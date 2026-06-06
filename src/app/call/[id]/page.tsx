"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import { addCall, formatDuration, getContacts } from "@/lib/store";
import { getCurrentUser } from "@/lib/users";
import { getIceServers, pollSignals, sendSignal } from "@/lib/callClient";
import type { Signal } from "@/lib/callTypes";

export default function CallPage() {
  return (
    <Suspense fallback={null}>
      <CallScreen />
    </Suspense>
  );
}

type Phase = "ringing" | "connecting" | "active" | "ended";

function CallScreen() {
  const router = useRouter();
  const peer = useParams<{ id: string }>().id;
  const search = useSearchParams();
  const role = search.get("role") === "callee" ? "callee" : "caller";
  const callId = search.get("callId") ?? "";
  const callType = search.get("type") === "video" ? "video" : "voice";

  const [name, setName] = useState(`+${peer}`);
  const [phase, setPhase] = useState<Phase>(role === "caller" ? "ringing" : "connecting");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState(role === "caller" ? "Ringing…" : "Connecting…");

  const selfRef = useRef("");
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const cursorRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const endedRef = useRef(false);
  const offerSentRef = useRef(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || !callId) {
      router.replace("/chats");
      return;
    }
    selfRef.current = u.phone;
    setName(getContacts().find((c) => c.phone === peer)?.name ?? `+${peer}`);

    let alive = true;

    async function attachRemote(stream: MediaStream) {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    }

    async function flushIce() {
      const pc = pcRef.current;
      if (!pc) return;
      for (const c of pendingIceRef.current) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          /* ignore */
        }
      }
      pendingIceRef.current = [];
    }

    async function addIce(c: RTCIceCandidateInit) {
      const pc = pcRef.current;
      if (pc?.remoteDescription?.type) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          /* ignore */
        }
      } else {
        pendingIceRef.current.push(c);
      }
    }

    function onConnected() {
      if (startedAtRef.current) return;
      startedAtRef.current = Date.now();
      setPhase("active");
      setStatus("");
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }

    async function sendOffer() {
      const pc = pcRef.current;
      if (!pc || offerSentRef.current) return;
      offerSentRef.current = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal({ type: "offer", from: selfRef.current, to: peer, callId, sdp: offer });
      setPhase("connecting");
      setStatus("Connecting…");
    }

    async function handle(sig: Signal) {
      if (sig.callId !== callId) return;
      const pc = pcRef.current;
      if (!pc) return;
      if (sig.type === "accept" && role === "caller") {
        await sendOffer();
      } else if (sig.type === "offer" && role === "callee" && sig.sdp) {
        await pc.setRemoteDescription(sig.sdp);
        await flushIce();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal({ type: "answer", from: selfRef.current, to: peer, callId, sdp: answer });
        setStatus("Connecting…");
      } else if (sig.type === "answer" && role === "caller" && sig.sdp) {
        await pc.setRemoteDescription(sig.sdp);
        await flushIce();
      } else if (sig.type === "ice" && sig.candidate) {
        await addIce(sig.candidate);
      } else if (sig.type === "decline") {
        setStatus("Call declined");
        finish(false, "declined");
      } else if (sig.type === "hangup" || sig.type === "cancel") {
        finish(false);
      }
    }

    async function setup() {
      try {
        const iceServers = await getIceServers();
        const pc = new RTCPeerConnection({ iceServers });
        pcRef.current = pc;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (e) => attachRemote(e.streams[0]);
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            sendSignal({
              type: "ice",
              from: selfRef.current,
              to: peer,
              callId,
              candidate: e.candidate.toJSON(),
            });
          }
        };
        pc.onconnectionstatechange = () => {
          const st = pc.connectionState;
          if (st === "connected") onConnected();
          else if (st === "failed" || st === "closed") finish(false);
        };

        // Begin polling the signaling inbox.
        pollRef.current = setInterval(async () => {
          if (!alive) return;
          const { signals, cursor } = await pollSignals(selfRef.current, cursorRef.current);
          cursorRef.current = cursor;
          for (const s of signals) await handle(s);
        }, 1000);
      } catch {
        setStatus("Could not access microphone/camera");
        setTimeout(() => finish(true), 1500);
      }
    }

    function finish(sendEnd: boolean, reason?: "declined") {
      if (endedRef.current) return;
      endedRef.current = true;
      const connected = startedAtRef.current > 0;
      const duration = connected ? Math.round((Date.now() - startedAtRef.current) / 1000) : 0;

      if (sendEnd) {
        sendSignal({
          type: connected ? "hangup" : "cancel",
          from: selfRef.current,
          to: peer,
          callId,
        });
      }

      addCall({
        contactId: peer,
        name: getContacts().find((c) => c.phone === peer)?.name ?? `+${peer}`,
        phone: peer,
        type: callType,
        outcome: connected ? "completed" : reason === "declined" ? "missed" : "cancelled",
        startedAt: startedAtRef.current || Date.now(),
        duration,
      });

      teardown();
      setPhase("ended");
      router.replace("/chats");
    }

    function teardown() {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        pcRef.current?.close();
      } catch {
        /* ignore */
      }
    }

    // expose finish for button handlers via ref
    finishRef.current = finish;
    setup();

    return () => {
      alive = false;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishRef = useRef<(send: boolean) => void>(() => {});

  function toggleMute() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }

  const isVideo = callType === "video";

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-linear-to-b from-teal to-[#0f3a3e] px-6 py-14 text-white">
      {/* Remote video fills the screen for video calls */}
      {isVideo && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full bg-black object-cover"
        />
      )}
      {/* Remote audio (voice calls) */}
      {!isVideo && <audio ref={remoteAudioRef} autoPlay className="hidden" />}

      {/* Local preview for video calls */}
      {isVideo && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute right-4 top-6 z-10 h-40 w-28 rounded-2xl border-2 border-white/30 bg-black object-cover"
        />
      )}

      <div className="z-10 flex flex-col items-center gap-4 pt-8">
        {!isVideo && <Avatar name={name} size={120} />}
        <h1 className="text-2xl font-bold drop-shadow">{name}</h1>
        <p className="text-sm text-white/85 drop-shadow">
          {phase === "active" ? formatDuration(seconds) : status}
        </p>
      </div>

      <div className="z-10 flex items-center gap-6">
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className={`flex h-14 w-14 items-center justify-center rounded-full ${muted ? "bg-white text-teal-dark" : "bg-white/20 text-white"}`}
        >
          {muted ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="m1 1 22 22" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><path d="M12 19v4" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
            </svg>
          )}
        </button>

        <button
          onClick={() => finishRef.current(true)}
          aria-label="End call"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg transition-transform hover:scale-105"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(135deg)" }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

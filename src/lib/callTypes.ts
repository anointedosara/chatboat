/** Shared WebRTC signaling types (used by both client and server). */

export type SignalType =
  | "invite" // caller announces an incoming call
  | "accept" // callee accepted, caller may send the offer
  | "decline" // callee declined
  | "offer" // caller's SDP offer
  | "answer" // callee's SDP answer
  | "ice" // a trickled ICE candidate
  | "hangup" // either side ended an active/connecting call
  | "cancel"; // caller gave up before it was answered

export type Signal = {
  seq?: number;
  type: SignalType;
  from: string; // sender phone (normalized)
  to: string; // recipient phone (normalized)
  callId: string;
  callType?: "voice" | "video";
  fromName?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  ts: number;
};

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Illustration from "@/components/Illustration";
import ChatLogo from "@/components/ChatLogo";
import ScreenFrame from "@/components/ScreenFrame";

const SPLASH_MS = 3000;

const SLIDES = [
  {
    text: "Welcome to chatboat,\na great friend to chat with you",
    button: "Next",
  },
  {
    text: "If you are confused about\nwhat to do just open\nChatboat app",
    button: "Next",
  },
  {
    text: "Chatboat will be ready\nto chat & make you\nhappy",
    button: "Get Started",
  },
];

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [slide, setSlide] = useState(0);

  // Splash holds for 3s while the app (and the register route) load in the
  // background, then reveals the onboarding carousel.
  useEffect(() => {
    router.prefetch("/register");
    const t = setTimeout(() => setShowSplash(false), SPLASH_MS);
    return () => clearTimeout(t);
  }, [router]);

  if (showSplash) {
    return <Splash />;
  }

  const isLast = slide === SLIDES.length - 1;

  const next = () => {
    if (isLast) router.push("/register");
    else setSlide((s) => s + 1);
  };

  return (
    <ScreenFrame>
      <div className="flex flex-1 flex-col px-6 pb-8 pt-5">
        {/* Skip — jumps straight to register */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/register")}
            className="rounded-full px-3 py-1 text-sm font-medium text-teal-dark"
          >
            Skip
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="w-full max-w-[300px]">
            <Illustration />
          </div>

          <p className="whitespace-pre-line text-center text-lg font-medium leading-7 text-ink">
            {SLIDES[slide].text}
          </p>
        </div>

        {/* Dots */}
        <div className="mb-6 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === slide ? "w-5 bg-teal" : "w-2 bg-teal-soft"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full rounded-full bg-teal py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-dark"
        >
          {SLIDES[slide].button}
        </button>
      </div>
    </ScreenFrame>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-teal">
      <div className="flex flex-col items-center gap-4">
        <ChatLogo size={84} />
        <span className="text-2xl font-semibold tracking-wide text-white">
          Chatboat
        </span>
      </div>
    </div>
  );
}

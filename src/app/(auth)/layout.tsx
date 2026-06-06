import ChatLogo from "@/components/ChatLogo";
import Illustration from "@/components/Illustration";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col md:flex-row">
      {/* Brand panel — desktop only (>=768px) */}
      <aside className="hidden bg-teal p-12 text-white md:flex md:w-[46%] md:flex-col md:items-center md:justify-center md:gap-10">
        <div className="flex items-center gap-3">
          <ChatLogo size={44} />
          <span className="text-3xl font-bold tracking-wide">Chatboat</span>
        </div>
        <div className="w-full max-w-[340px]">
          <Illustration />
        </div>
        <p className="max-w-sm text-center text-xl font-medium leading-8 text-white/90">
          A great friend to chat with you
        </p>
      </aside>

      {/* Screen content — fills the rest, card-centered on desktop */}
      <main className="flex min-h-dvh flex-1 items-stretch justify-center bg-white md:items-center md:bg-[#eef3f4]">
        <div className="flex w-full flex-col bg-white md:h-[760px] md:max-h-[92vh] md:w-[420px] md:overflow-hidden md:rounded-[36px] md:shadow-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}

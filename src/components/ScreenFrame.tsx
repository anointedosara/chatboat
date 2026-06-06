/**
 * Wraps a screen so that:
 *  - on mobile it fills the viewport (the original mobile design)
 *  - from 768px up it becomes a centered, rounded "device" card on a
 *    coloured backdrop, so the page still looks intentional full-screen.
 */
export default function ScreenFrame({
  children,
  backdrop = "md:bg-teal",
}: {
  children: React.ReactNode;
  backdrop?: string;
}) {
  return (
    <div
      className={`flex min-h-dvh w-full flex-1 items-stretch justify-center bg-white md:min-h-dvh md:items-center ${backdrop}`}
    >
      <div className="flex w-full flex-col bg-white md:h-[760px] md:max-h-[92vh] md:w-[420px] md:overflow-hidden md:rounded-[36px] md:shadow-2xl">
        {children}
      </div>
    </div>
  );
}

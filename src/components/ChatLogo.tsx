/** The Chatboat speech-bubble mark. */
export default function ChatLogo({
  size = 84,
  bubble = "white",
  dot = "#1fb8c0",
}: {
  size?: number;
  bubble?: string;
  dot?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={bubble} aria-hidden>
      <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <circle cx="8" cy="10.5" r="1.3" fill={dot} />
      <circle cx="12" cy="10.5" r="1.3" fill={dot} />
      <circle cx="16" cy="10.5" r="1.3" fill={dot} />
    </svg>
  );
}

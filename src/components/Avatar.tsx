import { avatarColor } from "@/lib/mockData";

/** Circular avatar — shows a profile picture if `src` is given, else initials. */
export default function Avatar({
  name,
  initials,
  src,
  size = 44,
}: {
  name: string;
  initials?: string;
  src?: string;
  size?: number;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const text =
    initials ??
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: avatarColor(name),
        fontSize: size * 0.38,
      }}
    >
      {text}
    </span>
  );
}

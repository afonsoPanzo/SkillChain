import { NONE } from "@/lib/skillchain/constants";

/** Same hash as the design prototype: stable hue per wallet address. */
export function hueOf(address: string): number {
  let h = 7;
  for (const c of address) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

interface AvatarProps {
  /** Wallet address; derives the background colour. */
  address: string;
  /** Equipped frame item id (0 or 1), or NONE. */
  frame?: number;
  /** Whether the Turbo Goggles (item 2) are equipped. */
  goggles?: boolean;
}

/**
 * Layered SVG avatar (SDD 5.4): base from the wallet, then accessory, then frame.
 * Layer geometry comes from public/items/*.svg.
 */
export function Avatar({ address, frame = NONE, goggles = false }: AvatarProps) {
  const hue = hueOf(address);
  return (
    <svg
      viewBox="0 0 100 100"
      style={{ display: "block", width: "100%", height: "100%" }}
      role="img"
      aria-label="Avatar"
    >
      <rect width="100" height="100" rx="22" fill={`hsl(${hue} 42% 30%)`} />
      <path
        d="M18 100 C18 75 33 67 50 67 C67 67 82 75 82 100 Z"
        fill={`hsl(${hue} 45% 18%)`}
      />
      <circle cx="50" cy="45" r="21" fill={`hsl(${hue} 55% 66%)`} />
      <rect x="40" y="40" width="5" height="9" rx="2.5" fill="#0E0F14" />
      <rect x="55" y="40" width="5" height="9" rx="2.5" fill="#0E0F14" />

      {goggles && (
        <g id="turbo-goggles">
          <rect x="25" y="41" width="50" height="4" rx="2" fill="#0E0F14" />
          <rect x="33" y="36" width="15" height="13" rx="4" fill="#14F195" stroke="#0E0F14" strokeWidth="3" />
          <rect x="52" y="36" width="15" height="13" rx="4" fill="#14F195" stroke="#0E0F14" strokeWidth="3" />
        </g>
      )}

      {frame === 0 && (
        <g id="frame-devnet">
          <rect x="3" y="3" width="94" height="94" rx="20" fill="none" stroke="#14F195" strokeWidth="4" strokeDasharray="9 6" />
        </g>
      )}
      {frame === 1 && (
        <g id="frame-validator">
          <rect x="2.5" y="2.5" width="95" height="95" rx="21" fill="none" stroke="#A15CFF" strokeWidth="3.5" />
          <rect x="8.5" y="8.5" width="83" height="83" rx="15" fill="none" stroke="#A15CFF" strokeWidth="1.5" />
          <rect x="45" y="-1" width="10" height="10" transform="rotate(45 50 4)" fill="#A15CFF" />
          <rect x="45" y="91" width="10" height="10" transform="rotate(45 50 96)" fill="#A15CFF" />
        </g>
      )}
    </svg>
  );
}

/** The avatar of a profile with its equipped items. */
export function ProfileAvatar({
  profile,
}: {
  profile: { owner: string; equippedFrame: number; equippedAccessory: number };
}) {
  return (
    <Avatar
      address={profile.owner}
      frame={profile.equippedFrame}
      goggles={profile.equippedAccessory === 2}
    />
  );
}

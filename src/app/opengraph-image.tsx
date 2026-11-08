import { ImageResponse } from "next/og";

export const alt = "SkillChain: learn Solana by playing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Preview image shown when any page of the app is shared. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0E0F14",
          color: "#F2F1EC",
        }}
      >
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800 }}>
          <span>Skill</span>
          <span style={{ color: "#14F195" }}>Chain</span>
        </div>
        <div style={{ display: "flex", fontSize: 48, marginTop: 24, color: "#C9CAD2" }}>
          Learn Solana by playing.
        </div>
        <div style={{ display: "flex", fontSize: 32, marginTop: 48, color: "#A15CFF" }}>
          Every level ends with a real transaction on Devnet.
        </div>
      </div>
    ),
    size,
  );
}

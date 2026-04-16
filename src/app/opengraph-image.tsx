import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Clŷniq — Meer patiënten, sterkere reputatie";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FDFBF7",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 300,
            color: "#1A1816",
            letterSpacing: "0.06em",
            marginBottom: "32px",
            fontFamily: "Georgia, serif",
          }}
        >
          Clŷniq
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#C9998A",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.5,
            fontWeight: 400,
          }}
        >
          Meer patiënten. Sterkere reputatie.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "18px",
            color: "#7A746E",
            textAlign: "center",
            maxWidth: "600px",
            lineHeight: 1.6,
            marginTop: "20px",
          }}
        >
          AI-assistent voor cosmetische klinieken — converteert aanvragen, plant consulten en verzamelt reviews.
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            gap: "32px",
            color: "#A9A29B",
            fontSize: "16px",
          }}
        >
          <span>clyniq.nl</span>
          <span>Op maat voor uw kliniek</span>
          <span>Boek een demo</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

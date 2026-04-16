import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 128,
          background: "#C9998A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 220,
            fontWeight: 300,
            color: "white",
            fontFamily: "Georgia, serif",
            letterSpacing: "0.02em",
          }}
        >
          Cŷ
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}

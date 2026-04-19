import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 640,
          height: 640,
          borderRadius: 160,
          background: "#C9998A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 280,
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
    { width: 640, height: 640 }
  );
}

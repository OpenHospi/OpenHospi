import { ImageResponse } from "next/og";

export const alt = "OpenHospi — Free student housing for the Netherlands";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fafa 0%, #d4f0f0 50%, #a8e0e0 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#1a6b6b",
            letterSpacing: "-0.02em",
          }}
        >
          OpenHospi
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#3a8a8a",
            maxWidth: "600px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Free, open-source student housing for the Netherlands
        </div>
      </div>
    </div>,
    { ...size },
  );
}

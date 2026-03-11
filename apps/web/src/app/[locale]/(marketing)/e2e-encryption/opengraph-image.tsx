import { APP_NAME, OG_IMAGE_SIZE } from "@openhospi/shared/constants";
import { ImageResponse } from "next/og";

export const alt = "End-to-End Encryption — OpenHospi";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Shield icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 120,
          height: 120,
          borderRadius: 28,
          background: "rgba(13, 148, 136, 0.15)",
          marginBottom: 32,
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0d9488"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <rect x="9" y="11" width="6" height="5" rx="1" />
          <path d="M10 11V8a2 2 0 1 1 4 0v3" />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#f8fafc",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          End-to-End Encryption
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          Signal Protocol-inspired. Open source. Fully transparent.
        </div>
      </div>

      {/* Brand */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "#0d9488",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          O
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#cbd5e1",
          }}
        >
          {APP_NAME}
        </div>
      </div>
    </div>,
    { ...size },
  );
}

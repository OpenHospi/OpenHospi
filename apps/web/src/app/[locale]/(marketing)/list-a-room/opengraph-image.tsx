import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

export const alt = "List a Room";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.listARoom" });

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
          {t("title")}
        </div>
      </div>
    </div>,
    { ...size },
  );
}

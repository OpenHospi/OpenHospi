import { BRAND_COLOR } from "@openhospi/shared/constants";

export const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  margin: "0 0 16px",
};

export const text = {
  fontSize: "16px",
  color: "#333",
  lineHeight: "24px",
  margin: "0 0 8px",
};

export const muted = {
  fontSize: "14px",
  color: "#666",
  lineHeight: "20px",
  margin: "16px 0 0",
};

export const label = {
  fontSize: "14px",
  color: "#666",
  margin: "0 0 8px",
};

export const code = {
  fontSize: "36px",
  fontWeight: "bold" as const,
  color: BRAND_COLOR,
  letterSpacing: "6px",
  textAlign: "center" as const,
  padding: "16px",
  backgroundColor: "#f0fdfa",
  margin: "0 0 24px",
};

export const codeHint = {
  fontSize: "12px",
  color: "#999",
  margin: "16px 0 0",
};

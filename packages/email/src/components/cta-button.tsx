import { Button } from "@react-email/components";
import { BRAND_COLOR } from "@openhospi/shared/constants";

type CtaButtonProps = {
  href: string;
  children: string;
};

export function CtaButton({ href, children }: CtaButtonProps) {
  return (
    <Button href={href} style={button}>
      {children}
    </Button>
  );
}

const button = {
  backgroundColor: BRAND_COLOR,
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  marginTop: "24px",
};

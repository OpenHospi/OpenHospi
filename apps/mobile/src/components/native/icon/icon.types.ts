export interface NativeIconProps {
  /** SF Symbol name — must have an equivalent Material Symbol name. */
  name: string;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  /** Optional Android override if the Material name differs. */
  androidName?: string;
  /** Optional iOS override if the SF Symbol name differs. */
  iosName?: string;
}

export interface ContextMenuAction {
  /** Unique key for the action */
  key: string;
  /** Visible label */
  label: string;
  /** SF Symbol name (iOS) — Material Symbol is derived via the icon mapping or androidSystemImage fallback */
  systemImage?: string;
  /** Optional override for Android (Material Symbol name) */
  androidSystemImage?: string;
  /** Marks the action as destructive (red on iOS) */
  destructive?: boolean;
  onPress: () => void;
}

export interface AppContextMenuProps {
  /** Trigger content shown to the user — long-press opens the menu on iOS */
  children: React.ReactNode;
  /** Actions rendered in the menu */
  actions: ContextMenuAction[];
}

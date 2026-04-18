import type { AppContextMenuProps } from './context-menu.types';

/**
 * Android has no SwiftUI-style long-press ContextMenu equivalent that layers over arbitrary
 * content. Screens that rely on this primitive should provide their own Android affordance
 * (swipe actions, overflow menu, bottom sheet) — this primitive simply passes the trigger
 * through.
 */
function AppContextMenu({ children }: AppContextMenuProps) {
  return <>{children}</>;
}

export { AppContextMenu };

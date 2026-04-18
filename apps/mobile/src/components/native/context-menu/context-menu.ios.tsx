import { Button as ExpoButton, ContextMenu, Host } from '@expo/ui/swift-ui';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { AppContextMenuProps } from './context-menu.types';

function AppContextMenu({ children, actions }: AppContextMenuProps) {
  return (
    <Host matchContents>
      <ContextMenu>
        <ContextMenu.Items>
          {actions.map((action) => (
            <ExpoButton
              key={action.key}
              label={action.label}
              systemImage={action.systemImage as SFSymbol | undefined}
              role={action.destructive ? 'destructive' : undefined}
              onPress={action.onPress}
            />
          ))}
        </ContextMenu.Items>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}

export { AppContextMenu };

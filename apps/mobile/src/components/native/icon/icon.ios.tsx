import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { NativeIconProps } from './icon.types';

function NativeIcon({ name, iosName, size = 20, color, accessibilityLabel }: NativeIconProps) {
  return (
    <SymbolView
      name={(iosName ?? name) as SFSymbol}
      size={size}
      tintColor={color}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export { NativeIcon };

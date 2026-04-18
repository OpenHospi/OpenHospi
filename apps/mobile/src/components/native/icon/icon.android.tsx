import { MaterialIcons } from '@expo/vector-icons';

import type { NativeIconProps } from './icon.types';
import { sfToMaterial } from './mapping';

function NativeIcon({ name, androidName, size = 20, color, accessibilityLabel }: NativeIconProps) {
  const materialName = (androidName ?? sfToMaterial[name] ?? name) as React.ComponentProps<
    typeof MaterialIcons
  >['name'];

  return (
    <MaterialIcons
      name={materialName}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export { NativeIcon };

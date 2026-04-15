import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/design';
import { ThemedText } from './text';

interface ThemedAvatarProps {
  /** Image URI */
  source?: string | null;
  /** Fallback initials (e.g. first letter of name) */
  fallback?: string;
  /** Diameter in points */
  size?: number;
  style?: ViewStyle;
}

function ThemedAvatar({ source, fallback, size = 40, style }: ThemedAvatarProps) {
  const { colors } = useTheme();
  const [imageError, setImageError] = React.useState(false);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const showFallback = !source || imageError;

  return (
    <View style={[containerStyle, style]}>
      {showFallback ? (
        <ThemedText
          variant={size >= 64 ? 'title3' : size >= 40 ? 'headline' : 'footnote'}
          weight="600"
          color={colors.tertiaryForeground}>
          {fallback?.charAt(0).toUpperCase() ?? '?'}
        </ThemedText>
      ) : (
        <Image
          source={{ uri: source }}
          style={{ width: size, height: size }}
          contentFit="cover"
          cachePolicy="disk"
          transition={200}
          onError={() => setImageError(true)}
        />
      )}
    </View>
  );
}

export { ThemedAvatar };
export type { ThemedAvatarProps };

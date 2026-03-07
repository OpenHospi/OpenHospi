import { getLocaleFlagCode, type SupportedLocale } from '@openhospi/shared/constants';
import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

import FLAGS from '../../assets/images/flags';

type FlagImageProps = {
  locale: SupportedLocale;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function FlagImage({ locale, size = 24, style }: FlagImageProps) {
  const code = getLocaleFlagCode(locale);
  const source = FLAGS[code];

  if (!source) return null;

  return (
    <Image
      source={source}
      style={[{ width: size * (4 / 3), height: size, borderRadius: 2 }, style]}
      contentFit="cover"
    />
  );
}

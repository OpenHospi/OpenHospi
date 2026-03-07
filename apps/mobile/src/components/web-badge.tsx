import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import React from 'react';
import { useColorScheme, Text, View } from 'react-native';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <View className="items-center gap-2 p-8">
      <Text className="text-center font-mono text-xs font-medium text-muted-foreground">
        v{version}
      </Text>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        style={{ width: 123, aspectRatio: 123 / 24 }}
      />
    </View>
  );
}

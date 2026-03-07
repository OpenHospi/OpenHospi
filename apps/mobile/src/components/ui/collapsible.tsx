import { SymbolView } from 'expo-symbols';
import { PropsWithChildren, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { THEME } from '@/lib/theme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const scheme = useColorScheme();
  const colors = THEME[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View>
      <Pressable
        className="flex-row items-center gap-2"
        style={({ pressed }) => pressed && { opacity: 0.7 }}
        onPress={() => setIsOpen((value) => !value)}
      >
        <View className="h-6 w-6 items-center justify-center rounded-xl bg-secondary">
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            weight="bold"
            tintColor={colors.foreground}
            style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}
          />
        </View>

        <Text className="text-sm font-medium text-foreground">{title}</Text>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <View className="ml-6 mt-4 gap-2 rounded-2xl bg-secondary p-6">{children}</View>
        </Animated.View>
      )}
    </View>
  );
}

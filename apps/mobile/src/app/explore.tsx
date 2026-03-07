import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { THEME } from '@/lib/theme';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const scheme = useColorScheme();
  const colors = THEME[scheme === 'dark' ? 'dark' : 'light'];

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInset={insets}
      contentContainerStyle={[
        { flexDirection: 'row', justifyContent: 'center' },
        contentPlatformStyle,
      ]}
    >
      <View className="max-w-[800px] flex-grow">
        <View className="items-center gap-4 px-6 py-16">
          <Text className="text-3xl font-semibold leading-[44px] text-foreground">Explore</Text>
          <Text className="text-center text-muted-foreground">
            This starter app includes example{'\n'}code to help you get started.
          </Text>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <View className="flex-row items-center justify-center gap-1 rounded-full bg-secondary px-6 py-2">
                <Text className="text-sm leading-[30px] text-foreground">Expo documentation</Text>
                <SymbolView
                  tintColor={colors.foreground}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </View>
            </Pressable>
          </ExternalLink>
        </View>

        <View className="gap-8 px-6 pt-4">
          <Collapsible title="File-based routing">
            <Text className="text-sm font-medium text-foreground">
              This app has two screens: <Text className="font-mono text-xs">src/app/index.tsx</Text>{' '}
              and <Text className="font-mono text-xs">src/app/explore.tsx</Text>
            </Text>
            <Text className="text-sm font-medium text-foreground">
              The layout file in <Text className="font-mono text-xs">src/app/_layout.tsx</Text> sets
              up the tab navigator.
            </Text>
            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <Text className="text-sm leading-[30px] text-blue-400">Learn more</Text>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Android, iOS, and web support">
            <View className="items-center rounded-2xl bg-secondary p-6">
              <Text className="text-sm font-medium text-foreground">
                You can open this project on Android, iOS, and the web. To open the web version,
                press <Text className="text-sm font-bold">w</Text> in the terminal running this
                project.
              </Text>
              <Image
                source={require('@/assets/images/tutorial-web.png')}
                style={{ width: '100%', aspectRatio: 296 / 171, borderRadius: 16, marginTop: 8 }}
              />
            </View>
          </Collapsible>

          <Collapsible title="Images">
            <Text className="text-sm font-medium text-foreground">
              For static images, you can use the <Text className="font-mono text-xs">@2x</Text> and{' '}
              <Text className="font-mono text-xs">@3x</Text> suffixes to provide files for different
              screen densities.
            </Text>
            <Image
              source={require('@/assets/images/react-logo.png')}
              style={{ width: 100, height: 100, alignSelf: 'center' }}
            />
            <ExternalLink href="https://reactnative.dev/docs/images">
              <Text className="text-sm leading-[30px] text-blue-400">Learn more</Text>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Light and dark mode components">
            <Text className="text-sm font-medium text-foreground">
              This template has light and dark mode support. The{' '}
              <Text className="font-mono text-xs">useColorScheme()</Text> hook lets you inspect what
              the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
            </Text>
            <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
              <Text className="text-sm leading-[30px] text-blue-400">Learn more</Text>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Animations">
            <Text className="text-sm font-medium text-foreground">
              This template includes an example of an animated component. The{' '}
              <Text className="font-mono text-xs">src/components/ui/collapsible.tsx</Text> component
              uses the powerful <Text className="font-mono text-xs">react-native-reanimated</Text>{' '}
              library to animate opening this hint.
            </Text>
          </Collapsible>
        </View>
        {Platform.OS === 'web' && <WebBadge />}
      </View>
    </ScrollView>
  );
}

import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, useColorScheme, View, Text, StyleSheet } from 'react-native';

import { ExternalLink } from './external-link';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { THEME } from '@/lib/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        className={
          isFocused ? 'rounded-2xl bg-accent px-4 py-1' : 'rounded-2xl bg-secondary px-4 py-1'
        }
      >
        <Text
          className={
            isFocused
              ? 'text-sm font-medium text-foreground'
              : 'text-sm font-medium text-muted-foreground'
          }
        >
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = THEME[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View {...props} style={styles.tabListContainer}>
      <View
        className="flex-grow flex-row items-center gap-2 rounded-full bg-secondary px-8 py-2"
        style={{ maxWidth: MaxContentWidth }}
      >
        <Text className="mr-auto text-sm font-bold text-foreground">Expo Starter</Text>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.externalPressable}>
            <Text className="text-sm leading-[30px] text-foreground">Docs</Text>
            <SymbolView
              tintColor={colors.foreground}
              name={{ ios: 'arrow.up.right.square', web: 'link' }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.7,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});

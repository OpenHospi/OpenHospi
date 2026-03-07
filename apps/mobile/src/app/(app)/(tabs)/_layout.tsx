import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, useColorScheme } from 'react-native';

import { useTranslations } from '@/i18n';
import { THEME } from '@/lib/theme';

export default function TabLayout() {
  const t = useTranslations('common.labels');
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? THEME.dark : THEME.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: t('discover'),
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={24} />
            ) : null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('chat'),
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <SymbolView name="bubble.left.and.bubble.right" tintColor={color} size={24} />
            ) : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) =>
            Platform.OS === 'ios' ? (
              <SymbolView name="person.crop.circle" tintColor={color} size={24} />
            ) : null,
        }}
      />
    </Tabs>
  );
}

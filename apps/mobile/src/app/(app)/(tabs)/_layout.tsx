import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, useColorScheme } from 'react-native';

import { useTranslations } from '@/i18n';
import { THEME } from '@/lib/theme';

function TabIcon({
  iosName,
  androidName,
  color,
}: {
  iosName: string;
  androidName: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={iosName as never} tintColor={color} size={24} />;
  }
  return <Ionicons name={androidName} size={24} color={color} />;
}

export default function TabLayout() {
  const t = useTranslations('common.labels');
  const tBreadcrumbs = useTranslations('breadcrumbs');
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
          tabBarIcon: ({ color }) => (
            <TabIcon iosName="magnifyingglass" androidName="search" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-rooms"
        options={{
          title: tBreadcrumbs('my-rooms'),
          tabBarIcon: ({ color }) => (
            <TabIcon iosName="house" androidName="home-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: tBreadcrumbs('chat'),
          tabBarIcon: ({ color }) => (
            <TabIcon
              iosName="bubble.left.and.bubble.right"
              androidName="chatbubbles-outline"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: tBreadcrumbs('applications'),
          tabBarIcon: ({ color }) => (
            <TabIcon iosName="doc.text" androidName="document-text-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => (
            <TabIcon
              iosName="person.crop.circle"
              androidName="person-circle-outline"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

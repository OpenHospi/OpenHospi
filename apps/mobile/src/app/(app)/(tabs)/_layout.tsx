import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';

import { useTranslation } from 'react-i18next';
import { NAV_THEME } from '@/lib/theme';
import { useUniwind } from 'uniwind';

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
  const { t } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tBreadcrumbs } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });
  const { theme } = useUniwind();
  const colors = NAV_THEME[(theme ?? 'light') as 'light' | 'dark'].colors;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      }}>
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

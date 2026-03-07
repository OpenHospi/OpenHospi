import * as Device from 'expo-device';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { WebBadge } from '@/components/web-badge';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <Text className="text-sm font-medium text-foreground">use browser devtools</Text>;
  }
  if (Device.isDevice) {
    return (
      <Text className="text-sm font-medium text-foreground">
        shake device or press <Text className="font-mono text-xs font-medium">m</Text> in terminal
      </Text>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <Text className="text-sm font-medium text-foreground">
      press <Text className="font-mono text-xs font-medium">{shortcut}</Text>
    </Text>
  );
}

export default function HomeScreen() {
  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView className="flex-1 items-center gap-4 px-6 pb-20" style={{ maxWidth: 800 }}>
        <View className="flex-1 items-center justify-center gap-6 px-6">
          <AnimatedIcon />
          <Text className="text-center text-5xl font-semibold leading-[52px] text-foreground">
            Welcome to&nbsp;Expo
          </Text>
        </View>

        <Text className="font-mono text-xs font-medium uppercase text-foreground">get started</Text>

        <View className="gap-4 self-stretch rounded-3xl bg-secondary p-6">
          <HintRow
            title="Try editing"
            hint={
              <Text className="font-mono text-xs font-medium text-foreground">
                src/app/index.tsx
              </Text>
            }
          />
          <HintRow title="Dev tools" hint={getDevMenuHint()} />
          <HintRow
            title="Fresh start"
            hint={
              <Text className="font-mono text-xs font-medium text-foreground">
                npm run reset-project
              </Text>
            }
          />
        </View>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </View>
  );
}

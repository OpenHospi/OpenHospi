import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/lib/auth-client';

export default function Index() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)/discover" />;
  }

  return <Redirect href="/(auth)/login" />;
}

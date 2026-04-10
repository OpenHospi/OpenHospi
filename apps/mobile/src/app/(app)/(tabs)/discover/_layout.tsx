import Stack from 'expo-router/stack';
import { Platform } from 'react-native';

export default function DiscoverLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        ...(Platform.OS === 'ios'
          ? { headerTransparent: true, headerBlurEffect: 'regular' }
          : undefined),
      }}
    />
  );
}

import Stack from 'expo-router/stack';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: 'regular',
        headerShadowVisible: false,
      }}
    />
  );
}

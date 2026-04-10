import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedText } from '@/components/primitives/themed-text';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

function getToastColors(type: ToastType, colors: ReturnType<typeof useTheme>['colors']) {
  switch (type) {
    case 'success':
      return { bg: colors.primary, text: colors.primaryForeground, icon: '#fff' };
    case 'error':
      return { bg: colors.destructive, text: '#ffffff', icon: '#fff' };
    case 'info':
      return { bg: colors.foreground, text: colors.background, icon: '#000' };
  }
}

function ToastItem({ toast }: { toast: Toast }) {
  const { colors } = useTheme();
  const Icon = ICON_MAP[toast.type];
  const toastColors = getToastColors(toast.type, colors);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.toastItem, { backgroundColor: toastColors.bg }]}>
      <Icon size={18} color={toastColors.icon} />
      <ThemedText variant="subheadline" weight="500" color={toastColors.text} style={{ flex: 1 }}>
        {toast.message}
      </ThemedText>
    </Animated.View>
  );
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    zIndex: 999,
  },
  toastItem: {
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

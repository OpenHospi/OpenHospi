import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';

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

const BG_CLASS = {
  success: 'bg-primary',
  error: 'bg-destructive',
  info: 'bg-foreground',
} as const;

const TEXT_CLASS = {
  success: 'text-primary-foreground',
  error: 'text-white',
  info: 'text-background',
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const Icon = ICON_MAP[toast.type];
  const iconColor = toast.type === 'error' ? '#fff' : toast.type === 'success' ? '#fff' : '#000';

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        marginBottom: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
      className={BG_CLASS[toast.type]}>
      <Icon size={18} color={iconColor} />
      <Text className={`text-sm font-medium ${TEXT_CLASS[toast.type]}`} style={{ flex: 1 }}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 24,
        right: 24,
        zIndex: 999,
      }}
      pointerEvents="none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

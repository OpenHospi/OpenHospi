import type { LucideIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 12,
      }}>
      <Icon size={48} className="text-muted-foreground" />
      <Text className="text-foreground text-center text-lg font-semibold">{title}</Text>
      {subtitle && <Text className="text-muted-foreground text-center text-sm">{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button onPress={onAction} style={{ marginTop: 8 }}>
          <Text>{actionLabel}</Text>
        </Button>
      )}
    </Animated.View>
  );
}

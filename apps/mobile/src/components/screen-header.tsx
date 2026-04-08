import { ChevronLeft } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: 16,
        gap: 8,
      }}>
      {onBack && (
        <Button variant="ghost" size="icon" onPress={onBack}>
          <ChevronLeft size={24} className="text-foreground" />
        </Button>
      )}
      <Text className="text-foreground text-lg font-semibold" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      {rightAction}
    </View>
  );
}

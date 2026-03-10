import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

type ProfileFieldRowProps = {
  label: string;
  value: string | null | undefined;
  placeholder: string;
  onPress: () => void;
};

export function ProfileFieldRow({ label, value, placeholder, onPress }: ProfileFieldRowProps) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
        }}>
        <Text className="text-card-foreground text-sm">{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text
            className={value ? 'text-card-foreground text-sm' : 'text-muted-foreground text-sm'}>
            {value || placeholder}
          </Text>
          <ChevronRight size={16} className="text-muted-foreground" />
        </View>
      </View>
    </Pressable>
  );
}

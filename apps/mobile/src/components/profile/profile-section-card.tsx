import { Pencil } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/native/text';
import { GroupedSection } from '@/components/layout/grouped-section';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

type Props = {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
};

export function ProfileSectionCard({ title, onEdit, children }: Props) {
  const { colors } = useTheme();

  return (
    <GroupedSection>
      <View style={styles.header}>
        <ThemedText variant="headline">{title}</ThemedText>
        {onEdit && (
          <Pressable
            onPress={() => {
              hapticLight();
              onEdit();
            }}
            hitSlop={8}>
            <Pencil size={16} color={colors.tertiaryForeground} />
          </Pressable>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </GroupedSection>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

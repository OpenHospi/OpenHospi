import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/primitives/themed-text';

type Props = {
  isVerified: boolean;
  compact?: boolean;
};

export function VerificationBadge({ isVerified, compact = true }: Props) {
  if (!isVerified) return null;

  if (compact) {
    return <ShieldCheck size={14} color="#22c55e" />;
  }

  return (
    <View style={styles.container}>
      <ShieldCheck size={14} color="#22c55e" />
      <ThemedText variant="caption1" weight="500" color="#16a34a">
        Verified
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

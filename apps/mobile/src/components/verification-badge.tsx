import { ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

type Props = {
  isVerified: boolean;
  compact?: boolean;
};

export function VerificationBadge({ isVerified, compact = true }: Props) {
  if (!isVerified) return null;

  if (compact) {
    return <ShieldCheck size={14} className="text-green-500" />;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <ShieldCheck size={14} className="text-green-500" />
      <Text className="text-xs font-medium text-green-600">Verified</Text>
    </View>
  );
}

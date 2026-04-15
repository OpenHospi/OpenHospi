import { Dimensions, StyleSheet, View } from 'react-native';

import { useTheme } from '@/design';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { radius } from '@/design/tokens/radius';

// ── Primitives ──────────────────────────────────────────────

type SkeletonLineProps = {
  width?: number | `${number}%`;
  height?: number;
};

export function SkeletonLine({ width = '100%', height = 14 }: SkeletonLineProps) {
  return <ThemedSkeleton width={width} height={height} rounded="sm" />;
}

type SkeletonCircleProps = {
  size?: number;
};

export function SkeletonCircle({ size = 40 }: SkeletonCircleProps) {
  return <ThemedSkeleton width={size} height={size} circle />;
}

export function SkeletonCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}>
      <View style={styles.cardHeader}>
        <SkeletonCircle size={48} />
        <View style={styles.cardHeaderText}>
          <SkeletonLine width="60%" height={16} />
          <SkeletonLine width="40%" height={12} />
        </View>
      </View>
      <SkeletonLine width="100%" height={12} />
      <SkeletonLine width="80%" height={12} />
    </View>
  );
}

// ── List Skeleton ───────────────────────────────────────────

type SkeletonListProps = {
  count?: number;
};

export function SkeletonList({ count = 4 }: SkeletonListProps) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

// ── Screen-Specific Variants ────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SkeletonRoomCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.roomCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}>
      <ThemedSkeleton width="100%" height={SCREEN_WIDTH * 0.75} rounded="sm" />
      <View style={styles.roomCardContent}>
        <SkeletonLine width="70%" height={18} />
        <SkeletonLine width="50%" height={14} />
        <View style={styles.roomCardFooter}>
          <SkeletonLine width="30%" height={20} />
          <SkeletonLine width="20%" height={12} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonConversation() {
  return (
    <View style={styles.conversation}>
      <SkeletonCircle size={48} />
      <View style={styles.conversationText}>
        <SkeletonLine width="60%" height={16} />
        <SkeletonLine width="80%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonProfile() {
  return (
    <View style={styles.profile}>
      <SkeletonCircle size={80} />
      {Array.from({ length: 4 }, (_, i) => (
        <View key={i} style={styles.profileField}>
          <SkeletonLine width="30%" height={12} />
          <SkeletonLine width="70%" height={16} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonRoomDetail() {
  return (
    <View>
      <ThemedSkeleton width="100%" height={SCREEN_WIDTH * 0.75} rounded="sm" />
      <View style={styles.roomDetailContent}>
        <SkeletonLine width="80%" height={22} />
        <SkeletonLine width="40%" height={16} />
        <View style={styles.roomDetailBadges}>
          <SkeletonLine width="25%" height={28} />
          <SkeletonLine width="25%" height={28} />
          <SkeletonLine width="25%" height={28} />
        </View>
        <SkeletonLine width="100%" height={14} />
        <SkeletonLine width="90%" height={14} />
        <SkeletonLine width="60%" height={14} />
      </View>
    </View>
  );
}

export function SkeletonApplicationCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.applicationCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}>
      <View style={styles.applicationCardContent}>
        <ThemedSkeleton width={80} height={60} rounded="sm" />
        <View style={styles.applicationCardText}>
          <SkeletonLine width="60%" height={16} />
          <SkeletonLine width="40%" height={12} />
        </View>
        <ThemedSkeleton width={60} height={22} rounded="full" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
    gap: 6,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  roomCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  roomCardContent: {
    padding: 16,
    gap: 8,
  },
  roomCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  conversationText: {
    flex: 1,
    gap: 6,
  },
  profile: {
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  profileField: {
    width: '100%',
    gap: 6,
  },
  roomDetailContent: {
    padding: 16,
    gap: 12,
  },
  roomDetailBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  applicationCard: {
    padding: 16,
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  applicationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applicationCardText: {
    flex: 1,
    gap: 6,
  },
});

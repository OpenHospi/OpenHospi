import { Dimensions, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';

// ── Primitives ──────────────────────────────────────────────

type SkeletonLineProps = {
  width?: number | `${number}%`;
  height?: number;
};

export function SkeletonLine({ width = '100%', height = 14 }: SkeletonLineProps) {
  return <Skeleton style={{ width, height, borderRadius: 6 }} />;
}

type SkeletonCircleProps = {
  size?: number;
};

export function SkeletonCircle({ size = 40 }: SkeletonCircleProps) {
  return <Skeleton style={{ width: size, height: size, borderRadius: size / 2 }} />;
}

export function SkeletonCard() {
  return (
    <View style={{ padding: 16, gap: 12 }} className="bg-card border-border rounded-xl border">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonCircle size={48} />
        <View style={{ flex: 1, gap: 6 }}>
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
    <View style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

// ── Screen-Specific Variants ────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function SkeletonRoomCard() {
  return (
    <View className="bg-card border-border overflow-hidden rounded-xl border">
      <Skeleton style={{ width: '100%', height: SCREEN_WIDTH * 0.75, borderRadius: 0 }} />
      <View style={{ padding: 16, gap: 8 }}>
        <SkeletonLine width="70%" height={18} />
        <SkeletonLine width="50%" height={14} />
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonLine width="30%" height={20} />
          <SkeletonLine width="20%" height={12} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonConversation() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
      <SkeletonCircle size={48} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonLine width="60%" height={16} />
        <SkeletonLine width="80%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonProfile() {
  return (
    <View style={{ alignItems: 'center', padding: 24, gap: 24 }}>
      <SkeletonCircle size={80} />
      {Array.from({ length: 4 }, (_, i) => (
        <View key={i} style={{ width: '100%', gap: 6 }}>
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
      <Skeleton style={{ width: '100%', height: SCREEN_WIDTH * 0.75, borderRadius: 0 }} />
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonLine width="80%" height={22} />
        <SkeletonLine width="40%" height={16} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
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
  return (
    <View style={{ padding: 16, gap: 12 }} className="bg-card border-border rounded-xl border">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton style={{ width: 80, height: 60, borderRadius: 6 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonLine width="60%" height={16} />
          <SkeletonLine width="40%" height={12} />
        </View>
        <Skeleton style={{ width: 60, height: 22, borderRadius: 11 }} />
      </View>
    </View>
  );
}

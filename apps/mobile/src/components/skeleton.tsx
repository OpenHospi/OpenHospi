import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

// ── Shimmer Animation ───────────────────────────────────────

function useShimmer() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [progress]);

  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.3, 0.7]),
  }));
}

// ── Primitives ──────────────────────────────────────────────

type SkeletonLineProps = {
  width?: number | `${number}%`;
  height?: number;
};

export function SkeletonLine({ width = '100%', height = 14 }: SkeletonLineProps) {
  const shimmerStyle = useShimmer();

  return (
    <Animated.View
      style={[{ width, height, borderRadius: 6 }, shimmerStyle]}
      className="bg-muted"
    />
  );
}

type SkeletonCircleProps = {
  size?: number;
};

export function SkeletonCircle({ size = 40 }: SkeletonCircleProps) {
  const shimmerStyle = useShimmer();

  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2 }, shimmerStyle]}
      className="bg-muted"
    />
  );
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

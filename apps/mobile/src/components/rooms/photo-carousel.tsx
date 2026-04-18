import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import Animated, { LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { getStoragePublicUrl } from '@/lib/storage-url';

type Photo = {
  id: string;
  url: string;
};

type Props = {
  photos: Photo[];
  bucket: 'profile-photos' | 'room-photos';
};

export function PhotoCarousel({ photos, bucket }: Props) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const carouselHeight = (screenWidth * 3) / 4;
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) return null;

  const count = photos.length;
  const pagerSize = { width: screenWidth, height: carouselHeight };

  function handlePageSelected(event: PagerViewOnPageSelectedEvent) {
    const next = event.nativeEvent.position;
    if (next !== activeIndex) {
      hapticLight();
      setActiveIndex(next);
    }
  }

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={`Photo ${activeIndex + 1} of ${count}`}
      accessibilityValue={{ min: 0, max: Math.max(count - 1, 0), now: activeIndex }}>
      <PagerView style={pagerSize} initialPage={0} onPageSelected={handlePageSelected} overdrag>
        {photos.map((photo) => (
          <View key={photo.id} collapsable={false} style={pagerSize}>
            <Image
              source={{ uri: getStoragePublicUrl(photo.url, bucket) }}
              style={pagerSize}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
          </View>
        ))}
      </PagerView>

      {count > 1 ? (
        <>
          <View style={styles.dotsContainer} pointerEvents="none">
            {photos.map((photo, i) => (
              <Animated.View
                key={photo.id}
                layout={LinearTransition.springify().reduceMotion(ReduceMotion.System)}
                style={[
                  styles.dot,
                  {
                    width: i === activeIndex ? 24 : 8,
                    backgroundColor: i === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.counterBadge} pointerEvents="none">
            <ThemedText variant="caption1" weight="500" color={colors.primaryForeground}>
              {activeIndex + 1}/{count}
            </ThemedText>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: radius.sm,
  },
  counterBadge: {
    position: 'absolute',
    top: 16,
    end: 16,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});

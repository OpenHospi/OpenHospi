import { Image } from 'expo-image';
import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  LinearTransition,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/primitives/themed-text';
import { radius } from '@/design/tokens/radius';
import { SPRING_SNAPPY } from '@/lib/animations';
import { getStoragePublicUrl } from '@/lib/storage-url';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = (SCREEN_WIDTH * 3) / 4;

type Photo = {
  id: string;
  url: string;
};

type Props = {
  photos: Photo[];
  bucket: 'profile-photos' | 'room-photos';
};

function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(3, e.scale));
    })
    .onEnd(() => {
      scale.value = withSpring(1, SPRING_SNAPPY);
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      }
    })
    .onEnd(() => {
      translateX.value = withSpring(0, SPRING_SNAPPY);
      translateY.value = withSpring(0, SPRING_SNAPPY);
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }, animatedStyle]}>
        <Image
          source={{ uri }}
          style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}
          contentFit="cover"
          cachePolicy="disk"
          transition={200}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export function PhotoCarousel({ photos, bucket }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) return null;

  return (
    <View>
      <Animated.FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ZoomableImage uri={getStoragePublicUrl(item.url, bucket)} />}
      />

      {photos.length > 1 && (
        <>
          <View style={styles.dotsContainer}>
            {photos.map((_, i) => (
              <Animated.View
                key={i}
                layout={LinearTransition.springify()}
                style={{
                  height: 8,
                  borderRadius: radius.sm,
                  width: i === activeIndex ? 24 : 8,
                  backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </View>

          <View style={styles.counterBadge}>
            <ThemedText color="#ffffff" style={styles.counterText}>
              {activeIndex + 1}/{photos.length}
            </ThemedText>
          </View>
        </>
      )}
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
  counterBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { getStoragePublicUrl } from '@/lib/storage-url';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = (SCREEN_WIDTH * 3) / 4; // 4:3 aspect ratio

type Photo = {
  id: string;
  url: string;
};

type Props = {
  photos: Photo[];
  bucket: 'profile-photos' | 'room-photos';
};

export function PhotoCarousel({ photos, bucket }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  if (photos.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Image
            source={{ uri: getStoragePublicUrl(item.url, bucket) }}
            style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}
            contentFit="cover"
          />
        )}
      />

      {photos.length > 1 && (
        <>
          <View className="absolute right-0 bottom-4 left-0 flex-row justify-center gap-2">
            {photos.map((_, i) => (
              <View
                key={i}
                className={`h-2 w-2 rounded-full ${i === activeIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </View>

          <View className="absolute top-4 right-4 rounded-full bg-black/40 px-2.5 py-1">
            <Text className="text-xs font-medium text-white">
              {activeIndex + 1}/{photos.length}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

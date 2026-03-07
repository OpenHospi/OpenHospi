import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Photo = {
  id: string;
  url: string;
};

type Props = {
  photos: Photo[];
  supabaseUrl: string;
  bucket: string;
};

export function PhotoCarousel({ photos, supabaseUrl, bucket }: Props) {
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
            source={{ uri: `${supabaseUrl}/storage/v1/object/public/${bucket}/${item.url}` }}
            style={{ width: SCREEN_WIDTH, height: 280 }}
            contentFit="cover"
          />
        )}
      />
      {photos.length > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
          {photos.map((_, i) => (
            <View
              key={i}
              className={`h-2 w-2 rounded-full ${i === activeIndex ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

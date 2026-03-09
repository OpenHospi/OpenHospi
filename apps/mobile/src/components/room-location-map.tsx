import { useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { LeafletView, MapShapeType } from 'react-native-leaflet-view';

import { Skeleton } from '@/components/ui/skeleton';
import { NAV_THEME } from '@/lib/theme';

type Props = {
  latitude: number;
  longitude: number;
};

// Apply a small random-ish offset for privacy (deterministic per coord)
function offsetCoords(lat: number, lng: number) {
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 2000));
  const offsetLat = (seed - 0.5) * 0.003;
  const offsetLng = (((seed * 1.3) % 1) - 0.5) * 0.003;
  return { lat: lat + offsetLat, lng: lng + offsetLng };
}

function useLeafletHtml() {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [asset] = await Asset.loadAsync(require('../../assets/leaflet.html'));
      if (cancelled || !asset.localUri) return;

      const file = new File(asset.localUri);
      const content = await file.text();
      if (!cancelled) setHtml(content);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return html;
}

export default function RoomLocationMap({ latitude, longitude }: Props) {
  const html = useLeafletHtml();
  const colorScheme = useColorScheme();
  const offset = useMemo(() => offsetCoords(latitude, longitude), [latitude, longitude]);

  if (!html) return <Skeleton style={{ height: 256, borderRadius: 12 }} />;

  const circleColor =
    colorScheme === 'dark' ? NAV_THEME.dark.colors.primary : NAV_THEME.light.colors.primary;

  return (
    <View style={{ height: 256, borderRadius: 12, overflow: 'hidden' }}>
      <LeafletView
        renderLoading={() => <></>}
        mapCenterPosition={{ lat: offset.lat, lng: offset.lng }}
        zoom={14}
        zoomControl={false}
        doDebug={false}
        source={{ html }}
        mapShapes={[
          {
            shapeType: MapShapeType.CIRCLE,
            center: { lat: offset.lat, lng: offset.lng },
            radius: 300,
            color: circleColor,
          },
        ]}
        onMessageReceived={() => {}}
      />
    </View>
  );
}

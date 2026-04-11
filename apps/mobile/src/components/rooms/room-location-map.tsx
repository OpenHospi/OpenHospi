import {
  MAP_DEFAULT_ZOOM,
  MAP_PRIVACY_OFFSET,
  MAP_PRIVACY_RADIUS,
} from '@openhospi/shared/constants';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import { Platform, View } from 'react-native';

type Props = {
  latitude: number;
  longitude: number;
};

function offsetCoords(lat: number, lng: number) {
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 2000));
  const offsetLat = (seed - 0.5) * MAP_PRIVACY_OFFSET;
  const offsetLng = (((seed * 1.3) % 1) - 0.5) * MAP_PRIVACY_OFFSET;
  return { latitude: lat + offsetLat, longitude: lng + offsetLng };
}

const CIRCLE_FILL = 'rgba(13, 148, 136, 0.06)';
const CIRCLE_STROKE = 'rgba(13, 148, 136, 0.2)';

export default function RoomLocationMap({ latitude, longitude }: Props) {
  const center = offsetCoords(latitude, longitude);

  const circleOverlay = {
    center,
    radius: MAP_PRIVACY_RADIUS,
    fillColor: CIRCLE_FILL,
    strokeColor: CIRCLE_STROKE,
    strokeWidth: 2,
  };

  const cameraPosition = {
    coordinates: center,
    zoom: MAP_DEFAULT_ZOOM,
  };

  return (
    <View style={{ height: 256, borderRadius: 12, overflow: 'hidden' }} pointerEvents="none">
      {Platform.OS === 'ios' ? (
        <AppleMaps.View
          style={{ flex: 1 }}
          cameraPosition={cameraPosition}
          circles={[circleOverlay]}
        />
      ) : (
        <GoogleMaps.View
          style={{ flex: 1 }}
          cameraPosition={cameraPosition}
          circles={[circleOverlay]}
        />
      )}
    </View>
  );
}

import { MAP_DEFAULT_ZOOM, MAP_PRIVACY_RADIUS } from '@openhospi/shared/constants';
import { GoogleMaps } from 'expo-maps';
import { View } from 'react-native';

import { radius } from '@/design/tokens/radius';

import { CIRCLE_FILL, CIRCLE_STROKE, offsetCoords, type RoomLocationMapProps } from './shared';

export default function RoomLocationMap({ latitude, longitude }: RoomLocationMapProps) {
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
    <View style={{ height: 256, borderRadius: radius.lg, overflow: 'hidden' }} pointerEvents="none">
      <GoogleMaps.View
        style={{ flex: 1 }}
        cameraPosition={cameraPosition}
        circles={[circleOverlay]}
      />
    </View>
  );
}

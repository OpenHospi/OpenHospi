import { MAP_PRIVACY_OFFSET } from '@openhospi/shared/constants';

export type RoomLocationMapProps = {
  latitude: number;
  longitude: number;
};

export function offsetCoords(lat: number, lng: number) {
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 2000));
  const offsetLat = (seed - 0.5) * MAP_PRIVACY_OFFSET;
  const offsetLng = (((seed * 1.3) % 1) - 0.5) * MAP_PRIVACY_OFFSET;
  return { latitude: lat + offsetLat, longitude: lng + offsetLng };
}

export const CIRCLE_FILL = 'rgba(13, 148, 136, 0.06)';
export const CIRCLE_STROKE = 'rgba(13, 148, 136, 0.2)';

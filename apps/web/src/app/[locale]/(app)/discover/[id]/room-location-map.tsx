"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import { Circle, MapContainer, TileLayer, useMap } from "react-leaflet";

type Props = {
  latitude: number;
  longitude: number;
};

// Apply a small random-ish offset for privacy (deterministic per coord)
function offsetCoords(lat: number, lng: number) {
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 2000));
  const offsetLat = (seed - 0.5) * 0.003;
  const offsetLng = ((seed * 1.3) % 1 - 0.5) * 0.003;
  return { lat: lat + offsetLat, lng: lng + offsetLng };
}

function FitBounds({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [map, lat, lng]);
  return null;
}

export default function RoomLocationMap({ latitude, longitude }: Props) {
  const offset = useMemo(() => offsetCoords(latitude, longitude), [latitude, longitude]);

  return (
    <MapContainer
      center={[offset.lat, offset.lng]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-64 w-full rounded-lg"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={[offset.lat, offset.lng]}
        radius={300}
        pathOptions={{
          color: "hsl(var(--primary))",
          fillColor: "hsl(var(--primary))",
          fillOpacity: 0.15,
          weight: 2,
        }}
      />
      <FitBounds lat={offset.lat} lng={offset.lng} />
    </MapContainer>
  );
}

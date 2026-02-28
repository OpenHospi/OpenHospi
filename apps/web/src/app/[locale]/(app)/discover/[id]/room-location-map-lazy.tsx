"use client";

import dynamic from "next/dynamic";

const RoomLocationMap = dynamic(() => import("./room-location-map"), { ssr: false });

type Props = {
  latitude: number;
  longitude: number;
};

export function RoomLocationMapLazy({ latitude, longitude }: Props) {
  return <RoomLocationMap latitude={latitude} longitude={longitude} />;
}

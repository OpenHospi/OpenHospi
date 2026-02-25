"use client";

import { useEffect, useRef } from "react";

import { markApplicationsSeen } from "./applicant-actions";

export function MarkSeenEffect({ roomId }: { roomId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    markApplicationsSeen(roomId);
  }, [roomId]);
  return null;
}

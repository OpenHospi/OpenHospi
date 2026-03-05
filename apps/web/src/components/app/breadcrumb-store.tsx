"use client";

import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore } from "react";

type Listener = () => void;

function createStore() {
  let labels: Record<string, string> = {};
  const listeners = new Set<Listener>();

  return {
    getSnapshot: () => labels,
    subscribe: (l: Listener) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    setLabel: (uuid: string, label: string) => {
      if (labels[uuid] === label) return;
      labels = { ...labels, [uuid]: label };
      for (const l of listeners) l();
    },
    removeLabel: (uuid: string) => {
      if (!(uuid in labels)) return;
      const next = { ...labels };
      delete next[uuid];
      labels = next;
      for (const l of listeners) l();
    },
  };
}

type Store = ReturnType<typeof createStore>;
const Ctx = createContext<Store | null>(null);

function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("BreadcrumbStoreProvider missing");
  return s;
}

export function BreadcrumbStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createStore);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useBreadcrumbLabels() {
  const s = useStore();
  return useSyncExternalStore(s.subscribe, s.getSnapshot, s.getSnapshot);
}

export function SetBreadcrumb({ uuid, label }: { uuid: string; label: string }) {
  const s = useStore();
  useLayoutEffect(() => {
    s.setLabel(uuid, label);
    return () => s.removeLabel(uuid);
  }, [s, uuid, label]);
  return null;
}

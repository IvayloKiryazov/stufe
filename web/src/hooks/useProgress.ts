import { useSyncExternalStore } from "react";
import { store, type Progress } from "../lib/store";

export function useProgress(): Progress {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

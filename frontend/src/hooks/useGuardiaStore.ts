"use client";

import { useSyncExternalStore } from "react";
import { guardiaStore } from "@/lib/store";
import { GuardiaState } from "@/lib/types";

export function useGuardiaStore(): GuardiaState {
  return useSyncExternalStore(
    (callback) => guardiaStore.subscribe(callback),
    () => guardiaStore.getState(),
    () => guardiaStore.getState()
  );
}

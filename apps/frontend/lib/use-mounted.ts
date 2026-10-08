"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only after the client has hydrated. Use this to gate rendering of
 * localStorage-derived state (e.g. the cart) so the first client render
 * matches the server-rendered HTML instead of diverging inside an effect.
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

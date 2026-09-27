import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

/**
 * When the app's data last changed. Every write (a car, a Service Record, a Document, the
 * reminder settings) calls `dataChanged()`, and a screen coming back into view reloads only if
 * something changed since its last load, or that load is getting old.
 *
 * Before, every tab reloaded everything each time it was shown: four queries and one more per
 * car on every tap of the tab bar, most of them bringing back what was already on screen.
 */
let version = 0;

/** Something was written: the next screen to come into view reloads. */
export function dataChanged(): void {
  version += 1;
}

export function dataVersion(): number {
  return version;
}

/** Old enough to read again anyway: day counts move at midnight, others may share a car. */
export const MAX_AGE_MS = 5 * 60 * 1000;

export type LoadStamp = { version: number; at: number };

/** Whether data loaded at `stamp` still stands. */
export function isFresh(stamp: LoadStamp | null, now = Date.now()): boolean {
  return stamp !== null && stamp.version === version && now - stamp.at < MAX_AGE_MS;
}

/**
 * Runs `load` when the screen comes into view, unless what it loaded last time is still fresh.
 * Returns `reload`, which always loads (pull to refresh, after this screen's own writes).
 */
export function useLoadWhenStale(load: () => Promise<void>): () => Promise<void> {
  const stamp = useRef<LoadStamp | null>(null);

  const reload = useCallback(async () => {
    const started = { version, at: Date.now() };
    await load();
    stamp.current = started;
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!isFresh(stamp.current)) void reload();
    }, [reload]),
  );

  return reload;
}

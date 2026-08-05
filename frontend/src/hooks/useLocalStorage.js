import { useState } from 'react';

/** Persistent state in localStorage. Everything stays on the device (AC 1.2.5). */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = (next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* storage full or blocked — state still works for this session */
      }
      return resolved;
    });
  };

  return [value, set];
}

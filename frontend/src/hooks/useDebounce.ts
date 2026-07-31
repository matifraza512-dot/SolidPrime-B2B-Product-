import { useEffect, useState } from "react";

/** Delays updating the returned value until the input has settled — used to
 * avoid firing an API request on every keystroke in search boxes. */
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

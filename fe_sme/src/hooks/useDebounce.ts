/**
 * useDebounce - ported from PMS internal system
 * Delays updating a value until after the specified delay
 */
import { useEffect, useState } from "react";

const DEFAULT_DEBOUNCE_DELAY = 500;

export const useDebounce = <T>(
  value: T,
  delay: number = DEFAULT_DEBOUNCE_DELAY,
): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

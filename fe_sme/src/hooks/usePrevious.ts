/**
 * usePrevious — returns the previous render's value
 * Ported from PMS internal system (exact port)
 */
import { useEffect, useRef } from "react";

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export default usePrevious;

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/**
 * A thin 2px progress bar pinned to the very top of the viewport.
 * Activates automatically when:
 *  - TanStack Query is fetching data (any query)
 *  - A mutation is in-flight
 *  - The route changes (page transition)
 *
 * No external dependency — pure CSS animation defined in index.css.
 */
export function GlobalLoadingBar() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const location = useLocation();

  // Briefly show the bar on every route change even when no fetch fires
  const [navActive, setNavActive] = useState(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNavActive(true);
    if (navTimer.current) clearTimeout(navTimer.current);
    navTimer.current = setTimeout(() => setNavActive(false), 600);
    return () => {
      if (navTimer.current) clearTimeout(navTimer.current);
    };
  }, [location.pathname, location.search]);

  const isActive = isFetching > 0 || isMutating > 0 || navActive;

  if (!isActive) return null;

  return (
    <div className="global-loading-bar-track" aria-hidden="true">
      <div className="global-loading-bar-fill" />
    </div>
  );
}

import { useState, useEffect, useRef } from "react";

export function useCollapsingHeader() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const initialScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    return initialScrollY > 100;
  });
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const initialScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    lastScrollY.current = initialScrollY;
    setIsCollapsed(initialScrollY > 100);

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

      // Hysteresis logic: collapse only after scrolling past 100px, expand only when returning near top (< 20px).
      // This gap prevents layout shift height changes from crossing the threshold back and forth.
      setIsCollapsed((prev) => {
        if (!prev && currentScrollY > 100) {
          return true;
        }
        if (prev && currentScrollY < 20) {
          return false;
        }
        return prev;
      });

      lastScrollY.current = currentScrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(handleScroll);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return isCollapsed;
}

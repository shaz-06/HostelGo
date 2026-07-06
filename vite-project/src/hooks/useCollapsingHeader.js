import { useState, useEffect, useRef } from "react";

export function useCollapsingHeader() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    ticking.current = false;

    // Set initial state based on current scroll position
    const initialScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    setIsCollapsed(initialScrollY > 10);

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

      // Rule: Scroll down past 10px -> hide header. Only when scrollY <= 10px -> unhide header.
      const shouldCollapse = currentScrollY > 10;

      if (shouldCollapse !== isCollapsed) {
        setIsCollapsed(shouldCollapse);
      }

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
  }, [isCollapsed]);

  return isCollapsed;
}

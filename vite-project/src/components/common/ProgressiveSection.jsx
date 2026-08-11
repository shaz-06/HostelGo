import React, { useState, useEffect, useRef } from "react";

export default function ProgressiveSection({ children, fallback, rootMargin = "600px", minHeight = "180px" }) {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (shouldRender) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
        }
      },
      {
        rootMargin,
        threshold: 0.01
      }
    );

    const currentEl = containerRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl && observer) {
        observer.unobserve(currentEl);
      }
    };
  }, [shouldRender, rootMargin]);

  return (
    <div ref={containerRef} style={{ minHeight: shouldRender ? "auto" : minHeight }}>
      {shouldRender ? children : fallback}
    </div>
  );
}

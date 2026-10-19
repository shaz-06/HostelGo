import React, { useState, useEffect, useRef } from "react";

export default function LazySection({ 
  children, 
  onIntersect, 
  rootMargin = "100px", 
  minHeight = "250px", 
  skeleton 
}) {
  const [isIntersected, setIsIntersected] = useState(false);
  const sectionRef = useRef(null);
  
  // Ref to track if we've already triggered the fetch to prevent duplicates during rapid unmount/remount
  const fetchTriggered = useRef(false);

  useEffect(() => {
    // Once intersected, we don't need to observe anymore (stable state)
    if (isIntersected) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsIntersected(true);
          if (onIntersect && !fetchTriggered.current) {
            fetchTriggered.current = true;
            onIntersect();
          }
          // Unobserve once triggered
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      {
        rootMargin, // Preload zone
        threshold: 0,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isIntersected, onIntersect, rootMargin]);

  return (
    <div ref={sectionRef} style={{ minHeight: !isIntersected ? minHeight : "auto" }}>
      {isIntersected ? children : (skeleton || null)}
    </div>
  );
}

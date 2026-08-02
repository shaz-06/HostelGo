import { useState, useCallback } from "react";

export function useDrawerGesture(onClose, threshold = 150) {
  const [startY, setStartY] = useState(null);
  const [currentY, setCurrentY] = useState(0);

  const handleTouchStart = useCallback((e) => {
    setStartY(e.touches[0].clientY);
    setCurrentY(0);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY === null) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      setCurrentY(diff);
    }
  }, [startY]);

  const handleTouchEnd = useCallback(() => {
    if (currentY > threshold) {
      onClose();
    }
    setStartY(null);
    setCurrentY(0);
  }, [currentY, onClose, threshold]);

  const transformStyle = currentY > 0 ? `translateY(${currentY}px)` : "none";
  const transitionStyle = startY === null ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : "none";

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    transformStyle,
    transitionStyle,
    isDragging: startY !== null
  };
}

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

export function usePullToRefresh() {
  const location = useLocation();
  const [refreshState, setRefreshState] = useState("idle");
  const pullDistanceRef = useRef(0);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const activeTouchRef = useRef(false);
  const hasTriggeredRefreshRef = useRef(false);
  const indicatorRef = useRef(null);

  const shouldIgnoreTouch = useCallback((target) => {
    if (!target) return false;
    const tagName = target.tagName;
    if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT" || tagName === "BUTTON" || tagName === "A" || target.isContentEditable) {
      return true;
    }
    let current = target;
    while (current) {
      if (current.classList && (
        current.classList.contains("bottom-sheet") ||
        current.classList.contains("modal") ||
        current.classList.contains("leaflet-container") ||
        current.classList.contains("no-pull-refresh") ||
        current.getAttribute("data-no-pull") === "true" ||
        current.style.overflowX === "auto" ||
        current.style.overflowX === "scroll"
      )) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }, []);

  useEffect(() => {
    const handleTouchStart = (e) => {
      hasTriggeredRefreshRef.current = false;
      if (refreshState === "refreshing") return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scrollTop > 1) return;

      const blacklistedPaths = ["/payment", "/checkout", "/login", "/otp", "/admin", "/rider"];
      if (blacklistedPaths.some(p => location.pathname.startsWith(p))) return;

      if (shouldIgnoreTouch(e.target)) return;

      const touch = e.touches[0];
      startYRef.current = touch.pageY;
      startXRef.current = touch.pageX;
      activeTouchRef.current = true;
      pullDistanceRef.current = 0;
    };

    const handleTouchMove = (e) => {
      if (!activeTouchRef.current || refreshState === "refreshing") return;

      const touch = e.touches[0];
      const deltaY = touch.pageY - startYRef.current;
      const deltaX = touch.pageX - startXRef.current;

      if (deltaY < 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
        activeTouchRef.current = false;
        pullDistanceRef.current = 0;
        if (indicatorRef.current) {
          indicatorRef.current.style.transform = "translate3d(-50%, -80px, 0) scale(0.7)";
          indicatorRef.current.style.opacity = "0";
        }
        return;
      }

      let pull = 0;
      if (deltaY > 20) {
        const drag = deltaY - 20;
        pull = Math.min(120, drag / (1.2 + drag * 0.005));
      }
      pullDistanceRef.current = pull;

      if (indicatorRef.current) {
        const opacity = Math.min(1, pull / 40);
        const scale = Math.min(1.08, 0.7 + (pull / 75) * 0.3);
        const rotate = pull * 3;

        indicatorRef.current.style.opacity = opacity.toString();
        indicatorRef.current.style.transform = `translate3d(-50%, ${pull}px, 0) scale(${scale})`;

        const spinner = indicatorRef.current.querySelector(".pull-spinner");
        if (spinner) {
          spinner.style.transform = `rotate(${rotate}deg)`;
        }

        const label = indicatorRef.current.querySelector(".pull-label");
        const circle = indicatorRef.current.querySelector(".pull-circle");

        if (label && circle) {
          if (pull >= 75) {
            label.textContent = "Release to refresh";
            circle.style.borderColor = "#318616";
            circle.style.boxShadow = "0 6px 20px rgba(49, 134, 22, 0.2)";
            circle.style.transform = "scale(1.08)";
            circle.style.transition = "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.15s ease";
          } else {
            label.textContent = "Pull to refresh";
            circle.style.borderColor = "rgba(49, 134, 22, 0.1)";
            circle.style.boxShadow = "0 4px 14px rgba(0,0,0,0.12)";
            circle.style.transform = "scale(1)";
            circle.style.transition = "none";
          }
        }
      }

      if (pull > 0 && e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (!activeTouchRef.current || refreshState === "refreshing") return;
      activeTouchRef.current = false;

      const pull = pullDistanceRef.current;
      if (pull >= 75) {
        if (!hasTriggeredRefreshRef.current) {
          hasTriggeredRefreshRef.current = true;
          setRefreshState("refreshing");

          if (indicatorRef.current) {
            indicatorRef.current.style.transition = "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease";
            indicatorRef.current.style.transform = "translate3d(-50%, 75px, 0) scale(1)";
            indicatorRef.current.style.opacity = "1";

            const spinner = indicatorRef.current.querySelector(".pull-spinner");
            if (spinner) {
              spinner.style.animation = "spin-refresh 0.8s linear infinite";
            }

            const label = indicatorRef.current.querySelector(".pull-label");
            if (label) {
              label.textContent = "Refreshing...";
            }

            const circle = indicatorRef.current.querySelector(".pull-circle");
            if (circle) {
              circle.style.borderColor = "#318616";
              circle.style.transform = "scale(1)";
            }
          }

          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      } else {
        if (indicatorRef.current) {
          indicatorRef.current.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease";
          indicatorRef.current.style.transform = "translate3d(-50%, -80px, 0) scale(0.7)";
          indicatorRef.current.style.opacity = "0";
        }
        pullDistanceRef.current = 0;
      }
    };

    const handleTouchCancel = () => {
      if (!activeTouchRef.current || refreshState === "refreshing") return;

      activeTouchRef.current = false;

      if (indicatorRef.current) {
        indicatorRef.current.style.transition =
          "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease";

        indicatorRef.current.style.transform =
          "translate3d(-50%, -80px, 0) scale(0.7)";

        indicatorRef.current.style.opacity = "0";
      }

      pullDistanceRef.current = 0;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchCancel);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [refreshState, location.pathname, shouldIgnoreTouch]);

  return { indicatorRef };
}

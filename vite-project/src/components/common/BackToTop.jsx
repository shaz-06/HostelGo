import React, { useState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [show, setShow] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingUp = currentScrollY < lastScrollY.current;
      const shouldShow = currentScrollY > 700 && isScrollingUp;

      setShow((prev) => {
        if (prev !== shouldShow) {
          return shouldShow;
        }
        return prev;
      });

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  };

  return (
    <button
      onClick={handleScrollToTop}
      style={{
        position: "fixed",
        top: "145px",
        left: "50%",
        transform: show ? "translate3d(-50%, 0, 0)" : "translate3d(-50%, -15px, 0)",
        background: "#333333",
        color: "#ffffff",
        border: "none",
        borderRadius: "30px",
        padding: "10px 22px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        fontWeight: "750",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        cursor: "pointer",
        zIndex: 9999,
        opacity: show ? 1 : 0,
        visibility: show ? "visible" : "hidden",
        transition: "opacity 300ms ease, transform 300ms ease, visibility 300ms ease",
        outline: "none"
      }}
      aria-label="Back to top"
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: "1.5px solid #ffffff",
          boxSizing: "border-box"
        }}
      >
        <ArrowUp size={12} strokeWidth={3} />
      </span>
      <span>Back to top</span>
    </button>
  );
}

import { useEffect, useRef } from "react";

/**
 * Custom hook to log component render counts and highlight slow mounts/renders.
 * @param {string} componentName - The name of the component to track.
 */
export function usePerfLogger(componentName) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const renderCount = useRef(0);
  const mountStart = useRef(performance.now());
  const lastRenderStart = useRef(performance.now());

  renderCount.current += 1;
  lastRenderStart.current = performance.now();

  // Log on every render
  console.log(`[PERF] [Render] <${componentName}> - Count: ${renderCount.current}`);

  useEffect(() => {
    const mountDuration = performance.now() - mountStart.current;
    if (mountDuration > 50) {
      console.warn(`[PERF] [Slow Mount] <${componentName}> mounted in ${mountDuration.toFixed(2)}ms (target < 50ms)`);
    } else {
      console.log(`[PERF] [Mount] <${componentName}> mounted in ${mountDuration.toFixed(2)}ms`);
    }

    return () => {
      console.log(`[PERF] [Unmount] <${componentName}> unmounted`);
    };
  }, []);

  useEffect(() => {
    const renderDuration = performance.now() - lastRenderStart.current;
    if (renderDuration > 16) {
      console.warn(`[PERF] [Slow Render] <${componentName}> render took ${renderDuration.toFixed(2)}ms (target < 16ms)`);
    }
  });
}

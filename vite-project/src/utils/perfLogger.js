/* global process */
import { useEffect, useRef } from "react";

/**
 * Custom hook to log component render counts and highlight slow mounts/renders.
 * @param {string} componentName - The name of the component to track.
 */
export function usePerfLogger(componentName) {
  const renderCount = useRef(0);
  const mountStart = useRef(0);
  const lastRenderStart = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    mountStart.current = performance.now();
    lastRenderStart.current = performance.now();

    return () => {
      console.log(`[PERF] [Unmount] <${componentName}> unmounted`);
    };
  }, [componentName]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    renderCount.current += 1;
    const now = performance.now();
    const renderDuration = now - lastRenderStart.current;
    
    console.log(`[PERF] [Render] <${componentName}> - Count: ${renderCount.current}`);
    
    if (renderCount.current > 1 && renderDuration > 16) {
      console.warn(`[PERF] [Slow Render] <${componentName}> render took ${renderDuration.toFixed(2)}ms (target < 16ms)`);
    }
    
    lastRenderStart.current = now;
  });
}

/**
 * Helper to track and log loading screen and operation durations with threshold warnings.
 * @param {string} operationName - Description of the operation/loading screen.
 * @param {number} startTime - performance.now() timestamp when operation began.
 */
export function measureLoadingOperation(operationName, startTime) {
  const duration = performance.now() - startTime;
  const formatted = duration.toFixed(2);

  if (duration > 2000) {
    console.error(`🚨 [CRITICAL LOADING OVERFLOW] <${operationName}> took ${formatted}ms (Threshold > 2000ms)`);
  } else if (duration > 1000) {
    console.warn(`⚠️ [SLOW LOADING] <${operationName}> took ${formatted}ms (Threshold > 1000ms)`);
  } else if (duration > 500) {
    console.info(`⚡ [LOADING WARNING] <${operationName}> took ${formatted}ms (Target < 500ms)`);
  } else {
    console.log(`✅ [FAST LOADING] <${operationName}> completed in ${formatted}ms`);
  }

  return duration;
}

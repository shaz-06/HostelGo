import React, { createContext, useState, useEffect, useRef } from "react";
import { registerLoaderFetch } from "../utils/apiClient";

export const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [blockingCount, setBlockingCount] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [errorState, setErrorState] = useState(null); // null, { type: 'offline' | 'timeout' | 'error', retryFn }
  const [loaderTimeStage, setLoaderTimeStage] = useState(0); // 0 (0-5s), 1 (5-15s), 2 (15-30s)

  const loaderShownAt = useRef(null);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const timeStageTimers = useRef([]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Clear offline error state if online again
      setErrorState((prev) => (prev && prev.type === "offline" ? null : prev));
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Timer cleanups
  const clearAllStageTimers = () => {
    timeStageTimers.current.forEach((t) => clearTimeout(t));
    timeStageTimers.current = [];
  };

  const handleRequestStart = () => {
    setBlockingCount((prev) => {
      const next = prev + 1;
      if (next === 1) {
        // Clear any scheduled hides
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }

        // Delay showing the loader by 300ms (anti-flicker)
        showTimeoutRef.current = setTimeout(() => {
          setShowLoader(true);
          loaderShownAt.current = Date.now();
          setLoaderTimeStage(0);

          // Setup time-based message/subtext stages
          clearAllStageTimers();

          // Stage 1: 5 seconds -> "This is taking a little longer than usual..."
          const t1 = setTimeout(() => {
            setLoaderTimeStage(1);
          }, 5000);

          // Stage 2: 15 seconds -> "Still connecting..."
          const t2 = setTimeout(() => {
            setLoaderTimeStage(2);
          }, 15000);

          timeStageTimers.current.push(t1, t2);
        }, 300);
      }
      return next;
    });
  };

  const handleRequestEnd = () => {
    setBlockingCount((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        // Cancel the show loader timer if request finishes before 300ms
        if (showTimeoutRef.current) {
          clearTimeout(showTimeoutRef.current);
          showTimeoutRef.current = null;
        }

        clearAllStageTimers();

        // Hide loader immediately without artificial minDisplay delay
        setShowLoader(false);
        loaderShownAt.current = null;
      }
      return next;
    });
  };

  // Central fetch interceptor callback
  const customFetchHandler = (url, options = {}) => {
    // Return a promise that resolves/rejects appropriately
    return new Promise(async (resolve, reject) => {
      const executeRequest = async () => {
        // Check offline first
        if (!navigator.onLine) {
          setErrorState({
            type: "offline",
            retryFn: () => executeRequest(),
            rejectFn: () => reject(new Error("No Internet Connection")),
          });
          return;
        }

        // Check if we are running in active error/timeout screen
        setErrorState(null);
        handleRequestStart();

        // Global timeout of 30 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 30000);

        try {
          const res = await fetch(url, {
            ...options,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          handleRequestEnd();

          if (!res.ok) {
            // Trigger friendly error state with retry option
            setErrorState({
              type: "error",
              retryFn: () => executeRequest(),
              rejectFn: () => reject(new Error(`Server error: status ${res.status}`)),
            });
            return;
          }

          resolve(res);
        } catch (err) {
          clearTimeout(timeoutId);
          handleRequestEnd();

          if (err.name === "AbortError") {
            setErrorState({
              type: "timeout",
              retryFn: () => executeRequest(),
              rejectFn: () => reject(new Error("Request timed out")),
            });
          } else {
            setErrorState({
              type: "error",
              retryFn: () => executeRequest(),
              rejectFn: () => reject(err),
            });
          }
        }
      };

      // Trigger first execution
      executeRequest();
    });
  };

  // Register the fetch handler to apiClient when provider mounts
  useEffect(() => {
    registerLoaderFetch(customFetchHandler);
  }, []);

  const handleRetry = React.useCallback(() => {
    if (errorState && errorState.retryFn) {
      errorState.retryFn();
    }
  }, [errorState]);

  const handleGoHome = React.useCallback(() => {
    if (errorState && errorState.rejectFn) {
      errorState.rejectFn();
    }
    setErrorState(null);
    setShowLoader(false);
    setBlockingCount(0);
    window.location.href = "/";
  }, [errorState]);

  const loaderContextValue = React.useMemo(() => ({
    showLoader,
    isOffline,
    errorState,
    loaderTimeStage,
    handleRetry,
    handleGoHome,
  }), [showLoader, isOffline, errorState, loaderTimeStage, handleRetry, handleGoHome]);

  return (
    <LoaderContext.Provider value={loaderContextValue}>
      {children}
    </LoaderContext.Provider>
  );
};

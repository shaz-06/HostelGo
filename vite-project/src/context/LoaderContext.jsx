import React, { createContext, useState, useEffect, useRef } from "react";
import { registerLoaderFetch } from "../utils/apiClient";
import OfflineScreen from "../components/common/OfflineScreen";

export const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [blockingCount, setBlockingCount] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [errorState, _setErrorState] = useState(null); // null, { type: 'offline' | 'timeout' | 'error', retryFn }
  const errorStateRef = useRef(null);

  const setErrorState = (val) => {
    if (typeof val === "function") {
      _setErrorState((prev) => {
        const next = val(prev);
        errorStateRef.current = next;
        return next;
      });
    } else {
      _setErrorState(val);
      errorStateRef.current = val;
    }
  };

  const [toastMessage, setToastMessage] = useState("");

  const showInAppToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const [loaderTimeStage, setLoaderTimeStage] = useState(0); // 0 (0-5s), 1 (5-15s), 2 (15-30s)

  const loaderShownAt = useRef(null);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const timeStageTimers = useRef([]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);

      // Auto-retry any pending requests that were blocked by offline state
      const currentError = errorStateRef.current;
      if (currentError && currentError.type === "offline" && currentError.retryFn) {
        console.log("[LoaderContext] Automatically retrying pending request...");
        currentError.retryFn();
      }

      // Clear offline error state if online again
      setErrorState((prev) => (prev && prev.type === "offline" ? null : prev));

      // Show in-app toast
      showInAppToast("Connection restored");
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

  const [isNavigating, setIsNavigating] = useState(true);
  const loadedRoutesRef = useRef({});

  const isRouteLoaded = React.useCallback((path) => {
    return !!loadedRoutesRef.current[path];
  }, []);

  const markRouteAsLoaded = React.useCallback((path) => {
    loadedRoutesRef.current[path] = true;
  }, []);

  // Timer cleanups
  const clearAllStageTimers = () => {
    timeStageTimers.current.forEach((t) => clearTimeout(t));
    timeStageTimers.current = [];
  };

  // Sync loader visibility and stage timers reactively
  useEffect(() => {
    const shouldShow = isNavigating || blockingCount > 0;
    if (shouldShow) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setShowLoader(true);
      if (!loaderShownAt.current) {
        loaderShownAt.current = Date.now();
        setLoaderTimeStage(0);
        clearAllStageTimers();

        // Stage 1: 5 seconds -> "This is taking a little longer than usual..."
        const t1 = setTimeout(() => {
          setLoaderTimeStage(1);
        }, 5000);

        // Stage 2: 8 seconds -> Trigger Timeout Fallback with Retry & Go Back options
        const t2 = setTimeout(() => {
          setLoaderTimeStage(2);
          setErrorState({
            type: "timeout",
            retryFn: () => {
              window.location.reload();
            },
            rejectFn: () => {
              window.location.href = "/";
            }
          });
        }, 8000);

        timeStageTimers.current.push(t1, t2);
      }
    } else {
      clearAllStageTimers();
      const shownAt = loaderShownAt.current;
      if (shownAt) {
        const elapsed = Date.now() - shownAt;
        const remaining = 700 - elapsed;
        if (remaining > 0) {
          hideTimeoutRef.current = setTimeout(() => {
            setShowLoader(false);
            loaderShownAt.current = null;
            markRouteAsLoaded(window.location.pathname);
          }, remaining);
        } else {
          setShowLoader(false);
          loaderShownAt.current = null;
          markRouteAsLoaded(window.location.pathname);
        }
      } else {
        setShowLoader(false);
        loaderShownAt.current = null;
      }
    }
  }, [isNavigating, blockingCount]);

  const handleRequestStart = () => {
    const currentPath = window.location.pathname;
    if (loadedRoutesRef.current[currentPath]) {
      return;
    }
    setBlockingCount((prev) => prev + 1);
  };

  const handleRequestEnd = () => {
    setBlockingCount((prev) => Math.max(0, prev - 1));
  };

  // Central fetch interceptor callback
  const customFetchHandler = (url, options = {}) => {
    return new Promise(async (resolve, reject) => {
      const executeRequest = async () => {
        if (!navigator.onLine) {
          setErrorState({
            type: "offline",
            retryFn: () => executeRequest(),
            rejectFn: () => reject(new Error("No Internet Connection")),
          });
          return;
        }

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
    setIsNavigating(false);
    window.location.href = "/";
  }, [errorState]);

  const loaderContextValue = React.useMemo(() => ({
    showLoader,
    isOffline,
    errorState,
    loaderTimeStage,
    handleRetry,
    handleGoHome,
    isNavigating,
    setIsNavigating,
    isRouteLoaded,
    markRouteAsLoaded,
  }), [showLoader, isOffline, errorState, loaderTimeStage, handleRetry, handleGoHome, isNavigating, setIsNavigating, isRouteLoaded, markRouteAsLoaded]);

  return (
    <LoaderContext.Provider value={loaderContextValue}>
      {isOffline && <OfflineScreen onRetry={() => setIsOffline(false)} />}
      {toastMessage && (
        <>
          <div style={toastStyle}>
            <span>{toastMessage}</span>
          </div>
          <style>{`
            @keyframes toastFadeInOut {
              0% { opacity: 0; transform: translate(-50%, 10px); }
              15% { opacity: 1; transform: translate(-50%, 0); }
              85% { opacity: 1; transform: translate(-50%, 0); }
              100% { opacity: 0; transform: translate(-50%, -10px); }
            }
          `}</style>
        </>
      )}
      {children}
    </LoaderContext.Provider>
  );
};

const toastStyle = {
  position: "fixed",
  bottom: "32px",
  left: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "#1e293b",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "50px",
  fontSize: "14px",
  fontWeight: "750",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
  zIndex: 9999999,
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  animation: "toastFadeInOut 3s ease-in-out forwards",
  pointerEvents: "none"
};

import { useState, useEffect, useRef, useCallback } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { startupCoordinator } from "../startup/startupCoordinator";
import { STARTUP_STATUS } from "../startup/startupConstants";
import * as locationService from "../services/location/locationService";
import * as addressService from "../services/address/addressService";
import { startupLogger } from "../services/telemetry/startupLogger";

export function useStartupLocationFlow() {
  const [startupStatus, setStartupStatus] = useState(STARTUP_STATUS.IDLE);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const hasInitialized = useRef(false);
  const abortControllerRef = useRef(null);

  const runStartupSequence = useCallback(async () => {
    // Prevent starting flow if already bypassed in this session
    if (sessionStorage.getItem("buyto_location_bypassed") === "true") {
      setStartupStatus(STARTUP_STATUS.READY);
      return;
    }

    // Cancel any ongoing startup operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStartupStatus(STARTUP_STATUS.CHECKING_SAVED_ADDRESS);

    try {
      const result = await startupCoordinator({
        locationService,
        addressService,
        telemetry: startupLogger,
        timeoutMs: 3500,
        signal: controller.signal
      });

      if (controller.signal.aborted) return;

      switch (result.status) {
        case STARTUP_STATUS.READY:
          setStartupStatus(STARTUP_STATUS.READY);
          setShowGpsModal(false);
          setShowPermissionModal(false);
          startupLogger.startupCompleted("ready");
          break;
        case "gps_disabled":
          setStartupStatus(STARTUP_STATUS.CHECKING_LOCATION_SERVICES);
          setShowGpsModal(true);
          setShowPermissionModal(false);
          break;
        case "permission_required":
        case "permission_permanently_denied":
          setStartupStatus(STARTUP_STATUS.REQUESTING_PERMISSION);
          setShowPermissionModal(true);
          setShowGpsModal(false);
          break;
        case "location_error":
          setStartupStatus(STARTUP_STATUS.READY); // set to ready but show retry error state
          setLocationError(result.error || new Error("Failed to fetch location."));
          break;
        default:
          setStartupStatus(STARTUP_STATUS.READY);
          break;
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("[useStartupLocationFlow] Coordinator error:", err);
      setStartupStatus(STARTUP_STATUS.READY);
      setLocationError(err);
    }
  }, []);

  // 1. Initial startup trigger
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    runStartupSequence();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [runStartupSequence]);

  // 2. Handle app resume: Automatically recheck location services if returning from settings
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppStateChange = async (state) => {
      // Re-trigger location checks if returning to active state and startup is not complete
      if (state.isActive && startupStatus !== STARTUP_STATUS.READY) {
        startupLogger.startupStarted();
        runStartupSequence();
      }
    };

    const handler = CapApp.addListener("appStateChange", handleAppStateChange);
    return () => {
      handler.then((h) => h.remove());
    };
  }, [startupStatus, runStartupSequence]);

  // 3. Bypass / Manual location handler
  const bypassLocationFlow = useCallback(() => {
    startupLogger.manualLocationSelected();
    sessionStorage.setItem("buyto_location_bypassed", "true");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setShowGpsModal(false);
    setShowPermissionModal(false);
    setLocationError(null);
    setStartupStatus(STARTUP_STATUS.READY);
  }, []);

  // 4. Retry handler
  const retryLocationFlow = useCallback(() => {
    setLocationError(null);
    runStartupSequence();
  }, [runStartupSequence]);

  return {
    startupComplete: startupStatus === STARTUP_STATUS.READY && !locationError,
    startupStatus,
    showGpsModal,
    showPermissionModal,
    locationError,
    bypassLocationFlow,
    retryLocationFlow
  };
}

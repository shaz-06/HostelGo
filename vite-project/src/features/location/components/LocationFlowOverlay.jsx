import React from "react";
import LocationDisabledModal from "../../../components/location/LocationDisabledModal";
import LocationPermissionModal from "../../../components/location/LocationPermissionModal";
import { LocationRetryDialog } from "./LocationRetryDialog";

export function LocationFlowOverlay({
  startupStatus,
  showGpsModal,
  showPermissionModal,
  locationError,
  bypassLocationFlow,
  retryLocationFlow,
  onSelectManually
}) {
  const handleSelectManually = () => {
    bypassLocationFlow();
    if (onSelectManually) {
      onSelectManually();
    }
  };

  return (
    <>
      <LocationDisabledModal
        isOpen={showGpsModal}
        onSelectManually={handleSelectManually}
      />

      <LocationPermissionModal
        isOpen={showPermissionModal}
        isPermanentlyDenied={startupStatus === "permission_permanently_denied"}
        onAllow={retryLocationFlow}
        onSelectManually={handleSelectManually}
      />

      <LocationRetryDialog
        isOpen={!!locationError}
        onRetry={retryLocationFlow}
        onSelectManually={handleSelectManually}
      />
    </>
  );
}

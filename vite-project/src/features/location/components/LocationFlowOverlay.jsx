import React, { useState } from "react";
import LocationDisabledModal from "../../../components/location/LocationDisabledModal";
import LocationPermissionModal from "../../../components/location/LocationPermissionModal";
import { LocationRetryDialog } from "./LocationRetryDialog";
import { LocationBottomDrawer } from "./LocationBottomDrawer";

export function LocationFlowOverlay({
  startupStatus,
  showGpsModal,
  showPermissionModal,
  locationError,
  bypassLocationFlow,
  retryLocationFlow
}) {
  const [showDrawer, setShowDrawer] = useState(false);

  const handleSelectManually = () => {
    bypassLocationFlow();
    setShowDrawer(true);
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

      <LocationBottomDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
      />
    </>
  );
}

import React from "react";
import { LocationBottomDrawer } from "../../features/location/components/LocationBottomDrawer";

/**
 * AddressSelectorModal acts as a backward compatibility wrapper 
 * pointing directly to the unified LocationBottomDrawer component.
 */
export default function AddressSelectorModal({ onClose, onSelectAddress, isLoggedIn }) {
  return (
    <LocationBottomDrawer
      isOpen={true}
      onClose={onClose}
    />
  );
}

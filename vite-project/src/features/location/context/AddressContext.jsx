import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { addressRepository } from "../repositories/addressRepository";
import { verifyLocationServiceability } from "../services/serviceabilityService";
import { startupLogger } from "../../../services/telemetry/startupLogger";

export const AddressContext = createContext();

export const AddressProvider = ({ children }) => {
  const [selectedAddress, _setSelectedAddress] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [locationSource, setLocationSource] = useState("manual");
  const [coordinates, setCoordinates] = useState(null);
  const [serviceabilityError, setServiceabilityError] = useState(null);

  // Load initially from repository
  useEffect(() => {
    async function loadInitial() {
      const resSelected = await addressRepository.getSelectedAddress();
      if (resSelected.success && resSelected.data) {
        _setSelectedAddress(resSelected.data);
        setCoordinates(resSelected.data.coords);
        setLocationSource(localStorage.getItem("buyto_location_source") || "manual");
      }
      
      const resSaved = await addressRepository.getSavedAddresses();
      if (resSaved.success && resSaved.data) {
        setSavedAddresses(resSaved.data);
        const def = resSaved.data.find(a => a.isDefault || a.is_default);
        if (def) setDefaultAddress(def);
      }
    }
    loadInitial();
    
    // Listen to network status to sync pending offline address items
    const handleOnline = () => {
      addressRepository.syncPendingChanges().then(() => {
        loadInitial();
      });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const selectAddress = useCallback(async (address) => {
    if (!address) return;
    
    const previousAddress = selectedAddress;
    const previousCoords = coordinates;
    
    // Optimistic Update
    _setSelectedAddress(address);
    setCoordinates(address.coords || { latitude: address.latitude, longitude: address.longitude });
    setServiceabilityError(null);

    // Verify serviceability
    const lat = address.latitude || (address.coords ? address.coords.latitude : null);
    const lng = address.longitude || (address.coords ? address.coords.longitude : null);
    
    if (lat && lng) {
      const check = await verifyLocationServiceability(lat, lng);
      if (!check.serviceable) {
        // Rollback
        _setSelectedAddress(previousAddress);
        setCoordinates(previousCoords);
        setServiceabilityError("This address is currently outside our delivery area.");
        startupLogger.gpsDisabled(); // Log warning
        return false;
      }
    }

    // Save persisted state
    await addressRepository.setSelectedAddress(address);
    return true;
  }, [selectedAddress, coordinates]);

  const addAddress = useCallback(async (address) => {
    const res = await addressRepository.saveAddress(address);
    if (res.success && res.data) {
      // Reload address list
      const resList = await addressRepository.getSavedAddresses();
      if (resList.success) setSavedAddresses(resList.data);
      return res.data;
    }
    return null;
  }, []);

  const updateAddress = useCallback(async (address) => {
    const res = await addressRepository.updateAddress(address);
    if (res.success && res.data) {
      const resList = await addressRepository.getSavedAddresses();
      if (resList.success) setSavedAddresses(resList.data);
      return res.data;
    }
    return null;
  }, []);

  const deleteAddress = useCallback(async (id) => {
    const res = await addressRepository.deleteAddress(id);
    if (res.success) {
      const resList = await addressRepository.getSavedAddresses();
      if (resList.success) setSavedAddresses(resList.data);
      return true;
    }
    return false;
  }, []);

  const value = React.useMemo(() => ({
    selectedAddress,
    savedAddresses,
    defaultAddress,
    locationSource,
    coordinates,
    serviceabilityError,
    setServiceabilityError,
    selectAddress,
    addAddress,
    updateAddress,
    deleteAddress
  }), [
    selectedAddress,
    savedAddresses,
    defaultAddress,
    locationSource,
    coordinates,
    serviceabilityError,
    selectAddress,
    addAddress,
    updateAddress,
    deleteAddress
  ]);

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => useContext(AddressContext);

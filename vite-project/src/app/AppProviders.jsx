import React from "react";
import { AuthProvider } from "../context/AuthContext";
import { UIProvider } from "../context/UIContext";
import { LoaderProvider } from "../context/LoaderContext";
import { AddressProvider } from "../features/location/context/AddressContext";

export default function AppProviders({ children }) {
  return (
    <AddressProvider>
      <LoaderProvider>
        <UIProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </UIProvider>
      </LoaderProvider>
    </AddressProvider>
  );
}

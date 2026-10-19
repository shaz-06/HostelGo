import React from 'react';
import AppProviders from './AppProviders';
import AppRouter from './AppRouter';
import CookieConsent from "../components/common/CookieConsent";
export default function App() {
  return (
    <AppProviders>
      <AppRouter />
      <CookieConsent />
    </AppProviders>
  );
}
import React, { createContext, useState, useCallback, useMemo } from 'react';

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [loginBottomSheetOpen, setLoginBottomSheetOpen] = useState(false);
  const [onLoginSuccessCallback, setOnLoginSuccessCallback] = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hideSensitive, setHideSensitive] = useState(false);

  const openOnboarding = useCallback(() => setOnboardingOpen(true), []);
  const closeOnboarding = useCallback(() => setOnboardingOpen(false), []);

  const openLogin = useCallback((onSuccess) => {
    setOnLoginSuccessCallback(() => typeof onSuccess === "function" ? onSuccess : null);
    setLoginBottomSheetOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginBottomSheetOpen(false);
    setOnLoginSuccessCallback(null);
  }, []);

  const toggleHideSensitive = useCallback(() => {
    setHideSensitive(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    loginBottomSheetOpen,
    isLoginOpen: loginBottomSheetOpen,
    openLogin,
    closeLogin,
    onLoginSuccessCallback,
    setOnLoginSuccessCallback,
    onboardingOpen,
    isOnboardingOpen: onboardingOpen,
    openOnboarding,
    closeOnboarding,
    showWelcomeModal,
    setShowWelcomeModal,
    hideSensitive,
    toggleHideSensitive
  }), [
    loginBottomSheetOpen,
    openLogin,
    closeLogin,
    onLoginSuccessCallback,
    onboardingOpen,
    openOnboarding,
    closeOnboarding,
    showWelcomeModal,
    hideSensitive,
    toggleHideSensitive
  ]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

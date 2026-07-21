import React, { createContext, useState, useEffect } from "react";
import { syncTokenWithBackend } from "../services/pushNotifications";
import { apiFetch } from "../utils/apiClient";

export const AuthContext = createContext();

const guestUser = {
  _id: "guest-user",
  name: "",
  email: "",
  phoneNumber: "",
  role: "guest",
  isGuest: true
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("buyto_user") || localStorage.getItem("hostelgoUser");
    return saved ? JSON.parse(saved) : guestUser;
  });

  const [token, setToken] = useState(() => {
    // Check if we are an admin and app was restarted
    const hasAdminSession = sessionStorage.getItem("buyto_admin_token");
    if (!hasAdminSession && localStorage.getItem("buyto_login_token")) {
      // Revert active token to the standard unverified login token
      localStorage.setItem("buyto_token", localStorage.getItem("buyto_login_token") || "");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      // Clean up URL query parameters so the token is not visible
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      localStorage.setItem("buyto_token", urlToken);
      localStorage.setItem("buyto_login_token", urlToken);
      return urlToken;
    }
    return localStorage.getItem("buyto_token") || null;
  });

  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeBonus, setWelcomeBonus] = useState(20);
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/config");
        if (res.ok) {
          const data = await res.json();
          setAppConfig(data);
          console.log("Cached configuration loaded successfully:", data);
        }
      } catch (err) {
        console.error("Failed to load app configuration:", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    // Keep user state validated with backend on initial load if token exists
    const checkUserSession = async () => {
      if (token) {
        const url = window.API_BASE_URL + "/api/auth/me";
        console.log("=== CHECK USER SESSION INITIATED ===");
        console.log("URL:", url);
        console.log("Authorization Header Present:", !!token);
        
        try {
          const res = await apiFetch(url, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            blocking: false
          });
          
          console.log("Response status:", res.status);
          const text = await res.text();
          console.log("Response body:", text);

          if (res.ok) {
            const data = JSON.parse(text);
            setUser(data.user);
            localStorage.setItem("buyto_user", JSON.stringify(data.user));
            localStorage.setItem("hostelgoUser", JSON.stringify(data.user));
          } else {
            if (res.status === 401 || res.status === 403) {
              console.log("AUTH FAILURE TRIGGERED: Status", res.status);
              console.log("LOGOUT CALLED");
              logout();
            } else {
              console.warn(`Session check returned non-ok status: ${res.status}. Session preserved.`);
            }
          }
        } catch (err) {
          console.error("=== CHECK USER SESSION FETCH ERROR ===");
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
        }
      } else {
        // When no authenticated session exists, setUser(guestUser) and skip /api/auth/me & token validation
        setUser(guestUser);
      }
      setLoading(false);
    };

    checkUserSession();
  }, [token]);



  const [saveForLaterIds, setSaveForLaterIds] = useState([]);

  // Fetch or load Save For Later list
  useEffect(() => {
    const loadSaveForLater = async () => {
      if (token) {
        try {
          const res = await fetch(window.API_BASE_URL + "/api/save-for-later", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.savedProducts) {
              const ids = data.savedProducts.map(p => {
                const prod = p.productId;
                return prod ? String(prod._id || prod.id || prod) : "";
              }).filter(Boolean);
              setSaveForLaterIds(ids);
            }
          }
        } catch (err) {
          console.error("Failed to load Save For Later list:", err);
        }
      } else {
        const guestSaved = localStorage.getItem("buyto_save_for_later");
        if (guestSaved) {
          try {
            setSaveForLaterIds(JSON.parse(guestSaved));
          } catch (e) {
            setSaveForLaterIds([]);
          }
        } else {
          setSaveForLaterIds([]);
        }
      }
    };
    loadSaveForLater();
  }, [token]);

  const syncGuestSavedProducts = async (userToken) => {
    const guestSaved = localStorage.getItem("buyto_save_for_later");
    if (guestSaved) {
      try {
        const ids = JSON.parse(guestSaved);
        if (Array.isArray(ids) && ids.length > 0) {
          console.log("Syncing guest Save For Later products to backend...", ids);
          await Promise.all(
            ids.map(productId =>
              fetch(window.API_BASE_URL + `/api/save-for-later/${productId}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${userToken}`
                }
              }).catch(err => console.error("Sync failed for", productId, err))
            )
          );
        }
      } catch (err) {
        console.error("Failed to sync guest products:", err);
      } finally {
        localStorage.removeItem("buyto_save_for_later");
      }
    }
  };

  const toggleSaveForLater = async (product) => {
    const productId = String(product._id || product.id);
    const isSaved = saveForLaterIds.includes(productId);

    if (token) {
      try {
        const method = isSaved ? "DELETE" : "POST";
        const res = await fetch(window.API_BASE_URL + `/api/save-for-later/${productId}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.savedProducts) {
            const ids = data.savedProducts.map(p => {
              const prod = p.productId;
              return prod ? String(prod._id || prod.id || prod) : "";
            }).filter(Boolean);
            setSaveForLaterIds(ids);
          }
          return { success: true, isSaved: !isSaved };
        } else {
          const errData = await res.json();
          return { success: false, message: errData.message };
        }
      } catch (err) {
        console.error("Toggle Save For Later API call failed:", err);
        return { success: false, message: err.message };
      }
    } else {
      let updatedIds;
      if (isSaved) {
        updatedIds = saveForLaterIds.filter(id => id !== productId);
      } else {
        updatedIds = [...saveForLaterIds, productId];
      }
      setSaveForLaterIds(updatedIds);
      localStorage.setItem("buyto_save_for_later", JSON.stringify(updatedIds));
      return { success: true, isSaved: !isSaved };
    }
  };

  const login = async (email, password) => {
    console.log("=== [FRONTEND AUTH LOGIN] ===");
    const res = await apiFetch(window.API_BASE_URL + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      blocking: false
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login authentication failed");
    }

    await syncGuestSavedProducts(data.token);

    setToken(data.token);
    setUser(data.user);

    // Set localStorage credentials
    localStorage.setItem("buyto_token", data.token);
    localStorage.setItem("buyto_login_token", data.token);
    localStorage.setItem("buyto_user", JSON.stringify(data.user));
    localStorage.setItem("hostelgoUser", JSON.stringify(data.user));

    setTimeout(() => {
      syncTokenWithBackend(data.token);
    }, 100);

    return data;
  };

  const [loginBottomSheetOpen, setLoginBottomSheetOpen] = useState(false);
  const [onLoginSuccessCallback, setOnLoginSuccessCallback] = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const openOnboarding = () => {
    setOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setOnboardingOpen(false);
  };

  const updateUserInSession = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("buyto_user", JSON.stringify(updatedUser));
    localStorage.setItem("hostelgoUser", JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(window.API_BASE_URL + "/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("buyto_user", JSON.stringify(data.user));
          localStorage.setItem("hostelgoUser", JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch (err) {
      console.error("refreshUser error:", err);
    }
  };

  const openLogin = (onSuccess) => {
    console.log("Opening OTP bottom sheet");
    setOnLoginSuccessCallback(() => typeof onSuccess === "function" ? onSuccess : null);
    setLoginBottomSheetOpen(true);
  };

  const closeLogin = () => {
    setLoginBottomSheetOpen(false);
    setOnLoginSuccessCallback(null);
  };

  const setAuthSession = async (authToken, authUser, isNewUser = false, welcomeBonusAmount = 20) => {
    console.log("LOGIN SUCCESS");
    await syncGuestSavedProducts(authToken);
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("buyto_token", authToken);
    localStorage.setItem("buyto_login_token", authToken);
    localStorage.setItem("buyto_user", JSON.stringify(authUser));
    localStorage.setItem("hostelgoUser", JSON.stringify(authUser));
    console.log("JWT SAVED");

    if (isNewUser) {
      setWelcomeBonus(welcomeBonusAmount);
      setShowWelcomeModal(true);
    }

    setTimeout(() => {
      syncTokenWithBackend(authToken);
    }, 100);

    if (onLoginSuccessCallback) {
      try {
        onLoginSuccessCallback();
      } catch (e) {
        console.error("Error executing login success callback:", e);
      }
    }
    setLoginBottomSheetOpen(false);
    setOnLoginSuccessCallback(null);
  };

  const signup = async (name, email, phone, password) => {
    console.log("=== [FRONTEND AUTH SIGNUP] ===");
    const res = await apiFetch(window.API_BASE_URL + "/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
      blocking: false
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Signup failed");
    }

    await syncGuestSavedProducts(data.token);

    setToken(data.token);
    setUser(data.user);

    // Set localStorage credentials
    localStorage.setItem("buyto_token", data.token);
    localStorage.setItem("buyto_login_token", data.token);
    localStorage.setItem("buyto_user", JSON.stringify(data.user));
    localStorage.setItem("hostelgoUser", JSON.stringify(data.user));

    if (data.isNewUser) {
      setWelcomeBonus(data.welcomeBonus || 20);
      setShowWelcomeModal(true);
    }

    setTimeout(() => {
      syncTokenWithBackend(data.token);
    }, 100);

    if (onLoginSuccessCallback) {
      try {
        onLoginSuccessCallback();
      } catch (e) {}
    }
    setLoginBottomSheetOpen(false);
    setOnLoginSuccessCallback(null);

    return data;
  };

  const logout = () => {
    console.log("=== [FRONTEND AUTH LOGOUT] ===");

    setToken(null);
    setUser(guestUser);
    setSaveForLaterIds([]);
    localStorage.removeItem("buyto_token");
    localStorage.removeItem("buyto_login_token");
    sessionStorage.removeItem("buyto_admin_token");
    localStorage.removeItem("buyto_user");
    localStorage.removeItem("hostelgoUser");
    localStorage.removeItem("hostelgo_cart");
    localStorage.removeItem("cart");
    localStorage.removeItem("buyto_selected_address_id");
  };

  const verifyAdmin = (verifiedToken) => {
    sessionStorage.setItem("buyto_admin_token", verifiedToken);
    localStorage.setItem("buyto_token", verifiedToken);
    setToken(verifiedToken);
  };

  const isAdminVerified = !!token && !!sessionStorage.getItem("buyto_admin_token");

  const isLoggedIn = !!user && !user.isGuest;

  useEffect(() => {
    const registerAdminPushToken = async () => {
      if (user && (user.phone === "6363849864" || user.role === "admin")) {
        try {
          const { getMessaging, getToken } = await import("firebase/messaging");
          const { app } = await import("../config/firebase");
          
          const messaging = getMessaging(app);
          
          if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            console.log("[Admin FCM] SW registered:", registration);
            
            let tokenOptions = { serviceWorkerRegistration: registration };
            if (import.meta.env.VITE_FIREBASE_VAPID_KEY) {
              tokenOptions.vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            }
            
            const token = await getToken(messaging, tokenOptions);
            if (token) {
              console.log("[Admin FCM] Retrieved Web FCM Token:", token);
              
              const res = await fetch(window.API_BASE_URL + "/api/notifications/register-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("buyto_token")}`
                },
                body: JSON.stringify({
                  phone: user.phone || "6363849864",
                  fcmToken: token
                })
              });
              if (res.ok) {
                console.log("[Admin FCM] Token registered on backend successfully");
              } else {
                console.error("[Admin FCM] Failed to register token on backend", res.status);
              }
            }
          }
        } catch (err) {
          console.error("[Admin FCM] Error requesting Web FCM token:", err);
        }
      }
    };

    registerAdminPushToken();
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn, 
      token, 
      loading, 
      login, 
      signup, 
      logout, 
      setAuthSession, 
      verifyAdmin,
      isAdminVerified,
      saveForLaterIds, 
      toggleSaveForLater, 
      loginBottomSheetOpen,
      isLoginOpen: loginBottomSheetOpen,
      openLogin,
      closeLogin,
      onboardingOpen,
      isOnboardingOpen: onboardingOpen,
      openOnboarding,
      closeOnboarding,
      updateUserInSession,
      refreshUser,
      showWelcomeModal,
      setShowWelcomeModal,
      welcomeBonus,
      appConfig
    }}>
      {children}
    </AuthContext.Provider>
  );
};
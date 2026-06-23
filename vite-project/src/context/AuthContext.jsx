import React, { createContext, useState, useEffect } from "react";
import { initializePushNotifications } from "../services/pushNotifications";

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
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      // Clean up URL query parameters so the token is not visible
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      localStorage.setItem("buyto_token", urlToken);
      return urlToken;
    }
    return localStorage.getItem("buyto_token") || null;
  });

  const [loading, setLoading] = useState(true);

  const syncFCMToken = async (authToken) => {
    try {
      const fcmToken = localStorage.getItem("fcm_token");
      if (!fcmToken) {
        console.log("[AuthContext] No FCM token available in localStorage to sync.");
        return;
      }
      console.log("[AuthContext] Syncing FCM token with backend...");
      const res = await fetch(window.API_BASE_URL + "/api/users/fcm-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ token: fcmToken })
      });
      if (res.ok) {
        console.log("[AuthContext] FCM token synced successfully with backend.");
      } else {
        console.error("[AuthContext] Failed to sync FCM token with backend:", res.status);
      }
    } catch (err) {
      console.error("[AuthContext] Error syncing FCM token:", err);
    }
  };

  useEffect(() => {
    // Keep user state validated with backend on initial load if token exists
    const checkUserSession = async () => {
      if (token) {
        try {
          const res = await fetch(window.API_BASE_URL + "/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem("buyto_user", JSON.stringify(data.user));
            localStorage.setItem("hostelgoUser", JSON.stringify(data.user));
            syncFCMToken(token);
          } else {
            // Expired or invalid token
            logout();
          }
        } catch (err) {
          console.error("Session verification failed:", err);
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
    const res = await fetch(window.API_BASE_URL + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
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
    localStorage.setItem("buyto_user", JSON.stringify(data.user));
    localStorage.setItem("hostelgoUser", JSON.stringify(data.user));

    //Initialize Firebase Push Notifications
    await initializePushNotifications();

    //Sync token to backend
    syncFCMToken(data.token);

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

  const openLogin = (onSuccess) => {
    console.log("Opening OTP bottom sheet");
    setOnLoginSuccessCallback(() => typeof onSuccess === "function" ? onSuccess : null);
    setLoginBottomSheetOpen(true);
  };

  const closeLogin = () => {
    setLoginBottomSheetOpen(false);
    setOnLoginSuccessCallback(null);
  };

  const setAuthSession = async (authToken, authUser) => {
    await syncGuestSavedProducts(authToken);
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("buyto_token", authToken);
    localStorage.setItem("buyto_user", JSON.stringify(authUser));
    localStorage.setItem("hostelgoUser", JSON.stringify(authUser));
    syncFCMToken(authToken);
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
    const res = await fetch(window.API_BASE_URL + "/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password })
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
    localStorage.setItem("buyto_user", JSON.stringify(data.user));
    localStorage.setItem("hostelgoUser", JSON.stringify(data.user));

    //Initialize Firebase Push Notifications
    await initializePushNotifications();

    //Sync token to backend
    syncFCMToken(data.token);

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

    const activeToken = token || localStorage.getItem("buyto_token");
    if (activeToken) {
      fetch(window.API_BASE_URL + "/api/users/fcm-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ token: null })
      }).catch(err => console.error("Error removing FCM token from backend on logout:", err));
    }

    setToken(null);
    setUser(guestUser);
    setSaveForLaterIds([]);
    localStorage.removeItem("buyto_token");
    localStorage.removeItem("buyto_user");
    localStorage.removeItem("hostelgoUser");
    localStorage.removeItem("hostelgo_cart");
    localStorage.removeItem("cart");
  };

  const isLoggedIn = !!user && !user.isGuest;

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
      saveForLaterIds, 
      toggleSaveForLater, 
      syncFCMToken,
      loginBottomSheetOpen,
      isLoginOpen: loginBottomSheetOpen,
      openLogin,
      closeLogin,
      onboardingOpen,
      isOnboardingOpen: onboardingOpen,
      openOnboarding,
      closeOnboarding,
      updateUserInSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
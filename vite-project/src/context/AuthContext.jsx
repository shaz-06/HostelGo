import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("buyto_user") || localStorage.getItem("hostelgoUser");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem("buyto_token") || null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep user state validated with backend on initial load if token exists
    const checkUserSession = async () => {
      if (token) {
        try {
          const res = await fetch("http://localhost:8000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            localStorage.setItem("buyto_user", JSON.stringify(data.user));
            localStorage.setItem("hostelgoUser", JSON.stringify(data.user));
          } else {
            // Expired or invalid token
            logout();
          }
        } catch (err) {
          console.error("Session verification failed:", err);
        }
      }
      setLoading(false);
    };

    checkUserSession();
  }, [token]);

  const login = async (email, password) => {
    console.log("=== [FRONTEND AUTH LOGIN] ===");
    const res = await fetch("http://localhost:8000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login authentication failed");
    }

    setToken(data.token);
    setUser(data.user);
    
    // Set localStorage credentials
    localStorage.setItem("buyto_token", data.token);
    localStorage.setItem("buyto_user", JSON.stringify(data.user));
    localStorage.setItem("hostelgoUser", JSON.stringify(data.user));
    
    return data;
  };

  const setAuthSession = (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem("buyto_token", authToken);
    localStorage.setItem("buyto_user", JSON.stringify(authUser));
    localStorage.setItem("hostelgoUser", JSON.stringify(authUser));
  };

  const signup = async (name, email, phone, password) => {
    console.log("=== [FRONTEND AUTH SIGNUP] ===");
    const res = await fetch("http://localhost:8000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Signup failed");
    }

    setToken(data.token);
    setUser(data.user);

    // Set localStorage credentials
    localStorage.setItem("buyto_token", data.token);
    localStorage.setItem("buyto_user", JSON.stringify(data.user));
    localStorage.setItem("hostelgoUser", JSON.stringify(data.user));
    
    return data;
  };

  const logout = () => {
    console.log("=== [FRONTEND AUTH LOGOUT] ===");
    setToken(null);
    setUser(null);
    localStorage.removeItem("buyto_token");
    localStorage.removeItem("buyto_user");
    localStorage.removeItem("hostelgoUser");
    localStorage.removeItem("hostelgo_cart");
    localStorage.removeItem("cart");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, setAuthSession }}>
      {children}
    </AuthContext.Provider>
  );
};

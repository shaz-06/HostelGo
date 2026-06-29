import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, token, loading, isAdminVerified } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
        <span>Checking permissions...</span>
      </div>
    );
  }

  // If not logged in or role is not admin, redirect to customer home
  if (!token || !user || user.role !== "admin") {
    console.warn("🔐 AdminRoute: Non-admin access blocked. Redirecting to home.");
    return <Navigate to="/" replace />;
  }

  // If admin but session is not 2FA verified, redirect to verification screen
  if (!isAdminVerified) {
    console.warn("🔐 AdminRoute: Admin session not verified. Redirecting to verification.");
    return <Navigate to="/admin-verify" replace />;
  }

  return children;
}
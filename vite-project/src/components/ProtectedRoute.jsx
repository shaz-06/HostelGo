import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontFamily: "Outfit, Inter, sans-serif" }}>
        <span>Checking permissions...</span>
      </div>
    );
  }

  if (!token) {
    console.warn("🔐 ProtectedRoute: Unauthenticated session blocked. Redirecting to /login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}


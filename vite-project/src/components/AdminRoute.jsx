import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        <span>Checking permissions...</span>
      </div>
    );
  }

  if (!token || !user || user.role !== "admin") {
    console.warn("🔐 AdminRoute: Unauthorized administrative access blocked. Redirecting to home.");
    return <Navigate to="/" replace />;
  }

  return children;
}

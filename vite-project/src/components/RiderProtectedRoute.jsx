import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function RiderProtectedRoute({ children }) {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#05070d", display: "flex", alignItems: "center", justifyContent: "center", color: "#6ee7b7" }}>
        <span>Checking rider access...</span>
      </div>
    );
  }

  if (!token || !user || user.role !== "rider") {
    console.warn("🔐 RiderProtectedRoute: Unauthorized rider access blocked.");
    return <Navigate to="/rider/login" replace />;
  }

  return children;
}

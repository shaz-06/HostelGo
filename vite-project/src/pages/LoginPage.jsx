import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { BRANDING } from "../config/branding";
import BuytoLogo from "../components/common/BuytoLogo";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      
      const res = await login(formData.email, formData.password);
      console.log("=== [FRONTEND] Login successful ===");
      
      const from = location.state?.from?.pathname || "/";
      
      // Redirect based on role
      if (res.user?.role === "admin") {
        navigate("/admin");
      } else if (res.user?.role === "rider") {
        navigate("/rider/dashboard");
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div style={pageContainerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <BuytoLogo size="xl" />
          </div>
          <h1 style={titleStyle}>Welcome Back</h1>
          <p style={subtitleStyle}>Sign in to access your instant delivery cart</p>
        </div>

        {error && <div style={errorStyle}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.border = "1.5px solid #FF4D4F";
                e.target.style.background = "white";
                e.target.style.boxShadow = "0 0 0 4px rgba(255, 77, 79, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1.5px solid #e5e7eb";
                e.target.style.background = "#f9fafb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.border = "1.5px solid #FF4D4F";
                  e.target.style.background = "white";
                  e.target.style.boxShadow = "0 0 0 4px rgba(255, 77, 79, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1.5px solid #e5e7eb";
                  e.target.style.background = "#f9fafb";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={showPasswordBtnStyle}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={submitBtnStyle}>
            {loading ? "Signing in..." : "Continue 🚀"}
          </button>
        </form>

        <div style={footerStyle}>
          <span style={{ color: "#6B7280", fontSize: "14px" }}>
            Don't have an account?{" "}
            <strong onClick={() => navigate("/signup", { state: location.state })} style={linkStyle}>
              Sign Up
            </strong>
          </span>
          
          <div style={{ marginTop: "16px" }}>
            <span onClick={() => navigate("/")} style={backBtnStyle}>
              ← Back to Store
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// STYLES
const pageContainerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "24px",
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: "400px",
  background: "rgba(255, 255, 255, 0.95)",
  border: "1px solid rgba(255, 255, 255, 0.6)",
  borderRadius: "32px",
  padding: "36px",
  backdropFilter: "blur(16px)",
  boxShadow: "0 20px 40px rgba(17, 24, 39, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)",
  boxSizing: "border-box",
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "24px",
};

const logoStyle = {
  fontSize: "28px",
  fontWeight: "900",
  color: "#FF4D4F",
  display: "block",
  marginBottom: "8px",
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "850",
  color: "#111827",
  margin: "0 0 4px 0",
};

const subtitleStyle = {
  color: "#6B7280",
  fontSize: "13px",
  margin: 0,
  fontWeight: "600",
};

const errorStyle = {
  background: "rgba(239, 68, 68, 0.12)",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  color: "#ef4444",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "13px",
  fontWeight: "600",
  marginBottom: "16px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle = {
  width: "100%",
  height: "50px",
  background: "#f9fafb",
  border: "1.5px solid #e5e7eb",
  borderRadius: "12px",
  padding: "0 16px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s ease",
};

const showPasswordBtnStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  fontSize: "16px",
  cursor: "pointer",
};

const submitBtnStyle = {
  height: "52px",
  background: "#FF4D4F",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "750",
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 8px 16px rgba(255, 77, 79, 0.2)",
  marginTop: "12px",
  transition: "all 0.15s ease",
};

const footerStyle = {
  textAlign: "center",
  marginTop: "24px",
};

const linkStyle = {
  color: "#FF4D4F",
  cursor: "pointer",
  fontWeight: "800",
};

const backBtnStyle = {
  color: "#6B7280",
  fontSize: "13px",
  cursor: "pointer",
  fontWeight: "600",
};
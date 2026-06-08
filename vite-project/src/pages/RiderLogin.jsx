import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { BRANDING } from "../config/branding";
import BuytoLogo from "../components/common/BuytoLogo";

export default function RiderLogin() {
  const navigate = useNavigate();
  const { setAuthSession } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setLoading(true);
      const res = await fetch(window.API_BASE_URL + "/api/rider/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Rider login failed");
      setAuthSession(data.token, data.user);
      navigate("/rider/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={authPageStyle}>
      <form onSubmit={submit} style={authCardStyle}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <BuytoLogo size="xl" />
          <span style={{ ...brandStyle, color: "#318616", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>
            Delivery Partner
          </span>
        </div>
        <h1 style={{ ...titleStyle, textAlign: "center" }}>Partner Login</h1>
        <p style={copyStyle}>Go online, accept packed orders, and complete instant deliveries.</p>
        {error && <div style={errorStyle}>⚠️ {error}</div>}
        <input 
          style={inputStyle} 
          type="email" 
          placeholder="Rider email" 
          value={form.email} 
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
          required 
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
        <input 
          style={inputStyle} 
          type="password" 
          placeholder="Password" 
          value={form.password} 
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
          required 
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
        <button style={primaryBtnStyle} disabled={loading}>{loading ? "Signing in..." : "Start Riding 🚀"}</button>
        <button type="button" style={ghostBtnStyle} onClick={() => navigate("/rider/signup")}>Create rider account</button>
      </form>
    </div>
  );
}

const authPageStyle = { 
  minHeight: "100vh", 
  background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)", 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  padding: 20, 
  fontFamily: "'Outfit','Inter',sans-serif" 
};

const authCardStyle = { 
  width: "100%", 
  maxWidth: 420, 
  background: "rgba(255, 255, 255, 0.95)", 
  border: "1px solid rgba(255, 255, 255, 0.6)", 
  borderRadius: 32, 
  padding: 28, 
  boxShadow: "0 20px 40px rgba(17, 24, 39, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)", 
  display: "flex", 
  flexDirection: "column", 
  gap: 14 
};

const brandStyle = { 
  color: "#FF4D4F", 
  fontWeight: 900, 
  fontSize: 24 
};

const titleStyle = { 
  color: "#111827", 
  margin: "4px 0 0", 
  fontSize: 28, 
  letterSpacing: "-0.5px",
  fontWeight: "850"
};

const copyStyle = { 
  color: "#6B7280", 
  margin: 0, 
  fontSize: 14, 
  lineHeight: 1.5,
  fontWeight: "600"
};

const inputStyle = { 
  height: 50, 
  borderRadius: 12, 
  border: "1.5px solid #e5e7eb", 
  background: "#f9fafb", 
  color: "#111827", 
  padding: "0 14px", 
  fontWeight: 600, 
  outline: "none",
  transition: "all 0.2s ease",
  boxSizing: "border-box"
};

const primaryBtnStyle = { 
  height: 50, 
  border: "none", 
  borderRadius: 12, 
  background: "#FF4D4F", 
  color: "white", 
  fontWeight: 900, 
  cursor: "pointer",
  boxShadow: "0 8px 16px rgba(255, 77, 79, 0.2)",
  fontSize: "15px"
};

const ghostBtnStyle = { 
  height: 42, 
  border: "1px solid #e5e7eb", 
  borderRadius: 12, 
  background: "transparent", 
  color: "#6B7280", 
  fontWeight: 800, 
  cursor: "pointer" 
};

const errorStyle = { 
  background: "rgba(239,68,68,0.12)", 
  border: "1px solid rgba(239,68,68,0.2)", 
  color: "#ef4444", 
  borderRadius: 12, 
  padding: 12, 
  fontSize: 13, 
  fontWeight: 800 
};


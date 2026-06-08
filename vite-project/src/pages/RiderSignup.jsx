import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { BRANDING } from "../config/branding";
import BuytoLogo from "../components/common/BuytoLogo";

export default function RiderSignup() {
  const navigate = useNavigate();
  const { setAuthSession } = useContext(AuthContext);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", vehicleType: "Bike", profileImage: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setLoading(true);
      const res = await fetch(window.API_BASE_URL + "/api/rider/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Rider signup failed");
      setAuthSession(data.token, data.user);
      navigate("/rider/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const focusInput = (e) => {
    e.target.style.border = "1.5px solid #FF4D4F";
    e.target.style.background = "white";
    e.target.style.boxShadow = "0 0 0 4px rgba(255, 77, 79, 0.1)";
  };

  const blurInput = (e) => {
    e.target.style.border = "1.5px solid #e5e7eb";
    e.target.style.background = "#f9fafb";
    e.target.style.boxShadow = "none";
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
        <h1 style={{ ...titleStyle, textAlign: "center" }}>Partner Signup</h1>
        <p style={copyStyle}>Aadhaar and driving license verification are prepared as onboarding placeholders.</p>
        {error && <div style={errorStyle}>⚠️ {error}</div>}
        <input 
          style={inputStyle} 
          placeholder="Full name" 
          value={form.name} 
          onChange={(e) => setForm({ ...form, name: e.target.value })} 
          required 
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <input 
          style={inputStyle} 
          type="email" 
          placeholder="Email" 
          value={form.email} 
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
          required 
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <input 
          style={inputStyle} 
          placeholder="Phone number" 
          value={form.phone} 
          onChange={(e) => setForm({ ...form, phone: e.target.value })} 
          required 
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <select 
          style={inputStyle} 
          value={form.vehicleType} 
          onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
          onFocus={focusInput}
          onBlur={blurInput}
        >
          <option>Bike</option>
          <option>Scooter</option>
          <option>Cycle</option>
          <option>EV Scooter</option>
        </select>
        <input 
          style={inputStyle} 
          placeholder="Profile photo URL (optional)" 
          value={form.profileImage} 
          onChange={(e) => setForm({ ...form, profileImage: e.target.value })} 
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <input 
          style={inputStyle} 
          type="password" 
          placeholder="Password" 
          value={form.password} 
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
          required 
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <div style={verifyGridStyle}>
          <span>🪪 Aadhaar: Pending</span>
          <span>🏍️ License: Pending</span>
        </div>
        <button style={primaryBtnStyle} disabled={loading}>{loading ? "Creating..." : "Create Rider Account"}</button>
        <button type="button" style={ghostBtnStyle} onClick={() => navigate("/rider/login")}>Already registered</button>
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
  maxWidth: 460, 
  background: "rgba(255, 255, 255, 0.95)", 
  border: "1px solid rgba(255, 255, 255, 0.6)", 
  borderRadius: 32, 
  padding: 28, 
  boxShadow: "0 20px 40px rgba(17, 24, 39, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)", 
  display: "flex", 
  flexDirection: "column", 
  gap: 13 
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

const verifyGridStyle = { 
  display: "grid", 
  gridTemplateColumns: "1fr 1fr", 
  gap: 10, 
  color: "#f59e0b", 
  fontSize: 12, 
  fontWeight: 900 
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
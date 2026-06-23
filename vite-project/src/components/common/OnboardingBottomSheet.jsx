import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OnboardingBottomSheet() {
  const { isOnboardingOpen, closeOnboarding, token, updateUserInSession } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Profile, 2: Address, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 states
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");

  // Step 2 states
  const [apartment, setApartment] = useState("");
  const [room, setRoom] = useState("");
  const [floor, setFloor] = useState("");
  const [landmark, setLandmark] = useState("");

  if (!isOnboardingOpen) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Full Name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(window.API_BASE_URL + "/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, gender })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      updateUserInSession(data.user);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!apartment.trim() || !room.trim()) {
      setError("Apartment/Hostel and Room Number are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(window.API_BASE_URL + "/api/auth/save-onboarding-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ apartment, room, floor, landmark })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save address");
      }

      updateUserInSession(data.user);
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    closeOnboarding();
    // Reset state for next use
    setStep(1);
    setName("");
    setGender("");
    setApartment("");
    setRoom("");
    setFloor("");
    setLandmark("");
    navigate("/");
  };

  return (
    <div style={backdropStyle}>
      <div style={sheetStyle}>
        <div style={dragIndicatorStyle}></div>

        <div style={scrollContentStyle}>
          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}

          {step === 1 && (
            <form onSubmit={handleProfileSubmit} style={formStyle}>
              <div style={headerStyle}>
                <h2 style={titleStyle}>Welcome to Buyto 👋</h2>
                <p style={subtitleStyle}>Let's set up your profile to customize your experience</p>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                  required
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Gender (Optional)</label>
                <div style={genderContainerStyle}>
                  {["Male", "Female", "Prefer not to say"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      style={{
                        ...genderOptionStyle,
                        backgroundColor: gender === g ? "#16a34a" : "#f3f4f6",
                        color: gender === g ? "#ffffff" : "#1f2937",
                        border: gender === g ? "1px solid #16a34a" : "1px solid #e5e7eb"
                      }}
                      disabled={loading}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div style={stickyFooterStyle}>
                <button type="submit" style={ctaButtonStyle} disabled={loading}>
                  {loading ? "Saving..." : "Continue →"}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleAddressSubmit} style={formStyle}>
              <div style={headerStyle}>
                <h2 style={titleStyle}>Add Delivery Address 📍</h2>
                <p style={subtitleStyle}>Tell us where to deliver your orders in your hostel or apartment</p>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Hostel / Apartment Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Central Tower / Aravali Hostel"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                  required
                />
              </div>

              <div style={rowStyle}>
                <div style={{ ...inputGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Room Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    style={inputStyle}
                    disabled={loading}
                    required
                  />
                </div>

                <div style={{ ...inputGroupStyle, flex: 1 }}>
                  <label style={labelStyle}>Floor Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    style={inputStyle}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near main gate / Common Room"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  style={inputStyle}
                  disabled={loading}
                />
              </div>

              <div style={stickyFooterStyle}>
                <button type="submit" style={ctaButtonStyle} disabled={loading}>
                  {loading ? "Saving Address..." : "Save & Continue →"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div style={successWrapperStyle}>
              <div style={successIconStyle}>🎉</div>
              <h2 style={successTitleStyle}>Welcome to Buyto</h2>
              <p style={successSubtitleStyle}>Your account setup is complete.</p>

              <div style={stickyFooterStyle}>
                <button onClick={handleFinish} style={ctaButtonStyle}>
                  Start Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Styling Objects matching modern Rich Aesthetics
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(6px)",
  zIndex: 1100,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center"
};

const sheetStyle = {
  backgroundColor: "#ffffff",
  borderTopLeftRadius: "32px",
  borderTopRightRadius: "32px",
  width: "100%",
  maxWidth: "480px",
  height: "90vh",
  boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.12)",
  animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
};

const dragIndicatorStyle = {
  width: "56px",
  height: "6px",
  backgroundColor: "#e5e7eb",
  borderRadius: "3px",
  margin: "12px auto 16px auto",
  flexShrink: 0
};

const scrollContentStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "0 24px 24px 24px",
  display: "flex",
  flexDirection: "column"
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  justifyContent: "space-between"
};

const headerStyle = {
  marginBottom: "28px"
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "850",
  color: "#111827",
  margin: "0 0 8px 0",
  letterSpacing: "-0.5px"
};

const subtitleStyle = {
  fontSize: "14px",
  color: "#4b5563",
  lineHeight: "1.5",
  margin: 0
};

const inputGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginBottom: "20px"
};

const labelStyle = {
  fontSize: "13.5px",
  fontWeight: "700",
  color: "#374151"
};

const inputStyle = {
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1.5px solid #e5e7eb",
  fontSize: "14.5px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  color: "#1f2937",
  backgroundColor: "#f9fafb"
};

const rowStyle = {
  display: "flex",
  gap: "16px",
  marginBottom: "4px"
};

const genderContainerStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "4px"
};

const genderOptionStyle = {
  flex: 1,
  minWidth: "90px",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  fontSize: "13.5px",
  fontWeight: "650",
  cursor: "pointer",
  transition: "all 0.25s ease",
  outline: "none",
  textAlign: "center"
};

const stickyFooterStyle = {
  marginTop: "auto",
  paddingTop: "24px",
  paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
  backgroundColor: "#ffffff",
  borderTop: "1px solid #f3f4f6",
  display: "flex",
  flexDirection: "column"
};

const ctaButtonStyle = {
  backgroundColor: "#16a34a",
  color: "#ffffff",
  border: "none",
  borderRadius: "18px",
  padding: "16px 24px",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "pointer",
  transition: "all 0.2s",
  outline: "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
};

const errorBannerStyle = {
  backgroundColor: "#fef2f2",
  color: "#b91c1c",
  padding: "14px 18px",
  borderRadius: "16px",
  fontSize: "13.5px",
  fontWeight: "750",
  marginBottom: "20px",
  border: "1px solid #fee2e2"
};

const successWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "40px 0",
  height: "100%",
  flex: 1
};

const successIconStyle = {
  fontSize: "72px",
  marginBottom: "24px",
  animation: "bounce 1s infinite"
};

const successTitleStyle = {
  fontSize: "26px",
  fontWeight: "900",
  color: "#111827",
  margin: "0 0 12px 0"
};

const successSubtitleStyle = {
  fontSize: "15px",
  color: "#4b5563",
  margin: "0 0 32px 0",
  lineHeight: "1.6"
};

import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, token, refreshUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success"); // "success" | "error"

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [avatar, setAvatar] = useState("");

  // Phone OTP modal states
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState("input"); // "input" | "verify"
  const [otpLoading, setOtpLoading] = useState(false);

  // Unsaved changes dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const fileInputRef = useRef(null);

  // Initial populate from user context / backend fetch
  useEffect(() => {
    let isMounted = true;
    const fetchLatestProfile = async () => {
      if (token && refreshUser) {
        const freshUser = await refreshUser();
        if (freshUser && isMounted) {
          setName(freshUser.name || "");
          setEmail(freshUser.email || "");
          setPhone(freshUser.phone || "");
          setDateOfBirth(freshUser.dateOfBirth ? freshUser.dateOfBirth.split("T")[0] : "");
          setGender(freshUser.gender || "");
          setAvatar(freshUser.avatar || "");
        }
      } else if (user && isMounted) {
        setName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "");
        setGender(user.gender || "");
        setAvatar(user.avatar || "");
      }
      if (isMounted) setInitialLoading(false);
    };
    fetchLatestProfile();
    return () => { isMounted = false; };
  }, [token]);

  // Compute dirty (hasUnsavedChanges)
  const origName = user?.name || "";
  const origEmail = user?.email || "";
  const origDob = user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : "";
  const origGender = user?.gender || "";
  const origAvatar = user?.avatar || "";

  const isDirty =
    name !== origName ||
    email !== origEmail ||
    dateOfBirth !== origDob ||
    gender !== origGender ||
    avatar !== origAvatar;

  const showToast = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Back action with unsaved check
  const handleBackClick = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/profile");
    }
  };

  // Avatar Upload / Remove handlers
  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate type & size
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (JPG, PNG, WebP)", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result); // Base64 data URL preview & save
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
  };

  // Phone OTP Flow
  const handleRequestPhoneOtp = async (e) => {
    e.preventDefault();
    if (!newPhone || !/^\d{10}$/.test(newPhone.trim())) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(window.API_BASE_URL + "/api/users/request-phone-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPhone: newPhone.trim() })
      });
      const data = await res.json();
      setOtpLoading(false);
      if (data.success) {
        setOtpStep("verify");
        showToast("OTP sent successfully to " + newPhone, "success");
      } else {
        showToast(data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      setOtpLoading(false);
      showToast("Error requesting OTP", "error");
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      showToast("Please enter a valid OTP code", "error");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(window.API_BASE_URL + "/api/users/verify-phone-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ otp: otpCode.trim() })
      });
      const data = await res.json();
      setOtpLoading(false);
      if (data.success) {
        setPhone(data.phone);
        setShowPhoneModal(false);
        setOtpStep("input");
        setNewPhone("");
        setOtpCode("");
        if (refreshUser) refreshUser();
        showToast("Phone number updated successfully!", "success");
      } else {
        showToast(data.message || "OTP verification failed", "error");
      }
    } catch (err) {
      setOtpLoading(false);
      showToast("Error verifying OTP", "error");
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      showToast("Name must be between 2 and 50 characters", "error");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(window.API_BASE_URL + "/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          dateOfBirth,
          gender,
          avatar
        })
      });
      const data = await res.json();
      setSaving(false);

      if (data.success) {
        if (refreshUser) await refreshUser();
        showToast("✅ Profile updated successfully.", "success");
        setTimeout(() => {
          navigate("/profile");
        }, 1200);
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      setSaving(false);
      showToast("Failed to save changes. Please try again.", "error");
    }
  };

  const getInitials = (n) => {
    if (!n) return "U";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  if (initialLoading) {
    return (
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 16px", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
        <div style={{ height: "24px", width: "140px", background: "#e2e8f0", borderRadius: "8px", marginBottom: "24px" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "#e2e8f0" }} />
          <div style={{ width: "120px", height: "18px", background: "#e2e8f0", borderRadius: "6px" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ height: "48px", background: "#e2e8f0", borderRadius: "12px" }} />
          <div style={{ height: "48px", background: "#e2e8f0", borderRadius: "12px" }} />
          <div style={{ height: "48px", background: "#e2e8f0", borderRadius: "12px" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: toastType === "error" ? "#ef4444" : "#318616",
            color: "white",
            padding: "12px 24px",
            borderRadius: "30px",
            fontWeight: "700",
            fontSize: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>{toastType === "error" ? "⚠️" : "✅"}</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px 20px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          position: "sticky",
          top: 0,
          zIndex: 100
        }}
      >
        <button
          onClick={handleBackClick}
          style={{
            background: "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#1e293b",
            fontSize: "18px",
            fontWeight: "800"
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
          Edit Profile
        </h1>
      </div>

      {/* Container */}
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Profile Picture Section */}
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "24px", textAlign: "center", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "16px" }}>
            {avatar ? (
              <img
                src={avatar}
                alt="Profile Avatar"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #318616"
                }}
              />
            ) : (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #318616 0%, #15803d 100%)",
                  color: "white",
                  fontSize: "36px",
                  fontWeight: "900",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  boxShadow: "0 4px 12px rgba(49, 134, 22, 0.25)"
                }}
              >
                {getInitials(name)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              📷 Change Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: "none" }}
            />
            {avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                style={{
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                🗑 Remove Photo
              </button>
            )}
          </div>
        </div>

        {/* Personal Information Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Full Name */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #f1f5f9" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Full Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              minLength={2}
              maxLength={50}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Phone Number (Read-only + OTP button) */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Phone Number
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewPhone("");
                  setOtpCode("");
                  setOtpStep("input");
                  setShowPhoneModal(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#318616",
                  fontWeight: "800",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Change Phone Number
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={phone ? `+91 ${phone}` : "Not provided"}
                readOnly
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "14px",
                  fontWeight: "700",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
              <span style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", fontWeight: "700", color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: "8px" }}>
                Verified 🔒
              </span>
            </div>
          </div>

          {/* Email Address */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #f1f5f9" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Date of Birth */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #f1f5f9" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Gender */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", border: "1px solid #f1f5f9" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Gender (Optional)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                <label
                  key={g}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: gender === g ? "2px solid #318616" : "1px solid #e2e8f0",
                    background: gender === g ? "#f0fdf4" : "#ffffff",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: gender === g ? "#15803d" : "#334155"
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ accentColor: "#318616" }}
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          {/* Sticky Bottom Save Button */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              padding: "16px 20px",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
              zIndex: 90
            }}
          >
            <div style={{ maxWidth: "560px", margin: "0 auto" }}>
              <button
                type="submit"
                disabled={!isDirty || saving}
                style={{
                  width: "100%",
                  background: !isDirty || saving ? "#cbd5e1" : "linear-gradient(135deg, #318616 0%, #15803d 100%)",
                  color: "white",
                  padding: "14px",
                  borderRadius: "14px",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: "800",
                  cursor: !isDirty || saving ? "not-allowed" : "pointer",
                  boxShadow: !isDirty || saving ? "none" : "0 4px 14px rgba(49, 134, 22, 0.35)",
                  transition: "all 0.2s"
                }}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>

      </div>

      {/* Phone OTP Verification Modal */}
      {showPhoneModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div style={{ background: "white", borderRadius: "20px", padding: "24px", maxWidth: "400px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 8px 0", color: "#0f172a" }}>
              Change Phone Number
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
              {otpStep === "input"
                ? "Enter your new 10-digit phone number. We will send an OTP code for verification."
                : `Enter the 6-digit OTP code sent to +91 ${newPhone}.`}
            </p>

            {otpStep === "input" ? (
              <form onSubmit={handleRequestPhoneOtp}>
                <input
                  type="tel"
                  maxLength={10}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit phone number"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "16px",
                    fontWeight: "700",
                    marginBottom: "16px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(false)}
                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", fontWeight: "700", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#318616", color: "white", fontWeight: "800", cursor: "pointer" }}
                  >
                    {otpLoading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp}>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter OTP (Default: 123456)"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "18px",
                    fontWeight: "800",
                    letterSpacing: "4px",
                    textAlign: "center",
                    marginBottom: "16px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setOtpStep("input")}
                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", fontWeight: "700", cursor: "pointer" }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#318616", color: "white", fontWeight: "800", cursor: "pointer" }}
                  >
                    {otpLoading ? "Verifying..." : "Verify & Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Dialog */}
      {showUnsavedDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div style={{ background: "white", borderRadius: "20px", padding: "24px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
              Discard changes?
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
              Your changes haven't been saved.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowUnsavedDialog(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontWeight: "700",
                  color: "#334155",
                  cursor: "pointer"
                }}
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  navigate("/profile");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ArrowLeft, Camera, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, token, refreshUser, updateUserInSession } = useContext(AuthContext);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  // Initial populate
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

  const showToast = useCallback((msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  }, []);

  const handleBackClick = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/profile");
    }
  };

  // Avatar upload via multipart POST /api/upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (JPG, PNG, WebP)", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(window.API_BASE_URL + "/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      setUploadingAvatar(false);
      if (data.success && data.imageUrl) {
        setAvatar(data.imageUrl);
        showToast("Photo uploaded successfully!", "success");
      } else {
        showToast(data.message || "Failed to upload photo", "error");
      }
    } catch (err) {
      setUploadingAvatar(false);
      showToast("Error uploading photo", "error");
    }
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
        if (updateUserInSession) {
          updateUserInSession({ ...user, phone: data.phone });
        } else if (refreshUser) {
          await refreshUser();
        }
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
        // Immediately synchronize user context state
        if (updateUserInSession && data.user) {
          updateUserInSession(data.user);
        } else if (refreshUser) {
          await refreshUser();
        }
        showToast("Profile updated successfully.", "success");
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
      <div className="max-w-[600px] mx-auto p-5 space-y-6">
        <div className="h-6 w-36 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded-sm animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-[48px] bg-gray-200 dark:bg-gray-800 rounded-[12px] animate-pulse" />
          <div className="h-[48px] bg-gray-200 dark:bg-gray-800 rounded-[12px] animate-pulse" />
          <div className="h-[48px] bg-gray-200 dark:bg-gray-800 rounded-[12px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-[100px] font-sans text-[var(--text-primary)]">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full font-bold text-sm shadow-lg z-[99999] flex items-center gap-2 text-white transition-all duration-300 animate-fade-in ${
            toastType === "error" ? "bg-red-500" : "bg-[#318616]"
          }`}
        >
          {toastType === "error" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-5 py-4 flex items-center gap-4 z-50">
        <button
          onClick={handleBackClick}
          className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)] hover:bg-gray-200 active:scale-95 transition-all duration-150 focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-black tracking-tight">
          Edit Profile
        </h1>
      </div>

      {/* Form Container */}
      <div className="max-w-[560px] mx-auto p-4">
        
        {/* Profile Picture Section */}
        <div className="bg-[var(--bg-card)] rounded-[20px] p-6 text-center mb-5 border border-[var(--border-color)] shadow-sm">
          <div className="relative inline-block mb-4">
            {uploadingAvatar ? (
              <div className="w-24 h-24 rounded-full border-2 border-[var(--border-color)] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <Loader2 className="w-8 h-8 animate-spin text-[#318616]" />
              </div>
            ) : avatar ? (
              <img
                src={avatar}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full object-cover border-3 border-[#318616] shadow-sm"
              />
            ) : (
              <img
                src="https://img.icons8.com/?size=100&id=492ILERveW8G&format=png&color=000000"
                alt="Default Profile Avatar"
                className="w-24 h-24 rounded-full object-contain p-2 bg-gray-50 border border-gray-100"
              />
            )}
          </div>

          <div className="flex gap-2.5 justify-center flex-wrap">
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="bg-[#f0fdf4] dark:bg-[#318616]/10 text-[#318616] border border-[#bbf7d0] dark:border-[#318616]/30 px-4 py-2 rounded-full text-[13px] font-bold cursor-pointer flex items-center gap-1.5 hover:bg-[#dcfce7] active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" /> Change Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            {avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-full text-[13px] font-bold cursor-pointer flex items-center gap-1.5 hover:bg-red-100/50 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Input Fields Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Full Name */}
          <div className="bg-[var(--bg-card)] rounded-[16px] p-4 border border-[var(--border-color)]">
            <label className="block text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              minLength={2}
              maxLength={50}
              className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3.5 py-3 text-sm font-semibold rounded-[10px] border border-[var(--border-color)] outline-none focus:border-[#318616] transition-colors"
            />
          </div>

          {/* Phone Number */}
          <div className="bg-[var(--bg-card)] rounded-[16px] p-4 border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
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
                className="text-[12px] font-extrabold text-[#318616] hover:underline focus:outline-none"
              >
                Change Phone Number
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={phone ? `+91 ${phone}` : "Not provided"}
                readOnly
                className="w-full bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)] px-3.5 py-3 text-sm font-bold rounded-[10px] border border-[var(--border-color)] outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-md border border-green-200 dark:border-green-900/30">
                Verified 🔒
              </span>
            </div>
          </div>

          {/* Email Address */}
          <div className="bg-[var(--bg-card)] rounded-[16px] p-4 border border-[var(--border-color)]">
            <label className="block text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3.5 py-3 text-sm font-semibold rounded-[10px] border border-[var(--border-color)] outline-none focus:border-[#318616] transition-colors"
            />
          </div>

          {/* Date of Birth */}
          <div className="bg-[var(--bg-card)] rounded-[16px] p-4 border border-[var(--border-color)]">
            <label className="block text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Date of Birth (Optional)
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3.5 py-3 text-sm font-semibold rounded-[10px] border border-[var(--border-color)] outline-none focus:border-[#318616] transition-colors"
            />
          </div>

          {/* Gender */}
          <div className="bg-[var(--bg-card)] rounded-[16px] p-4 border border-[var(--border-color)]">
            <label className="block text-[11px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Gender (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                <label
                  key={g}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] border cursor-pointer text-[13px] font-bold transition-all ${
                    gender === g
                      ? "border-[#318616] bg-[#f0fdf4] dark:bg-[#318616]/10 text-[#318616]"
                      : "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-gray-100/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={(e) => setGender(e.target.value)}
                    className="accent-[#318616]"
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          {/* Sticky Bottom Save Button bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] p-4 shadow-md z-40">
            <div className="max-w-[560px] mx-auto">
              <button
                type="submit"
                disabled={!isDirty || saving}
                className={`w-full py-3.5 rounded-[14px] text-[15px] font-black text-white flex items-center justify-center gap-2 transition-all ${
                  !isDirty || saving
                    ? "bg-gray-300 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : "bg-[#318616] hover:bg-[#318616]/95 shadow-[0_4px_14px_rgba(49,134,22,0.3)] active:scale-[0.99] cursor-pointer"
                }`}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Phone OTP Verification Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 max-w-[400px] w-full shadow-2xl">
            <h3 className="text-[17px] font-black mb-2 text-[var(--text-primary)]">
              Change Phone Number
            </h3>
            <p className="text-[12.5px] text-[var(--text-secondary)] mb-5 leading-relaxed">
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
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-[10px] p-3 text-base font-bold mb-4 outline-none focus:border-[#318616]"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(false)}
                    className="flex-1 py-2.5 rounded-[10px] border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] font-bold cursor-pointer hover:bg-gray-100/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="flex-1 py-2.5 rounded-[10px] bg-[#318616] text-white font-bold cursor-pointer hover:bg-[#318616]/95"
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
                  className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-[10px] p-3 text-lg font-black tracking-widest text-center mb-4 outline-none focus:border-[#318616]"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOtpStep("input")}
                    className="flex-1 py-2.5 rounded-[10px] border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] font-bold cursor-pointer hover:bg-gray-100/50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="flex-1 py-2.5 rounded-[10px] bg-[#318616] text-white font-bold cursor-pointer hover:bg-[#318616]/95"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 max-w-[380px] w-full text-center shadow-2xl">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-[17px] font-black text-[var(--text-primary)] mb-1.5">
              Discard changes?
            </h3>
            <p className="text-[12.5px] text-[var(--text-secondary)] mb-5 leading-relaxed">
              Your changes haven't been saved.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowUnsavedDialog(false)}
                className="flex-1 py-2.5 rounded-[10px] border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] font-bold cursor-pointer hover:bg-gray-100/50"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  navigate("/profile");
                }}
                className="flex-1 py-2.5 rounded-[10px] bg-red-500 text-white font-bold cursor-pointer hover:bg-red-600"
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

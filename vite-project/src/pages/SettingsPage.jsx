import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Address States
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isExpandingAddresses, setIsExpandingAddresses] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  // Address Form State
  const [addressForm, setAddressForm] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    addressLine: "",
    landmark: "",
    roomNumber: "",
    addressType: "Hostel"
  });

  // Toggle & Preferences States
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offersRewards, setOffersRewards] = useState(true);
  const [language, setLanguage] = useState("English");

  // Modals & Triggers
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedOrderPref = localStorage.getItem("buyto_pref_order_updates");
    if (savedOrderPref !== null) setOrderUpdates(savedOrderPref === "true");
    
    const savedOffersPref = localStorage.getItem("buyto_pref_offers_rewards");
    if (savedOffersPref !== null) setOffersRewards(savedOffersPref === "true");

    const savedLang = localStorage.getItem("buyto_pref_language");
    if (savedLang !== null) setLanguage(savedLang);

    if (token) {
      fetchAddresses();
    }
  }, [token]);

  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true);
      const res = await fetch(window.API_BASE_URL + "/api/addresses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAddresses(data.addresses || []);
        }
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setProfileSaving(true);
      const res = await fetch(window.API_BASE_URL + "/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, gender })
      });
      if (res.ok) {
        alert("Profile updated successfully!");
        setIsEditingProfile(false);
        // Reload page to sync context state
        window.location.reload();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile details");
    } finally {
      setProfileSaving(false);
    }
  };

  // Add or Edit Address
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine) {
      alert("Please fill name, phone, and address line.");
      return;
    }
    
    try {
      const url = editingAddressId 
        ? `${window.API_BASE_URL}/api/addresses/${editingAddressId}`
        : `${window.API_BASE_URL}/api/addresses`;
        
      const method = editingAddressId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      });

      if (res.ok) {
        alert(editingAddressId ? "Address updated!" : "Address added!");
        setAddressForm({
          fullName: user?.name || "",
          phone: user?.phone || "",
          addressLine: "",
          landmark: "",
          roomNumber: "",
          addressType: "Hostel"
        });
        setIsAddingAddress(false);
        setEditingAddressId(null);
        fetchAddresses();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save address");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving address");
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Address deleted!");
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChange = (key, value) => {
    localStorage.setItem(key, String(value));
    if (key === "buyto_pref_order_updates") setOrderUpdates(value);
    if (key === "buyto_pref_offers_rewards") setOffersRewards(value);
  };

  const handleLanguageChange = (lang) => {
    localStorage.setItem("buyto_pref_language", lang);
    setLanguage(lang);
  };

  const handleDeleteAccount = () => {
    alert("Account deletion request submitted. You will be logged out.");
    setShowDeleteModal(false);
    logout();
    navigate("/");
  };

  const handleShareSettings = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Buyto Instant Grocery",
          text: "Order groceries in minutes!",
          url: "https://buyto.co.in"
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      navigator.clipboard.writeText("https://buyto.co.in");
      alert("App Link copied to clipboard!");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={contentWrapperStyle}>

        {/* Global style injections */}
        <style>{`
          .toggle-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
          }
          .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .3s;
            border-radius: 24px;
          }
          .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
          }
          input:checked + .toggle-slider {
            background-color: #318616;
          }
          input:checked + .toggle-slider:before {
            transform: translateX(20px);
          }
          .settings-row-btn {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            background: none;
            border: none;
            padding: 14px 20px;
            font-size: 14px;
            font-weight: 700;
            color: #1f2937;
            cursor: pointer;
            text-align: left;
            border-bottom: 1px solid #f3f4f6;
            box-sizing: border-box;
          }
          .settings-row-btn:last-child {
            border-bottom: none;
          }
          .settings-row-btn:active {
            background: #f9fafb;
          }
          .settings-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
          }
        `}</style>

        {/* Header */}
        <div style={headerStyle}>
          <button onClick={() => navigate("/profile")} style={backBtnStyle}>←</button>
          <h1 style={titleStyle}>Settings</h1>
        </div>

        {/* SECTION 1: ACCOUNT */}
        <div style={{ marginBottom: "8px" }}>
          <h3 style={sectionTitleStyle}>Account</h3>
          <div className="settings-card">
            
            {/* Edit Profile Item */}
            <button 
              onClick={() => setIsEditingProfile(!isEditingProfile)} 
              className="settings-row-btn"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>👤</span>
                <span>Edit Profile</span>
              </div>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                {isEditingProfile ? "▼" : "▶"}
              </span>
            </button>

            {isEditingProfile && (
              <form onSubmit={handleProfileSave} style={formBoxStyle}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={labelStyle}>Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    style={inputStyle}
                    placeholder="Enter name"
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Gender</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)} 
                    style={selectStyle}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingProfile(false)} 
                    style={cancelBtnStyle}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={profileSaving}
                    style={saveBtnStyle}
                  >
                    {profileSaving ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            )}

            {/* Saved Addresses Item */}
            <button 
              onClick={() => {
                setIsExpandingAddresses(!isExpandingAddresses);
                if (!isExpandingAddresses) fetchAddresses();
              }} 
              className="settings-row-btn"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>📍</span>
                <span>Saved Addresses</span>
              </div>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                {isExpandingAddresses ? "▼" : "▶"}
              </span>
            </button>

            {isExpandingAddresses && (
              <div style={expandedSectionStyle}>
                {addressesLoading ? (
                  <p style={loadingTextStyle}>Loading saved addresses...</p>
                ) : addresses.length === 0 && !isAddingAddress ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#6b7280" }}>
                      No saved addresses yet.
                    </p>
                    <button 
                      onClick={() => setIsAddingAddress(true)} 
                      style={addAddressBtnStyle}
                    >
                      + Add Address
                    </button>
                  </div>
                ) : (
                  <div>
                    {!isAddingAddress && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {addresses.map((addr) => (
                          <div key={addr._id} style={addressCardStyle}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={addressTypeBadgeStyle}>{addr.label || addr.addressType || "Hostel"}</span>
                                <span style={{ fontSize: "13px", fontWeight: "800", color: "#1f2937" }}>{addr.fullName}</span>
                              </div>
                              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#4b5563" }}>
                                {addr.addressLine} {addr.roomNumber ? `, Room ${addr.roomNumber}` : ""}
                              </p>
                              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#9ca3af" }}>
                                Phone: {addr.phone}
                              </p>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                              <button 
                                onClick={() => {
                                  setEditingAddressId(addr._id);
                                  setAddressForm({
                                    fullName: addr.fullName,
                                    phone: addr.phone,
                                    addressLine: addr.addressLine,
                                    landmark: addr.landmark || "",
                                    roomNumber: addr.roomNumber || "",
                                    addressType: addr.addressType || "Hostel"
                                  });
                                  setIsAddingAddress(true);
                                }} 
                                style={textLinkStyle("#318616")}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => deleteAddress(addr._id)} 
                                style={textLinkStyle("#ef4444")}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            setEditingAddressId(null);
                            setAddressForm({
                              fullName: user?.name || "",
                              phone: user?.phone || "",
                              addressLine: "",
                              landmark: "",
                              roomNumber: "",
                              addressType: "Hostel"
                            });
                            setIsAddingAddress(true);
                          }} 
                          style={addAddressBtnStyle}
                        >
                          + Add New Address
                        </button>
                      </div>
                    )}

                    {isAddingAddress && (
                      <form onSubmit={handleAddressSubmit} style={formBoxStyle}>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "800", color: "#1f2937" }}>
                          {editingAddressId ? "Edit Address" : "New Address Details"}
                        </h4>
                        <div style={{ marginBottom: "10px" }}>
                          <label style={labelStyle}>Full Name *</label>
                          <input 
                            type="text" 
                            required
                            value={addressForm.fullName} 
                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} 
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ marginBottom: "10px" }}>
                          <label style={labelStyle}>Phone Number *</label>
                          <input 
                            type="text" 
                            required
                            value={addressForm.phone} 
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} 
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ marginBottom: "10px" }}>
                          <label style={labelStyle}>Hostel / Apartment *</label>
                          <input 
                            type="text" 
                            required
                            value={addressForm.addressLine} 
                            onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} 
                            style={inputStyle}
                            placeholder="e.g. Block B, Tech PG"
                          />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                          <div>
                            <label style={labelStyle}>Room Number</label>
                            <input 
                              type="text" 
                              value={addressForm.roomNumber} 
                              onChange={(e) => setAddressForm({ ...addressForm, roomNumber: e.target.value })} 
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Landmark</label>
                            <input 
                              type="text" 
                              value={addressForm.landmark} 
                              onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} 
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        <div style={{ marginBottom: "14px" }}>
                          <label style={labelStyle}>Type</label>
                          <select 
                            value={addressForm.addressType} 
                            onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })} 
                            style={selectStyle}
                          >
                            <option value="Hostel">Hostel</option>
                            <option value="PG">PG</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            type="button" 
                            onClick={() => setIsAddingAddress(false)} 
                            style={cancelBtnStyle}
                          >
                            Back
                          </button>
                          <button 
                            type="submit" 
                            style={saveBtnStyle}
                          >
                            Save Address
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* SECTION 2: NOTIFICATIONS */}
        <div style={{ marginBottom: "8px" }}>
          <h3 style={sectionTitleStyle}>Notifications</h3>
          <div className="settings-card">
            
            {/* Order Updates */}
            <div style={flexRowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🔔</span>
                <span style={rowLabelStyle}>Order Updates</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={orderUpdates}
                  onChange={(e) => handleToggleChange("buyto_pref_order_updates", e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Offers & Rewards */}
            <div style={{ ...flexRowStyle, borderBottom: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🎁</span>
                <span style={rowLabelStyle}>Offers & Rewards</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={offersRewards}
                  onChange={(e) => handleToggleChange("buyto_pref_offers_rewards", e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

          </div>
        </div>

        {/* SECTION 3: PREFERENCES */}
        <div style={{ marginBottom: "8px" }}>
          <h3 style={sectionTitleStyle}>Preferences</h3>
          <div className="settings-card">
            
            {/* Language */}
            <div style={flexRowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🌐</span>
                <span style={rowLabelStyle}>Language</span>
              </div>
              <select 
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)} 
                style={inlineSelectStyle}
              >
                <option value="English">English</option>
                <option value="Kannada">Kannada</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            {/* Dark Mode */}
            <div style={{ ...flexRowStyle, borderBottom: "none", opacity: 0.6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🌙</span>
                <span style={rowLabelStyle}>Dark Mode</span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#9ca3af", background: "#f3f4f6", padding: "4px 8px", borderRadius: "8px" }}>
                Coming Soon
              </span>
            </div>

          </div>
        </div>

        {/* SECTION 4: PRIVACY & LEGAL */}
        <div style={{ marginBottom: "8px" }}>
          <h3 style={sectionTitleStyle}>Privacy & Legal</h3>
          <div className="settings-card">
            
            <button onClick={() => navigate("/privacy-policy")} className="settings-row-btn">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🔒</span>
                <span>Privacy Policy</span>
              </div>
              <span>→</span>
            </button>

            <button onClick={() => navigate("/terms")} className="settings-row-btn">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>📜</span>
                <span>Terms & Conditions</span>
              </div>
              <span>→</span>
            </button>

            <button onClick={() => setShowDeleteModal(true)} style={{ color: "#ef4444" }} className="settings-row-btn">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🗑</span>
                <span>Delete Account</span>
              </div>
              <span>→</span>
            </button>

          </div>
        </div>

        {/* SECTION 5: ABOUT BUYTO */}
        <div style={{ marginBottom: "8px" }}>
          <h3 style={sectionTitleStyle}>About Buyto</h3>
          <div className="settings-card">
            
            <button onClick={() => navigate("/about")} className="settings-row-btn">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>ℹ️</span>
                <span>About Us</span>
              </div>
              <span>→</span>
            </button>

            <button 
              onClick={() => alert("Coming Soon on Play Store!")} 
              className="settings-row-btn"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>⭐</span>
                <span>Rate Buyto</span>
              </div>
              <span>→</span>
            </button>

            <button onClick={handleShareSettings} className="settings-row-btn">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>📤</span>
                <span>Share Buyto</span>
              </div>
              <span>→</span>
            </button>

            <div style={{ ...flexRowStyle, borderBottom: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>📱</span>
                <span style={rowLabelStyle}>App Version</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: "750", color: "#6b7280" }}>
                Version 1.0.0
              </span>
            </div>

          </div>
        </div>

        {/* SECTION: ADMIN ACTIONS */}
        {user?.role === "admin" && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={sectionTitleStyle}>Administrator</h3>
            <div className="settings-card">
              <button onClick={() => navigate("/admin")} className="settings-row-btn">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>⚙️</span>
                  <span>Admin Dashboard</span>
                </div>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 6: ACCOUNT ACTIONS */}
        <div style={{ marginBottom: "40px" }}>
          <button 
            onClick={() => setShowLogoutModal(true)} 
            style={logoutCardBtnStyle}
            className="menu-row-hover"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>🚪</span>
              <span style={{ fontSize: "14.5px", fontWeight: "800" }}>Logout</span>
            </div>
            <span>→</span>
          </button>
        </div>

        {/* Subtle footer */}
        <div style={footerStyle}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#9ca3af" }}>
            Made with ❤️ by Buyto
          </p>
          <p style={{ margin: "2px 0 0 0", fontSize: "10px", fontWeight: "500", color: "#bdc3c7" }}>
            Version 1.0.0
          </p>
        </div>

      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "900", color: "#ef4444", textAlign: "center" }}>
              Delete Account? ⚠️
            </h2>
            <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "#4b5563", fontWeight: "600", textAlign: "center", lineHeight: "1.5" }}>
              This action cannot be undone. All your saved addresses, active orders, and BuyCoins balance will be deleted permanently.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                style={modalCancelBtnStyle}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount} 
                style={modalDangerBtnStyle}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "900", color: "#1f2937", textAlign: "center" }}>
              Logout? 🚪
            </h2>
            <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "#6b7280", fontWeight: "600", textAlign: "center" }}>
              Are you sure you want to end your session?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setShowLogoutModal(false)} 
                style={modalCancelBtnStyle}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                  navigate("/");
                }} 
                style={modalConfirmBtnStyle}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// PREMIUM STYLING DICTIONARY
const containerStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "24px 16px 40px 16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  display: "flex",
  justifyContent: "center",
  boxSizing: "border-box",
  overflowX: "hidden"
};

const contentWrapperStyle = {
  width: "100%",
  maxWidth: "500px",
  boxSizing: "border-box"
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "20px"
};

const backBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: "#1f2937",
  padding: "4px 0",
  fontWeight: "800"
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "900",
  color: "#1f2937",
  margin: 0,
  letterSpacing: "-0.5px"
};

const sectionTitleStyle = {
  fontSize: "14px",
  fontWeight: "850",
  color: "#4b5563",
  margin: "0 0 10px 0",
  paddingLeft: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const flexRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  borderBottom: "1px solid #f3f4f6",
  boxSizing: "border-box"
};

const rowLabelStyle = {
  fontSize: "14.5px",
  fontWeight: "750",
  color: "#1f2937"
};

const formBoxStyle = {
  background: "#f9fafb",
  padding: "20px",
  borderTop: "1px solid #e5e7eb",
  boxSizing: "border-box"
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: "800",
  color: "#4b5563",
  textTransform: "uppercase",
  marginBottom: "4px"
};

const inputStyle = {
  width: "100%",
  height: "42px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  padding: "0 12px",
  fontSize: "13px",
  fontWeight: "600",
  outline: "none",
  boxSizing: "border-box",
  background: "white"
};

const selectStyle = {
  width: "100%",
  height: "42px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  padding: "0 12px",
  fontSize: "13px",
  fontWeight: "600",
  outline: "none",
  boxSizing: "border-box",
  background: "white"
};

const cancelBtnStyle = {
  flex: 1,
  height: "40px",
  background: "#f3f4f6",
  color: "#4b5563",
  border: "none",
  borderRadius: "10px",
  fontWeight: "800",
  fontSize: "13px",
  cursor: "pointer"
};

const saveBtnStyle = {
  flex: 1.5,
  height: "40px",
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "10px",
  fontWeight: "800",
  fontSize: "13px",
  cursor: "pointer"
};

const inlineSelectStyle = {
  border: "1.5px solid #e5e7eb",
  borderRadius: "8px",
  padding: "4px 8px",
  fontSize: "13px",
  fontWeight: "750",
  outline: "none",
  background: "white"
};

const expandedSectionStyle = {
  background: "#f9fafb",
  borderTop: "1px solid #e5e7eb",
  padding: "16px 20px"
};

const loadingTextStyle = {
  fontSize: "12px",
  color: "#6b7280",
  textAlign: "center",
  margin: 0
};

const addAddressBtnStyle = {
  width: "100%",
  height: "38px",
  background: "white",
  color: "#318616",
  border: "1.5px dashed #318616",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
  marginTop: "8px"
};

const addressCardStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "12px 16px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
};

const addressTypeBadgeStyle = {
  fontSize: "9px",
  fontWeight: "800",
  color: "#318616",
  background: "#e8f7e3",
  padding: "2px 6px",
  borderRadius: "4px",
  textTransform: "uppercase"
};

const textLinkStyle = (color) => ({
  background: "none",
  border: "none",
  padding: 0,
  fontSize: "12px",
  fontWeight: "800",
  color: color,
  cursor: "pointer",
  textDecoration: "underline"
});

const logoutCardBtnStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  background: "#ffffff",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  borderRadius: "20px",
  padding: "18px 24px",
  color: "#ef4444",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(239, 68, 68, 0.03)",
  boxSizing: "border-box"
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(17, 24, 39, 0.4)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "16px"
};

const modalCardStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "28px",
  width: "100%",
  maxWidth: "380px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  border: "1px solid #e5e7eb",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column"
};

const modalCancelBtnStyle = {
  flex: 1,
  height: "44px",
  background: "#f3f4f6",
  color: "#4b5563",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  fontSize: "13px",
  cursor: "pointer"
};

const modalConfirmBtnStyle = {
  flex: 1,
  height: "44px",
  background: "#318616",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  fontSize: "13px",
  cursor: "pointer"
};

const modalDangerBtnStyle = {
  flex: 1.2,
  height: "44px",
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  fontSize: "13px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
};

const footerStyle = {
  textAlign: "center",
  marginTop: "20px",
  marginBottom: "20px"
};

import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, MapPin, Plus, Share2, MoreHorizontal, X, Pin, AlertTriangle } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import AddressSelectorModal from "../components/common/AddressSelectorModal";

const WhatsAppIcon = () => (
  <img 
    src="https://img.icons8.com/?size=100&id=DUEq8l5qTqBE&format=png&color=000000" 
    alt="Request Address"
    className="w-8 h-8 object-contain"
  />
);

const ZomatoIcon = () => (
  <div className="w-8 h-8 rounded-lg bg-[#CB202D] flex items-center justify-center text-white font-sans text-[10px] font-black italic">
    zomato
  </div>
);

export default function MyAddressesPage() {
  const navigate = useNavigate();
  const { user, token, refreshUser } = useContext(AuthContext) || { user: null };

  const [isExiting, setIsExiting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showShareBanner, setShowShareBanner] = useState(true);

  // Addresses state loaded from API
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected address ID tracking
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem("buyto_selected_address_id") || "");

  // Bottom sheet drawer states
  const [activeDrawerAddress, setActiveDrawerAddress] = useState(null);

  // Edit dialog states
  const [editingAddress, setEditingAddress] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAddressLine, setEditAddressLine] = useState("");
  const [editLandmark, setEditLandmark] = useState("");
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editError, setEditError] = useState("");

  // Load addresses from API
  const loadAddresses = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.addresses) {
          setAddresses(data.addresses);
          
          // Sync default selectedId if empty
          const savedId = localStorage.getItem("buyto_selected_address_id");
          if (!savedId && data.addresses.length > 0) {
            const def = data.addresses.find(a => a.isDefault) || data.addresses[0];
            setSelectedId(def._id);
            localStorage.setItem("buyto_selected_address_id", def._id);
          } else if (savedId) {
            setSelectedId(savedId);
          }
        }
      }
    } catch (e) {
      console.error("Error loading addresses:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load on mount & when token changes
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Sync selectedId changes from external events (e.g. if updated elsewhere)
  useEffect(() => {
    const handleAddressChange = () => {
      setSelectedId(localStorage.getItem("buyto_selected_address_id") || "");
      loadAddresses();
    };
    window.addEventListener("addressChanged", handleAddressChange);
    return () => window.removeEventListener("addressChanged", handleAddressChange);
  }, [loadAddresses]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 5);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate("/profile");
    }, 280); // native slide out
  };

  const handleOpenAddAddress = () => {
    setShowAddressModal(true);
  };

  // Sync state on modal closed
  const handleModalClose = () => {
    setShowAddressModal(false);
    loadAddresses();
    if (refreshUser && token) {
      refreshUser();
    }
  };

  // Select Address handler
  const handleSelectAddress = async (addr) => {
    const addressLineText = addr.addressLine + (addr.landmark ? `, ${addr.landmark}` : "");
    localStorage.setItem("userLocation", addressLineText);
    localStorage.setItem("roomNumber", addr.roomNumber || "");
    localStorage.setItem("buyto_selected_address_id", addr._id);
    localStorage.setItem("buyto_selected_address_type", addr.label || addr.addressType || "Other");
    localStorage.setItem("buyto_selected_address_full", JSON.stringify(addr));

    setSelectedId(addr._id);

    // Call backend set default
    if (token && addr._id && !addr._id.startsWith("fallback")) {
      try {
        await fetch(`${window.API_BASE_URL}/api/addresses/${addr._id}/default`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Error setting default address:", e);
      }
    }

    // Notify listeners (App.jsx, Home Header, CartPage)
    window.dispatchEvent(new Event("addressChanged"));
  };

  // Open Edit Dialog
  const handleEditClick = (addr) => {
    setActiveDrawerAddress(null);
    setEditingAddress(addr);
    setEditLabel(addr.label || addr.addressType || "PG");
    setEditAddressLine(addr.addressLine || "");
    setEditLandmark(addr.landmark || "");
    setEditRoomNumber(addr.roomNumber || "");
    setEditPhone(addr.phone || "");
    setEditFullName(addr.fullName || user?.name || "");
    setEditError("");
  };

  // Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editAddressLine.trim() || !editPhone.trim() || !editFullName.trim()) {
      setEditError("Name, Phone, and Address Line are required");
      return;
    }

    if (!editingAddress?._id || editingAddress._id.startsWith("fallback")) {
      // Edit mock fallback locally
      setEditingAddress(null);
      return;
    }

    try {
      const payload = {
        label: editLabel,
        addressType: editLabel,
        fullName: editFullName,
        phone: editPhone,
        addressLine: editAddressLine,
        landmark: editLandmark,
        roomNumber: editRoomNumber,
        latitude: editingAddress.latitude || 12.9716,
        longitude: editingAddress.longitude || 77.5946,
        isDefault: editingAddress.isDefault,
        serviceable: true
      };

      const res = await fetch(`${window.API_BASE_URL}/api/addresses/${editingAddress._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingAddress(null);
        loadAddresses();

        // If the edited address was the selected one, update localStorage instantly
        const savedId = localStorage.getItem("buyto_selected_address_id");
        if (savedId === editingAddress._id) {
          const addressLineText = editAddressLine + (editLandmark ? `, ${editLandmark}` : "");
          localStorage.setItem("userLocation", addressLineText);
          localStorage.setItem("roomNumber", editRoomNumber || "");
          localStorage.setItem("buyto_selected_address_type", editLabel);
          localStorage.setItem("buyto_selected_address_full", JSON.stringify({ ...editingAddress, ...payload }));
          window.dispatchEvent(new Event("addressChanged"));
        }
      } else {
        const data = await res.json();
        setEditError(data.message || "Failed to update address");
      }
    } catch (err) {
      console.error("Error editing address:", err);
      setEditError("Failed to update address details");
    }
  };

  // Delete Address handler
  const handleDeleteClick = async (addr) => {
    setActiveDrawerAddress(null);
    if (!addr._id || addr._id.startsWith("fallback")) {
      setAddresses([]);
      localStorage.removeItem("buyto_selected_address_id");
      window.dispatchEvent(new Event("addressChanged"));
      return;
    }

    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        const res = await fetch(`${window.API_BASE_URL}/api/addresses/${addr._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          loadAddresses();
          // If deleted address was active, clear active selection
          const savedId = localStorage.getItem("buyto_selected_address_id");
          if (savedId === addr._id) {
            localStorage.removeItem("buyto_selected_address_id");
            localStorage.removeItem("userLocation");
            localStorage.removeItem("roomNumber");
            localStorage.removeItem("buyto_selected_address_full");
            window.dispatchEvent(new Event("addressChanged"));
          }
        }
      } catch (e) {
        console.error("Error deleting address:", e);
      }
    }
  };

  // Fallback initial PG address if user is guest or has none saved
  const fallbackAddresses = [
    {
      _id: "fallback-addr-1",
      addressType: "PG",
      houseNumber: "SDM Gents Luxury PG",
      addressLine: "SDM Gents Luxury PG, Sri Sai layout",
      area: "Next To Hotel Udupi Krishna Theertha",
      landmark: "Reva Circle",
      city: "Bengaluru",
      state: "Karnataka",
      zip: "560064",
      phone: "6363849864"
    }
  ];

  const displayList = addresses.length > 0 ? addresses : fallbackAddresses;

  return (
    <div 
      className="min-h-screen pb-16 font-sans select-none overflow-x-hidden"
      style={{
        background: "#F6F7FB",
        animation: isExiting 
          ? "slideOut 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards" 
          : "slideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        width: "100%",
        maxWidth: "100%",
        willChange: "transform"
      }}
    >
      {/* Dynamic Keyframe Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideIn {
            from { transform: translate3d(100%, 0, 0); }
            to { transform: translate3d(0, 0, 0); }
          }
          @keyframes slideOut {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(100%, 0, 0); }
          }
          .custom-shadow {
            box-shadow: 0 1px 8px rgba(0, 0, 0, 0.03);
          }
          .custom-border {
            border: 1px solid rgba(0, 0, 0, 0.06);
          }
          .row-active:active {
            background-color: #FAFAFA;
            transform: scale(0.995);
          }
        `
      }} />

      {/* Sticky Header */}
      <header 
        className={`sticky top-0 z-50 flex items-center justify-between px-3 py-3.5 bg-white transition-shadow duration-200 ${
          scrolled ? "shadow-[0_4px_12px_rgba(0,0,0,0.04)] border-b border-gray-100" : "border-b border-gray-50"
        }`}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-800 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <span className="text-[17px] font-bold text-gray-900 tracking-tight">My addresses</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-5">
        
        {/* ================= TOP CARD: ACTIONS ================= */}
        <section className="bg-white rounded-[18px] custom-shadow border border-gray-50 overflow-hidden divide-y divide-gray-50">
          
          {/* Action Row 1: Add new address */}
          <div 
            onClick={handleOpenAddAddress}
            className="flex items-center justify-between p-4 row-active cursor-pointer transition-all duration-150"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-[#318616]">
                <Plus className="w-5 h-5 stroke-[3]" />
              </div>
              <span className="text-[14px] font-bold text-[#318616]">Add new address</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>

          {/* Action Row 2: Request from someone else */}
          <div 
            onClick={useCallback(() => navigate("/profile/request-address"), [navigate])}
            className="flex items-center justify-between p-4 row-active cursor-pointer transition-all duration-150"
          >
            <div className="flex items-center gap-3.5">
              <WhatsAppIcon />
              <span className="text-[14px] font-bold text-gray-800">Request address from someone else</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>

          {/* Action Row 3: Import from Zomato */}
          <div className="flex items-center justify-between p-4 row-active cursor-pointer transition-all duration-150">
            <div className="flex items-center gap-3.5">
              <ZomatoIcon />
              <span className="text-[14px] font-bold text-gray-800">Import your addresses from Zomato</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>

          {/* Action Row 4: Manage Shared Addresses */}
          <div 
            onClick={useCallback(() => navigate("/profile/manage-shares"), [navigate])}
            className="flex items-center justify-between p-4 row-active cursor-pointer transition-all duration-150"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Share2 className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <span className="text-[14px] font-bold text-gray-800">Manage shared addresses</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>

        </section>

        {/* ================= SAVED ADDRESSES SECTION ================= */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-wide px-1">Your saved addresses</h2>
          
          {displayList.map((addr) => {
            const isSelected = selectedId === addr._id || (displayList.length === 1 && !selectedId);
            const displayStr = `${addr.houseNumber || addr.addressLine || ""}, ${addr.area || ""}, ${addr.landmark ? "Near " + addr.landmark : ""}, ${addr.city || "Bengaluru"}, ${addr.state || "Karnataka"} ${addr.zip || ""}`.replace(/,\s*,/g, ",").replace(/^,\s*/, "");
            
            return (
              <div 
                key={addr._id}
                onClick={() => handleSelectAddress(addr)}
                className={`bg-white rounded-[20px] p-5 custom-shadow relative flex flex-col gap-4 cursor-pointer transition-all duration-200 border ${
                  isSelected ? "border-[#318616] ring-1 ring-[#318616]" : "border-gray-50 hover:border-gray-200"
                }`}
              >
                {/* Pin Badge Indicator */}
                <div className="absolute top-5 right-5 text-gray-300 hover:text-gray-500">
                  <Pin className={`w-4.5 h-4.5 transform rotate-45 stroke-[2.2] ${isSelected ? "text-[#318616]" : "text-gray-300"}`} />
                </div>

                {/* Body Block */}
                <div className="flex gap-4 items-start">
                  {/* Category Pin Box */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                    isSelected ? "bg-green-50 text-[#318616] border-green-100" : "bg-gray-50 text-amber-500 border-gray-100"
                  }`}>
                    <img 
                      src="https://img.icons8.com/?size=100&id=XieTOK4V0QEI&format=png&color=000000" 
                      alt="Location Pin" 
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  
                  {/* Address Details */}
                   <div className="flex flex-col flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-[15px] font-black text-gray-800 leading-none">
                        {addr.label || addr.addressType || "PG"}
                      </h3>
                      {addr.isShared ? (
                        <span className="border border-[#318616] text-[#318616] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Shared
                        </span>
                      ) : isSelected && (
                        <span className="bg-green-50 text-[#318616] text-[10px] font-extrabold px-1.5 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    <p className="text-[12px] font-bold text-gray-400 leading-relaxed mb-1.5">
                      {displayStr}
                    </p>
                    {addr.isShared ? (
                      <span className="text-[12px] font-bold text-gray-400">
                        Shared by: <strong className="text-gray-700 font-extrabold">{addr.sharedBy?.name || "User"}</strong>
                      </span>
                    ) : (
                      <span className="text-[12px] font-bold text-gray-400">
                        Phone number: <strong className="text-gray-700 font-extrabold">{addr.phone || "6363849864"}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-actions Row */}
                <div className="flex items-center gap-2 pl-15" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setActiveDrawerAddress(addr)}
                    className="w-8 h-8 rounded-full border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full border border-gray-100 hover:bg-green-50 flex items-center justify-center text-green-600 hover:text-green-700 focus:outline-none transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.2]">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                    </svg>
                  </button>
                </div>

                {/* Share addresses with friends/family Tip Banner */}
                {showShareBanner && (
                  <div className="mt-2 bg-[#FFF9E9] rounded-2xl p-3.5 flex items-center justify-between gap-3 border border-[#FBEAC4]/40 relative" onClick={(e) => e.stopPropagation()}>
                    {/* Tiny triangle connector on top of banner pointing to share button */}
                    <div className="absolute -top-1.5 left-[84px] w-3 h-3 bg-[#FFF9E9] border-t border-l border-[#FBEAC4]/40 transform rotate-45" />
                    
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.5]">
                          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                        </svg>
                      </div>
                      <span className="text-[12px] font-bold text-amber-950 leading-snug">
                        Now share your addresses with friends and family
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowShareBanner(false)}
                      className="w-6 h-6 rounded-full bg-[#E5D7B7]/40 hover:bg-[#E5D7B7]/60 flex items-center justify-center text-amber-950 focus:outline-none transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>
            );
          })}

        </section>

      </main>

      {/* ================= BOTTOM DRAWER ACTIONS SHEET ================= */}
      {activeDrawerAddress && (
        <div 
          className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200"
          onClick={() => setActiveDrawerAddress(null)}
        >
          <div 
            className="bg-white rounded-t-[28px] w-full max-w-md p-5 pb-8 flex flex-col gap-4 animate-in slide-in-from-bottom duration-250 ease-out"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.08)"
            }}
          >
            {/* Header bar indicator */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2" />
            
            <div className="flex flex-col gap-1 px-1">
              <h3 className="text-[15px] font-black text-gray-800">Address Actions</h3>
              <p className="text-[12px] font-bold text-gray-400 truncate">
                {activeDrawerAddress.addressLine || activeDrawerAddress.houseNumber || ""}
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {!activeDrawerAddress.isShared && (
                <button 
                  onClick={() => handleEditClick(activeDrawerAddress)}
                  className="w-full py-4 px-4 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[14px] font-black text-gray-800 flex items-center gap-3 transition-colors text-left"
                >
                  <img 
                    src="https://img.icons8.com/?size=100&id=95043&format=png&color=000000" 
                    alt="Edit" 
                    className="w-5 h-5 object-contain" 
                  /> Edit address
                </button>
              )}
              <button 
                onClick={() => handleDeleteClick(activeDrawerAddress)}
                className="w-full py-4 px-4 bg-red-50 hover:bg-red-100 rounded-2xl text-[14px] font-black text-red-600 flex items-center gap-3 transition-colors text-left"
              >
                <img 
                  src="https://img.icons8.com/?size=100&id=XLYyiimvk3fV&format=png&color=000000" 
                  alt="Delete" 
                  className="w-5 h-5 object-contain" 
                /> {activeDrawerAddress.isShared ? "Remove shared address" : "Delete address"}
              </button>
            </div>

            <button 
              onClick={() => setActiveDrawerAddress(null)}
              className="w-full py-3.5 bg-gray-900 text-white text-[13px] font-black rounded-xl hover:bg-black transition-colors mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= EDIT ADDRESS DIALOG MODAL ================= */}
      {editingAddress && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-[16px] font-black text-gray-800 mb-1">Edit Address Details</h3>
            <p className="text-[11px] font-bold text-gray-400 mb-4 leading-relaxed">
              Update details to ensure accurate shipping and delivery.
            </p>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Address Type (e.g. PG, Home)</label>
                <input 
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Address Line / Hostel Name</label>
                <input 
                  type="text"
                  value={editAddressLine}
                  onChange={(e) => setEditAddressLine(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Room Number</label>
                  <input 
                    type="text"
                    value={editRoomNumber}
                    onChange={(e) => setEditRoomNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Landmark</label>
                  <input 
                    type="text"
                    value={editLandmark}
                    onChange={(e) => setEditLandmark(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Contact Name</label>
                <input 
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Contact Phone</label>
                <input 
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-extrabold text-gray-800 placeholder-gray-400 outline-none focus:border-green-500"
                />
              </div>

              {editError && (
                <div className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {editError}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setEditingAddress(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 text-[13px] font-black rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#318616] text-white text-[13px] font-black rounded-xl hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Address Selector Modal integration */}
      {showAddressModal && (
        <AddressSelectorModal onClose={handleModalClose} />
      )}

    </div>
  );
}

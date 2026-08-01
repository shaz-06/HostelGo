import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AddressSelectorModal from "../components/common/AddressSelectorModal";
import SEO from "../components/common/SEO";
import BuyCoin from "../components/common/BuyCoin";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

// Import configuration and modular components
import { profileMenuConfig } from "../data/profileMenu";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileBanner from "../components/profile/ProfileBanner";
import QuickActions from "../components/profile/QuickActions";
import ProfileSection from "../components/profile/ProfileSection";
import ProfileRow from "../components/profile/ProfileRow";
import VersionFooter from "../components/profile/VersionFooter";

// Additional Lucide icons used directly in page elements
import { Smartphone, Sun, EyeOff, ChevronDown } from "lucide-react";

export default function ProfilePage({ defaultTab = "" }) {
  const navigate = useNavigate();
  const { user, isLoggedIn, token, logout, openLogin, refreshUser } = useContext(AuthContext);
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();

  // States
  const [orders, setOrders] = useState([]);
  const [liveUser, setLiveUser] = useState(user);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [activeAddress, setActiveAddress] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAppearanceDropdown, setShowAppearanceDropdown] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(-1);
  const cancelBtnRef = React.useRef(null);
  const logoutBtnRef = React.useRef(null);
  const lightOptionRef = React.useRef(null);
  const darkOptionRef = React.useRef(null);

  // Redesign Feature States (persisted locally)
  const [isAppUpdated, setIsAppUpdated] = useState(() => {
    return localStorage.getItem("buyto_app_updated") === "true";
  });
  const [hideSensitive, setHideSensitive] = useState(() => {
    return localStorage.getItem("buyto_hide_sensitive") === "true";
  });

  // Handle defaultTab from routing
  useEffect(() => {
    if (defaultTab === "addresses") {
      setShowAddressModal(true);
    }
  }, [defaultTab]);

  // Sync session & live profile details
  useEffect(() => {
    if (user) {
      setLiveUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    if (refreshUser) {
      refreshUser().then((usr) => {
        if (usr) setLiveUser(usr);
      });
    }
  }, [token, refreshUser]);

  // Load orders count for stats on mount
  useEffect(() => {
    if (!token) return;
    fetch(window.API_BASE_URL + "/api/orders/my-orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading orders:", err));
  }, [token]);

  // Load active address preview
  useEffect(() => {
    const saved = localStorage.getItem("selectedAddress");
    if (saved) {
      try {
        setActiveAddress(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else if (liveUser?.addresses?.length > 0) {
      setActiveAddress(liveUser.addresses[0]);
    }
  }, [liveUser]);

  // Callbacks
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleOrdersClick = useCallback(() => {
    if (!isLoggedIn) {
      openLogin();
    } else {
      navigate("/orders");
    }
  }, [isLoggedIn, navigate, openLogin]);

  const handleWalletClick = useCallback(() => {
    if (!isLoggedIn) {
      openLogin();
    } else {
      navigate("/wallet");
    }
  }, [isLoggedIn, navigate, openLogin]);

  const handleHelpClick = useCallback(() => {
    navigate("/help");
  }, [navigate]);

  const handleBannerClick = useCallback(() => {
    if (!isLoggedIn) {
      openLogin();
    } else {
      // Complete profile action
      navigate("/profile/edit");
    }
  }, [isLoggedIn, openLogin, navigate]);

  const handleCancelLogout = useCallback(() => {
    setShowLogoutDialog(false);
    if (window.history.state?.dialog === "logout") {
      window.history.back();
    }
  }, []);

  const confirmLogout = useCallback(() => {
    setShowLogoutDialog(false);
    if (window.history.state?.dialog === "logout") {
      window.history.back();
    }
    logout();
    navigate("/");
  }, [logout, navigate]);

  const handleLogout = useCallback(() => {
    setShowLogoutDialog(true);
  }, []);

  useEffect(() => {
    if (showLogoutDialog) {
      window.dispatchEvent(new CustomEvent("hideBottomNav", { detail: true }));
      window.history.pushState({ dialog: "logout" }, "");
      
      const handlePopState = (event) => {
        setShowLogoutDialog(false);
      };
      
      const handleGlobalKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowLogoutDialog(false);
          window.history.back();
        }
        if (e.key === "Tab") {
          const cancelBtn = cancelBtnRef.current;
          const logoutBtn = logoutBtnRef.current;
          if (cancelBtn && logoutBtn) {
            if (e.shiftKey) {
              if (document.activeElement === cancelBtn) {
                logoutBtn.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === logoutBtn) {
                cancelBtn.focus();
                e.preventDefault();
              }
            }
          }
        }
      };

      window.addEventListener("popstate", handlePopState);
      window.addEventListener("keydown", handleGlobalKeyDown);

      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      return () => {
        window.dispatchEvent(new CustomEvent("hideBottomNav", { detail: false }));
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("keydown", handleGlobalKeyDown);
      };
    }
  }, [showLogoutDialog]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: "Buyto App",
        text: "Check out Buyto for 15-minute hostel deliveries!",
        url: window.location.origin
      }).catch(err => console.log(err));
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.origin);
      alert("App link copied to clipboard!");
    }
  }, []);

  const handleOpenAddress = useCallback(() => {
    if (!isLoggedIn) {
      openLogin();
    } else {
      setShowAddressModal(true);
    }
  }, [isLoggedIn, openLogin]);

  // Toggle handlers
  const handleToggleSensitive = useCallback(() => {
    setHideSensitive(prev => {
      const nextValue = !prev;
      localStorage.setItem("buyto_hide_sensitive", nextValue ? "true" : "false");
      return nextValue;
    });
  }, []);

  const handleSelectTheme = useCallback((selectedTheme) => {
    setGlobalTheme(selectedTheme.toUpperCase());
    setShowAppearanceDropdown(false);
  }, [setGlobalTheme]);

  useEffect(() => {
    if (showAppearanceDropdown) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowAppearanceDropdown(false);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveDropdownIndex(prev => (prev === -1 || prev === 1) ? 0 : 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveDropdownIndex(prev => (prev === -1 || prev === 0) ? 1 : 0);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (activeDropdownIndex === 0) {
            handleSelectTheme("light");
          } else if (activeDropdownIndex === 1) {
            handleSelectTheme("dark");
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    } else {
      setActiveDropdownIndex(-1);
    }
  }, [showAppearanceDropdown, activeDropdownIndex, handleSelectTheme]);

  useEffect(() => {
    if (showAppearanceDropdown) {
      if (activeDropdownIndex === 0) {
        lightOptionRef.current?.focus();
      } else if (activeDropdownIndex === 1) {
        darkOptionRef.current?.focus();
      }
    }
  }, [activeDropdownIndex, showAppearanceDropdown]);

  const handleToggleAppearanceDropdown = useCallback(() => {
    setShowAppearanceDropdown(prev => !prev);
  }, []);

  const handleCloseAppearanceDropdown = useCallback(() => {
    setShowAppearanceDropdown(false);
  }, []);

  const handleSelectLight = useCallback(() => {
    handleSelectTheme("light");
  }, [handleSelectTheme]);

  const handleSelectDark = useCallback(() => {
    handleSelectTheme("dark");
  }, [handleSelectTheme]);

  const handleCloseAddressModal = useCallback(() => {
    setShowAddressModal(false);
  }, []);

  const handleSelectAddressDummy = useCallback(() => {}, []);

  const handleAppUpdateDismiss = useCallback(() => {
    setIsAppUpdated(true);
    localStorage.setItem("buyto_app_updated", "true");
  }, []);

  // Menu action router
  const handleMenuRowClick = useCallback((item) => {
    if (!isLoggedIn && item.id !== "about-buyto" && item.id !== "privacy-policy" && item.id !== "terms-conditions" && item.id !== "refund-policy" && item.id !== "faq" && item.id !== "contact-us" && item.id !== "help-center") {
      openLogin();
      return;
    }

    if (item.actionType === "navigate") {
      navigate(item.path);
    } else if (item.actionType === "callback") {
      if (item.actionKey === "onOpenAddress") {
        handleOpenAddress();
      } else if (item.actionKey === "onShare") {
        handleShare();
      } else if (item.actionKey === "onLogout") {
        handleLogout();
      }
    }
  }, [isLoggedIn, navigate, openLogin, handleOpenAddress, handleShare, handleLogout]);

  // Memoized Config with Dynamic Subtitles
  const memoizedMenuConfig = useMemo(() => {
    return profileMenuConfig.map(section => {
      // Map and inject dynamic subtitles if needed (e.g. show active address name under Address Book)
      const updatedItems = section.items.map(item => {
        if (item.id === "address-book" && activeAddress) {
          const addressDesc = activeAddress.houseNumber 
            ? `${activeAddress.houseNumber}, ${activeAddress.buildingName || activeAddress.landmark}`
            : activeAddress.addressLine1;
          return { ...item, subtitle: addressDesc };
        }
        if (item.id === "buycoins" && isLoggedIn) {
          return { ...item, subtitle: `${liveUser?.buyCoins ?? 0} Coins available` };
        }
        return item;
      });
      return { ...section, items: updatedItems };
    });
  }, [activeAddress, liveUser, isLoggedIn]);

  return (
    <div className="page-with-bottom-nav min-h-screen bg-[#F6F7FB] pb-[100px] overflow-x-hidden font-sans">
      <SEO title={isLoggedIn ? "My Profile" : "Login"} description="Manage your account profile, addresses, and settings on Buyto." />
      
      {/* Dynamic inline styles for micro-animations and custom styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        `
      }} />

      {/* 1. Header */}
      <ProfileHeader 
        user={liveUser} 
        isLoggedIn={isLoggedIn} 
        onBack={handleBack} 
      />

      {/* 2. Profile Completion Banner */}
      <ProfileBanner 
        isLoggedIn={isLoggedIn} 
        user={liveUser}
        onClick={handleBannerClick} 
      />

      {/* 3. Quick Action Cards */}
      <QuickActions 
        onOrders={handleOrdersClick}
        onWallet={handleWalletClick}
        onHelp={handleHelpClick}
      />

      <div className="mt-5 space-y-5">
        {/* 4. Update Card */}
        {!isAppUpdated && (
          <div className="mx-4">
            <div className="bg-white rounded-[18px] border border-gray-100 p-4 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-blue-50">
                  <img 
                    src="https://img.icons8.com/?size=100&id=L9ByuHGgbUNK&format=png&color=000000" 
                    alt="Update" 
                    className="w-[18px] h-[18px] object-contain" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[15px] font-semibold text-gray-800 block truncate">
                    App update available
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 block mt-0.5 leading-tight">
                    Bug fixes and performance improvements
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-600 text-[11px] font-extrabold px-2 py-1 rounded-md">
                  v18.15.0
                </span>
                <button 
                  onClick={handleAppUpdateDismiss}
                  className="text-[12px] font-extrabold text-[#318616] hover:underline px-2 py-1"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Appearance Card */}
        <div className="mx-4 relative">
          <div className="bg-white rounded-[18px] border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <ProfileRow
              icon="https://img.icons8.com/?size=100&id=nncre7HDghLc&format=png&color=000000"
              label="Appearance"
              rightContent={
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-extrabold text-[#318616] tracking-wider uppercase">
                    {globalTheme}
                  </span>
                  <ChevronDown 
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      showAppearanceDropdown ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </div>
              }
              onClick={handleToggleAppearanceDropdown}
              isLast={true}
            />
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showAppearanceDropdown && (
              <>
                {/* Click outside backdrop overlay */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={handleCloseAppearanceDropdown} 
                />
                
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 p-1.5 flex flex-col overflow-hidden"
                  role="menu"
                >
                  <button
                    ref={lightOptionRef}
                    onClick={handleSelectLight}
                    className="w-full h-11 px-4 flex items-center justify-between text-[14px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-xl transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800/60"
                    role="menuitem"
                  >
                    <span>Light</span>
                    {globalTheme.toLowerCase() === "light" && <span className="text-[#318616] text-[15px] font-bold">✓</span>}
                  </button>
                  <button
                    ref={darkOptionRef}
                    onClick={handleSelectDark}
                    className="w-full h-11 px-4 flex items-center justify-between text-[14px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-xl transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800/60"
                    role="menuitem"
                  >
                    <span>Dark</span>
                    {globalTheme.toLowerCase() === "dark" && <span className="text-[#318616] text-[15px] font-bold">✓</span>}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 6. Settings Toggle (Hide Sensitive Products) */}
        <div className="mx-4">
          <div className="bg-white rounded-[18px] border border-gray-100 p-4 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <EyeOff className="w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <span className="text-[15px] font-semibold text-gray-800 block truncate">
                  Hide sensitive products
                </span>
                <span className="text-[11px] font-medium text-gray-400 block mt-0.5 leading-tight">
                  Wellness, intimate hygiene and other sensitive items will be hidden
                </span>
              </div>
            </div>
            
            {/* Custom iOS-like Toggle Switch */}
            <button
              onClick={handleToggleSensitive}
              className={`w-[46px] h-6 rounded-full transition-colors duration-200 focus:outline-none relative flex-shrink-0 ${
                hideSensitive ? "bg-[#318616]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={hideSensitive}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200 ${
                hideSensitive ? "translate-x-[24px]" : "translate-x-0.5"
              }`} />
            </button>
          </div>
        </div>

        {/* 7. Grouped Sections */}
        {memoizedMenuConfig.map((section, sectionIdx) => (
          <ProfileSection key={section.title || sectionIdx} title={section.title}>
            {section.items.map((item, itemIdx) => (
              <ProfileRow
                key={item.id}
                icon={item.icon}
                label={item.label}
                subtitle={item.subtitle}
                danger={item.danger}
                onClick={() => handleMenuRowClick(item)}
                isLast={itemIdx === section.items.length - 1}
              />
            ))}
          </ProfileSection>
        ))}

        {/* 8. Footer */}
        <VersionFooter version="v18.13.0" />
      </div>

      {/* Address Selector Modal */}
      {showAddressModal && (
        <AddressSelectorModal
          onClose={handleCloseAddressModal}
          onSelectAddress={handleSelectAddressDummy}
          isLoggedIn={isLoggedIn}
        />
      )}

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCancelLogout}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-white rounded-[28px] w-full max-w-sm p-6 shadow-2xl relative z-10 text-center border border-gray-100 flex flex-col items-center gap-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-dialog-title"
              aria-describedby="logout-dialog-desc"
            >
              {/* Illustration / Icon */}
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-1">
                <img 
                  src="https://img.icons8.com/?size=100&id=j5sJqtadgqDL&format=png&color=000000" 
                  alt="Logout" 
                  className="w-8 h-8 object-contain" 
                />
              </div>

              {/* Title */}
              <h3 id="logout-dialog-title" className="text-[20px] font-black text-gray-900 leading-tight">
                Logout?
              </h3>

              {/* Message */}
              <p id="logout-dialog-desc" className="text-[13px] font-bold text-gray-400 leading-relaxed max-w-[280px]">
                Are you sure you want to logout from your Buyto account?<br />
                You'll need to sign in again to access your account.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 w-full mt-2">
                <button
                  ref={cancelBtnRef}
                  onClick={handleCancelLogout}
                  className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/50 rounded-2xl text-[14px] font-black text-gray-800 transition-colors focus:ring-2 focus:ring-gray-300 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  ref={logoutBtnRef}
                  onClick={confirmLogout}
                  className="flex-1 py-3.5 bg-[#EF4444] hover:bg-[#DC2626] rounded-2xl text-[14px] font-black text-white transition-colors focus:ring-2 focus:ring-red-400 focus:outline-none"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React from "react";
import { ArrowLeft, LogIn } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ProfileHeader = React.memo(({ user, isLoggedIn, onBack, onLoginClick }) => {
  const { isDark } = useTheme();

  return (
    <div
      className="relative pt-12 pb-8 px-4 flex flex-col items-center justify-center rounded-b-[40px] shadow-sm animate-fade-in"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #6F4612 0%, #95651C 42%, #C08A32 72%, #8A5A18 100%)"
          : "linear-gradient(to bottom, #FFF4B8, #FFFBE3, #F6F7FB)",
        boxShadow: isDark
          ? "inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 8px 24px rgba(0, 0, 0, 0.18)"
          : undefined
      }}
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all duration-200 focus:outline-none"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Avatar Container */}
      <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden mb-4 transition-transform duration-300 hover:scale-105">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="Profile Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src="https://img.icons8.com/?size=100&id=492ILERveW8G&format=png&color=000000"
            alt="Default Profile Avatar"
            className="w-full h-full object-contain p-2 bg-gray-50"
          />
        )}
      </div>

      {/* Account Info */}
      <h1
        className="text-2xl font-black text-gray-900 tracking-tight mb-1"
        style={{ color: isDark ? "#FFFFFF" : undefined }}
      >
        {isLoggedIn ? (user?.name || "Your account") : "Your account"}
      </h1>
      <p
        className="text-sm font-semibold text-gray-500"
        style={{ color: isDark ? "rgba(255, 255, 255, 0.8)" : undefined }}
      >
        {isLoggedIn ? (
          <>
            {user?.phone || "No phone number linked"}
            {user?.dateOfBirth ? (() => {
              try {
                const date = new Date(user.dateOfBirth);
                if (isNaN(date.getTime())) return "";
                const day = String(date.getDate()).padStart(2, "0");
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const mon = months[date.getMonth()];
                const year = date.getFullYear();
                return ` • ${day} ${mon} ${year}`;
              } catch (e) {
                return "";
              }
            })() : ""}
          </>
        ) : "Log in to manage your profile"}
      </p>

      {/* Login CTA Button */}
      {!isLoggedIn && (
        <button
          onClick={onLoginClick}
          style={{
            marginTop: "20px",
            width: "190px",
            height: "46px",
            backgroundColor: "#318616",
            color: "white",
            border: "none",
            borderRadius: "9999px",
            fontWeight: "800",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(49, 134, 22, 0.25)",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: "translateY(0)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#286f12";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(49, 134, 22, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#318616";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(49, 134, 22, 0.25)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(49, 134, 22, 0.2)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(49, 134, 22, 0.35)";
          }}
        >
          <LogIn className="w-4 h-4" />
          <span>Login / Sign up</span>
        </button>
      )}
    </div>
  );
});

ProfileHeader.displayName = "ProfileHeader";

export default ProfileHeader;

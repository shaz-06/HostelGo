import React from "react";
import { ArrowLeft, User } from "lucide-react";

const ProfileHeader = React.memo(({ user, isLoggedIn, onBack }) => {
  return (
    <div className="relative pt-12 pb-8 px-4 flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF4B8] via-[#FFFBE3] to-[#F6F7FB] rounded-b-[40px] shadow-sm animate-fade-in">
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
      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
        {isLoggedIn ? (user?.name || "Your account") : "Your account"}
      </h1>
      <p className="text-sm font-semibold text-gray-500">
        {isLoggedIn ? (user?.phone || "No phone number linked") : "Log in to manage your profile"}
      </p>
    </div>
  );
});

ProfileHeader.displayName = "ProfileHeader";

export default ProfileHeader;

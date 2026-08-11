import React from "react";
import { ChevronRight } from "lucide-react";

const ProfileBanner = React.memo(({ isLoggedIn, user, onClick }) => {
  if (!isLoggedIn) {
    return (
      <div 
        onClick={onClick}
        className="mx-4 mt-4 p-5 bg-gradient-to-r from-[#FEFBE8] to-[#FFFbeb] border border-[#FEF3C7] rounded-[20px] flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex-1 pr-4">
          <h3 className="text-[15px] font-extrabold text-amber-950 mb-1">🎁 Welcome to Buyto!</h3>
          <p className="text-[12px] font-bold text-amber-800 flex items-center gap-0.5">
            Get 20 BuyCoins FREE on sign up <span className="text-[#318616] ml-1">Claim now</span> <ChevronRight className="w-3.5 h-3.5 inline text-[#318616]" />
          </p>
        </div>
        <div className="text-4xl animate-bounce">🪙</div>
      </div>
    );
  }

  // If birthday is already added, do not show the banner at all
  if (user?.dateOfBirth) {
    return null;
  }

  return (
    <div 
      onClick={onClick}
      className="mx-4 mt-4 p-5 bg-gradient-to-r from-[#FEFBE8] to-[#FFFbeb] border border-[#FEF3C7] rounded-[20px] flex items-center justify-between shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.99]"
    >
      <div className="flex-1 pr-4">
        <h3 className="text-[15px] font-extrabold text-amber-950 mb-1">Add your birthday</h3>
        <button className="text-[13px] font-extrabold text-[#318616] flex items-center gap-0.5 hover:underline focus:outline-none">
          Enter details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="text-4xl">🎂</div>
    </div>
  );
});

ProfileBanner.displayName = "ProfileBanner";

export default ProfileBanner;

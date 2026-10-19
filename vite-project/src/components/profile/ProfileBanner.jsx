import React from "react";
import { ChevronRight } from "lucide-react";

const ProfileBanner = React.memo(({ isLoggedIn, user, onClick }) => {
  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="
        mx-4 mt-4
        w-[calc(100%-2rem)]
        max-w-full
        box-border
        p-3 sm:p-4 md:p-5
        bg-gradient-to-r from-[#FEFBE8] to-[#FFFbeb]
        border border-[#FEF3C7]
        rounded-[20px]
        flex items-center justify-between
        gap-2 sm:gap-4
        shadow-sm
        cursor-pointer
        hover:shadow-md
        transition-all duration-200
        active:scale-[0.99]
        overflow-hidden
      "
      >
        <div className="flex-1 min-w-0 pr-1 sm:pr-2 md:pr-4">
          <h3
            className="
            text-[13px] sm:text-[14px] md:text-[15px]
            font-extrabold
            text-amber-950
            mb-1
            leading-tight
          "
          >
            🎁 Welcome to Buyto!
          </h3>

          <p
            className="
            text-[11px] sm:text-[12px]
            font-bold
            text-amber-800
            leading-relaxed
            flex flex-wrap
            items-center
            gap-x-1
            gap-y-0.5
          "
          >
            <span>Get 20 BuyCoins FREE on sign up</span>

            <span
              className="
              text-[#318616]
              inline-flex
              items-center
              whitespace-nowrap
              font-extrabold
            "
            >
              Claim now
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </p>
        </div>

        <div
          className="flex-shrink-0text-2xl sm:text-3xl md:text-4xlanimate-bounce"
          aria-hidden="true"
        >
          🪙
        </div>
      </button>
    );
  }

  // If birthday is already added, do not show the banner at all
  if (user?.dateOfBirth) {
    return null;
  }

  return (
    <div className="mx-4 mt-4 p-5 bg-gradient-to-r from-[#FEFBE8] to-[#FFFbeb] border border-[#FEF3C7] rounded-[20px] flex items-center justify-between shadow-sm">
      <div className="flex-1 pr-4">
        <h3 className="text-[15px] font-extrabold text-amber-950 mb-1">
          Add your birthday
        </h3>
        <button
          type="button"
          onClick={onClick}
          className="text-[13px] font-extrabold text-[#318616] flex items-center gap-0.5 hover:underline"
        >
          Enter details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="text-4xl">🎂</div>
    </div>
  );
});

ProfileBanner.displayName = "ProfileBanner";

export default ProfileBanner;

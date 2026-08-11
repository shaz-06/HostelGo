import React from "react";
import { ShoppingBag, Wallet, MessageSquare } from "lucide-react";

const QuickActions = React.memo(({ onOrders, onWallet, onHelp }) => {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 mt-5">
      {/* Orders Card */}
      <button
        onClick={onOrders}
        className="bg-white rounded-[15px] py-3 px-2 flex flex-col items-center justify-center border border-gray-100/60 shadow-[0_2px_5px_rgba(0,0,0,0.015)] transition-all duration-200 active:scale-95 focus:outline-none"
      >
        <div className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 flex items-center justify-center mb-1.5">
          <img
            src="https://img.icons8.com/?size=100&id=TGsUUNBPyMx1&format=png&color=000000"
            alt="Orders"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-[12.5px] font-semibold text-gray-800 text-center tracking-tight">
          Your orders
        </span>
      </button>

      {/* Wallet Card */}
      <button
        onClick={onWallet}
        className="bg-white rounded-[15px] py-3 px-2 flex flex-col items-center justify-center border border-gray-100/60 shadow-[0_2px_5px_rgba(0,0,0,0.015)] transition-all duration-200 active:scale-95 focus:outline-none"
      >
        <div className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 flex items-center justify-center mb-1.5">
          <img
            src="https://img.icons8.com/?size=100&id=MjAYkOMsbYOO&format=png&color=000000"
            alt="Wallet"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-[12.5px] font-semibold text-gray-800 text-center tracking-tight">
          Buyto Wallet
        </span>
      </button>

      {/* Need Help Card */}
      <button
        onClick={onHelp}
        className="bg-white rounded-[15px] py-3 px-2 flex flex-col items-center justify-center border border-gray-100/60 shadow-[0_2px_5px_rgba(0,0,0,0.015)] transition-all duration-200 active:scale-95 focus:outline-none"
      >
        <div className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 flex items-center justify-center mb-1.5">
          <img
            src="https://img.icons8.com/?size=100&id=SKPXwfsncJbF&format=png&color=000000"
            alt="Support"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-[12.5px] font-semibold text-gray-800 text-center tracking-tight">
          Need help?
        </span>
      </button>
    </div>
  );
});

QuickActions.displayName = "QuickActions";

export default QuickActions;

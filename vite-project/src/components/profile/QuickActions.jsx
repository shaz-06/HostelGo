import React from "react";
import { ShoppingBag, Wallet, MessageSquare } from "lucide-react";

const QuickActions = React.memo(({ onOrders, onWallet, onHelp }) => {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 mt-5">
      {/* Orders Card */}
      <button
        onClick={onOrders}
        className="bg-white rounded-[18px] p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm transition-all duration-200 active:scale-95 focus:outline-none"
      >
        <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center mb-2">
          <img 
            src="https://img.icons8.com/?size=100&id=ipCQ1zFXbRzl&format=png&color=000000" 
            alt="Orders" 
            className="w-full h-full object-contain" 
          />
        </div>
        <span className="text-[13px] font-medium text-gray-800 text-center tracking-tight">
          Your orders
        </span>
      </button>
 
      {/* Wallet Card */}
      <button
        onClick={onWallet}
        className="bg-white rounded-[18px] p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm transition-all duration-200 active:scale-95 focus:outline-none"
      >
        <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center mb-2">
          <img 
            src="https://img.icons8.com/?size=100&id=MjAYkOMsbYOO&format=png&color=000000" 
            alt="Wallet" 
            className="w-full h-full object-contain" 
          />
        </div>
        <span className="text-[13px] font-medium text-gray-800 text-center tracking-tight">
          Buyto Wallet
        </span>
      </button>
 
      {/* Need Help Card */}
      <button
        onClick={onHelp}
        className="bg-white rounded-[18px] p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm transition-all duration-200 active:scale-95 focus:outline-none"
      >
        <div className="w-11 h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center mb-2">
          <img 
            src="https://img.icons8.com/?size=100&id=SKPXwfsncJbF&format=png&color=000000" 
            alt="Support" 
            className="w-full h-full object-contain" 
          />
        </div>
        <span className="text-[13px] font-medium text-gray-800 text-center tracking-tight">
          Need help?
        </span>
      </button>
    </div>
  );
});

QuickActions.displayName = "QuickActions";

export default QuickActions;

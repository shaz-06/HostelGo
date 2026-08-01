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
        <div className="w-10 h-10 rounded-full bg-[#318616]/5 flex items-center justify-center mb-2">
          <img 
            src="https://img.icons8.com/?size=100&id=ipCQ1zFXbRzl&format=png&color=000000" 
            alt="Orders" 
            className="w-5 h-5 object-contain" 
          />
        </div>
        <span className="text-[13px] font-black text-gray-800 text-center tracking-tight">
          Your orders
        </span>
      </button>

      {/* Wallet Card */}
      <button
        onClick={onWallet}
        className="bg-white rounded-[18px] p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm transition-all duration-200 active:scale-95 focus:outline-none"
      >
        <div className="w-10 h-10 rounded-full bg-amber-500/5 flex items-center justify-center mb-2">
          <img 
            src="https://img.icons8.com/?size=100&id=MjAYkOMsbYOO&format=png&color=000000" 
            alt="Wallet" 
            className="w-5 h-5 object-contain" 
          />
        </div>
        <span className="text-[13px] font-black text-gray-800 text-center tracking-tight">
          Buyto Wallet
        </span>
      </button>

      {/* Need Help Card */}
      <button
        onClick={onHelp}
        className="bg-white rounded-[18px] p-4 flex flex-col items-center justify-center border border-gray-100 shadow-sm transition-all duration-200 active:scale-95 focus:outline-none"
      >
        <div className="w-10 h-10 rounded-full bg-blue-500/5 flex items-center justify-center mb-2">
          <img 
            src="https://img.icons8.com/?size=100&id=19nQzXuCO2It&format=png&color=000000" 
            alt="Support" 
            className="w-5 h-5 object-contain" 
          />
        </div>
        <span className="text-[13px] font-black text-gray-800 text-center tracking-tight">
          Need help?
        </span>
      </button>
    </div>
  );
});

QuickActions.displayName = "QuickActions";

export default QuickActions;

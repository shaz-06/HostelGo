import React from "react";
import BuytoLogo from "../common/BuytoLogo";

const VersionFooter = React.memo(({ version = "v1.0.0" }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 select-none">
      {/* Brand Logo */}
      <div className="opacity-30 grayscale hover:grayscale-0 hover:opacity-50 transition-all duration-300 transform hover:scale-105">
        <BuytoLogo size="small" clickable={false} responsive={false} style={{ height: "42px" }} />
      </div>
      
      {/* Version and Copyright */}
      <span className="text-[12px] font-extrabold text-gray-300 mt-2 tracking-widest uppercase">
        {version}
      </span>
      <span className="text-[11px] font-bold text-gray-300 mt-0.5">
        © 2026 Buyto Technologies
      </span>
    </div>
  );
});

VersionFooter.displayName = "VersionFooter";

export default VersionFooter;

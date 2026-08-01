import React from "react";

const ProfileSection = React.memo(({ title, children }) => {
  return (
    <div className="mx-4 mb-6">
      {title && (
        <h2 className="text-[17px] font-black text-gray-900 mb-3 px-1 tracking-tight">
          {title}
        </h2>
      )}
      <div className="bg-white rounded-[18px] border border-gray-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
});

ProfileSection.displayName = "ProfileSection";

export default ProfileSection;

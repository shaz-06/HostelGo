import React from "react";
import { ChevronRight } from "lucide-react";

const ProfileRow = React.memo(({
  icon: Icon,
  label,
  subtitle,
  rightContent,
  onClick,
  danger = false,
  isLast = false
}) => {
  return (
    <div className="w-full">
      <button
        onClick={onClick}
        className={`w-full min-h-[58px] px-4 py-3.5 flex items-center justify-between text-left transition-all duration-150 focus:outline-none focus:bg-gray-50 active:bg-gray-100/80 ${danger ? "text-red-600" : "text-gray-800"
          }`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {Icon && (
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center overflow-hidden ${danger ? "text-red-600" : "text-gray-500"
              }`}>
              {typeof Icon === "string" ? (
                <img src={Icon} alt={label} className="w-[18px] h-[18px] object-contain" />
              ) : (
                <Icon className="w-[18px] h-[18px] stroke-[2]" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[15px] font-medium tracking-tight block truncate">
              {label}
            </span>
            {subtitle && (
              <span className="text-[11px] font-medium text-gray-400 block mt-0.5 leading-tight">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {rightContent !== undefined ? (
            rightContent
          ) : (
            <ChevronRight className={`w-4.5 h-4.5 ${danger ? "text-red-300" : "text-gray-400"}`} />
          )}
        </div>
      </button>
      {!isLast && <div className="h-[1px] bg-gray-100/80 ml-14 mr-4" />}
    </div>
  );
});

ProfileRow.displayName = "ProfileRow";

export default ProfileRow;

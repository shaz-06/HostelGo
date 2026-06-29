import React from "react";

export default function BuyCoin({ size = 24, className = "", animate = false }) {
  const floatStyle = animate ? {
    animation: "buyCoinFloat 4s ease-in-out infinite"
  } : {};

  return (
    <span 
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        justifyContent: "center", 
        verticalAlign: "middle",
        ...floatStyle
      }}
      className={className}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        style={{ display: "block" }}
      >
        <defs>
          {/* Outer Ring Gradient */}
          <linearGradient id="outerRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="30%" stopColor="#fbbf24" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          
          {/* Inner Golden Gradient */}
          <linearGradient id="innerFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="40%" stopColor="#ffd54f" />
            <stop offset="80%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          
          {/* Premium Drop Shadow for 3D depth */}
          <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.2" />
          </filter>

          {/* Shine gradient sweep */}
          <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          
          <clipPath id="coinClip">
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>
        
        {/* Subtle drop shadow under coin */}
        <circle cx="50" cy="52" r="46" fill="rgba(0, 0, 0, 0.15)" />
        
        {/* Outer Ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="46" 
          fill="url(#outerRingGrad)" 
          stroke="#b45309" 
          strokeWidth="1.5" 
          filter="url(#coinShadow)" 
        />
        
        {/* Inner Plate */}
        <circle 
          cx="50" 
          cy="50" 
          r="36" 
          fill="url(#innerFillGrad)" 
          stroke="#e0a904" 
          strokeWidth="1" 
        />
        
        {/* Inner dotted border */}
        <circle 
          cx="50" 
          cy="50" 
          r="32" 
          fill="none" 
          stroke="rgba(245, 158, 11, 0.4)" 
          strokeWidth="1.5" 
          strokeDasharray="4 2" 
        />
        
        {/* Bold Brand Letter B */}
        <text 
          x="51" 
          y="64" 
          fontFamily="'Outfit', 'Inter', 'Arial Black', sans-serif" 
          fontSize="42" 
          fontWeight="900" 
          fill="#318616" 
          textAnchor="middle"
          style={{ letterSpacing: "-1.5px" }}
        >
          B
        </text>

        {/* Shine Sweep Overlay */}
        {animate && (
          <g clipPath="url(#coinClip)">
            <rect 
              x="-120" 
              y="-120" 
              width="60" 
              height="300" 
              fill="url(#shineGrad)" 
              style={{
                animation: "buyCoinShine 8s infinite linear"
              }}
            />
          </g>
        )}
      </svg>

      {/* Global CSS for Coin Animations */}
      <style>{`
        @keyframes buyCoinFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(3deg);
          }
        }
        @keyframes buyCoinShine {
          0% {
            transform: translate(-100px, -100px) rotate(45deg);
          }
          20% {
            transform: translate(220px, 220px) rotate(45deg);
          }
          100% {
            transform: translate(220px, 220px) rotate(45deg);
          }
        }
      `}</style>
    </span>
  );
}

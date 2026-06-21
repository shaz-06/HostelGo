import React from "react";
import { useNavigate } from "react-router-dom";
import { logoPath, appName } from "../../config/branding";

export default function BuytoLogo({
  size = "medium",
  responsive = true,
  clickable = true,
  style = {},
  imgStyle = {},
  className = "",
  onClick,
  ...props
}) {
  const navigate = useNavigate();

  // Heights configuration
  const heights = {
    small: { mobile: "48px", tablet: "56px", desktop: "64px" },
    medium: { mobile: "56px", tablet: "64px", desktop: "76px" },
    large: { mobile: "64px", tablet: "72px", desktop: "88px" },
    xl: { mobile: "72px", tablet: "80px", desktop: "100px" },
  };

  const h = heights[size] || heights.medium;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (clickable) {
      navigate("/");
    }
  };

  const staticHeight = h.desktop;

  return (
    <div
      onClick={handleClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: clickable ? "pointer" : "default",
        ...style,
      }}
      className={`buyto-logo-container ${className}`}
      {...props}
    >
      {responsive && (
        <style dangerouslySetInnerHTML={{
          __html: `
          .buyto-logo-${size} {
            height: ${h.mobile};
            width: auto;
          }
          @media (min-width: 768px) {
            .buyto-logo-${size} {
              height: ${h.tablet};
              width: auto;
            }
          }
          @media (min-width: 1024px) {
            .buyto-logo-${size} {
              height: ${h.desktop};
              width: auto;
            }
          }
        `}} />
      )}
      <img
        src={logoPath}
        alt={appName}
        className={responsive ? `buyto-logo-${size}` : ""}
        style={{
          width: "auto",
          height: responsive ? undefined : staticHeight,
          objectFit: "contain",
          maxWidth: "100%",
          ...imgStyle,
        }}
        loading="lazy"
      />
    </div>
  );
}

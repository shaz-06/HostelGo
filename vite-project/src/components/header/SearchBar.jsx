import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAppStore, selectSearchQuery } from "../../store/appStore";
import { useTheme } from "../../context/ThemeContext";

const searchSuggestions = [
  "Milk",
  "Curd",
  "Rice",
  "Atta",
  "Chocolates",
  "Ice Cream",
  "Shampoo",
  "Face Wash",
  "Cold Drinks",
  "Bread",
  "Eggs",
  "Snacks"
];

export const SearchBar = React.memo(({ useDarkAzure, welcomeBannerVisible, isHomepage, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDark } = useTheme();

  const searchQuery = useAppStore(selectSearchQuery);
  const setSearchQueryStore = useAppStore((state) => state.setSearchQuery);

  const setSearchQuery = useCallback((val) => {
    setSearchQueryStore(val, searchParams, setSearchParams, navigate, location.pathname);
  }, [searchParams, setSearchParams, navigate, location.pathname, setSearchQueryStore]);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [searchIndex, setSearchIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!isFocused || searchQuery === "") {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery, isFocused]);

  useEffect(() => {
    if (localQuery === searchQuery) return;
    const handler = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [localQuery, searchQuery, setSearchQuery]);

  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isFocused]);

  const handleVoiceSearch = async () => {
    if (isListening && recognitionRef.current) {
      console.log("Mic clicked - Stopping recognition");
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      return;
    }

    console.log("Mic clicked - Starting recognition");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported on this device.");
      console.log("Speech error: SpeechRecognition not supported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Permission granted");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Microphone permission error:", err);
      console.log("Speech error: Permission denied");
      alert("Microphone access is required for voice search.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("Listening started");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech result:", transcript);
      setSearchQuery(transcript);
      if (location.pathname !== "/") {
        navigate("/");
      }
    };

    recognition.onerror = (event) => {
      console.log("Speech error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      console.log("Listening ended");
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (err) {
      console.log("Speech error on start:", err);
      setIsListening(false);
    }
  };

  return (
    <div style={{ position: "relative", flexGrow: 1, width: "100%", margin: "1px 0" }}>
      <input
        type="text"
        id="main-search-input"
        placeholder={isListening ? "Listening..." : ""}
        value={localQuery}
        onChange={(e) => {
          const val = e.target.value;
          setLocalQuery(val);
        }}
        onFocus={() => {
          setIsFocused(true);
          if (location.pathname !== "/search") {
            navigate("/search");
          }
        }}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.target.blur();
          }
        }}
        style={{
          background: isDark ? "#242730" : "#FFFFFF",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "30px",
          padding: isMobile 
            ? (localQuery.trim().length > 0 ? "9px 70px 9px 40px" : "9px 40px") 
            : (localQuery.trim().length > 0 ? "12px 70px 12px 40px" : "12px 40px"),
          width: "100%",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(255, 255, 255, 0.7)",
          fontSize: "14px",
          fontWeight: "600",
          color: isDark ? "#F5F5F5" : "#1f2937",
          outline: "none",
          boxSizing: "border-box",
          boxShadow: isDark ? "0 12px 35px rgba(0,0,0,0.25)" : "0 12px 35px rgba(0,0,0,0.08)"
        }}
      />
      {(!localQuery && !isFocused && !isListening) && (
        <div
          style={{
            position: "absolute",
            left: "40px",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            fontSize: "14px",
            fontWeight: "600",
            color: (useDarkAzure || welcomeBannerVisible || isHomepage) ? "#64748B" : (isDark ? "#A7ACB8" : "#9ca3af"),
            fontFamily: "inherit",
            height: "24px",
            overflow: "hidden"
          }}
        >
          <span>Search for&nbsp;</span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: `translateY(-${searchIndex * 24}px)`,
              height: "24px"
            }}
          >
            {searchSuggestions.map((sug, idx) => (
              <span
                key={idx}
                style={{
                  height: "24px",
                  lineHeight: "24px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                '{sug}'
              </span>
            ))}
          </div>
        </div>
      )}
      <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: (useDarkAzure || welcomeBannerVisible || isHomepage) ? "#64748B" : (isDark ? "#D5D8DE" : "#9ca3af"), display: "flex", alignItems: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </span>
      {localQuery.trim().length > 0 && (
        <button
          type="button"
          onClick={() => {
            setLocalQuery("");
            setSearchQuery("");
            setIsFocused(false);
            if (location.pathname === "/search") {
              navigate("/");
            }
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent blur from firing before click
          style={{
            position: "absolute",
            right: "42px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "6px",
            color: (useDarkAzure || welcomeBannerVisible || isHomepage) ? "#64748B" : (isDark ? "#D5D8DE" : "#4b5563"),
            transition: "opacity 0.2s"
          }}
          aria-label="Clear search"
          onMouseOver={(e) => e.currentTarget.style.opacity = "0.7"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={handleVoiceSearch}
        style={{
          position: "absolute",
          right: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: isListening ? "#ef4444" : (isDark ? "#D5D8DE" : "#4b5563"),
          display: "flex",
          alignItems: "center",
          padding: "4px"
        }}
      >
        <img
          src={`https://img.icons8.com/?size=100&id=M0nvDJhT5w5g&format=png&color=${(useDarkAzure || welcomeBannerVisible || isHomepage) ? "64748B" : "000000"}`}
          alt="Mic"
          style={{
            width: "18px",
            height: "18px",
            objectFit: "contain",
            opacity: isListening ? 0.6 : 1
          }}
        />
      </button>

    </div>
  );
});

export default SearchBar;

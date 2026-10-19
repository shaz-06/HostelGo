import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "./common/SEO";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";
import BackToTop from "./common/BackToTop";

export default function SearchResultsView({
  searchQuery,
  filteredProducts = [],
  allProducts = [],
  isMobile = false,
  windowWidth,
  renderProductCard,
  addToCart,
  removeFromCart,
  cartItems,
  setSelectedProduct,
  setSearchQuery,
  openProduct,
  getCartKey,
  searchLoading = false
}) {
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setLocalQuery(searchQuery || "");
  }, [searchQuery]);

  // Sync typed query with parent state immediately
  useEffect(() => {
    if (localQuery !== searchQuery) {
      setSearchQuery(localQuery);
    }
  }, [localQuery, searchQuery, setSearchQuery]);

  const handleVoiceSearch = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported on this device.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setLocalQuery(transcript);
        setSearchQuery(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <strong key={i} style={{ color: "#4B5E78", fontWeight: "750" }}>{part}</strong>
            : <span key={i} style={{ opacity: 0.85 }}>{part}</span>
        )}
      </span>
    );
  };

  const suggestionsList = [
    "Fresh Fruits",
    "Organic Veggies",
    "Fresh Milk",
    "Bread & Eggs",
    "Ice Cream",
    "Chips & Snacks",
    "Cold Drinks"
  ];

  return (
    <div style={{
      width: "100%",
      maxWidth: "680px",
      margin: "0 auto",
      padding: isMobile ? "0px 24px 140px 24px" : "0px 24px 100px 24px",
      boxSizing: "border-box",
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      <SEO
        title={localQuery ? `Search "${localQuery}"` : "Search"}
        description={localQuery ? `Search results for "${localQuery}" on Buyto.` : "Search across thousands of daily essentials and groceries on Buyto."}
      />

      {/* RESULTS / SUGGESTIONS CONTAINER */}
      <div>
        {searchLoading ? (
          /* SKELETON / LOADING LOADER */
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "4px 8px"
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "8px",
                  background: "#FFFBF2",
                  animation: "pulse-loader 1.5s infinite ease-in-out"
                }} />
                <div style={{
                  width: "140px",
                  height: "16px",
                  background: "#FFFBF2",
                  borderRadius: "4px",
                  animation: "pulse-loader 1.5s infinite ease-in-out"
                }} />
              </div>
            ))}
            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes pulse-loader {
                0%, 100% { background-color: #F3F1E8; }
                50% { background-color: #E6E4DB; }
              }
            `}} />
          </div>
        ) : localQuery.trim() === "" ? (
          /* POPULAR SEARCH SUGGESTIONS WHEN EMPTY QUERY */
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#4B5563", marginBottom: "16px", marginTop: "8px" }}>
              Popular Searches
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {suggestionsList.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLocalQuery(sug);
                    setSearchQuery(sug);
                  }}
                  style={{
                    background: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "20px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#4B5563",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    outline: "none"
                  }}
                >
                  🔍 {sug}
                </button>
              ))}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* NO RESULTS FOUND STATE */
          <div style={{
            textAlign: "center",
            padding: "48px 24px",
            marginTop: "12px",
            background: "white",
            borderRadius: "24px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1F2937", margin: "0 0 8px 0" }}>
              No products found for "{localQuery}"
            </h3>
            <p style={{ color: "#6B7280", fontSize: "14px", margin: "0 0 16px 0", fontWeight: "500" }}>
              Try checking the spelling or searching with a different keyword.
            </p>
          </div>
        ) : (
          /* RESULTS LIST VIEW */
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
            border: "1px solid #e2e8f0",
            padding: "4px 0",
            marginTop: "2px",
            maxHeight: "400px",
            height: "fit-content",
            flex: "0 0 auto",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch"
          }}>
            {filteredProducts.slice(0, 8).map((product) => {
              const productId = product._id || product.id;
              const imageUrl = getOptimizedImageUrl(product.image, "thumbnail");

              return (
                <div
                  key={productId}
                  onClick={() => {
                    navigate(`/product/${productId}`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    padding: "8px 16px",
                    transition: "background-color 0.15s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Image Container */}
                  <div style={{
                    width: "48px",
                    height: "48px",
                    background: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0
                  }}>
                    <img
                      src={imageUrl}
                      alt={product.name}
                      style={{
                        width: "85%",
                        height: "85%",
                        objectFit: "contain"
                      }}
                      loading="lazy"
                    />
                  </div>

                  {/* Product/Search Name */}
                  <span style={{
                    fontSize: isMobile ? "14px" : "15px",
                    fontWeight: "600",
                    color: "#1D2A3A",
                    textAlign: "left"
                  }}>
                    {highlightMatch(product.name, localQuery)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BackToTop />
    </div>
  );
}

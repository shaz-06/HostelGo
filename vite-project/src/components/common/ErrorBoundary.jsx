import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "20px",
          background: "#F9FAFB",
          fontFamily: "'Outfit', 'Inter', sans-serif",
          textAlign: "center"
        }}>
          <div style={{
            background: "white",
            borderRadius: "24px",
            padding: "40px",
            maxWidth: "480px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            border: "1px solid #f3f4f6"
          }}>
            <span style={{ fontSize: "48px" }}>⚠️</span>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#1f2937", margin: "16px 0 8px 0" }}>Something went wrong</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
              An unexpected rendering error occurred. We have saved your cart, please try reloading the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#318616",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "14px",
                fontWeight: "750",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#286f12"}
              onMouseOut={(e) => e.currentTarget.style.background = "#318616"}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SEO from "../components/common/SEO";
import { Copy, Share2, MessageCircle, AlertCircle, RefreshCw, Check } from "lucide-react";

export default function ReferEarnPage() {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, updateUserInSession } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, earned: 0 });
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [isLoadingReferral, setIsLoadingReferral] = useState(true);
  const [referralError, setReferralError] = useState(false);
  const copyTimeoutRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Manual entry and order eligibility states
  const [hasOrders, setHasOrders] = useState(false);
  const [checkingOrders, setCheckingOrders] = useState(true);
  const referralLink = referralCode ? `https://www.buyto.co.in/?ref=${referralCode}` : "";
  const shareMessage = referralCode ? `🎁 Join me on Buyto!\n\nUse my referral code ${referralCode} when you join Buyto.\n\nYou get ₹50 BuyCoins.\n\n${referralLink}` : "";

  console.log("[ReferEarn] current AuthContext user:", user);
  console.log("[ReferEarn] calculated referralCode:", referralCode);
  const [manualCode, setManualCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");

  // Fetch referrals data
  const fetchData = useCallback(async (targetPage = 1, append = false) => {
    if (!token) return;
    if (!append) {
      setLoading(true);
      setIsLoadingReferral(true);
    }
    setError(false);
    setReferralError(false);

    try {
      console.log("[ReferEarn] ===== REFERRAL API REQUEST START =====");
      console.log("[ReferEarn] Auth user:", user);
      console.log("[ReferEarn] Token available:", !!token);
      console.log("[ReferEarn] API URL:", `${window.API_BASE_URL}/api/users/referrals`);

      const res = await fetch(`${window.API_BASE_URL}/api/users/referrals?page=${targetPage}&limit=10&_t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("[ReferEarn] Referral API HTTP status:", res.status);
      const data = await res.json();
      console.log("[ReferEarn] Referral API RESPONSE:", data);
      console.log("[ReferEarn] Referral code from API:", data?.referralCode);
      console.log("[ReferEarn] Referral code from nested user:", data?.user?.referralCode);
      console.log("[ReferEarn] Referral code from nested data:", data?.data?.referralCode);

      if (res.ok && data.success) {
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setPage(data.pagination.page);

        const code = data.referralCode || data?.user?.referralCode || data?.data?.referralCode;
        if (code) {
          setReferralCode(code);
          if (user && !user.referralCode) {
            updateUserInSession({ ...user, referralCode: code });
          }
        } else {
          setReferralError(true);
        }

        if (append) {
          setHistory(prev => [...prev, ...data.history]);
        } else {
          setHistory(data.history);
        }
      } else {
        setError(true);
        setReferralError(true);
      }
    } catch (err) {
      console.error("[ReferEarn] Failed to load referral data:", err);
      setError(true);
      setReferralError(true);
    } finally {
      setLoading(false);
      setIsLoadingReferral(false);
      setRefreshing(false);
    }
  }, [token, user, updateUserInSession]);

  // Fetch order status for manual linking restriction
  useEffect(() => {
    if (authLoading || !token) {
      setCheckingOrders(false);
      return;
    }
    setCheckingOrders(true);
    fetch(`${window.API_BASE_URL}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          setHasOrders(true);
        }
        setCheckingOrders(false);
      })
      .catch(() => setCheckingOrders(false));
  }, [authLoading, token]);

  useEffect(() => {
    if (!authLoading && token) {
      console.log("[ReferEarn] authLoading completed and token available. Fetching referrals...");
      fetchData(1, false);
    }
  }, [authLoading, token, fetchData]);

  // Pull to refresh simulation
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(1, false);
  };

  // Load more pages
  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchData(page + 1, true);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error("Failed to copy referral code:", err);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyFeedback("Referral link copied ✓");
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Buyto & Earn Rewards",
          text: shareMessage,
          url: referralLink
        });
        setShareFeedback("Shared successfully!");
        setTimeout(() => setShareFeedback(""), 2000);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
  };

  // Telegram Share
  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
  };

  const handleApplyManualCode = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setLinking(true);
    setLinkError("");
    setLinkSuccess("");

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: user.name,
          referralCode: manualCode.toUpperCase().trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to link referral code.");
      }
      updateUserInSession(data.user);
      setLinkSuccess("Referral applied successfully! You will get ₹50 BuyCoins reward after your first qualifying order is delivered.");
    } catch (err) {
      console.error(err);
      if (err.message?.toLowerCase().includes("self")) {
        setLinkError("You can't use your own referral code.");
      } else if (err.message?.toLowerCase().includes("invalid")) {
        setLinkError("That referral code isn't valid.");
      } else {
        setLinkError(err.message || "Failed to link code. Please try again.");
      }
    } finally {
      setLinking(false);
    }
  };

  // Render Skeletons
  const renderSkeletons = () => (
    <div style={contentWrapperStyle}>
      <div style={skeletonCardStyle} />
      <div style={skeletonGridStyle}>
        <div style={skeletonStatStyle} />
        <div style={skeletonStatStyle} />
        <div style={skeletonStatStyle} />
        <div style={skeletonStatStyle} />
      </div>
      <div style={skeletonListStyle}>
        <div style={skeletonRowStyle} />
        <div style={skeletonRowStyle} />
        <div style={skeletonRowStyle} />
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <SEO title="Refer & Earn • Buyto" description="Invite friends to Buyto and earn rewards." />

      {/* Header */}
      <div style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backButtonStyle} aria-label="Go back">←</button>
        <h1 style={titleStyle}>Refer & Earn</h1>
        <div style={{ width: "44px" }} />
      </div>

      {/* Hero Banner Section */}
      <div style={heroBannerStyle}>
        <div style={heroOverlayStyle}>
          <div style={heroContentStyle}>
            <span style={heroTagStyle}>LIMITED PERIOD OFFER</span>
            <h2 style={heroHeadingStyle}>Invite Friends & Earn ₹75</h2>
            <p style={heroSubheadingStyle}>Your friends get ₹50 on signup. You get ₹75 when they place their first delivered order of ₹199 or more.</p>
          </div>
        </div>
      </div>

      {loading && history.length === 0 ? (
        renderSkeletons()
      ) : error ? (
        <div style={errorWrapperStyle}>
          <AlertCircle size={48} color="#ef4444" />
          <h3 style={errorTitleStyle}>Unable to load referrals</h3>
          <p style={errorSubtitleStyle}>Check your internet connection and try again.</p>
          <button onClick={() => fetchData(1, false)} style={retryButtonStyle}>Retry</button>
        </div>
      ) : (
        <div style={contentWrapperStyle}>
          {/* Refresh Action (Mobile visual helper) */}
          <div style={refreshRowStyle}>
            <button
              onClick={handleRefresh}
              style={{ ...refreshBtnStyle, transform: refreshing ? "rotate(360deg)" : "none" }}
              aria-label="Pull to refresh"
            >
              <RefreshCw size={16} /> {refreshing ? "Refreshing..." : "Pull to Refresh"}
            </button>
          </div>

          {/* Referral Code Card */}
          <div style={referralCardStyle}>
            <style>{`
              @keyframes spin-refresh {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h3 style={cardHeaderStyle}>Your Referral Code</h3>
            {isLoadingReferral ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                fontSize: "14px",
                color: "var(--text-secondary)",
                fontWeight: "750",
                gap: "8px"
              }}>
                <RefreshCw size={16} style={{ animation: "spin-refresh 1s linear infinite" }} /> Generating your referral code...
              </div>
            ) : referralError ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                gap: "12px"
              }}>
                <span style={{ fontSize: "14px", color: "#ef4444", fontWeight: "600" }}>
                  Unable to load your referral code.
                </span>
                <button
                  onClick={() => fetchData(1, false)}
                  style={{
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div style={codeRowStyle}>
                  <span style={codeTextStyle}>{referralCode}</span>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      ...copyBtnStyle,
                      backgroundColor: copied ? "#F59E0B" : "#16a34a",
                      color: copied ? "#318616" : "#ffffff",
                      transition: "background-color 180ms ease, color 180ms ease, transform 180ms ease",
                      transform: copied ? "scale(0.96)" : "scale(1)",
                      minWidth: "120px",
                      justifyContent: "center"
                    }}
                    aria-label="Copy Referral Code"
                  >
                    {copied ? (
                      <>
                        <Check size={18} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={18} /> Copy Code
                      </>
                    )}
                  </button>
                </div>
                {!copied && copyFeedback && <div style={toastFeedbackStyle}>{copyFeedback}</div>}

                <div style={dividerStyle} />

                <h4 style={shareTitleStyle}>Share Referral Link</h4>
                <div style={shareGridStyle}>
                  <button onClick={handleWhatsAppShare} style={shareIconBtnStyle} aria-label="Share on WhatsApp">
                    <img
                      src="https://img.icons8.com/?size=100&id=A1JUR9NRH7sC&format=png&color=000000"
                      alt="WhatsApp"
                      style={{ width: "36px", height: "36px", objectFit: "contain" }}
                    />
                    <span style={shareLabelStyle}>WhatsApp</span>
                  </button>
                  <button onClick={handleTelegramShare} style={shareIconBtnStyle} aria-label="Share on Telegram">
                    <img
                      src="https://img.icons8.com/?size=100&id=5mIvDYZUWDCF&format=png&color=000000"
                      alt="Telegram"
                      style={{ width: "36px", height: "36px", objectFit: "contain" }}
                    />
                    <span style={shareLabelStyle}>Telegram</span>
                  </button>
                  <button onClick={handleNativeShare} style={shareIconBtnStyle} aria-label="Open Share Options">
                    <img
                      src="https://img.icons8.com/?size=100&id=12771&format=png&color=000000"
                      alt="Share Link"
                      style={{ width: "36px", height: "36px", objectFit: "contain" }}
                    />
                    <span style={shareLabelStyle}>Share Link</span>
                  </button>
                </div>
                {shareFeedback && <div style={toastFeedbackStyle}>{shareFeedback}</div>}
              </>
            )}
          </div>

          {/* Manual Referral Code Input / Status Card */}
          {!checkingOrders && (
            <>
              {user?.referredBy ? (
                <div style={manualEntryCardStyle}>
                  <h3 style={sectionTitleStyle}>🎁 Referral Code Status</h3>
                  <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #bcf0da",
                    padding: "16px",
                    borderRadius: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}>
                    <span style={{ fontWeight: "800", color: "#16a34a", fontSize: "14px" }}>🎁 Referral Applied ✓</span>
                    <span style={{ fontSize: "12.5px", color: "#374151", fontWeight: "600" }}>
                      You've joined Buyto through a referral. Your ₹50 reward is pending your first qualifying order delivery.
                    </span>
                  </div>
                </div>
              ) : hasOrders ? (
                <div style={manualEntryCardStyle}>
                  <h3 style={{ ...sectionTitleStyle, display: "flex", alignItems: "center", gap: "8px", margin: "0 0 14px 0" }}>
                    <img src="https://img.icons8.com/?size=100&id=UYwSCUxFGfYb&format=png&color=000000" alt="Referral Code" style={{ width: "22px", height: "22px" }} />
                    Have a referral code?
                  </h3>
                  <div style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "16px",
                    borderRadius: "18px",
                    fontSize: "13px",
                    color: "#991b1b",
                    fontWeight: "750"
                  }}>
                    Referral codes can only be added before your first order.
                  </div>
                </div>
              ) : (
                <div style={manualEntryCardStyle}>
                  <h3 style={{ ...sectionTitleStyle, display: "flex", alignItems: "center", gap: "8px", margin: "0 0 14px 0" }}>
                    <img src="https://img.icons8.com/?size=100&id=UYwSCUxFGfYb&format=png&color=000000" alt="Referral Code" style={{ width: "22px", height: "22px" }} />
                    Have a referral code?
                  </h3>
                  <p style={{ ...subtitleStyle, marginBottom: "12px" }}>Enter your friend's Buyto referral code to claim ₹50 BuyCoins.</p>
                  <form onSubmit={handleApplyManualCode} style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="e.g. BUYTO123"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      style={{
                        flex: 1,
                        height: "46px",
                        borderRadius: "12px",
                        border: "1.5px solid #cbd5e1",
                        padding: "0 14px",
                        fontSize: "14px",
                        fontWeight: "700",
                        outline: "none",
                        background: "#f8fafc"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={linking || !manualCode.trim()}
                      style={{
                        background: "#318616",
                        color: "white",
                        border: "none",
                        borderRadius: "12px",
                        padding: "0 18px",
                        fontSize: "13.5px",
                        fontWeight: "800",
                        cursor: "pointer",
                        boxShadow: "0 4px 10px rgba(49, 134, 22, 0.15)"
                      }}
                    >
                      {linking ? "Applying..." : "Apply Code"}
                    </button>
                  </form>
                  {linkError && <div style={{ color: "#ef4444", fontSize: "12.5px", fontWeight: "700", marginTop: "8px" }}>⚠️ {linkError}</div>}
                  {linkSuccess && <div style={{ color: "#16a34a", fontSize: "12.5px", fontWeight: "750", marginTop: "8px" }}>🎉 {linkSuccess}</div>}
                </div>
              )}
            </>
          )}

          {/* Statistics Grid */}
          <div style={statsGridStyle}>
            <div style={statBoxStyle}>
              <span style={statValStyle}>{stats.total}</span>
              <span style={statLabelStyle}>Total Invites</span>
            </div>
            <div style={statBoxStyle}>
              <span style={statValStyle}>{stats.completed}</span>
              <span style={statLabelStyle}>Successful</span>
            </div>
            <div style={statBoxStyle}>
              <span style={statValStyle}>{stats.pending}</span>
              <span style={statLabelStyle}>Pending</span>
            </div>
            <div style={{ ...statBoxStyle, borderRight: "none" }}>
              <span style={{ ...statValStyle, color: "#16a34a" }}>₹{stats.earned}</span>
              <span style={statLabelStyle}>Wallet Earned</span>
            </div>
          </div>

          {/* History List */}
          <div style={historySectionStyle}>
            <h3 style={sectionTitleStyle}>Referral History</h3>
            {history.length === 0 ? (
              <div style={emptyWrapperStyle}>
                <div style={emptyIconStyle}>👥</div>
                <h4 style={emptyTitleStyle}>Invite Friends & Earn Rewards</h4>
                <p style={emptySubtitleStyle}>Share your referral code with friends. Once they complete their first qualifying order, both of you will receive wallet rewards.</p>
                <button onClick={handleNativeShare} style={ctaInviteButtonStyle}>Invite Friends</button>
              </div>
            ) : (
              <div style={historyListStyle}>
                {history.map((item, idx) => (
                  <div key={item.id || idx} style={historyCardStyle}>
                    <div style={historyInfoStyle}>
                      <span style={friendNameStyle}>{item.friendName}</span>
                      <span style={historyDateStyle}>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div style={historyActionStyle}>
                      <span style={historyAmtStyle}>₹{item.reward}</span>
                      <span style={badgeStyle(item.status)}>{item.status}</span>
                    </div>
                  </div>
                ))}

                {page < totalPages && (
                  <button onClick={handleLoadMore} style={loadMoreButtonStyle}>
                    Load More Referrals
                  </button>
                )}
              </div>
            )}
          </div>

          {/* FAQ/Rules Section */}
          <div style={faqSectionStyle}>
            <h3 style={sectionTitleStyle}>How it works</h3>
            <div style={faqItemStyle}>
              <span style={faqNumberStyle}>1</span>
              <div style={faqContentStyle}>
                <h4 style={faqTitleStyle}>Invite Friends</h4>
                <p style={faqBodyStyle}>Share your referral code or sign up link with your friends.</p>
              </div>
            </div>
            <div style={faqItemStyle}>
              <span style={faqNumberStyle}>2</span>
              <div style={faqContentStyle}>
                <h4 style={faqTitleStyle}>Friend Signs Up</h4>
                <p style={faqBodyStyle}>Your friend enters your code during signup or onboarding profile complete. They get ₹50 wallet cash.</p>
              </div>
            </div>
            <div style={faqItemStyle}>
              <span style={faqNumberStyle}>3</span>
              <div style={faqContentStyle}>
                <h4 style={faqTitleStyle}>Place First Order</h4>
                <p style={faqBodyStyle}>Once your friend successfully places and delivers their first order of ₹199 or more, you get ₹75 credited to your wallet.</p>
              </div>
            </div>
            <div style={termsLinkStyle}>
              * Subject to Buyto Referral program Terms & Conditions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling Object declarations following Buyto design themes
const containerStyle = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column"
};

const headerStyle = {
  background: "var(--bg-card)",
  height: "70px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px",
  borderBottom: "1px solid var(--border-color)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.01)"
};

const backButtonStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: "var(--bg-secondary)",
  border: "none",
  fontSize: "20px",
  fontWeight: "bold",
  color: "var(--text-primary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  outline: "none"
};

const titleStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "var(--text-primary)",
  margin: 0,
  textAlign: "center",
  flex: 1
};

const heroBannerStyle = {
  background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
  color: "#ffffff",
  position: "relative",
  overflow: "hidden"
};

const heroOverlayStyle = {
  padding: "40px 24px",
  background: "rgba(0,0,0,0.05)"
};

const heroContentStyle = {
  maxWidth: "500px",
  margin: "0 auto",
  textAlign: "center"
};

const heroTagStyle = {
  background: "#eab308",
  color: "#1e3a1e",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.5px"
};

const heroHeadingStyle = {
  fontSize: "28px",
  fontWeight: "850",
  margin: "12px 0 8px 0",
  letterSpacing: "-0.5px"
};

const heroSubheadingStyle = {
  fontSize: "14px",
  lineHeight: "1.5",
  margin: 0,
  opacity: 0.9,
  fontWeight: "550"
};

const contentWrapperStyle = {
  padding: "20px 16px",
  maxWidth: "500px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const refreshRowStyle = {
  display: "flex",
  justifyContent: "center"
};

const refreshBtnStyle = {
  background: "none",
  border: "none",
  color: "var(--text-secondary)",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  outline: "none"
};

const referralCardStyle = {
  background: "var(--bg-card)",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid var(--border-color)",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
  position: "relative"
};

const cardHeaderStyle = {
  fontSize: "13px",
  fontWeight: "750",
  color: "var(--text-secondary)",
  margin: "0 0 10px 0",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const codeRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--bg-secondary)",
  borderRadius: "16px",
  padding: "8px 8px 8px 18px",
  border: "1px solid var(--border-color)"
};

const codeTextStyle = {
  fontSize: "22px",
  fontWeight: "850",
  letterSpacing: "2px",
  color: "var(--text-primary)"
};

const copyBtnStyle = {
  background: "#16a34a",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  fontSize: "13px",
  fontWeight: "750",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  outline: "none",
  boxShadow: "0 4px 10px rgba(22, 163, 74, 0.2)"
};

const dividerStyle = {
  height: "1px",
  background: "var(--border-color)",
  margin: "20px 0"
};

const shareTitleStyle = {
  fontSize: "13px",
  fontWeight: "750",
  color: "var(--text-secondary)",
  margin: "0 0 12px 0"
};

const shareGridStyle = {
  display: "flex",
  gap: "12px"
};

const shareIconBtnStyle = {
  flex: 1,
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-color)",
  borderRadius: "16px",
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  transition: "all 0.2s",
  outline: "none"
};

const shareLabelStyle = {
  fontSize: "12px",
  fontWeight: "700",
  color: "var(--text-primary)"
};

const statsGridStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: "24px",
  display: "flex",
  padding: "16px 0",
  boxShadow: "0 8px 24px rgba(0,0,0,0.01)"
};

const statBoxStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  borderRight: "1px solid var(--border-color)"
};

const statValStyle = {
  fontSize: "20px",
  fontWeight: "850",
  color: "var(--text-primary)"
};

const statLabelStyle = {
  fontSize: "11px",
  fontWeight: "600",
  color: "var(--text-secondary)",
  marginTop: "4px"
};

const historySectionStyle = {
  marginTop: "10px"
};

const sectionTitleStyle = {
  fontSize: "17px",
  fontWeight: "800",
  color: "var(--text-primary)",
  margin: "0 0 14px 0"
};

const historyListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const historyCardStyle = {
  background: "var(--bg-card)",
  borderRadius: "18px",
  padding: "16px",
  border: "1px solid var(--border-color)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const historyInfoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

const friendNameStyle = {
  fontSize: "14.5px",
  fontWeight: "750",
  color: "var(--text-primary)"
};

const historyDateStyle = {
  fontSize: "12px",
  color: "var(--text-secondary)",
  fontWeight: "550"
};

const historyActionStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "6px"
};

const historyAmtStyle = {
  fontSize: "14.5px",
  fontWeight: "800",
  color: "#16a34a"
};

const badgeStyle = (status) => {
  let bg = "rgba(107, 114, 128, 0.1)";
  let co = "#6B7280";

  if (status === "COMPLETED") {
    bg = "rgba(22, 163, 74, 0.1)";
    co = "#16A34A";
  } else if (status === "PENDING") {
    bg = "rgba(234, 179, 8, 0.1)";
    co = "#CA8A04";
  } else if (status === "CANCELLED" || status === "EXPIRED") {
    bg = "rgba(239, 68, 68, 0.1)";
    co = "#EF4444";
  }

  return {
    padding: "3px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "750",
    backgroundColor: bg,
    color: co
  };
};

const loadMoreButtonStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: "14px",
  padding: "12px",
  color: "var(--text-primary)",
  fontSize: "13.5px",
  fontWeight: "750",
  cursor: "pointer",
  outline: "none",
  textAlign: "center"
};

const emptyWrapperStyle = {
  background: "var(--bg-card)",
  borderRadius: "24px",
  padding: "40px 24px",
  border: "1px solid var(--border-color)",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
};

const emptyIconStyle = {
  fontSize: "56px",
  marginBottom: "16px"
};

const emptyTitleStyle = {
  fontSize: "17px",
  fontWeight: "800",
  color: "var(--text-primary)",
  margin: "0 0 8px 0"
};

const emptySubtitleStyle = {
  fontSize: "13.5px",
  color: "var(--text-secondary)",
  lineHeight: "1.5",
  margin: "0 0 24px 0",
  maxWidth: "340px"
};

const ctaInviteButtonStyle = {
  background: "#16a34a",
  color: "#ffffff",
  border: "none",
  borderRadius: "16px",
  padding: "14px 28px",
  fontSize: "14.5px",
  fontWeight: "800",
  cursor: "pointer",
  outline: "none",
  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
};

const faqSectionStyle = {
  background: "var(--bg-card)",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid var(--border-color)",
  marginTop: "10px"
};

const faqItemStyle = {
  display: "flex",
  gap: "16px",
  marginBottom: "20px"
};

const faqNumberStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "rgba(22, 163, 74, 0.1)",
  color: "#16a34a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13.5px",
  fontWeight: "800",
  flexShrink: 0
};

const faqContentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

const faqTitleStyle = {
  fontSize: "14.5px",
  fontWeight: "750",
  color: "var(--text-primary)",
  margin: 0
};

const faqBodyStyle = {
  fontSize: "12.5px",
  color: "var(--text-secondary)",
  lineHeight: "1.4",
  margin: 0
};

const termsLinkStyle = {
  fontSize: "11px",
  color: "var(--text-secondary)",
  textAlign: "center",
  marginTop: "10px",
  fontWeight: "550"
};

const toastFeedbackStyle = {
  fontSize: "12px",
  color: "#16a34a",
  fontWeight: "700",
  marginTop: "6px",
  textAlign: "center"
};

// Skeletons styles
const skeletonCardStyle = {
  height: "180px",
  borderRadius: "24px",
  background: "var(--bg-secondary)",
  animation: "pulse 1.5s infinite"
};

const skeletonGridStyle = {
  display: "flex",
  gap: "16px"
};

const skeletonStatStyle = {
  flex: 1,
  height: "80px",
  borderRadius: "18px",
  background: "var(--bg-secondary)",
  animation: "pulse 1.5s infinite"
};

const skeletonListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const skeletonRowStyle = {
  height: "60px",
  borderRadius: "14px",
  background: "var(--bg-secondary)",
  animation: "pulse 1.5s infinite"
};

const errorWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 24px",
  textAlign: "center",
  gap: "12px"
};

const errorTitleStyle = {
  fontSize: "18px",
  fontWeight: "800",
  color: "var(--text-primary)",
  margin: 0
};

const errorSubtitleStyle = {
  fontSize: "14px",
  color: "var(--text-secondary)",
  margin: 0
};

const retryButtonStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: "12px",
  padding: "10px 24px",
  color: "var(--text-primary)",
  fontWeight: "750",
  cursor: "pointer",
  outline: "none"
};

const manualEntryCardStyle = {
  background: "var(--bg-card)",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid var(--border-color)",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)"
};

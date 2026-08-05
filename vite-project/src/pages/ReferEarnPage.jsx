import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SEO from "../components/common/SEO";
import { Copy, Share2, MessageCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function ReferEarnPage() {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, earned: 0 });
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const referralCode = user?.referralCode || "BUYTO123";
  const referralLink = `https://www.buyto.co.in/signup?ref=${referralCode}`;
  const shareMessage = `Join Buyto and get ₹50 in your Buyto Wallet after your first delivered order of ₹199 or more. Use my referral code ${referralCode} during signup. I'll earn ₹75 too. Download Buyto now! ${referralLink}`;

  // Fetch referrals data
  const fetchData = useCallback(async (targetPage = 1, append = false) => {
    if (!token) return;
    if (!append) setLoading(true);
    setError(false);

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/users/referrals?page=${targetPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setPage(data.pagination.page);
        if (append) {
          setHistory(prev => [...prev, ...data.history]);
        } else {
          setHistory(data.history);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error loading referrals:", err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

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
  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopyFeedback("Referral code copied!");
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopyFeedback("Referral link copied!");
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
      // Fallback
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
            <h3 style={cardHeaderStyle}>Your Referral Code</h3>
            <div style={codeRowStyle}>
              <span style={codeTextStyle}>{referralCode}</span>
              <button onClick={handleCopyCode} style={copyBtnStyle} aria-label="Copy Referral Code">
                <Copy size={18} /> Copy Code
              </button>
            </div>
            {copyFeedback && <div style={toastFeedbackStyle}>{copyFeedback}</div>}

            <div style={dividerStyle} />

            <h4 style={shareTitleStyle}>Share Referral Link</h4>
            <div style={shareGridStyle}>
              <button onClick={handleWhatsAppShare} style={shareIconBtnStyle} aria-label="Share on WhatsApp">
                <MessageCircle size={22} color="#25D366" />
                <span style={shareLabelStyle}>WhatsApp</span>
              </button>
              <button onClick={handleTelegramShare} style={shareIconBtnStyle} aria-label="Share on Telegram">
                <Share2 size={22} color="#0088cc" />
                <span style={shareLabelStyle}>Telegram</span>
              </button>
              <button onClick={handleNativeShare} style={shareIconBtnStyle} aria-label="Open Share Options">
                <Share2 size={22} color="var(--text-primary)" />
                <span style={shareLabelStyle}>Share Link</span>
              </button>
            </div>
            {shareFeedback && <div style={toastFeedbackStyle}>{shareFeedback}</div>}
          </div>

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

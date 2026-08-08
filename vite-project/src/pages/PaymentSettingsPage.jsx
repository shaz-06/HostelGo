import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

// --- INLINE SVG / BRAND COMPONENT ICON RENDERERS ---

const CardIcon = () => (
  <img 
    src="https://img.icons8.com/?size=100&id=aMTIdm5CdddP&format=png&color=000000" 
    alt="Card Icon"
    className="w-8 h-8 object-contain"
    style={{ maxWidth: "32px", maxHeight: "32px" }}
  />
);

const PluxeeIcon = () => (
  <div className="flex flex-col items-center justify-center font-sans tracking-tight">
    <span className="text-[11px] font-black text-[#1d1c3e] leading-none">pluxee</span>
  </div>
);

const GooglePayIcon = () => (
  <img 
    src="https://img.icons8.com/?size=100&id=am4ltuIYDpQ5&format=png&color=000000" 
    alt="Google Pay"
    className="w-8 h-8 object-contain"
    style={{ maxWidth: "32px", maxHeight: "32px" }}
  />
);

const PhonePeIcon = () => (
  <img 
    src="https://img.icons8.com/?size=100&id=OYtBxIlJwMGA&format=png&color=000000" 
    alt="PhonePe"
    className="w-8 h-8 object-contain"
    style={{ maxWidth: "32px", maxHeight: "32px" }}
  />
);

const SamsungPayIcon = () => (
  <div className="w-7 h-7 bg-[#034ea2] rounded-lg flex items-center justify-center text-white font-extrabold text-[9px] uppercase tracking-tighter">
    Pay
  </div>
);

const AmazonPayIcon = () => (
  <img 
    src="https://img.icons8.com/?size=100&id=2nt5XhjL7jBK&format=png&color=000000" 
    alt="Amazon Pay"
    className="w-8 h-8 object-contain"
    style={{ maxWidth: "32px", maxHeight: "32px" }}
  />
);

const MobikwikIcon = () => (
  <div className="w-7 h-7 bg-[#00529b] rounded-full flex items-center justify-center text-white font-black text-[11px] italic">
    M
  </div>
);

const LazyPayIcon = () => (
  <div className="w-7 h-6 flex items-center justify-center bg-gray-50 border border-gray-100 rounded">
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#f05a28]" fill="currentColor">
      <path d="M2 20h20L12 4z" />
    </svg>
  </div>
);

const NetbankingIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18M3 10h18M3 10l9-7 9 7M5 10v11M9 10v11M15 10v11M19 10v11" />
  </svg>
);

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Monitor scroll for sticky header divider shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 5);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate("/profile");
    }, 280); // native-feeling animation duration
  };

  return (
    <div 
      className="min-h-screen pb-16 font-sans select-none overflow-x-hidden"
      style={{
        background: "#F6F7FB",
        animation: isExiting 
          ? "slideOut 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards" 
          : "slideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        width: "100%",
        maxWidth: "100%",
        willChange: "transform"
      }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-6 py-3 rounded-full font-bold text-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] z-[99999] flex items-center gap-2"
          style={{ animation: "fadeIn 0.2s ease" }}
        >
          {toastMsg}
        </div>
      )}
      {/* Dynamic Keyframe Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideIn {
            from { transform: translate3d(100%, 0, 0); }
            to { transform: translate3d(0, 0, 0); }
          }
          @keyframes slideOut {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(100%, 0, 0); }
          }
          .custom-shadow {
            box-shadow: 0 1px 8px rgba(0, 0, 0, 0.03);
          }
          .custom-border {
            border: 1px solid rgba(0, 0, 0, 0.06);
          }
          .row-divider {
            border-bottom: 1.5px solid #F6F7FB;
          }
          .row-active:active {
            background-color: #FAFAFA;
            transform: scale(0.995);
          }
        `
      }} />

      {/* Replicated Sticky Header */}
      <header 
        className={`sticky top-0 z-50 flex items-center justify-between px-3 py-3.5 bg-white transition-shadow duration-200 ${
          scrolled ? "shadow-[0_4px_12px_rgba(0,0,0,0.04)] border-b border-gray-100" : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-800 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <span className="text-[17px] font-bold text-gray-900 tracking-tight">Payment settings</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-black text-gray-400 uppercase tracking-wide mr-2">
          <img 
            src="https://img.icons8.com/?size=100&id=YPXiLiXDHqyY&format=png&color=000000" 
            alt="Secure" 
            className="w-3.5 h-3.5 object-contain" 
          /> Secure
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-5">
        
        {/* ================= 1. CARDS ================= */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-extrabold text-gray-800 tracking-tight px-1">Cards</h2>
          <div className="bg-white rounded-[18px] custom-shadow border border-gray-50 overflow-hidden px-4">
            
            {/* Add Card Row */}
            <div 
              onClick={() => showToast("Coming Soon..")}
              className="flex items-center justify-between py-3.5 row-divider row-active cursor-pointer transition-all duration-150"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                  <CardIcon />
                </div>
                <span className="text-[14px] font-extrabold text-gray-800">Add credit or debit cards</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); showToast("Coming Soon.."); }}
                className="text-[13px] font-extrabold text-[#318616] hover:opacity-85 focus:outline-none pr-1"
              >
                ADD
              </button>
            </div>

            {/* Pluxee Row */}
            <div 
              onClick={() => showToast("Coming Soon..")}
              className="flex items-center gap-3.5 py-3.5 row-active cursor-pointer transition-all duration-150"
            >
              <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                <PluxeeIcon />
              </div>
              <span className="text-[14px] font-extrabold text-gray-800">Pluxee</span>
            </div>

          </div>
        </section>

        {/* ================= 2. UPI ================= */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-extrabold text-gray-800 tracking-tight px-1">UPI</h2>
          <div className="bg-white rounded-[18px] custom-shadow border border-gray-50 overflow-hidden px-4">
            
            {/* Google Pay */}
            <div className="flex items-center gap-3.5 py-3.5 row-divider row-active transition-all duration-150">
              <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                <GooglePayIcon />
              </div>
              <span className="text-[14px] font-extrabold text-gray-800">Google Pay UPI</span>
            </div>

            {/* PhonePe */}
            <div className="flex items-center gap-3.5 py-3.5 row-divider row-active transition-all duration-150">
              <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                <PhonePeIcon />
              </div>
              <span className="text-[14px] font-extrabold text-gray-800">PhonePe UPI</span>
            </div>

            {/* Samsung Pay */}
            <div 
              onClick={() => showToast("Coming Soon..")}
              className="flex items-center gap-3.5 py-3.5 row-active cursor-pointer transition-all duration-150"
            >
              <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                <SamsungPayIcon />
              </div>
              <span className="text-[14px] font-extrabold text-gray-800">Samsung Pay UPI</span>
            </div>

          </div>
        </section>

        {/* ================= 3. WALLETS ================= */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-extrabold text-gray-800 tracking-tight px-1">Wallets</h2>
          <div className="bg-white rounded-[18px] custom-shadow border border-gray-50 overflow-hidden px-4">
            
            {/* Amazon Pay */}
            <div 
              onClick={() => showToast("Coming Soon..")}
              className="flex items-center justify-between py-3.5 row-divider row-active cursor-pointer transition-all duration-150"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                  <AmazonPayIcon />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-gray-800 leading-tight">Amazon Pay Balance</span>
                  <span className="text-[11px] font-medium text-gray-400 mt-0.5">Link your Amazon Pay Balance wallet</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); showToast("Coming Soon.."); }}
                className="text-[13px] font-extrabold text-[#318616] hover:opacity-85 focus:outline-none pr-1"
              >
                ADD
              </button>
            </div>

            {/* Mobikwik */}
            <div 
              onClick={() => showToast("Coming Soon..")}
              className="flex items-center justify-between py-3.5 row-active cursor-pointer transition-all duration-150"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                  <MobikwikIcon />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-gray-800 leading-tight">Mobikwik</span>
                  <span className="text-[11px] font-medium text-gray-400 mt-0.5">Link your Mobikwik wallet</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); showToast("Coming Soon.."); }}
                className="text-[13px] font-extrabold text-[#318616] hover:opacity-85 focus:outline-none pr-1"
              >
                ADD
              </button>
            </div>

          </div>
        </section>

        {/* ================= 4. PAY LATER ================= */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-extrabold text-gray-800 tracking-tight px-1">Pay Later</h2>
          <div className="bg-white rounded-[18px] custom-shadow border border-gray-50 overflow-hidden px-4">
            
            {/* LazyPay */}
            <div 
              onClick={() => showToast("Coming Soon..")}
              className="flex items-center justify-between py-3.5 row-active cursor-pointer transition-all duration-150"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                  <LazyPayIcon />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-extrabold text-gray-800 leading-tight">LazyPay</span>
                  <span className="text-[11px] font-medium text-gray-400 mt-0.5">Link your LazyPay account</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); showToast("Coming Soon.."); }}
                className="text-[13px] font-extrabold text-[#318616] hover:opacity-85 focus:outline-none pr-1"
              >
                ADD
              </button>
            </div>

          </div>
        </section>

        {/* ================= 5. NETBANKING ================= */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[13px] font-extrabold text-gray-800 tracking-tight px-1">Netbanking</h2>
          <div className="bg-white rounded-[18px] custom-shadow border border-gray-50 overflow-hidden px-4">
            
            {/* Netbanking */}
            <div 
              onClick={() => showToast("Coming Soon..")}
              className="flex items-center justify-between py-3.5 row-active cursor-pointer transition-all duration-150"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl custom-border flex items-center justify-center bg-white">
                  <NetbankingIcon />
                </div>
                <span className="text-[14px] font-extrabold text-gray-800">Netbanking</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); showToast("Coming Soon.."); }}
                className="text-[13px] font-extrabold text-[#318616] hover:opacity-85 focus:outline-none pr-1"
              >
                ADD
              </button>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}

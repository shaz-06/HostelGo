import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Share2, StopCircle, UserCheck } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import SEO from "../components/common/SEO";

export default function ManageSharesPage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext) || { token: null };

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  const loadShares = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/address-share/shared-by-me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setShares(data.shares || []);
        }
      }
    } catch (err) {
      console.error("Error loading shared-by-me addresses:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleRevokeShare = async (shareId) => {
    if (!window.confirm("Are you sure you want to stop sharing this address? Recipient will lose access immediately.")) return;
    setRevokingId(shareId);
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/address-share/${shareId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Refresh active shares list
        loadShares();
      }
    } catch (err) {
      console.error("Error revoking address sharing:", err);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-[120px] font-sans relative overflow-x-hidden">
      <SEO title="Manage Shared Addresses" description="View and manage who has access to your shared addresses." />

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInFromRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-slide-in {
            animation: slideInFromRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `
      }} />

      {/* Sticky Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 z-30 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-gray-100 hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h1 className="text-[17px] font-black text-gray-800">Manage Shared Addresses</h1>
      </header>

      <main className="p-4 flex flex-col gap-5 max-w-md mx-auto animate-slide-in">
        {/* Banner Details */}
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-2">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-1">
            <Share2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h2 className="text-[15px] font-black text-gray-800">Active Shares</h2>
          <p className="text-[12px] font-bold text-gray-400 leading-relaxed">
            Here you can see all your saved addresses that are currently shared with other Buyto users. You can stop sharing at any time.
          </p>
        </div>

        {/* Shares list */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-wider px-1">
            Addresses Shared By Me ({shares.length})
          </h3>

          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin text-[#318616]" />
            </div>
          ) : shares.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 text-center text-gray-400 text-[13px] font-bold">
              You are not sharing any addresses right now.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {shares.map((share) => (
                <div 
                  key={share._id} 
                  className="bg-white rounded-[20px] p-5 border border-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <h4 className="text-[14px] font-extrabold text-gray-800 leading-tight">
                        {share.addressId?.label || "PG Address"}
                      </h4>
                      <p className="text-[11px] font-bold text-gray-400 truncate max-w-[220px]">
                        {share.addressId?.addressLine || "Address detail line"}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400 text-[12px] font-bold">
                        <UserCheck className="w-4 h-4 text-green-500" />
                        <span>
                          Shared with: <strong className="text-gray-700 font-extrabold">{share.sharedWithUserId?.name || "Buyto User"}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">
                        Phone: {share.sharedWithUserId?.phone}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRevokeShare(share._id)}
                      disabled={revokingId === share._id}
                      className="text-[12px] font-black text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors focus:outline-none flex-shrink-0"
                    >
                      {revokingId === share._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <StopCircle className="w-3.5 h-3.5" /> Stop Sharing
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

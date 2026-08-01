import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Send, XCircle, CheckCircle2, Phone, Search } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import SEO from "../components/common/SEO";

export default function RequestAddressPage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext) || { token: null };

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [requests, setRequests] = useState([]);

  // Load sent requests
  const loadRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/address-share/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Filter to requests sent by me
          setRequests(data.requests || []);
        }
      }
    } catch (err) {
      console.error("Error loading share requests:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Validation
  const tenDigitPhone = phone.replace(/\D/g, "").slice(-10);
  const isValidPhone = /^[6789]\d{9}$/.test(tenDigitPhone);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d+]/g, ""); // Allow only digits and + symbol
    setPhone(value);
    setError("");
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPhone) {
      setError("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`${window.API_BASE_URL}/api/address-share/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setPhone("");
        // Refresh sent requests
        loadRequests();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(data.message || "Failed to send address request.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this address request?")) return;
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/address-share/${requestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadRequests();
      }
    } catch (err) {
      console.error("Error cancelling request:", err);
    }
  };

  // Filter out pending and other outgoing requests
  const outgoingRequests = requests.filter(r => r.sharedWithUserId && typeof r.sharedWithUserId === "object" && String(r.sharedWithUserId._id) === String(requests[0]?.sharedWithUserId?._id || ""));

  return (
    <div className="min-h-screen bg-[#F6F7FB] pb-[120px] font-sans relative overflow-x-hidden">
      <SEO title="Request Address" description="Request a saved address securely from another Buyto user." />

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
        <h1 className="text-[17px] font-black text-gray-800">Request Address</h1>
      </header>

      <main className="p-4 flex flex-col gap-5 max-w-md mx-auto animate-slide-in">
        {/* Banner Explanation */}
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-2">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#318616] mb-1">
            <Send className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h2 className="text-[15px] font-black text-gray-800">Request a delivery address</h2>
          <p className="text-[12px] font-bold text-gray-400 leading-relaxed">
            Request a delivery address from another Buyto user. They'll receive your request and can choose which address to share with you.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleRequestSubmit} className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider px-1">
              Enter Phone Number or Search User
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9+]*"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[14px] font-bold text-gray-800 placeholder-gray-400 outline-none transition-all duration-150"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3 flex items-center gap-2.5 text-[12px] font-bold">
              <XCircle className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-100 text-[#318616] rounded-2xl p-3 flex items-center gap-2.5 text-[12px] font-bold">
              <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
              <span>Request sent successfully! Pending owner response.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isValidPhone || submitting}
            className={`w-full py-4 rounded-2xl text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all duration-150 shadow-md ${
              isValidPhone && !submitting
                ? "bg-[#318616] hover:bg-[#286f12] active:scale-98"
                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Request Address"
            )}
          </button>
        </form>

        {/* Pending Requests Outbox */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-wider px-1">
            Pending Requests ({requests.filter(r => r.status === "pending").length})
          </h3>

          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin text-[#318616]" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-[24px] p-8 border border-gray-100 text-center text-gray-400 text-[13px] font-bold">
              No recent address share requests.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((req) => {
                const isIncoming = String(req.ownerId?._id) === String(req.sharedWithUserId?._id); // dummy check, actually filter outgoing
                const targetUser = req.ownerId;
                const statusColors = {
                  pending: "bg-amber-50 text-amber-600 border-amber-100",
                  accepted: "bg-green-50 text-green-600 border-green-100",
                  rejected: "bg-red-50 text-red-600 border-red-100",
                  expired: "bg-gray-100 text-gray-500 border-gray-200"
                };

                return (
                  <div key={req._id} className="bg-white rounded-[20px] p-4 border border-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <h4 className="text-[14px] font-extrabold text-gray-800 truncate">
                        {targetUser?.name || "Buyto User"}
                      </h4>
                      <p className="text-[11px] font-bold text-gray-400">
                        {targetUser?.phone || "Phone number"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusColors[req.status] || "bg-gray-50 text-gray-500"}`}>
                          {req.status}
                        </span>
                        {req.status === "pending" && (
                          <span className="text-[10px] font-bold text-gray-300">
                            Expires in 24h
                          </span>
                        )}
                      </div>
                    </div>
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleCancelRequest(req._id)}
                        className="text-[12px] font-black text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors focus:outline-none"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

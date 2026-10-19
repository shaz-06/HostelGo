import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddressShareOverlay({
  activeNotification,
  setActiveNotification,
  handleRejectRequest,
  handleOpenShareOptions,
  showRespondModal,
  setShowRespondModal,
  handleAcceptRequest,
  myAddresses,
  setSelectedAddressToShare,
  selectedAddressToShare
}) {
  return (
    <>
      {/* Real-time In-App Notification Center Overlay */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
            className="fixed top-4 left-4 right-4 z-[200] max-w-sm mx-auto bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1 text-left">
              <h4 className="text-[14px] font-black text-gray-800 flex items-center gap-1.5">
                🔔 {activeNotification.title}
              </h4>
              <p className="text-[12px] font-bold text-gray-400 leading-normal">
                {activeNotification.message}
              </p>
            </div>
            {activeNotification.type === "request" ? (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleRejectRequest}
                  className="px-3.5 py-2 rounded-xl text-[12px] font-black text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={handleOpenShareOptions}
                  className="px-3.5 py-2 rounded-xl text-[12px] font-black text-white bg-[#318616] hover:bg-[#286f12] transition-colors"
                >
                  Share Address
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={() => setActiveNotification(null)}
                  className="px-3.5 py-2 rounded-xl text-[12px] font-black text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choose Address Modal for Sharing */}
      <AnimatePresence>
        {showRespondModal && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowRespondModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
              className="bg-white rounded-[28px] w-full max-w-sm p-6 shadow-2xl relative z-10 flex flex-col gap-4 text-center"
            >
              <h3 className="text-[18px] font-black text-gray-800 leading-tight">Choose Address</h3>
              <p className="text-[12px] font-bold text-gray-400">
                Select which of your saved addresses you want to share with {activeNotification?.senderName || "the requestor"}.
              </p>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto mt-2 text-left">
                {myAddresses.map(addr => (
                  <label
                    key={addr._id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 ${selectedAddressToShare === addr._id
                      ? "border-[#318616] bg-green-50/30"
                      : "border-gray-100 hover:border-gray-200"
                      }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[14px] font-extrabold text-gray-800 truncate">{addr.label || addr.addressType}</span>
                      <span className="text-[11px] font-bold text-gray-400 truncate max-w-[200px]">{addr.addressLine}</span>
                    </div>
                    <input
                      type="radio"
                      name="share_address"
                      checked={selectedAddressToShare === addr._id}
                      onChange={() => setSelectedAddressToShare(addr._id)}
                      className="accent-[#318616] w-4.5 h-4.5"
                    />
                  </label>
                ))}
                {myAddresses.length === 0 && (
                  <p className="text-[12px] text-gray-400 font-bold text-center py-4">No saved addresses to share.</p>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRespondModal(false)}
                  className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200/50 rounded-2xl text-[14px] font-black text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptRequest}
                  disabled={!selectedAddressToShare}
                  className="flex-1 py-3.5 bg-[#318616] hover:bg-[#286f12] rounded-2xl text-[14px] font-black text-white transition-colors"
                >
                  Share
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

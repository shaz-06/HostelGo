import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function SavedListsPage() {
  const navigate = useNavigate();
  const { token, isLoggedIn } = useContext(AuthContext);
  const [savedLists, setSavedLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Load Saved Lists
  const fetchLists = async () => {
    setLoading(true);
    // 1. Try backend if logged in
    if (isLoggedIn && token) {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/auth/shopping-lists", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSavedLists(data.savedLists);
            localStorage.setItem("buyto_saved_lists", JSON.stringify(data.savedLists));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch backend saved lists, falling back to local:", err);
      }
    }

    // 2. Fallback to localStorage
    const local = localStorage.getItem("buyto_saved_lists");
    if (local) {
      setSavedLists(JSON.parse(local));
    } else {
      setSavedLists([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLists();
  }, [token, isLoggedIn]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Delete List
  const handleDelete = async (e, listId) => {
    e.stopPropagation();
    const updatedLists = savedLists.filter(l => l._id !== listId && l.id !== listId);
    setSavedLists(updatedLists);
    localStorage.setItem("buyto_saved_lists", JSON.stringify(updatedLists));

    if (isLoggedIn && token) {
      try {
        await fetch(window.API_BASE_URL + `/api/auth/shopping-lists/${listId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to delete list from backend:", err);
      }
    }
    showToast("List deleted successfully!");
  };

  // Duplicate List
  const handleDuplicate = async (e, list) => {
    e.stopPropagation();
    const newName = `${list.name} (Copy)`;
    const newItems = list.items.map(item => ({ name: item.name, completed: item.completed }));

    if (isLoggedIn && token) {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/auth/shopping-lists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: newName, items: newItems })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSavedLists(data.savedLists);
            localStorage.setItem("buyto_saved_lists", JSON.stringify(data.savedLists));
            showToast("List duplicated successfully!");
            return;
          }
        }
      } catch (err) {
        console.error("Backend duplicate failed:", err);
      }
    }

    // Local fallback
    const tempId = String(Date.now());
    const duplicated = {
      _id: tempId,
      id: tempId,
      name: newName,
      items: newItems
    };
    const updatedLists = [...savedLists, duplicated];
    setSavedLists(updatedLists);
    localStorage.setItem("buyto_saved_lists", JSON.stringify(updatedLists));
    showToast("List duplicated successfully!");
  };

  // Open Rename Modal
  const openRenameModal = (e, list) => {
    e.stopPropagation();
    setSelectedList(list);
    setRenameValue(list.name);
    setShowRenameModal(true);
  };

  // Submit Rename
  const handleRename = async () => {
    if (!renameValue.trim()) return;
    const listId = selectedList._id || selectedList.id;

    const updatedLists = savedLists.map(l => {
      if ((l._id && l._id === listId) || (l.id && l.id === listId)) {
        return { ...l, name: renameValue.trim() };
      }
      return l;
    });
    setSavedLists(updatedLists);
    localStorage.setItem("buyto_saved_lists", JSON.stringify(updatedLists));

    if (isLoggedIn && token) {
      try {
        await fetch(window.API_BASE_URL + `/api/auth/shopping-lists/${listId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: renameValue.trim() })
        });
      } catch (err) {
        console.error("Backend rename failed:", err);
      }
    }

    setShowRenameModal(false);
    showToast("List renamed successfully!");
  };

  // Share List
  const handleShare = (e, list) => {
    e.stopPropagation();
    const itemsText = list.items.map(i => `• ${i.name}${i.completed ? " (Completed)" : ""}`).join("\n");
    const shareText = `🛒 *Buyto Shopping List: ${list.name}*\n\n${itemsText}\n\nCreated using Buyto Instant Delivery.`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      showToast("List copied to clipboard as text!");
    }).catch(err => {
      console.error("Failed to copy list text:", err);
    });
  };

  // Tap to Open List
  const handleListTap = (list) => {
    const listId = list._id || list.id;
    navigate(`/shopping-list?listId=${listId}`);
  };

  return (
    <div style={containerStyle}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={toastStyle}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header style={headerStyle}>
        <button onClick={() => navigate("/")} style={backBtnStyle}>
          ← Back
        </button>
        <h1 style={titleStyle}>❤️ Saved Lists</h1>
        <div style={{ width: "60px" }} />
      </header>

      {/* Content */}
      <main style={mainContentStyle}>
        {loading ? (
          <div style={centerTextStyle}>Loading your saved lists...</div>
        ) : savedLists.length === 0 ? (
          <div style={emptyStateStyle}>
            <span style={{ fontSize: "56px" }}>❤️</span>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: "16px 0 8px 0" }}>
              No Saved Lists Yet
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", maxWidth: "280px", margin: "0 auto 24px auto", lineHeight: "1.4" }}>
              Save your shopping lists to access them quickly or reuse them later.
            </p>
            <button onClick={() => navigate("/shopping-list")} style={createBtnStyle}>
              Create Shopping List
            </button>
          </div>
        ) : (
          <div style={listGridStyle}>
            {savedLists.map((list) => {
              const listId = list._id || list.id;
              const pendingCount = list.items.filter(i => !i.completed).length;
              return (
                <div
                  key={listId}
                  onClick={() => handleListTap(list)}
                  style={cardStyle}
                  className="hover-card"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={listNameStyle}>{list.name}</h3>
                      <p style={subtextStyle}>
                        {list.items.length} items • {pendingCount} pending
                      </p>
                    </div>
                    <span style={heartBadgeStyle}>❤️</span>
                  </div>

                  {/* Preview Items */}
                  <div style={previewListStyle}>
                    {list.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} style={previewItemRowStyle}>
                        <span style={dotStyle(item.completed)}>✓</span>
                        <span style={previewItemTextStyle(item.completed)}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                    {list.items.length > 3 && (
                      <div style={{ fontSize: "11px", color: "#64748b", paddingLeft: "16px", fontWeight: "600" }}>
                        + {list.items.length - 3} more items
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div style={actionsContainerStyle} onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => openRenameModal(e, list)} style={actionBtnStyle}>
                      ✏️ Rename
                    </button>
                    <button onClick={(e) => handleDuplicate(e, list)} style={actionBtnStyle}>
                      👥 Duplicate
                    </button>
                    <button onClick={(e) => handleShare(e, list)} style={actionBtnStyle}>
                      🔗 Share
                    </button>
                    <button onClick={(e) => handleDelete(e, listId)} style={deleteBtnStyle}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Rename Modal */}
      {showRenameModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>
              Rename Shopping List
            </h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              style={modalInputStyle}
              placeholder="Enter list name"
              autoFocus
            />
            <div style={modalActionsStyle}>
              <button onClick={() => setShowRenameModal(false)} style={modalCancelBtnStyle}>
                Cancel
              </button>
              <button onClick={handleRename} style={modalSaveBtnStyle}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.04) 15%, #ffffff 100%)",
  padding: "16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  background: "white",
  padding: "12px 16px",
  borderRadius: "20px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
};

const backBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
};

const titleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "900",
  color: "#1e293b",
  textAlign: "center",
};

const mainContentStyle = {
  maxWidth: "800px",
  margin: "0 auto",
};

const centerTextStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#64748b",
  fontWeight: "600",
};

const toastStyle = {
  position: "fixed",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#1e293b",
  color: "white",
  padding: "12px 24px",
  borderRadius: "12px",
  zIndex: 10000,
  fontSize: "13px",
  fontWeight: "700",
  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
  animation: "fadeIn 0.2s ease",
};

const emptyStateStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "48px 24px",
  textAlign: "center",
  boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
  border: "1px solid #f1f5f9",
  marginTop: "40px",
};

const createBtnStyle = {
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "12px 24px",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
};

const listGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "16px",
};

const cardStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.02)",
  border: "1px solid #f1f5f9",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  transition: "all 0.2s ease",
};

const listNameStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: "850",
  color: "#1e293b",
};

const subtextStyle = {
  margin: "4px 0 16px 0",
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "600",
};

const heartBadgeStyle = {
  fontSize: "18px",
};

const previewListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  background: "#f8fafc",
  padding: "12px",
  borderRadius: "16px",
  marginBottom: "16px",
};

const previewItemRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const dotStyle = (completed) => ({
  color: completed ? "#10b981" : "#94a3b8",
  fontSize: "13px",
  fontWeight: "800",
});

const previewItemTextStyle = (completed) => ({
  fontSize: "12px",
  color: completed ? "#94a3b8" : "#334155",
  textDecoration: completed ? "line-through" : "none",
  fontWeight: "600",
});

const actionsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  borderTop: "1px solid #f1f5f9",
  paddingTop: "12px",
};

const actionBtnStyle = {
  background: "#f1f5f9",
  border: "none",
  borderRadius: "8px",
  height: "32px",
  fontSize: "11px",
  color: "#475569",
  fontWeight: "700",
  cursor: "pointer",
  transition: "all 0.1s ease",
};

const deleteBtnStyle = {
  background: "#fef2f2",
  border: "none",
  borderRadius: "8px",
  height: "32px",
  fontSize: "11px",
  color: "#ef4444",
  fontWeight: "750",
  cursor: "pointer",
  transition: "all 0.1s ease",
};

// Modal styling
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100000,
  padding: "16px",
  backdropFilter: "blur(4px)",
};

const modalContentStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "24px",
  width: "100%",
  maxWidth: "340px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
  boxSizing: "border-box",
};

const modalInputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1.5px solid #cbd5e1",
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e293b",
  outline: "none",
  boxSizing: "border-box",
  marginBottom: "20px",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const modalCancelBtnStyle = {
  background: "#f1f5f9",
  border: "none",
  borderRadius: "12px",
  padding: "10px 18px",
  fontSize: "13px",
  fontWeight: "700",
  color: "#475569",
  cursor: "pointer",
};

const modalSaveBtnStyle = {
  background: "linear-gradient(135deg, #10b981, #059669)",
  border: "none",
  borderRadius: "12px",
  padding: "10px 18px",
  fontSize: "13px",
  fontWeight: "800",
  color: "white",
  cursor: "pointer",
};

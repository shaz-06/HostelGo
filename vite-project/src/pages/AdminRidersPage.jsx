import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function AdminRidersPage() {
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 1024;

  const page = {
    minHeight: "100vh",
    background: "#F9FAFB",
    color: "#111827",
    fontFamily: "'Outfit','Inter',sans-serif",
    padding: isMobile ? "16px 12px" : "24px 32px",
    boxSizing: "border-box",
    overflowX: "hidden"
  };

  const header = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    gap: isMobile ? "12px" : "18px",
    paddingBottom: 20,
    borderBottom: "1.5px solid #E5E7EB",
    marginBottom: 24 
  };

  const [riders, setRiders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedRiderId, setExpandedRiderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("All");
  const [stores, setStores] = useState([]);
  const [activeDropdownRiderId, setActiveDropdownRiderId] = useState(null);

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEditRider, setSelectedEditRider] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusRider, setSelectedStatusRider] = useState(null);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedStoreRider, setSelectedStoreRider] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedSuspendRider, setSelectedSuspendRider] = useState(null);

  const filteredRiders = riders.filter((rider) => {
    // 1. Soft-delete check: Inactive/Archived riders only show when filter is "Archived"
    if (statusFilter === "Archived") {
      if (rider.isActive !== false) return false;
    } else {
      if (rider.isActive === false) return false;
    }

    // 2. Status filters
    if (statusFilter !== "All" && statusFilter !== "Archived") {
      if (statusFilter === "Suspended" && !rider.isSuspended) return false;
      if (statusFilter !== "Suspended" && rider.isSuspended) return false;
      if (statusFilter === "Offline" && rider.isOnline) return false;
      if (statusFilter === "Available" && (!rider.isOnline || (rider.riderStatus && rider.riderStatus !== "Available"))) return false;
      if (statusFilter === "Assigned" && (!rider.isOnline || rider.riderStatus !== "Assigned")) return false;
      if (statusFilter === "Busy" && (!rider.isOnline || rider.riderStatus !== "Busy")) return false;
    }

    // 3. Store filter
    if (storeFilter !== "All" && rider.fulfillmentStoreId !== storeFilter) return false;

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (rider.name || "").toLowerCase().includes(q);
      const matchPhone = (rider.phone || "").toLowerCase().includes(q);
      const matchVehicle = (rider.vehicleNumber || "").toLowerCase().includes(q);
      const matchCode = (rider.riderCode || "").toLowerCase().includes(q);
      const matchLicense = (rider.driversLicense || "").toLowerCase().includes(q);
      const matchEmail = (rider.email || "").toLowerCase().includes(q);
      const matchEmergency = (rider.emergencyContact || "").toLowerCase().includes(q);

      if (!matchName && !matchPhone && !matchVehicle && !matchCode && !matchLicense && !matchEmail && !matchEmergency) {
        return false;
      }
    }

    return true;
  });

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/admin/riders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load riders");
      setRiders(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/admin/delivery-zones", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStores(data);
    } catch (err) {
      console.error("Failed to load stores:", err);
    }
  };

  useEffect(() => {
    fetchRiders();
    fetchStores();
  }, []);

  const toggleSuspend = async (rider, reason = "Other", notes = "") => {
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/riders/${rider._id}/suspend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isSuspended: !rider.isSuspended, reason, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update rider");
      setRiders((prev) => prev.map((item) => (item._id === data._id ? { ...item, ...data } : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRider = async (rider) => {
    if (rider.assignedOrder) {
      alert(`This rider is currently assigned to Order #${rider.assignedOrder.substring(rider.assignedOrder.length - 8).toUpperCase()}.\nComplete or reassign the order before deleting this rider.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to archive/delete rider ${rider.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/riders/${rider._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete rider");
      
      alert("✅ Rider Archived Successfully");
      fetchRiders();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const activeRidersList = riders.filter(r => r.isActive !== false);
  const totalRidersCount = activeRidersList.length;
  const onlineCount = activeRidersList.filter((rider) => rider.isOnline && !rider.isSuspended).length;
  const availableCount = activeRidersList.filter(r => r.isOnline && !r.isSuspended && (r.riderStatus === "Available" || !r.riderStatus)).length;
  const busyCount = activeRidersList.filter(r => r.isOnline && !r.isSuspended && r.riderStatus === "Busy").length;
  const offlineCount = activeRidersList.filter(r => !r.isOnline && !r.isSuspended).length;
  const suspendedCount = activeRidersList.filter(r => r.isSuspended).length;
  const archivedCount = riders.filter(r => r.isActive === false).length;

  const totalDeliveries = riders.reduce((sum, rider) => sum + (rider.totalDeliveries || 0), 0);
  const totalEarnings = riders.reduce((sum, rider) => sum + (rider.totalEarnings || 0), 0);

  const [showAddModal, setShowAddModal] = useState(false);

  if (loading) {
    return <div style={loadingStyle}>Loading rider fleet...</div>;
  }

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <button onClick={() => navigate("/admin")} style={backBtnStyle}>← Dashboard</button>
          <h1 style={titleStyle}>Riders Management</h1>
        </div>
        <div>
          <button 
            onClick={() => setShowAddModal(true)} 
            style={{
              background: "#318616",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "13px",
              fontWeight: "800",
              padding: "10px 16px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)",
              transition: "all 0.15s ease",
              marginRight: "8px"
            }}
          >
            + Add Rider
          </button>
          <button 
            onClick={fetchRiders} 
            style={{
              background: "white",
              border: "1.5px solid #d1d5db",
              borderRadius: "12px",
              color: "#374151",
              fontSize: "13px",
              fontWeight: "800",
              padding: "9px 16px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Refresh Riders
          </button>
        </div>
      </header>

      {error && <div style={errorStyle}>⚠️ {error}</div>}

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px",
        marginBottom: "20px"
      }}>
        <Stat label="Total Active" value={totalRidersCount} accent="#FF4D4F" />
        <Stat label="🟢 Available" value={availableCount} accent="#22C55E" />
        <Stat label="🔵 Busy" value={busyCount} accent="#3B82F6" />
        <Stat label="⚪ Offline" value={offlineCount} accent="#9CA3AF" />
        <Stat label="🔴 Suspended" value={suspendedCount} accent="#EF4444" />
        <Stat label="Archived" value={archivedCount} accent="#6B7280" />
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px", marginTop: "16px" }}>
        {[
          { id: "All", label: "All Active" },
          { id: "Available", label: "🟢 Available" },
          { id: "Assigned", label: "🟡 Assigned" },
          { id: "Busy", label: "🔵 Busy" },
          { id: "Offline", label: "🔴 Offline" },
          { id: "Suspended", label: "❌ Suspended" },
          { id: "Archived", label: "📂 Archived" }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id)}
            style={{
              padding: "6px 12px",
              borderRadius: "10px",
              border: "1.5px solid #e5e7eb",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
              background: statusFilter === filter.id ? "#3b82f6" : "white",
              color: statusFilter === filter.id ? "white" : "#4b5563",
              borderColor: statusFilter === filter.id ? "#3b82f6" : "#e5e7eb",
              transition: "all 0.15s ease"
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by Name, Code (e.g. BUY-R0001), Phone, License, Vehicle, Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1.5px solid #e5e7eb",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: "600",
            outline: "none"
          }}
        />
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            border: "1.5px solid #e5e7eb",
            borderRadius: "14px",
            fontSize: "13px",
            fontWeight: "800",
            color: "#374151",
            outline: "none",
            background: "white"
          }}
        >
          <option value="All">All Stores</option>
          {stores.map(store => (
            <option key={store._id} value={store._id}>{store.name}</option>
          ))}
        </select>
      </div>

      <main style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Rider</th>
              <th style={thStyle}>Vehicle</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Assigned Order</th>
              <th style={thStyle}>Deliveries</th>
              <th style={thStyle}>Earnings</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRiders.map((rider) => (
              <React.Fragment key={rider._id}>
                <tr style={trStyle}>
                  <td 
                    style={{ ...tdStyle, cursor: "pointer" }}
                    onClick={() => setExpandedRiderId(expandedRiderId === rider._id ? null : rider._id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "10px", color: "#6b7280" }}>
                        {expandedRiderId === rider._id ? "▼" : "▶"}
                      </span>
                      <div>
                        <strong style={{ color: "#111827", fontSize: "14px", fontWeight: "800" }}>
                          {rider.riderCode ? `[${rider.riderCode}] ` : ""}{rider.name}
                        </strong>
                        <span style={subTextStyle}>{rider.phone} • {rider.email}</span>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>{rider.vehicleType || "Not set"}</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(rider)}>
                      {rider.isSuspended ? "Suspended" : !rider.isOnline ? "Offline" : (rider.riderStatus || "Available")}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {rider.assignedOrder ? (
                      <a
                        href={`/admin/orders?search=${rider.assignedOrder}`}
                        style={{
                          color: "#3b82f6",
                          textDecoration: "underline",
                          fontWeight: "700",
                          fontFamily: "monospace"
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/admin/orders`, { state: { highlightOrderId: rider.assignedOrder } });
                        }}
                      >
                        #{rider.assignedOrder.substring(rider.assignedOrder.length - 8).toUpperCase()}
                      </a>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>{rider.totalDeliveries || 0}</td>
                  <td style={tdStyle}>{money(rider.totalEarnings)}</td>
                  <td style={{ ...tdStyle, position: "relative" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button 
                        onClick={() => setExpandedRiderId(expandedRiderId === rider._id ? null : rider._id)} 
                        style={{
                          border: "1.5px solid #d1d5db",
                          borderRadius: 10,
                          padding: "6px 12px",
                          background: "white",
                          cursor: "pointer",
                          fontWeight: "800",
                          fontSize: "12px",
                          color: "#374151"
                        }}
                      >
                        Assign 🛵
                      </button>
                      
                      <button
                        onClick={() => setActiveDropdownRiderId(activeDropdownRiderId === rider._id ? null : rider._id)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "20px",
                          cursor: "pointer",
                          padding: "4px 8px",
                          color: "#4b5563"
                        }}
                      >
                        ⋮
                      </button>

                      {activeDropdownRiderId === rider._id && (
                        <div style={{
                          position: "absolute",
                          right: "16px",
                          top: "40px",
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                          zIndex: 50,
                          display: "flex",
                          flexDirection: "column",
                          minWidth: "140px",
                          overflow: "hidden"
                        }}>
                          <button
                            onClick={() => {
                              setSelectedEditRider(rider);
                              setShowEditModal(true);
                              setActiveDropdownRiderId(null);
                            }}
                            style={{
                              padding: "10px 14px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              color: "#374151",
                              width: "100%",
                              transition: "background 0.15s ease"
                            }}
                          >
                            ✏️ Edit Rider
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStatusRider(rider);
                              setShowStatusModal(true);
                              setActiveDropdownRiderId(null);
                            }}
                            style={{
                              padding: "10px 14px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              color: "#374151",
                              width: "100%",
                              transition: "background 0.15s ease"
                            }}
                          >
                            🔄 Change Status
                          </button>
                          <button
                            onClick={() => {
                              if (rider.riderStatus === "Busy") {
                                alert("This rider has an active delivery. Complete or reassign the order before changing the fulfillment store.");
                              } else {
                                setSelectedStoreRider(rider);
                                setShowStoreModal(true);
                              }
                              setActiveDropdownRiderId(null);
                            }}
                            style={{
                              padding: "10px 14px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              color: "#374151",
                              width: "100%",
                              transition: "background 0.15s ease"
                            }}
                          >
                            📍 Change Store
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSuspendRider(rider);
                              setShowSuspendModal(true);
                              setActiveDropdownRiderId(null);
                            }}
                            style={{
                              padding: "10px 14px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              color: "#374151",
                              width: "100%",
                              transition: "background 0.15s ease"
                            }}
                          >
                            🚫 Suspend Rider
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteRider(rider);
                              setActiveDropdownRiderId(null);
                            }}
                            style={{
                              padding: "10px 14px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              color: "#ef4444",
                              width: "100%",
                              transition: "background 0.15s ease"
                            }}
                          >
                            🗑 Delete Rider
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRiderId === rider._id && (
                  <tr style={{ background: "#f9fafb" }}>
                    <td colSpan={7} style={{ padding: "16px", borderBottom: "1.5px solid #E5E7EB" }}>
                      <RiderAssignmentForm 
                        rider={rider} 
                        onSuccess={() => {
                          fetchRiders();
                          setExpandedRiderId(null);
                        }} 
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredRiders.length === 0 && <div style={emptyStyle}>No riders match the selected filter.</div>}
      </main>

      {/* Add Rider Modal */}
      {showAddModal && (
        <RiderFormModal
          title="Onboard New Rider"
          stores={stores}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchRiders();
          }}
        />
      )}

      {/* Edit Rider Modal */}
      {showEditModal && selectedEditRider && (
        <RiderFormModal
          title="Edit Rider Details"
          rider={selectedEditRider}
          stores={stores}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEditRider(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedEditRider(null);
            fetchRiders();
          }}
        />
      )}

      {/* Change Status Modal */}
      {showStatusModal && selectedStatusRider && (
        <StatusModalComponent
          rider={selectedStatusRider}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedStatusRider(null);
          }}
          onSuccess={() => {
            setShowStatusModal(false);
            setSelectedStatusRider(null);
            fetchRiders();
          }}
        />
      )}

      {/* Change Store Modal */}
      {showStoreModal && selectedStoreRider && (
        <StoreModalComponent
          rider={selectedStoreRider}
          stores={stores}
          onClose={() => {
            setShowStoreModal(false);
            setSelectedStoreRider(null);
          }}
          onSuccess={() => {
            setShowStoreModal(false);
            setSelectedStoreRider(null);
            fetchRiders();
          }}
        />
      )}

      {/* Suspend Rider Modal */}
      {showSuspendModal && selectedSuspendRider && (
        <SuspendModalComponent
          rider={selectedSuspendRider}
          onClose={() => {
            setShowSuspendModal(false);
            setSelectedSuspendRider(null);
          }}
          onSuccess={() => {
            setShowSuspendModal(false);
            setSelectedSuspendRider(null);
            fetchRiders();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <article style={{ ...statStyle, borderTop: `4px solid ${accent}` }}>
      <span style={statLabelStyle}>{label}</span>
      <strong style={statValueStyle}>{value}</strong>
    </article>
  );
}

const loadingStyle = { 
  minHeight: "100vh", 
  background: "#F9FAFB", 
  color: "#6B7280", 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  fontFamily: "'Outfit','Inter',sans-serif", 
  fontWeight: 800 
};

const pageStyle = { 
  minHeight: "100vh", 
  background: "#F9FAFB", 
  color: "#111827", 
  fontFamily: "'Outfit','Inter',sans-serif", 
  padding: "24px 32px", 
  boxSizing: "border-box" 
};

const headerStyle = { 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center", 
  gap: 18, 
  paddingBottom: 20, 
  borderBottom: "1.5px solid #E5E7EB", 
  marginBottom: 24 
};

const backBtnStyle = { 
  background: "#FFFFFF", 
  border: "1.5px solid #E5E7EB", 
  borderRadius: "12px", 
  color: "#374151", 
  fontSize: "13px", 
  fontWeight: "700", 
  padding: "8px 14px", 
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
  transition: "all 0.15s ease" 
};

const titleStyle = { 
  fontSize: 26, 
  fontWeight: "850", 
  margin: "14px 0 0", 
  letterSpacing: "-0.5px" 
};

const refreshBtnStyle = { 
  background: "#FF4D4F", 
  border: "none", 
  borderRadius: "12px", 
  color: "white", 
  fontSize: "13px", 
  fontWeight: "800", 
  padding: "10px 16px", 
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
  transition: "all 0.15s ease" 
};

const errorStyle = { 
  background: "#FEE2E2", 
  border: "1px solid rgba(239, 68, 68, 0.2)", 
  color: "#B91C1C", 
  borderRadius: "14px", 
  padding: "12px 16px", 
  fontSize: "14px", 
  fontWeight: "750",
  marginBottom: 18 
};

const statsGridStyle = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", 
  gap: 16, 
  marginBottom: 22 
};

const statStyle = { 
  background: "#FFFFFF", 
  border: "1.5px solid #E5E7EB", 
  borderRadius: 20, 
  padding: 18, 
  display: "flex", 
  flexDirection: "column", 
  gap: 6,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)" 
};

const statLabelStyle = { 
  color: "#6B7280", 
  fontSize: 12, 
  fontWeight: "800", 
  textTransform: "uppercase",
  letterSpacing: "0.5px" 
};

const statValueStyle = { 
  color: "#111827", 
  fontSize: 26,
  fontWeight: "900" 
};

const tableWrapStyle = { 
  background: "#FFFFFF", 
  border: "1.5px solid #E5E7EB", 
  borderRadius: 24, 
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
  overflowX: "auto" 
};

const tableStyle = { 
  width: "100%", 
  borderCollapse: "collapse", 
  minWidth: 820 
};

const thStyle = { 
  textAlign: "left", 
  padding: "14px 16px", 
  color: "#6B7280", 
  fontSize: 11, 
  textTransform: "uppercase", 
  borderBottom: "1.5px solid #E5E7EB",
  fontWeight: "800" 
};

const trStyle = { 
  borderBottom: "1px solid #F3F4F6",
  transition: "background 0.15s ease" 
};

const tdStyle = { 
  padding: "16px", 
  color: "#374151", 
  fontSize: 13, 
  fontWeight: 700 
};

const subTextStyle = { 
  display: "block", 
  color: "#6B7280", 
  marginTop: 4, 
  fontSize: 12,
  fontWeight: 500 
};

const statusBadgeStyle = (rider) => {
  let color = "#6B7280";
  let background = "#F3F4F6";
  if (rider.isSuspended) {
    color = "#EF4444";
    background = "#FEF2F2";
  } else if (!rider.isOnline) {
    color = "#6B7280";
    background = "#F3F4F6";
  } else {
    const status = rider.riderStatus || "Available";
    if (status === "Available" || status === "Delivered") {
      color = "#10B981";
      background = "#F0FDF4";
    } else if (status === "Assigned") {
      color = "#D97706";
      background = "#FEF3C7";
    } else if (status === "Busy") {
      color = "#2563EB";
      background = "#EFF6FF";
    }
  }
  return {
    color,
    background,
    border: `1.5px solid ${color}26`,
    borderRadius: 999, 
    padding: "5px 12px", 
    fontWeight: 800,
    fontSize: "11px",
    textTransform: "uppercase",
    display: "inline-block" 
  };
};

const actionBtnStyle = (suspended) => ({ 
  border: "none", 
  borderRadius: 10, 
  padding: "8px 14px", 
  cursor: "pointer", 
  fontWeight: "800", 
  background: suspended ? "#10B981" : "#EF4444", 
  color: "white",
  boxShadow: `0 4px 10px ${suspended ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
  transition: "all 0.15s ease",
  fontSize: "12px"
});

const emptyStyle = { 
  padding: 28, 
  color: "#9CA3AF", 
  textAlign: "center", 
  fontWeight: 700 
};

function RiderAssignmentForm({ rider, onSuccess }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reassignReason, setReassignReason] = useState("Rider unavailable");

  // Debounced search for suggestions
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoadingSuggestions(true);
      setError("");
      try {
        const token = localStorage.getItem("buyto_token");
        const res = await fetch(window.API_BASE_URL + `/api/admin/orders/search-suggestions?query=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load suggestions");
        setSuggestions(data);
      } catch (err) {
        console.error("Suggestions fetch error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelectSuggestion = (orderItem) => {
    setSelectedOrder(orderItem);
    setQuery(orderItem.orderId);
    setSuggestions([]);
  };

  const handleAssignClick = (e) => {
    e.preventDefault();
    if (!selectedOrder) {
      setError("Please select an order from the search suggestions.");
      return;
    }
    // Check if duplicate active assignment:
    const riderHasActive = !!rider.assignedOrder;
    const orderHasRider = selectedOrder.orderStatus === "Rider Assigned";

    if (riderHasActive || orderHasRider) {
      setShowConfirmModal(true);
    } else {
      executeAssignment();
    }
  };

  const executeAssignment = async () => {
    setIsProcessing(true);
    setError("");
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/riders/${rider._id}/assign-order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderNumber: selectedOrder.orderId,
          reason: reassignReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign order");

      setSuccessMsg(`🎉 Rider Assigned Successfully!\n${rider.name} → Order #${selectedOrder.shortId}`);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div style={{ background: "white", padding: "16px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "800", color: "#374151" }}>
        Assign Active Order to {rider.name}
      </h3>

      {error && <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: "750", marginBottom: "8px" }}>⚠️ {error}</div>}
      {successMsg && <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "800", marginBottom: "8px", whiteSpace: "pre-line" }}>{successMsg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Left Side: Order Search & Suggestions */}
        <div style={{ position: "relative" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#6b7280", marginBottom: "4px" }}>
            SEARCH ORDER NUMBER / CUSTOMER / PHONE
          </label>
          <input
            type="text"
            placeholder="Type ID, suffix, name or phone..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedOrder && e.target.value !== selectedOrder.orderId) {
                setSelectedOrder(null);
              }
            }}
            disabled={isProcessing}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              border: "1.5px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              outline: "none"
            }}
          />
          {loadingSuggestions && (
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Searching active orders...</div>
          )}

          {suggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "white",
              border: "1.5px solid #e5e7eb",
              borderRadius: "10px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              zIndex: 10,
              maxHeight: "200px",
              overflowY: "auto",
              marginTop: "4px"
            }}>
              {suggestions.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelectSuggestion(item)}
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "800", fontSize: "12px", color: "#1f2937" }}>
                      #{item.shortId} ({item.orderStatus})
                    </span>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: "800",
                      background: item.priority === "High Priority" ? "#fee2e2" : "#f3f4f6",
                      color: item.priority === "High Priority" ? "#ef4444" : "#4b5563",
                      padding: "2px 6px",
                      borderRadius: "6px"
                    }}>
                      {item.priority === "High Priority" ? "🔥 High Priority" : "Standard"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#4b5563" }}>
                    <span>{item.customerName} ({item.customerPhone})</span>
                    <span>Waiting: {item.waitingMinutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedOrder && (
            <div style={{
              marginTop: "12px",
              padding: "10px",
              background: "#eff6ff",
              borderRadius: "10px",
              border: "1px solid #bfdbfe",
              fontSize: "12px",
              color: "#1e3a8a"
            }}>
              <strong style={{ display: "block", marginBottom: "4px", fontSize: "13px" }}>Order Information</strong>
              <div>Customer: {selectedOrder.customerName}</div>
              <div>Address: {selectedOrder.deliveryAddress}</div>
              <div>Store: {selectedOrder.fulfillmentStoreName}</div>
              <div>Status: {selectedOrder.orderStatus}</div>
              <div>ETA: {selectedOrder.eta}</div>
            </div>
          )}
        </div>

        {/* Right Side: Rider details (Read-only) */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#6b7280", marginBottom: "4px" }}>
            ASSIGNED TO RIDER (READ-ONLY)
          </label>
          <div style={{ padding: "10px", background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "10px", fontSize: "13px" }}>
            <div style={{ marginBottom: "6px" }}><strong>Rider Name:</strong> {rider.name}</div>
            <div style={{ marginBottom: "6px" }}><strong>Vehicle Number:</strong> {rider.vehicleNumber || "KA 03 JM 1234"}</div>
            <div style={{ marginBottom: "6px" }}><strong>Phone:</strong> {rider.phone}</div>
            <div><strong>Fulfillment Store:</strong> {rider.fulfillmentStoreName || "Default HQ"}</div>
          </div>

          <button
            onClick={handleAssignClick}
            disabled={isProcessing || !selectedOrder}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "10px",
              background: isProcessing || !selectedOrder ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "800",
              cursor: isProcessing || !selectedOrder ? "not-allowed" : "pointer",
              transition: "background 0.15s ease"
            }}
          >
            {isProcessing ? "Processing Assignment..." : "Assign Order"}
          </button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "20px",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
            textAlign: "center"
          }}>
            <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>⚠️</span>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "800", color: "#111827" }}>
              Reassign Rider
            </h4>
            <p style={{ fontSize: "13px", color: "#4b5563", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              <strong>{rider.name}</strong> or the selected order is already linked to another active dispatch.
              Do you want to proceed with reassignment?
            </p>

            <div style={{ textAlign: "left", marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#6b7280", marginBottom: "4px" }}>
                REASSIGNMENT REASON
              </label>
              <select
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1.5px solid #e5e7eb",
                  fontSize: "13px",
                  fontWeight: "600",
                  outline: "none"
                }}
              >
                <option value="Rider unavailable">Rider unavailable</option>
                <option value="Vehicle issue">Vehicle issue</option>
                <option value="Shift ended">Shift ended</option>
                <option value="Customer request">Customer request</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: "10px 16px",
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                  color: "#4b5563"
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeAssignment}
                style={{
                  padding: "10px 16px",
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "800",
                  cursor: "pointer",
                  color: "white"
                }}
              >
                Reassign Rider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RiderFormModal({ title, rider, stores, onClose, onSuccess }) {
  const [name, setName] = useState(rider ? rider.name : "");
  const [phone, setPhone] = useState(rider ? rider.phone : "");
  const [email, setEmail] = useState(rider ? rider.email || "" : "");
  const [vehicleType, setVehicleType] = useState(rider ? rider.vehicleType || "Bike" : "Bike");
  const [vehicleNumber, setVehicleNumber] = useState(rider ? rider.vehicleNumber : "");
  const [fulfillmentStoreId, setFulfillmentStoreId] = useState(rider ? rider.fulfillmentStoreId : "");
  const [profileImage, setProfileImage] = useState(rider ? rider.profileImage || "" : "");
  const [driversLicense, setDriversLicense] = useState(rider ? rider.driversLicense || "" : "");
  const [emergencyContact, setEmergencyContact] = useState(rider ? rider.emergencyContact || "" : "");
  const [notes, setNotes] = useState(rider ? rider.notes || "" : "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !vehicleNumber || (!rider && !fulfillmentStoreId)) {
      setError("Please fill in all required fields marked with *");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name,
      phone,
      email,
      vehicleType,
      vehicleNumber,
      driversLicense,
      emergencyContact,
      notes,
      profileImage
    };

    if (!rider) {
      const selectedStore = stores.find(s => s._id === fulfillmentStoreId);
      payload.fulfillmentStoreId = fulfillmentStoreId;
      payload.fulfillmentStoreName = selectedStore ? selectedStore.name : "";
    }

    try {
      const token = localStorage.getItem("buyto_token");
      const url = rider
        ? window.API_BASE_URL + `/api/admin/riders/${rider._id}`
        : window.API_BASE_URL + "/api/admin/riders";
      const method = rider ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Backend route not found. ${method} /api/admin/riders returned ${res.status}.`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save rider");

      alert(rider ? "✅ Rider updated successfully!" : "✅ Rider added successfully!");
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalBackdropStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "800" }}>{title}</h3>
        {error && <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: "800", marginBottom: "12px" }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>FULL NAME *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>PHONE NUMBER *</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>VEHICLE TYPE *</label>
              <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={inputStyle}>
                <option value="Bike">Bike</option>
                <option value="Scooter">Scooter</option>
                <option value="EV Scooter">EV Scooter</option>
                <option value="Bicycle">Bicycle</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>VEHICLE NUMBER *</label>
              <input type="text" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} required placeholder="e.g. KA03AB1234" style={inputStyle} />
            </div>
            {!rider && (
              <div>
                <label style={labelStyle}>FULFILLMENT STORE *</label>
                <select value={fulfillmentStoreId} onChange={e => setFulfillmentStoreId(e.target.value)} required style={inputStyle}>
                  <option value="">Select Store</option>
                  {stores.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>DRIVER'S LICENSE NUMBER</label>
              <input type="text" value={driversLicense} onChange={e => setDriversLicense(e.target.value)} placeholder="License Code" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>EMERGENCY CONTACT</label>
              <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="Emergency Contact Name/Number" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>PROFILE PHOTO</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: "12px" }} />
              {profileImage && (
                <img src={profileImage} alt="Preview" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>NOTES / REMARKS</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional rider notes..." style={{ ...inputStyle, height: "60px", resize: "none" }} />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="button" onClick={onClose} disabled={loading} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={confirmBtnStyle}>
              {loading ? "Saving..." : rider ? "Update Rider" : "Create Rider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusModalComponent({ rider, onClose, onSuccess }) {
  const [riderStatus, setRiderStatus] = useState(rider.riderStatus || "Available");
  const [isOnline, setIsOnline] = useState(rider.isOnline);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/riders/${rider._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ riderStatus, isOnline })
      });
      if (!res.ok) throw new Error("Failed to update status");
      alert("✅ Status updated successfully!");
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalBackdropStyle}>
      <div style={{ ...modalContentStyle, maxWidth: "340px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800" }}>Change Status for {rider.name}</h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
          <div>
            <label style={labelStyle}>RIDER DISPATCH STATUS</label>
            <select value={riderStatus} onChange={e => setRiderStatus(e.target.value)} style={inputStyle}>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Busy">Busy</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>ONLINE STATE</label>
            <select value={isOnline ? "true" : "false"} onChange={e => setIsOnline(e.target.value === "true")} style={inputStyle}>
              <option value="true">🟢 Online</option>
              <option value="false">🔴 Offline</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={confirmBtnStyle}>{loading ? "Updating..." : "Update Status"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StoreModalComponent({ rider, stores, onClose, onSuccess }) {
  const [storeId, setStoreId] = useState(rider.fulfillmentStoreId || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeId) return;
    setLoading(true);
    try {
      const selected = stores.find(s => s._id === storeId);
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/riders/${rider._id}/store`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fulfillmentStoreId: storeId,
          fulfillmentStoreName: selected ? selected.name : ""
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update store");
      }
      alert("✅ Fulfillment store changed successfully!");
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalBackdropStyle}>
      <div style={{ ...modalContentStyle, maxWidth: "340px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800" }}>Transfer Store for {rider.name}</h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
          <div>
            <label style={labelStyle}>ASSIGNED FULFILLMENT STORE</label>
            <select value={storeId} onChange={e => setStoreId(e.target.value)} required style={inputStyle}>
              <option value="">Select Store</option>
              {stores.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={confirmBtnStyle}>{loading ? "Transferring..." : "Change Store"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SuspendModalComponent({ rider, onClose, onSuccess }) {
  const [reason, setReason] = useState("Misconduct");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/riders/${rider._id}/suspend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isSuspended: !rider.isSuspended,
          reason,
          notes
        })
      });
      if (!res.ok) throw new Error("Failed to update suspension status");
      alert(rider.isSuspended ? "✅ Suspension lifted successfully!" : "✅ Rider suspended successfully!");
      onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalBackdropStyle}>
      <div style={{ ...modalContentStyle, maxWidth: "340px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800" }}>
          {rider.isSuspended ? "Lift Suspension" : "Suspend Rider"}
        </h3>
        <p style={{ fontSize: "12px", color: "#4b5563", marginBottom: "16px" }}>
          Rider: <strong>{rider.name}</strong> ({rider.riderCode})
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
          {!rider.isSuspended && (
            <>
              <div>
                <label style={labelStyle}>SUSPENSION REASON</label>
                <select value={reason} onChange={e => setReason(e.target.value)} style={inputStyle}>
                  <option value="Misconduct">Misconduct</option>
                  <option value="Leave">Leave</option>
                  <option value="Vehicle Issue">Vehicle Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>ADDITIONAL REMARKS</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Audit logs notes..." style={{ ...inputStyle, height: "60px", resize: "none" }} />
              </div>
            </>
          )}

          {rider.isSuspended && (
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
              Are you sure you want to lift this suspension? The rider will return to active status.
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              ...confirmBtnStyle,
              background: rider.isSuspended ? "#10b981" : "#ef4444"
            }}>
              {loading ? "Processing..." : rider.isSuspended ? "Lift Suspension" : "Suspend"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999
};

const modalContentStyle = {
  background: "white",
  padding: "24px",
  borderRadius: "20px",
  maxWidth: "520px",
  width: "90%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
  textAlign: "center",
  fontFamily: "'Outfit','Inter',sans-serif"
};

const labelStyle = {
  display: "block",
  fontSize: "10px",
  fontWeight: "800",
  color: "#6b7280",
  marginBottom: "4px",
  letterSpacing: "0.5px"
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 12px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: "600",
  outline: "none"
};

const cancelBtnStyle = {
  padding: "8px 16px",
  background: "#f3f4f6",
  border: "none",
  borderRadius: "10px",
  fontWeight: "800",
  cursor: "pointer",
  color: "#4b5563",
  fontSize: "12px"
};

const confirmBtnStyle = {
  padding: "8px 16px",
  background: "#318616",
  border: "none",
  borderRadius: "10px",
  fontWeight: "800",
  cursor: "pointer",
  color: "white",
  fontSize: "12px"
};
import React, { useEffect, useMemo, useState } from "react";

export default function UserManagement({ isMobile = false }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const API = window.API_BASE_URL;

  const getToken = () => localStorage.getItem("buyto_token");

  const authHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  // ============================================================
  // FETCH USERS
  // ============================================================

  const fetchUsers = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const query = params.toString();

      const response = await fetch(
        `${API}/api/admin/users${query ? `?${query}` : ""}`,
        {
          headers: authHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load users");
      }

      const userList =
        data?.users || data?.data || (Array.isArray(data) ? data : []);

      setUsers(userList);
    } catch (err) {
      console.error("User Management fetch error:", err);
      setError(err.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // ============================================================
  // USER STATUS HELPERS
  // ============================================================

  const getUserStatus = (user) => {
    if (user?.deletedAt) {
      return "deleted";
    }

    if (user?.isSuspended) {
      return "suspended";
    }

    if (user?.isActive === false) {
      return "inactive";
    }

    return "active";
  };

  const getStatusLabel = (user) => {
    const status = getUserStatus(user);

    switch (status) {
      case "active":
        return "Active";
      case "suspended":
        return "Suspended";
      case "inactive":
        return "Inactive";
      case "deleted":
        return "Deleted";
      default:
        return "Unknown";
    }
  };

  const getStatusStyle = (user) => {
    const status = getUserStatus(user);

    if (status === "active") {
      return {
        color: "#166534",
        background: "#DCFCE7",
      };
    }

    if (status === "suspended") {
      return {
        color: "#991B1B",
        background: "#FEE2E2",
      };
    }

    if (status === "inactive") {
      return {
        color: "#92400E",
        background: "#FEF3C7",
      };
    }

    return {
      color: "#475569",
      background: "#E2E8F0",
    };
  };

  // ============================================================
  // LOCAL FILTER
  // ============================================================

  const filteredUsers = useMemo(() => {
    if (!search.trim()) {
      return users;
    }

    const query = search.toLowerCase().trim();

    return users.filter((user) => {
      return (
        String(user?.name || "")
          .toLowerCase()
          .includes(query) ||
        String(user?.email || "")
          .toLowerCase()
          .includes(query) ||
        String(user?.phone || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [users, search]);

  // ============================================================
  // USER ACTIONS
  // ============================================================

  const updateUserStatus = async (user, action) => {
    const userId = user?._id || user?.id;

    if (!userId) {
      alert("User ID not found");
      return;
    }

    let endpoint = "";

    if (action === "suspend") {
      endpoint = `/api/admin/users/${userId}/suspend`;
    } else if (action === "unsuspend") {
      endpoint = `/api/admin/users/${userId}/unsuspend`;
    } else if (action === "block") {
      endpoint = `/api/admin/users/${userId}/block`;
    } else if (action === "unblock") {
      endpoint = `/api/admin/users/${userId}/unblock`;
    } else {
      return;
    }

    try {
      const response = await fetch(`${API}${endpoint}`, {
        method: "PUT",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || `Failed to ${action} user`);
      }

      alert(
        action === "suspend"
          ? "User suspended successfully."
          : action === "unsuspend"
          ? "User unsuspended successfully."
          : action === "block"
          ? "User blocked successfully."
          : "User unblocked successfully.",
      );

      await fetchUsers(true);

      if (selectedUser) {
        setSelectedUser((prev) => ({
          ...prev,
          ...(data?.user || {}),
        }));
      }
    } catch (err) {
      console.error(`User ${action} error:`, err);
      alert(err.message || `Failed to ${action} user`);
    }
  };

  const handleSuspend = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to suspend ${user?.name || "this user"}?`,
    );

    if (!confirmed) return;

    await updateUserStatus(user, "suspend");
  };

  const handleUnsuspend = async (user) => {
    const confirmed = window.confirm(`Unsuspend ${user?.name || "this user"}?`);

    if (!confirmed) return;

    await updateUserStatus(user, "unsuspend");
  };

  const handleBlock = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to block ${user?.name || "this user"}?`,
    );

    if (!confirmed) return;

    await updateUserStatus(user, "block");
  };

  const handleUnblock = async (user) => {
    const confirmed = window.confirm(`Unblock ${user?.name || "this user"}?`);

    if (!confirmed) return;

    await updateUserStatus(user, "unblock");
  };

  // ============================================================
  // OPEN DETAILS
  // ============================================================

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  const closeUserDetails = () => {
    setShowDetails(false);
    setSelectedUser(null);
  };

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    return {
      total: users.length,

      active: users.filter((user) => getUserStatus(user) === "active").length,

      suspended: users.filter((user) => getUserStatus(user) === "suspended")
        .length,

      inactive: users.filter((user) => getUserStatus(user) === "inactive")
        .length,
    };
  }, [users]);

  // ============================================================
  // STYLES
  // ============================================================

  const cardStyle = {
    background: "#FFFFFF",
    border: "1.5px solid #E5E7EB",
    borderRadius: "20px",
    padding: isMobile ? "16px" : "22px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.03)",
  };

  const statGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  };

  const statCard = {
    ...cardStyle,
    padding: isMobile ? "15px" : "18px",
  };

  const buttonBase = {
    border: "none",
    borderRadius: "10px",
    padding: "9px 13px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: "14px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? "22px" : "26px",
              fontWeight: "900",
              color: "#111827",
            }}
          >
            👥 User Management
          </h2>

          <p
            style={{
              margin: "5px 0 0",
              color: "#6B7280",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Manage Buyto customers, accounts and user status.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          style={{
            ...buttonBase,
            background: "#318616",
            color: "#FFFFFF",
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          {refreshing ? "⟳ Refreshing..." : "↻ Refresh Users"}
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#991B1B",
            borderRadius: "14px",
            padding: "14px 16px",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div style={statGridStyle}>
        <div style={statCard}>
          <div
            style={{
              fontSize: "12px",
              color: "#6B7280",
              fontWeight: "700",
            }}
          >
            Total Users
          </div>

          <div
            style={{
              marginTop: "7px",
              fontSize: "26px",
              fontWeight: "900",
              color: "#111827",
            }}
          >
            {stats.total}
          </div>
        </div>

        <div style={statCard}>
          <div
            style={{
              fontSize: "12px",
              color: "#6B7280",
              fontWeight: "700",
            }}
          >
            Active
          </div>

          <div
            style={{
              marginTop: "7px",
              fontSize: "26px",
              fontWeight: "900",
              color: "#16A34A",
            }}
          >
            {stats.active}
          </div>
        </div>

        <div style={statCard}>
          <div
            style={{
              fontSize: "12px",
              color: "#6B7280",
              fontWeight: "700",
            }}
          >
            Suspended
          </div>

          <div
            style={{
              marginTop: "7px",
              fontSize: "26px",
              fontWeight: "900",
              color: "#DC2626",
            }}
          >
            {stats.suspended}
          </div>
        </div>

        <div style={statCard}>
          <div
            style={{
              fontSize: "12px",
              color: "#6B7280",
              fontWeight: "700",
            }}
          >
            Inactive
          </div>

          <div
            style={{
              marginTop: "7px",
              fontSize: "26px",
              fontWeight: "900",
              color: "#D97706",
            }}
          >
            {stats.inactive}
          </div>
        </div>
      </div>

      {/* ======================================================
          SEARCH + FILTER
      ====================================================== */}

      <div style={cardStyle}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "10px",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            style={{
              flex: 1,
              minWidth: 0,
              border: "1.5px solid #E5E7EB",
              borderRadius: "12px",
              padding: "12px 14px",
              outline: "none",
              fontSize: "13px",
              color: "#111827",
              background: "#FFFFFF",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              border: "1.5px solid #E5E7EB",
              borderRadius: "12px",
              padding: "12px 14px",
              outline: "none",
              fontSize: "13px",
              fontWeight: "700",
              color: "#374151",
              background: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="submit"
            style={{
              ...buttonBase,
              background: "#111827",
              color: "#FFFFFF",
            }}
          >
            🔍 Search
          </button>
        </form>
      </div>

      {/* ======================================================
          USERS TABLE
      ====================================================== */}

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "17px",
                fontWeight: "900",
                color: "#111827",
              }}
            >
              Customers
            </h3>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "#6B7280",
              }}
            >
              {filteredUsers.length} user
              {filteredUsers.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              color: "#6B7280",
              fontWeight: "700",
            }}
          >
            ⏳ Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              color: "#6B7280",
            }}
          >
            <div style={{ fontSize: "35px", marginBottom: "10px" }}>👤</div>

            <div
              style={{
                fontWeight: "800",
                color: "#374151",
              }}
            >
              No users found
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "12px",
              }}
            >
              Try changing your search or filters.
            </div>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              width: "100%",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "850px",
              }}
            >
              <thead>
                <tr>
                  {["Customer", "Contact", "Status", "Joined", "Actions"].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom: "1px solid #E5E7EB",
                          fontSize: "11px",
                          fontWeight: "900",
                          color: "#6B7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const status = getUserStatus(user);
                  const statusStyle = getStatusStyle(user);

                  return (
                    <tr key={user._id || user.id}>
                      {/* CUSTOMER */}
                      <td
                        style={{
                          padding: "14px 12px",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              background: "#E8F5E3",
                              color: "#318616",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "900",
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {(user?.name || "U").charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: "800",
                                color: "#111827",
                              }}
                            >
                              {user?.name || "Unnamed User"}
                            </div>

                            <div
                              style={{
                                fontSize: "11px",
                                color: "#94A3B8",
                                marginTop: "2px",
                              }}
                            >
                              ID:{" "}
                              {String(user?._id || user?.id || "").slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td
                        style={{
                          padding: "14px 12px",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#374151",
                            fontWeight: "700",
                          }}
                        >
                          {user?.email || "No email"}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            color: "#94A3B8",
                            marginTop: "3px",
                          }}
                        >
                          {user?.phone || "No phone"}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td
                        style={{
                          padding: "14px 12px",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        <span
                          style={{
                            ...statusStyle,
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "5px 9px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: "900",
                          }}
                        >
                          {status === "active" && "● "}
                          {status === "suspended" && "⛔ "}
                          {status === "inactive" && "○ "}
                          {status === "deleted" && "✕ "}
                          {getStatusLabel(user)}
                        </span>
                      </td>

                      {/* JOINED */}
                      <td
                        style={{
                          padding: "14px 12px",
                          borderBottom: "1px solid #F1F5F9",
                          fontSize: "12px",
                          color: "#4B5563",
                          fontWeight: "600",
                        }}
                      >
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-IN")
                          : "Unknown"}
                      </td>

                      {/* ACTIONS */}
                      <td
                        style={{
                          padding: "14px 12px",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                          }}
                        >
                          <button
                            onClick={() => openUserDetails(user)}
                            style={{
                              ...buttonBase,
                              background: "#EFF6FF",
                              color: "#1D4ED8",
                            }}
                          >
                            View
                          </button>

                          {status === "suspended" ? (
                            <button
                              onClick={() => handleUnsuspend(user)}
                              style={{
                                ...buttonBase,
                                background: "#DCFCE7",
                                color: "#166534",
                              }}
                            >
                              Unsuspend
                            </button>
                          ) : status === "active" ? (
                            <button
                              onClick={() => handleSuspend(user)}
                              style={{
                                ...buttonBase,
                                background: "#FEF2F2",
                                color: "#B91C1C",
                              }}
                            >
                              Suspend
                            </button>
                          ) : null}

                          {user?.isActive === false ? (
                            <button
                              onClick={() => handleUnblock(user)}
                              style={{
                                ...buttonBase,
                                background: "#ECFDF5",
                                color: "#047857",
                              }}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(user)}
                              style={{
                                ...buttonBase,
                                background: "#FFF7ED",
                                color: "#C2410C",
                              }}
                            >
                              Block
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          USER DETAILS MODAL
      ====================================================== */}

      {showDetails && selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            padding: isMobile ? "0" : "20px",
          }}
          onClick={closeUserDetails}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "650px",
              maxHeight: isMobile ? "90vh" : "85vh",
              overflowY: "auto",
              background: "#FFFFFF",
              borderRadius: isMobile ? "24px 24px 0 0" : "24px",
              padding: isMobile ? "20px" : "28px",
              boxSizing: "border-box",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                marginBottom: "22px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "21px",
                    fontWeight: "900",
                    color: "#111827",
                  }}
                >
                  User Details
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "12px",
                    color: "#6B7280",
                  }}
                >
                  Customer account information
                </p>
              </div>

              <button
                onClick={closeUserDetails}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#F3F4F6",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#374151",
                }}
              >
                ×
              </button>
            </div>

            {/* PROFILE */}

            <div
              style={{
                background: "#F8FAFC",
                borderRadius: "18px",
                padding: "18px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "50%",
                  background: "#E8F5E3",
                  color: "#318616",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: "900",
                }}
              >
                {(selectedUser?.name || "U").charAt(0).toUpperCase()}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "900",
                    color: "#111827",
                  }}
                >
                  {selectedUser?.name || "Unnamed User"}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    marginTop: "3px",
                  }}
                >
                  {selectedUser?.email || "No email"}
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    display: "inline-flex",
                    padding: "4px 9px",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: "900",
                    ...getStatusStyle(selectedUser),
                  }}
                >
                  {getStatusLabel(selectedUser)}
                </div>
              </div>
            </div>

            {/* INFORMATION */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              <DetailItem label="Full Name" value={selectedUser?.name} />

              <DetailItem label="Email" value={selectedUser?.email} />

              <DetailItem label="Phone" value={selectedUser?.phone} />

              <DetailItem
                label="User ID"
                value={selectedUser?._id || selectedUser?.id || "Unknown"}
              />

              <DetailItem
                label="Account Created"
                value={
                  selectedUser?.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString("en-IN")
                    : "Unknown"
                }
              />

              <DetailItem
                label="Last Updated"
                value={
                  selectedUser?.updatedAt
                    ? new Date(selectedUser.updatedAt).toLocaleString("en-IN")
                    : "Unknown"
                }
              />

              <DetailItem
                label="Phone Verified"
                value={selectedUser?.phoneVerified ? "Yes" : "No"}
              />

              <DetailItem
                label="Email Verified"
                value={selectedUser?.emailVerified ? "Yes" : "No"}
              />
            </div>

            {/* SUSPENSION INFORMATION */}

            {selectedUser?.isSuspended && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "15px",
                  borderRadius: "14px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "900",
                    color: "#991B1B",
                    marginBottom: "7px",
                  }}
                >
                  ⛔ Suspension Information
                </div>

                {selectedUser?.suspensionReason && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7F1D1D",
                    }}
                  >
                    Reason: <strong>{selectedUser.suspensionReason}</strong>
                  </div>
                )}

                {selectedUser?.suspensionNotes && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#7F1D1D",
                      marginTop: "5px",
                    }}
                  >
                    Notes: {selectedUser.suspensionNotes}
                  </div>
                )}
              </div>
            )}

            {/* MODAL ACTIONS */}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "22px",
                paddingTop: "18px",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              {getUserStatus(selectedUser) === "suspended" ? (
                <button
                  onClick={() => handleUnsuspend(selectedUser)}
                  style={{
                    ...buttonBase,
                    background: "#DCFCE7",
                    color: "#166534",
                  }}
                >
                  ✓ Unsuspend User
                </button>
              ) : (
                <button
                  onClick={() => handleSuspend(selectedUser)}
                  style={{
                    ...buttonBase,
                    background: "#FEF2F2",
                    color: "#B91C1C",
                  }}
                >
                  ⛔ Suspend User
                </button>
              )}

              <button
                onClick={closeUserDetails}
                style={{
                  ...buttonBase,
                  background: "#F3F4F6",
                  color: "#374151",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({ label, value }) {
  return (
    <div
      style={{
        padding: "13px",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        background: "#FFFFFF",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#94A3B8",
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "5px",
          fontSize: "12px",
          color: "#1F2937",
          fontWeight: "700",
          wordBreak: "break-word",
        }}
      >
        {value || "Not provided"}
      </div>
    </div>
  );
}

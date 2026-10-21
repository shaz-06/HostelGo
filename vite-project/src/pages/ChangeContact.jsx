import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ChangeContact() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentNumber = String(location.state?.currentNumber || "");
  const currentName = location.state?.currentName || "";
  const returnTo = location.state?.returnTo || -1;

  const [alternateNumber, setAlternateNumber] = useState("");
  const [confirmNumber, setConfirmNumber] = useState("");
  const [contactFor, setContactFor] = useState("me");
  const [otherName, setOtherName] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    const phone = alternateNumber.replace(/\D/g, "");
    const confirm = confirmNumber.replace(/\D/g, "");

    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit alternate number.");
      return;
    }

    if (phone !== confirm) {
      setError("The alternate numbers do not match.");
      return;
    }

    if (contactFor === "other" && !otherName.trim()) {
      setError("Please enter the person's name.");
      return;
    }

    const contact = {
      currentNumber,
      alternateNumber: phone,
      name: contactFor === "other" ? otherName.trim() : currentName,
      contactFor,
    };

    localStorage.setItem("buytoAlternateContact", JSON.stringify(contact));

    if (typeof returnTo === "string" && returnTo.startsWith("/")) {
      navigate(returnTo, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    marginTop: 8,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    fontSize: 16,
    outlineColor: "#318616",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            border: 0,
            background: "transparent",
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          ← Back
        </button>

        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 22,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#1f2937" }}>Contact details</h2>

          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Choose the contact number for your Buyto delivery.
          </p>

          <label>Current number</label>
          <input style={inputStyle} value={currentNumber} readOnly />

          <label style={{ display: "block", marginTop: 20 }}>
            Alternate number
          </label>
          <input
            style={inputStyle}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter 10-digit number"
            value={alternateNumber}
            onChange={(e) =>
              setAlternateNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
          />

          <label style={{ display: "block", marginTop: 20 }}>
            Re-enter alternate number
          </label>
          <input
            style={inputStyle}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="Confirm alternate number"
            value={confirmNumber}
            onChange={(e) =>
              setConfirmNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
          />

          <h3 style={{ marginTop: 24, color: "#1f2937" }}>
            This number is for
          </h3>

          {[
            { value: "me", label: "This is for me" },
            { value: "other", label: "This is for someone else" },
          ].map((option) => (
            <label
              key={option.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 14,
                marginTop: 10,
                border: `1px solid ${
                  contactFor === option.value ? "#318616" : "#e5e7eb"
                }`,
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="contactFor"
                value={option.value}
                checked={contactFor === option.value}
                onChange={() => setContactFor(option.value)}
              />
              {option.label}
            </label>
          ))}

          {contactFor === "other" && (
            <>
              <label style={{ display: "block", marginTop: 20 }}>
                Their name
              </label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Enter their full name"
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
              />
            </>
          )}

          {error && <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>}

          <button
            onClick={handleSave}
            style={{
              width: "100%",
              marginTop: 24,
              padding: 15,
              background: "#318616",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Save contact
          </button>
        </div>
      </div>
    </div>
  );
}

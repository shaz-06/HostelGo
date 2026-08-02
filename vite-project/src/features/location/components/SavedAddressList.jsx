import React from "react";
import { AddressCard } from "./AddressCard";

export const SavedAddressList = React.memo(({ addresses, selectedId, onSelect, onEdit }) => {
  if (!addresses || addresses.length === 0) {
    return (
      <div style={{
        padding: "24px",
        textAlign: "center",
        color: "#94a3b8",
        fontSize: "13px",
        fontWeight: "600"
      }}>
        No saved addresses yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {addresses.map((address) => (
        <AddressCard
          key={address.id || address._id}
          address={address}
          isSelected={(address.id || address._id) === selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
});

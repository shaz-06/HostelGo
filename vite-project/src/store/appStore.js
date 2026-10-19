import { create } from "zustand";
import { cartDebug } from "../utils/cartDebug";

const CART_SCHEMA_VERSION = 1;

// Helper to restore initial cart items from localStorage
const getInitialCartItems = () => {
  const saved = localStorage.getItem("buyto_cart") || localStorage.getItem("cart");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : Object.values(parsed).map((item) => ({
        ...item.product,
        quantity: item.quantity,
      }));
    } catch (e) {
      return [];
    }
  }
  return [];
};

export const useAppStore = create((set, get) => ({
  cartItems: getInitialCartItems(),
  searchQuery: new URLSearchParams(window.location.search).get("q") || "",
  userLocation: localStorage.getItem("userLocation") || "",
  roomNumber: localStorage.getItem("roomNumber") || "",
  isLoggedIn: !!localStorage.getItem("buyto_token"),
  user: null,
  token: localStorage.getItem("buyto_token") || null,
  products: [],
  searchResults: [],
  searchLoading: false,
  saveForLaterIds: [],

  // Actions
  setProducts: (products) => set({ products }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchLoading: (searchLoading) => set({ searchLoading }),

  setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("buyto_token", token);
    } else {
      localStorage.removeItem("buyto_token");
    }
    set({ token, isLoggedIn: !!token });
  },

  setUserLocation: (userLocation) => {
    localStorage.setItem("userLocation", userLocation);
    set({ userLocation });
  },

  setRoomNumber: (roomNumber) => {
    localStorage.setItem("roomNumber", roomNumber);
    set({ roomNumber });
  },

  setSearchQuery: (val, searchParams, setSearchParams, navigate, pathname) => {
    set({ searchQuery: val });
    if (val) {
      if (pathname !== "/search") {
        navigate(`/search?q=${encodeURIComponent(val)}`);
      } else {
        setSearchParams({ q: val }, { replace: true });
      }
    } else {
      setSearchParams({}, { replace: true });
    }
  },

  setCartItems: (items) => {
    localStorage.setItem("buyto_cart", JSON.stringify(items));
    localStorage.setItem("cart", JSON.stringify(items));
    set({ cartItems: items });
  },

  addToCart: (product) => {
    let enriched = { ...product };
    const { products, cartItems, token } = get();

    if (!enriched._id && enriched.id && products && products.length > 0) {
      const matched = products.find(p => p.id === enriched.id);
      if (matched && matched._id) {
        enriched._id = matched._id;
      }
    }

    cartDebug.logLifecycle("addToCart (Zustand)", enriched);

    const productId = String(enriched._id || enriched.id);
    const existingIndex = cartItems.findIndex(
      (item) => String(item._id || item.id) === productId
    );

    let updatedItems;
    if (existingIndex > -1) {
      updatedItems = cartItems.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedItems = [...cartItems, { ...enriched, quantity: 1 }];
    }

    localStorage.setItem("buyto_cart", JSON.stringify(updatedItems));
    localStorage.setItem("cart", JSON.stringify(updatedItems));
    set({ cartItems: updatedItems });

    // Sync activity with backend
    if (token) {
      fetch(window.API_BASE_URL + "/api/users/cart-activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ hasItems: updatedItems.length > 0 })
      }).catch(err => console.error("Failed to sync cart activity to backend:", err));
    }
  },

  removeFromCart: (product) => {
    const { cartItems, token } = get();
    const productId = String(product._id || product.id);
    const existingItem = cartItems.find(
      (item) => String(item._id || item.id) === productId
    );

    if (!existingItem) return;

    let updatedItems;
    if (existingItem.quantity === 1) {
      updatedItems = cartItems.filter(
        (item) => String(item._id || item.id) !== productId
      );
    } else {
      updatedItems = cartItems.map((item) =>
        String(item._id || item.id) === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    }

    localStorage.setItem("buyto_cart", JSON.stringify(updatedItems));
    localStorage.setItem("cart", JSON.stringify(updatedItems));
    set({ cartItems: updatedItems });

    // Sync activity with backend
    if (token) {
      fetch(window.API_BASE_URL + "/api/users/cart-activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ hasItems: updatedItems.length > 0 })
      }).catch(err => console.error("Failed to sync cart activity to backend:", err));
    }
  },

  clearCartAfterDelivery: () => {
    localStorage.removeItem("buyto_cart");
    localStorage.removeItem("cart");
    sessionStorage.removeItem("buyto_cart");
    sessionStorage.removeItem("buyto_applied_coupon_code");
    localStorage.removeItem("buyto_coins_redeem");
    localStorage.removeItem("buyto_checkout_summary");
    localStorage.removeItem("buyto_selected_address_id");
    set({ cartItems: [] });
    console.log("[CartCleanup] Zustand cart and checkout storage cleared successfully.");
  },

  setSaveForLaterIds: (ids) => set({ saveForLaterIds: ids }),

  clearSaveForLater: () => set({ saveForLaterIds: [] }),

  loadSaveForLater: async (token) => {
    if (token) {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/save-for-later", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.savedProducts) {
            const ids = data.savedProducts.map(p => {
              const prod = p.productId;
              return prod ? String(prod._id || prod.id || prod) : "";
            }).filter(Boolean);
            set({ saveForLaterIds: ids });
          }
        }
      } catch (err) {
        console.error("Failed to load Save For Later list:", err);
      }
    } else {
      const guestSaved = localStorage.getItem("buyto_save_for_later");
      if (guestSaved) {
        try {
          set({ saveForLaterIds: JSON.parse(guestSaved) });
        } catch (e) {
          set({ saveForLaterIds: [] });
        }
      } else {
        set({ saveForLaterIds: [] });
      }
    }
  },

  toggleSaveForLater: async (product, token) => {
    const { saveForLaterIds } = get();
    const productId = String(product._id || product.id);
    const isSaved = saveForLaterIds.includes(productId);

    // Optimistic Update
    const previousIds = [...saveForLaterIds];
    let updatedIds;
    if (isSaved) {
      updatedIds = saveForLaterIds.filter(id => id !== productId);
    } else {
      updatedIds = [...saveForLaterIds, productId];
    }
    set({ saveForLaterIds: updatedIds });

    if (token) {
      try {
        const method = isSaved ? "DELETE" : "POST";
        const res = await fetch(window.API_BASE_URL + `/api/save-for-later/${productId}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.savedProducts) {
            const ids = data.savedProducts.map(p => {
              const prod = p.productId;
              return prod ? String(prod._id || prod.id || prod) : "";
            }).filter(Boolean);
            set({ saveForLaterIds: ids });
          }
          return { success: true, isSaved: !isSaved };
        } else {
          // Rollback
          set({ saveForLaterIds: previousIds });
          const errData = await res.json();
          return { success: false, message: errData.message };
        }
      } catch (err) {
        // Rollback
        set({ saveForLaterIds: previousIds });
        console.error("Toggle Save For Later API call failed:", err);
        return { success: false, message: err.message };
      }
    } else {
      localStorage.setItem("buyto_save_for_later", JSON.stringify(updatedIds));
      return { success: true, isSaved: !isSaved };
    }
  },

  syncGuestSavedProducts: async (userToken) => {
    const guestSaved = localStorage.getItem("buyto_save_for_later");
    if (guestSaved) {
      try {
        const ids = JSON.parse(guestSaved);
        if (Array.isArray(ids) && ids.length > 0) {
          console.log("Syncing guest Save For Later products to backend...", ids);
          await Promise.all(
            ids.map(productId =>
              fetch(window.API_BASE_URL + `/api/save-for-later/${productId}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${userToken}`
                }
              }).catch(err => console.error("Sync failed for", productId, err))
            )
          );
        }
      } catch (err) {
        console.error("Failed to sync guest products:", err);
      } finally {
        localStorage.removeItem("buyto_save_for_later");
      }
    }
  }
}));

// Narrow/Atomic Selectors for optimal rendering
export const selectCartItems = (state) => state.cartItems;
export const selectCartItemsCount = (state) => {
  return state.cartItems.reduce((sum, item) => sum + item.quantity, 0);
};
export const selectCartTotalPrice = (state) => {
  return state.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};
export const selectProductQuantity = (productId) => (state) => {
  const item = state.cartItems.find(
    (item) => String(item._id || item.id) === String(productId)
  );
  return item ? item.quantity : 0;
};
export const selectSearchQuery = (state) => state.searchQuery;
export const selectUserLocation = (state) => state.userLocation;
export const selectRoomNumber = (state) => state.roomNumber;
export const selectIsLoggedIn = (state) => state.isLoggedIn;
export const selectUser = (state) => state.user;
export const selectToken = (state) => state.token;
export const selectSaveForLaterIds = (state) => state.saveForLaterIds;

// Action Selectors (stable references)
let cachedCartActions = null;
export const selectCartActions = (state) => {
  if (!cachedCartActions) {
    cachedCartActions = {
      addToCart: state.addToCart,
      removeFromCart: state.removeFromCart,
      setCartItems: state.setCartItems,
      clearCartAfterDelivery: state.clearCartAfterDelivery
    };
  }
  return cachedCartActions;
};

let cachedLocationActions = null;
export const selectLocationActions = (state) => {
  if (!cachedLocationActions) {
    cachedLocationActions = {
      setUserLocation: state.setUserLocation,
      setRoomNumber: state.setRoomNumber
    };
  }
  return cachedLocationActions;
};

let cachedAuthActions = null;
export const selectAuthActions = (state) => {
  if (!cachedAuthActions) {
    cachedAuthActions = {
      setLoggedIn: state.setLoggedIn,
      setUser: state.setUser,
      setToken: state.setToken
    };
  }
  return cachedAuthActions;
};

let cachedSearchActions = null;
export const selectSearchActions = (state) => {
  if (!cachedSearchActions) {
    cachedSearchActions = {
      setSearchQuery: state.setSearchQuery
    };
  }
  return cachedSearchActions;
};

let cachedSaveForLaterActions = null;
export const selectSaveForLaterActions = (state) => {
  if (!cachedSaveForLaterActions) {
    cachedSaveForLaterActions = {
      toggleSaveForLater: state.toggleSaveForLater,
      loadSaveForLater: state.loadSaveForLater,
      clearSaveForLater: state.clearSaveForLater,
      syncGuestSavedProducts: state.syncGuestSavedProducts
    };
  }
  return cachedSaveForLaterActions;
};


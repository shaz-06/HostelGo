import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { calculateBill } from "../utils/billCalculator";
import CartBillDetails from "../components/CartBillDetails";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";
import { MOBILE_NAV_TOTAL_OFFSET } from "../constants/layoutConstants";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Resolve default marker icon bug in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

function ChangeMapView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, 16);
        }
    }, [center, map]);
    return null;
}

function MapEventsHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

export default function CartPage({
    cartItems = [],
    increaseQty,
    decreaseQty,
    removeFromCart,
    removeFromCartCompletely,
    isLoggedIn,
    activeCoupons = [],
    selectedCoupon = null,
    setSelectedCoupon = () => { },
    products = [],
    addToCart = () => { },
}) {
    const { user, setUser, openLogin } = useContext(AuthContext);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");
    const [phoneError, setPhoneError] = useState("");

    const handlePhoneSubmit = (e) => {
        if (e) e.preventDefault();
        const cleanPhone = phoneInput.trim().replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            setPhoneError("Please enter a valid 10-digit phone number.");
            return;
        }
        setPhoneError("");
        // Update user state with phone number
        const updatedUser = { ...user, phoneNumber: cleanPhone };
        setUser(updatedUser);
        localStorage.setItem("buyto_user", JSON.stringify(updatedUser));
        localStorage.setItem("hostelgoUser", JSON.stringify(updatedUser));
        setShowPhoneModal(false);
        navigate("/payment");
    };

    const navigate = useNavigate();
    const [noBagPledge, setNoBagPledge] = useState(() => {
        return localStorage.getItem("buyto_no_bag_pledge") === "true";
    });
    const [toast, setToast] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Shopping List Checkout Summary State
    const [checkoutSummary, setCheckoutSummary] = useState(null);
    useEffect(() => {
        const savedSummary = localStorage.getItem("buyto_checkout_summary");
        if (savedSummary) {
            setCheckoutSummary(JSON.parse(savedSummary));
        }
    }, []);
    const [lazyLoaded, setLazyLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState("Snacks");
    const [availableCoins, setAvailableCoins] = useState(0);
    const [coinsToRedeem, setCoinsToRedeem] = useState(() => {
        return Number(localStorage.getItem("buyto_coins_redeem") || 0);
    });

    const [config, setConfig] = useState({
        handlingFee: 0,
        gstPercentage: 5,
        gstFixedCharges: 2
    });
    const [deliverySettings, setDeliverySettings] = useState({
        lateNightDeliveryEnabled: false,
        rainyDeliveryEnabled: false
    });

    // Dynamic Saved Addresses States
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(() => {
        return localStorage.getItem("buyto_selected_address_id") || "";
    });
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressForm, setAddressForm] = useState({
        id: "", // present if editing
        label: "Hostel",
        fullName: "",
        phone: "",
        addressLine: "",
        landmark: "",
        roomNumber: "",
        isDefault: false,
        latitude: null,
        longitude: null
    });
    const [gpsDetecting, setGpsDetecting] = useState(false);
    const [isAddressServiceable, setIsAddressServiceable] = useState(true);

    // Map & GPS Address modal states
    const [mapCenter, setMapCenter] = useState([13.3409, 74.7978]);
    const [markerPos, setMarkerPos] = useState([13.3409, 74.7978]);
    const [isModalAddressServiceable, setIsModalAddressServiceable] = useState(true);
    const [serviceabilityMessage, setServiceabilityMessage] = useState("");
    const [showLocationConfirm, setShowLocationConfirm] = useState(false);
    const [detectedAddressText, setDetectedAddressText] = useState("");
    const debounceGeocodeTimeout = useRef(null);


    const originalUser = localStorage.getItem("hostelgoUser") ? JSON.parse(localStorage.getItem("hostelgoUser")) : null;

    // Check serviceability inside modal
    const checkModalServiceability = async (lat, lng) => {
        try {
            const res = await fetch(window.API_BASE_URL + "/api/auth/verify-serviceability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ latitude: Number(lat), longitude: Number(lng) })
            });
            if (res.ok) {
                const data = await res.json();
                setIsModalAddressServiceable(data.serviceable);
                setServiceabilityMessage(
                    data.serviceable
                        ? "🟢 Delivery Available. Estimated delivery: 10–30 mins"
                        : "🔴 Currently unavailable in your area. You can still save this address."
                );
                return data.serviceable;
            }
        } catch (err) {
            console.error("Modal serviceability check failed:", err);
        }
        setIsModalAddressServiceable(false);
        setServiceabilityMessage("🔴 Currently unavailable in your area. You can still save this address.");
        return false;
    };

    // Debounced reverse geocoding and serviceability checking
    const handleMapClickOrMarkerDrag = (lat, lng) => {
        const newCoords = [Number(lat), Number(lng)];
        setMarkerPos(newCoords);

        if (debounceGeocodeTimeout.current) {
            clearTimeout(debounceGeocodeTimeout.current);
        }

        setShowLocationConfirm(false);
        setServiceabilityMessage("Checking delivery serviceability...");

        debounceGeocodeTimeout.current = setTimeout(async () => {
            await checkModalServiceability(lat, lng);

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setDetectedAddressText(data.display_name || `${lat}, ${lng}`);
                    setShowLocationConfirm(true);
                }
            } catch (error) {
                console.error("Reverse geocoding failed:", error);
            }
        }, 650);
    };

    // Check serviceability
    const checkServiceability = async (latitude, longitude) => {
        if (latitude === null || longitude === null) {
            setIsAddressServiceable(false);
            return;
        }
        try {
            const res = await fetch(window.API_BASE_URL + "/api/auth/verify-serviceability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    latitude: Number(latitude),
                    longitude: Number(longitude)
                })
            });
            if (res.ok) {
                const data = await res.json();
                setIsAddressServiceable(data.serviceable);
            } else {
                setIsAddressServiceable(false);
            }
        } catch (err) {
            console.error("Error checking serviceability in CartPage:", err);
            setIsAddressServiceable(false);
        }
    };

    // Fetch saved addresses from backend
    const fetchAddresses = async () => {
        if (!isLoggedIn) return;
        const token = localStorage.getItem("buyto_token");
        try {
            const res = await fetch(window.API_BASE_URL + "/api/addresses", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.addresses) {
                    setAddresses(data.addresses);

                    const savedId = localStorage.getItem("buyto_selected_address_id");
                    const hasSavedAddr = savedId ? data.addresses.some(a => a._id === savedId) : false;

                    if (!hasSavedAddr) {
                        localStorage.removeItem("buyto_selected_address_id");
                        if (data.addresses.length > 0) {
                            const defAddr = data.addresses.find(a => a.isDefault) || data.addresses[0];
                            handleSelectAddress(defAddr);
                            localStorage.setItem("buyto_selected_address_id", defAddr._id);
                        }
                    } else if (hasSavedAddr && data.addresses.length > 0) {
                        const selAddr = data.addresses.find(a => a._id === savedId);
                        if (selAddr) {
                            checkServiceability(selAddr.latitude, selAddr.longitude);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching addresses in CartPage:", err);
        }
    };

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        // Fetch billing fees config on mount
        fetch(window.API_BASE_URL + "/api/config/fees")
            .then(res => res.json())
            .then(data => {
                if (data) setConfig(data);
            })
            .catch(err => console.error("Failed to load fee configuration:", err));

        // Fetch delivery settings on mount
        fetch(window.API_BASE_URL + "/api/delivery-settings")
            .then(res => res.json())
            .then(data => {
                if (data) setDeliverySettings(data);
            })
            .catch(err => console.error("Failed to load delivery settings:", err));

        // Connect to Socket.IO for real-time delivery settings updates
        const socket = io(window.API_BASE_URL);
        socket.on("deliverySettingsUpdated", (updatedSettings) => {
            console.log("🔌 Socket: delivery settings updated in real-time:", updatedSettings);
            if (updatedSettings) setDeliverySettings(updatedSettings);
        });

        // Fetch user wallet balance if logged in
        if (isLoggedIn) {
            const token = localStorage.getItem("buyto_token");
            fetch(window.API_BASE_URL + "/api/buycoins/wallet", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data && data.success && data.wallet) {
                        setAvailableCoins(data.wallet.availableCoins);
                    }
                })
                .catch(err => console.error("Error fetching BuyCoins wallet:", err));

            // Fetch saved addresses list
            fetchAddresses();
        }

        // Lazy-loading trigger
        const timer = setTimeout(() => {
            setLazyLoaded(true);
        }, 600);

        return () => {
            window.removeEventListener("resize", handleResize);
            socket.disconnect();
            clearTimeout(timer);
        };
    }, [isLoggedIn]);

    // Save noBagPledge to localStorage
    const handleNoBagToggle = () => {
        const newValue = !noBagPledge;
        setNoBagPledge(newValue);
        localStorage.setItem("buyto_no_bag_pledge", String(newValue));
        console.log("Analytics Event: no_bag_pledge_enabled", { enabled: newValue });
    };

    // Save coins to redeem
    const handleCoinsChange = (newCoins) => {
        const maxCoinsAllowed = Math.floor(subtotal * 0.20);
        const val = Math.max(0, Math.min(newCoins, availableCoins, maxCoinsAllowed));
        setCoinsToRedeem(val);
        localStorage.setItem("buyto_coins_redeem", String(val));
        console.log("Analytics Event: buycoins_used", { coinsUsed: val });
    };

    // Address selection handler
    const handleSelectAddress = async (addr) => {
        setSelectedAddressId(addr._id);
        localStorage.setItem("buyto_selected_address_id", addr._id);

        const updatedUser = {
            name: addr.fullName,
            phone: addr.phone,
            location: addr.addressLine + (addr.landmark ? `, ${addr.landmark}` : ""),
            roomNumber: addr.roomNumber,
            coords: [addr.latitude || 13.628, addr.longitude || 74.693]
        };
        localStorage.setItem("buyto_user", JSON.stringify(updatedUser));
        localStorage.setItem("userName", updatedUser.name);
        localStorage.setItem("userLocation", updatedUser.location);
        localStorage.setItem("roomNumber", updatedUser.roomNumber || "");

        // Check serviceability
        checkServiceability(addr.latitude, addr.longitude);

        // Notify backend address was selected
        const token = localStorage.getItem("buyto_token");
        try {
            await fetch(`${window.API_BASE_URL}/api/addresses/${addr._id}/use`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            console.error("Failed to update lastUsedAt in backend:", e);
        }

        setToast({ couponCode: "Address Selected", discountAmount: 0 });
        setTimeout(() => setToast(null), 1500);
    };

    // Set default address
    const handleSetDefaultAddress = async (id, e) => {
        e.stopPropagation();
        const token = localStorage.getItem("buyto_token");
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/addresses/${id}/default`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAddresses();
            }
        } catch (err) {
            console.error("Failed to set default address:", err);
        }
    };

    // Delete address
    const handleDeleteAddress = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this address?")) return;
        const token = localStorage.getItem("buyto_token");
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/addresses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchAddresses();
                if (selectedAddressId === id) {
                    localStorage.removeItem("buyto_selected_address_id");
                    setSelectedAddressId("");
                }
            }
        } catch (err) {
            console.error("Failed to delete address:", err);
        }
    };

    // Open Add address modal
    const openAddModal = () => {
        setAddressForm({
            id: "",
            label: "Hostel",
            fullName: originalUser?.name || user?.name || "",
            phone: originalUser?.phone || user?.phone || "",
            addressLine: "",
            landmark: "",
            roomNumber: "",
            isDefault: addresses.length === 0, // default if first address
            latitude: null,
            longitude: null
        });
        setMapCenter([13.3409, 74.7978]);
        setMarkerPos([13.3409, 74.7978]);
        setIsModalAddressServiceable(true);
        setServiceabilityMessage("");
        setShowLocationConfirm(false);
        setDetectedAddressText("");
        setShowAddressModal(true);
    };

    // Open Edit address modal
    const openEditModal = (addr, e) => {
        e.stopPropagation();
        const lat = addr.latitude || 13.3409;
        const lng = addr.longitude || 74.7978;
        setAddressForm({
            id: addr._id,
            label: addr.label || "Hostel",
            fullName: addr.fullName,
            phone: addr.phone,
            addressLine: addr.addressLine,
            landmark: addr.landmark || "",
            roomNumber: addr.roomNumber || "",
            isDefault: addr.isDefault,
            latitude: lat,
            longitude: lng
        });
        setMapCenter([lat, lng]);
        setMarkerPos([lat, lng]);
        setIsModalAddressServiceable(addr.serviceable !== undefined ? addr.serviceable : true);
        setServiceabilityMessage(
            addr.serviceable
                ? "🟢 Delivery Available. Estimated delivery: 10–30 mins"
                : "🔴 Currently unavailable in your area. You can still save this address."
        );
        setShowLocationConfirm(false);
        setDetectedAddressText(addr.addressLine);
        setShowAddressModal(true);
    };

    // Detect browser GPS coordinates
    const detectGpsLocation = () => {
        setGpsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const newPos = [lat, lng];

                setMapCenter(newPos);
                setMarkerPos(newPos);
                setGpsDetecting(false);

                // Show success toast
                setToast({ couponCode: "Location detected successfully", discountAmount: 0 });
                setTimeout(() => setToast(null), 2000);

                setShowLocationConfirm(false);
                setServiceabilityMessage("Checking delivery serviceability...");

                // Run serviceability check
                await checkModalServiceability(lat, lng);

                // Reverse geocode
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setDetectedAddressText(data.display_name || `${lat}, ${lng}`);
                        setShowLocationConfirm(true);
                    }
                } catch (error) {
                    console.error("Nominatim reverse geocode failed:", error);
                }
            },
            async (err) => {
                console.error("Geolocation failed, using default campus location:", err);
                setGpsDetecting(false);

                // Fallback to standard Udupi campus coordinates if permission blocked
                const fallbackLat = 13.3409;
                const fallbackLng = 74.7978;
                const fallbackPos = [fallbackLat, fallbackLng];

                setMapCenter(fallbackPos);
                setMarkerPos(fallbackPos);

                setToast({ couponCode: "Location detected successfully (fallback)", discountAmount: 0 });
                setTimeout(() => setToast(null), 2000);

                setShowLocationConfirm(false);
                setServiceabilityMessage("Checking delivery serviceability...");

                await checkModalServiceability(fallbackLat, fallbackLng);

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${fallbackLat}&lon=${fallbackLng}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setDetectedAddressText(data.display_name || `${fallbackLat}, ${fallbackLng}`);
                        setShowLocationConfirm(true);
                    }
                } catch (error) {
                    console.error("Nominatim fallback reverse geocode failed:", error);
                }
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    };

    // Submit Add/Edit Address Form
    const handleAddressFormSubmit = async (e) => {
        e.preventDefault();

        if (!addressForm.latitude || !addressForm.longitude) {
            alert("Please select and confirm a location on the map first.");
            return;
        }

        const token = localStorage.getItem("buyto_token");
        const isEdit = !!addressForm.id;
        const url = isEdit
            ? `${window.API_BASE_URL}/api/addresses/${addressForm.id}`
            : `${window.API_BASE_URL}/api/addresses`;
        const method = isEdit ? "PUT" : "POST";

        const payload = {
            ...addressForm,
            addressType: addressForm.label,
            serviceable: isModalAddressServiceable,
            lastCheckedAt: new Date()
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.address) {
                    setShowAddressModal(false);
                    fetchAddresses();
                    handleSelectAddress(data.address);
                }
            } else {
                const data = await res.json();
                alert(data.message || "Failed to save address details");
            }
        } catch (err) {
            console.error("Address save exception:", err);
            alert("Connection error saving address details");
        }
    };

    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    const originalSubtotal = cartItems.reduce(
        (acc, item) => acc + (item.originalPrice || item.price) * item.quantity,
        0
    );

    // Apply calculated coins to bill
    const billBreakdown = calculateBill(
        subtotal,
        originalSubtotal,
        config,
        deliverySettings,
        selectedCoupon,
        coinsToRedeem
    );
    const { total, originalTotal } = billBreakdown;

    // Filter products for Did You Forget tabs
    const getTabProducts = () => {
        if (!products || products.length === 0) return [];
        switch (activeTab) {
            case "Snacks":
                return products.filter(p => p.category === "Snacks" || p.category?.toLowerCase()?.includes("snack"));
            case "Cold Drinks":
                return products.filter(p => p.category === "Beverages" || p.category?.toLowerCase()?.includes("drink"));
            case "Personal Care":
                return products.filter(p => p.category === "Cleaners & Repellents" || p.category === "Sexual Wellness");
            case "Dairy":
                return products.filter(p => p.category?.toLowerCase()?.includes("dairy"));
            case "Fruits":
                return products.filter(p => p.category === "The Fruit Store");
            case "Bakery":
                return products.filter(p => p.category === "The Bread Store" || p.category?.toLowerCase()?.includes("bread"));
            default:
                return [];
        }
    };

    // Filter products for recommended and trending
    const recommendedList = products.slice(0, 8);
    const trendingList = products.slice(8, 16);
    const bestDeals = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 8);

    // Student specific products
    const studentEssentials = [
        { _id: "upsell_maggi", name: "Maggi Instant Masala Noodles", price: 14, originalPrice: 16, weight: "70g", image: "https://images.unsplash.com/photo-1612966608967-302fa54d87da?w=200&auto=format&fit=crop", category: "Snacks" },
        { _id: "upsell_redbull", name: "Red Bull Energy Drink", price: 125, originalPrice: 145, weight: "250ml", image: "https://images.unsplash.com/photo-1622543956221-15b50d9d8318?w=200&auto=format&fit=crop", category: "Beverages" },
        { _id: "upsell_notebook", name: "Classmate Spiral Notebook", price: 65, originalPrice: 75, weight: "1 Unit", image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&auto=format&fit=crop", category: "Stationery" },
        { _id: "upsell_charger", name: "Fast Charging Type-C Cable", price: 199, originalPrice: 299, weight: "1.2m", image: "https://images.unsplash.com/photo-1541667593101-40bcb5020967?w=200&auto=format&fit=crop", category: "Electronics" },
        { _id: "upsell_bandaid", name: "Hansaplast Medicated Bandages", price: 30, originalPrice: 35, weight: "8 Strips", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&auto=format&fit=crop", category: "Emergency" }
    ];

    // Student Emergency Essentials list
    const emergencyEssentials = [
        { _id: "emerg_bandaid", name: "Hansaplast Medicated Bandages", price: 30, originalPrice: 35, weight: "8 Strips", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&auto=format&fit=crop", category: "Emergency" },
        { _id: "emerg_dettol", name: "Dettol Liquid Antiseptic", price: 56, originalPrice: 62, weight: "100ml", image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=200&auto=format&fit=crop", category: "Emergency" },
        { _id: "emerg_pcm", name: "Crocin Paracetamol Tablets", price: 18, originalPrice: 20, weight: "15 Tablets", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop", category: "Emergency" },
        { _id: "emerg_mosquito", name: "Odomos Mosquito Repellent Cream", price: 48, originalPrice: 50, weight: "50g", image: "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=200&auto=format&fit=crop", category: "Emergency" },
        { _id: "emerg_sanitizer", name: "Lifebuoy Hand Sanitizer", price: 25, originalPrice: 30, weight: "50ml", image: "https://images.unsplash.com/photo-1584483777135-217362f6b2dd?w=200&auto=format&fit=crop", category: "Emergency" }
    ];

    const isDesktop = windowWidth >= 1024;

    const renderShimmer = () => (
        <div style={{ display: "flex", gap: "16px", overflow: "hidden", padding: "10px 0" }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="shimmer-card" style={{
                    minWidth: "140px",
                    height: "180px",
                    background: "#f3f4f6",
                    borderRadius: "16px",
                    animation: "pulseShimmer 1.5s infinite"
                }} />
            ))}
        </div>
    );

    // Reusable Quantity Stepper component for all Recommendation cards
    const renderQuantityControl = (prod, onAddEventName = "recommendation_add_to_cart") => {
        const itemId = prod._id || prod.id;
        const cartItem = cartItems.find(item => String(item._id || item.id) === String(itemId));
        const qty = cartItem ? cartItem.quantity : 0;

        if (qty === 0) {
            return (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod);
                        console.log(`Analytics Event: ${onAddEventName}`, { productId: itemId });
                    }}
                    style={{
                        background: "white",
                        color: "#318616",
                        border: "1.5px solid #318616",
                        borderRadius: "8px",
                        padding: "4px 14px",
                        fontWeight: "800",
                        fontSize: "12px",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(49, 134, 22, 0.08)",
                        transition: "all 0.15s ease",
                        minWidth: "64px",
                        textAlign: "center"
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = "#318616";
                        e.currentTarget.style.color = "white";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.color = "#318616";
                    }}
                >
                    ADD
                </button>
            );
        }

        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                background: "#318616",
                color: "white",
                border: "1.5px solid #318616",
                borderRadius: "8px",
                padding: "2px 4px",
                boxShadow: "0 2px 6px rgba(49, 134, 22, 0.15)",
                gap: "8px",
                height: "26px"
            }}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (cartItem) {
                            removeFromCart(cartItem);
                        }
                    }}
                    style={{
                        border: "none",
                        background: "transparent",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "800",
                        fontSize: "14px",
                        padding: "0 4px",
                        lineHeight: 1
                    }}
                >
                    -
                </button>
                <span style={{ fontSize: "12px", fontWeight: "800", minWidth: "14px", textAlign: "center" }}>
                    {qty}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod);
                    }}
                    style={{
                        border: "none",
                        background: "transparent",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "800",
                        fontSize: "14px",
                        padding: "0 4px",
                        lineHeight: 1
                    }}
                >
                    +
                </button>
            </div>
        );
    };

    const renderProductCarousel = (title, icon, list, onAddEventName) => {
        if (!lazyLoaded) return (
            <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1f2937", marginBottom: "8px" }}>{icon} {title}</h3>
                {renderShimmer()}
            </div>
        );

        return (
            <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1f2937", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{icon}</span> {title}
                </h3>
                <div style={{
                    display: "flex",
                    gap: "12px",
                    overflowX: "auto",
                    paddingBottom: "8px",
                    scrollbarWidth: "none"
                }} className="hide-scrollbar">
                    {list.map((prod) => {
                        const discount = prod.originalPrice ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100) : 0;
                        return (
                            <div
                                key={prod._id || prod.id}
                                onClick={() => console.log("Analytics Event: recommendation_click", { productId: prod._id || prod.id })}
                                style={{
                                    minWidth: "130px",
                                    width: "130px",
                                    background: "white",
                                    borderRadius: "16px",
                                    padding: "8px",
                                    border: "1px solid #f3f4f6",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.01)",
                                    position: "relative"
                                }}
                            >
                                {discount > 0 && (
                                    <span style={{
                                        position: "absolute",
                                        top: "6px",
                                        left: "6px",
                                        background: "#ef4444",
                                        color: "white",
                                        fontSize: "9px",
                                        fontWeight: "800",
                                        padding: "2px 5px",
                                        borderRadius: "4px",
                                        zIndex: 1
                                    }}>
                                        {discount}% OFF
                                    </span>
                                )}
                                <img
                                    src={getOptimizedImageUrl(prod.image, "thumbnail", prod)}
                                    alt={prod.name}
                                    style={{
                                        width: "100%",
                                        height: "80px",
                                        objectFit: "contain",
                                        borderRadius: "10px",
                                        marginBottom: "6px"
                                    }}
                                />
                                <div>
                                    <h4 style={{ fontSize: "12px", fontWeight: "700", color: "#1f2937", margin: "0 0 2px 0", height: "30px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                        {prod.name}
                                    </h4>
                                    <p style={{ color: "#6b7280", fontSize: "10px", margin: "0 0 4px 0" }}>{prod.weight}</p>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <b style={{ fontSize: "13px", color: "#111827" }}>₹{prod.price}</b>
                                        {prod.originalPrice && <s style={{ fontSize: "9px", color: "#9ca3af" }}>₹{prod.originalPrice}</s>}
                                    </div>
                                    {renderQuantityControl(prod, onAddEventName)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Subcomponents for structured flow
    const renderCartItems = () => (
        cartItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize: "50px" }}>😢</span>
                <h2 style={{ fontSize: "20px", marginTop: "14px", color: "#374151" }}>Your cart is empty</h2>
                <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>Add items from our catalog to get started</p>
                <button onClick={() => navigate("/")} style={{ background: "#318616", color: "white", border: "none", padding: "12px 24px", borderRadius: "14px", fontWeight: "700", cursor: "pointer" }}>Shop Now</button>
            </div>
        ) : (
            <div style={{ background: "white", borderRadius: "24px", padding: windowWidth < 768 ? "16px" : "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1f2937" }}>Cart Items</h3>
                    <span style={{ color: "#6b7280", fontSize: "13px", fontWeight: "600" }}>Standard Delivery: 30 Mins</span>
                </div>

                {checkoutSummary && (
                    <div style={{
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)",
                        borderRadius: "18px",
                        border: "1px solid #d1fae5",
                        padding: "14px 16px",
                        marginBottom: "20px",
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "16px", fontWeight: "900", color: "#1f2937" }}>{checkoutSummary.totalItems}</span>
                            <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "700", marginTop: "2px", textAlign: "center" }}>Shopping List Items</span>
                        </div>
                        <div style={{ width: "1px", height: "24px", background: "#d1fae5" }} />
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "16px", fontWeight: "900", color: "#15803d" }}>{checkoutSummary.matchedCount}</span>
                            <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "700", marginTop: "2px", textAlign: "center" }}>Matched Products</span>
                        </div>
                        <div style={{ width: "1px", height: "24px", background: "#d1fae5" }} />
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "16px", fontWeight: "900", color: "#b91c1c" }}>{checkoutSummary.unavailableCount}</span>
                            <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "700", marginTop: "2px", textAlign: "center" }}>Unavailable Items</span>
                        </div>
                        <div style={{ width: "1px", height: "24px", background: "#d1fae5" }} />
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "16px", fontWeight: "900", color: "#b45309" }}>{checkoutSummary.needsSelectionCount}</span>
                            <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "700", marginTop: "2px", textAlign: "center" }}>Needs Selection</span>
                        </div>
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {cartItems.map((item) => (
                        <div key={item._id || item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #f3f4f6" }}>
                            <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                                <img src={getOptimizedImageUrl(item.image, "thumbnail", item)} alt={item.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "14px" }} />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1f2937" }}>{item.name}</h4>

                                    {item.addedFromShoppingList && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                                            <span style={{
                                                fontSize: "10px",
                                                fontWeight: "900",
                                                color: "#047857",
                                                background: "#d1fae5",
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                alignSelf: "flex-start"
                                            }}>
                                                Selected via Shopping List
                                            </span>
                                            {item.originalShoppingListName && (
                                                <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "700" }}>
                                                    Original: {item.originalShoppingListName}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <p style={{ color: "#6b7280", margin: "4px 0 6px 0", fontSize: "12px" }}>{item.weight}</p>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <b style={{ fontSize: "15px" }}>₹{item.price}</b>
                                        {item.originalPrice && <s style={{ color: "#9ca3af", fontSize: "12px" }}>₹{item.originalPrice}</s>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "4px 8px" }}>
                                    <button onClick={() => removeFromCart(item)} style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: "700", padding: "0 6px" }}>-</button>
                                    <span style={{ fontSize: "14px", fontWeight: "700", padding: "0 8px" }}>{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: "700", padding: "0 6px" }}>+</button>
                                </div>
                                <button onClick={() => removeFromCartCompletely(item._id || item.id)} style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    );

    const renderDidYouForget = () => (
        cartItems.length > 0 && (
            <div style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1f2937", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🛒</span> Did You Forget?
                </h3>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", scrollbarWidth: "none" }} className="hide-scrollbar">
                    {["Snacks", "Cold Drinks", "Personal Care", "Dairy", "Fruits", "Bakery"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "10px",
                                border: "none",
                                background: activeTab === tab ? "#318616" : "#f3f4f6",
                                color: activeTab === tab ? "white" : "#4b5563",
                                fontWeight: "750",
                                fontSize: "13px",
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Horizonal Carousel List */}
                <div style={{
                    display: "flex",
                    gap: "14px",
                    overflowX: "auto",
                    padding: "10px 0",
                    scrollbarWidth: "none"
                }} className="hide-scrollbar">
                    {getTabProducts().length === 0 ? (
                        <div style={{ color: "#9ca3af", fontSize: "13px", padding: "20px" }}>No items currently available in this category</div>
                    ) : (
                        getTabProducts().map((prod) => {
                            const discount = prod.originalPrice ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100) : 0;
                            return (
                                <div
                                    key={prod._id || prod.id}
                                    onClick={() => console.log("Analytics Event: recommendation_click", { productId: prod._id || prod.id, tab: activeTab })}
                                    style={{
                                        minWidth: "130px",
                                        width: "130px",
                                        background: "white",
                                        borderRadius: "16px",
                                        padding: "8px",
                                        border: "1px solid #f3f4f6",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        position: "relative"
                                    }}
                                >
                                    {discount > 0 && (
                                        <span style={{
                                            position: "absolute",
                                            top: "6px",
                                            left: "6px",
                                            background: "#ef4444",
                                            color: "white",
                                            fontSize: "9px",
                                            fontWeight: "800",
                                            padding: "2px 5px",
                                            borderRadius: "4px",
                                            zIndex: 1
                                        }}>
                                            {discount}% OFF
                                        </span>
                                    )}
                                    <img src={getOptimizedImageUrl(prod.image, "thumbnail", prod)} alt={prod.name} style={{ width: "100%", height: "80px", objectFit: "contain", borderRadius: "10px", marginBottom: "6px" }} />
                                    <div>
                                        <h4 style={{ fontSize: "12px", fontWeight: "700", color: "#1f2937", margin: "0 0 2px 0", height: "30px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                            {prod.name}
                                        </h4>
                                        <p style={{ color: "#6b7280", fontSize: "10px", margin: "0 0 6px 0" }}>{prod.weight}</p>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <b style={{ fontSize: "13px", color: "#111827" }}>₹{prod.price}</b>
                                            {prod.originalPrice && <s style={{ fontSize: "9px", color: "#9ca3af" }}>₹{prod.originalPrice}</s>}
                                        </div>
                                        {renderQuantityControl(prod, "recommendation_add_to_cart")}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )
    );

    const renderAddressSection = () => (
        <div style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1f2937" }}>📍 Delivery Address</h3>
                <button onClick={openAddModal} style={{ border: "none", background: "transparent", color: "#318616", fontSize: "12px", fontWeight: "800", cursor: "pointer" }}>
                    + Add New
                </button>
            </div>

            {/* Address List */}
            {addresses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px", color: "#6b7280", border: "1.5px dashed #cbd5e1", borderRadius: "14px", marginBottom: "14px" }}>
                    <p style={{ margin: "0 0 10px 0", fontSize: "12px" }}>No saved addresses yet</p>
                    <button onClick={openAddModal} style={{ background: "#318616", color: "white", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "750", cursor: "pointer" }}>
                        [ Add New Address ]
                    </button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                    {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr._id;
                        return (
                            <div
                                key={addr._id}
                                onClick={() => handleSelectAddress(addr)}
                                style={{
                                    padding: "12px",
                                    borderRadius: "14px",
                                    border: `1.5px solid ${isSelected ? "#318616" : "#e5e7eb"}`,
                                    background: isSelected ? "rgba(49, 134, 22, 0.04)" : "white",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    position: "relative"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <span style={{ fontSize: "10px", background: "#cbd5e1", color: "#333", padding: "2px 6px", borderRadius: "4px", fontWeight: "800" }}>{addr.label}</span>
                                        {addr.isDefault && <span style={{ fontSize: "10px", background: "#d1fae5", color: "#065f46", padding: "2px 6px", borderRadius: "4px", fontWeight: "800" }}>DEFAULT</span>}
                                    </div>
                                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                                        Used: {new Date(addr.lastUsedAt || addr.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <b style={{ fontSize: "13px", color: "#374151" }}>{addr.fullName}</b>
                                <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "6px" }}>({addr.phone})</span>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#4b5563", lineHeight: "1.4" }}>
                                    {addr.addressLine}
                                    {addr.landmark && `, Landmark: ${addr.landmark}`}
                                </p>
                                {addr.roomNumber && <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#6b7280" }}>Room/Flat: {addr.roomNumber}</p>}

                                {/* Address actions */}
                                <div style={{ display: "flex", gap: "12px", marginTop: "8px", borderTop: "1px solid #f3f4f6", paddingTop: "6px" }}>
                                    <button onClick={(e) => openEditModal(addr, e)} style={{ border: "none", background: "transparent", color: "#2563eb", fontSize: "11px", fontWeight: "750", cursor: "pointer", padding: 0 }}>Edit</button>
                                    <button onClick={(e) => handleDeleteAddress(addr._id, e)} style={{ border: "none", background: "transparent", color: "#ef4444", fontSize: "11px", fontWeight: "750", cursor: "pointer", padding: 0 }}>Delete</button>
                                    {!addr.isDefault && (
                                        <button onClick={(e) => handleSetDefaultAddress(addr._id, e)} style={{ border: "none", background: "transparent", color: "#059669", fontSize: "11px", fontWeight: "750", cursor: "pointer", padding: 0, marginLeft: "auto" }}>Set as Default</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {!isAddressServiceable && selectedAddressId && (
                <div style={{ marginTop: "12px", background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                    📍 Selected address is outside our delivery zone. Please choose another address.
                </div>
            )}
        </div>
    );

    const renderGreenInitiative = () => (
        <div style={{
            background: noBagPledge ? "#d1fae5" : "white",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
            border: `1.5px solid ${noBagPledge ? "#10b981" : "transparent"}`,
            transition: "all 0.2s ease",
            marginBottom: "20px"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: noBagPledge ? "#065f46" : "#1f2937" }}>
                        🌱 No Bag Pledge
                    </h4>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#059669", display: "block", marginTop: "2px" }}>
                        Earn +2 BuyCoins Reward
                    </span>
                    <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: noBagPledge ? "#047857" : "#6b7280" }}>
                        Opt out of paper bags for a greener delivery.
                    </p>
                </div>
                <div
                    onClick={handleNoBagToggle}
                    style={{
                        width: "56px",
                        height: "30px",
                        background: noBagPledge ? "#10b981" : "#e5e7eb",
                        borderRadius: "999px",
                        position: "relative",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    <div style={{
                        width: "24px",
                        height: "24px",
                        background: "white",
                        borderRadius: "50%",
                        position: "absolute",
                        top: "3px",
                        left: noBagPledge ? "29px" : "3px",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                        transition: "all 0.2s"
                    }} />
                </div>
            </div>
        </div>
    );

    const renderCoupons = () => (
        <div style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1f2937" }}>🎁 Coupons</h3>
                {activeCoupons.length > 0 && (
                    <span style={{ fontSize: "11px", background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", color: "#d97706", padding: "2px 8px", borderRadius: "6px", fontWeight: "800" }}>
                        {activeCoupons.length} Available
                    </span>
                )}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                {activeCoupons.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>No coupons currently available</span>
                ) : (
                    activeCoupons.map((coupon) => {
                        const isEligible = subtotal >= (coupon.minimumOrderValue || coupon.minOrderValue || 149);
                        const isApplied = selectedCoupon?._id === coupon._id;
                        return (
                            <button
                                key={coupon._id}
                                disabled={!isEligible}
                                onClick={() => {
                                    if (isApplied) {
                                        setSelectedCoupon(null, "cart");
                                    } else {
                                        setSelectedCoupon(coupon, "cart");
                                        setToast(coupon);
                                        setTimeout(() => setToast(null), 2500);
                                        console.log("Analytics Event: coupon_applied", { couponCode: coupon.couponCode });
                                    }
                                }}
                                style={{
                                    background: isApplied ? "#318616" : "white",
                                    color: isApplied ? "white" : isEligible ? "#318616" : "#9ca3af",
                                    border: `1.5px solid ${isApplied ? "#318616" : isEligible ? "#318616" : "#e5e7eb"}`,
                                    borderRadius: "10px",
                                    padding: "6px 12px",
                                    fontWeight: "800",
                                    fontSize: "12px",
                                    cursor: isEligible ? "pointer" : "not-allowed",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                {coupon.couponCode} {isApplied && "✓"}
                            </button>
                        );
                    })
                )}
            </div>
            {activeCoupons.length > 0 && (
                <button
                    onClick={() => navigate("/profile?tab=coupons")}
                    style={{
                        width: "100%",
                        padding: "10px",
                        background: "#f3f4f6",
                        color: "#374151",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "750",
                        fontSize: "12px",
                        cursor: "pointer",
                        marginTop: "8px"
                    }}
                >
                    Apply Coupon Code &gt;
                </button>
            )}
        </div>
    );

    const renderBuyCoins = () => (
        isLoggedIn && (
            <div style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1f2937" }}>💰 BuyCoins</h3>
                    <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "650" }}>
                        Balance: {availableCoins} Coins
                    </span>
                </div>
                <p style={{ margin: "0 0 12px 0", fontSize: "11px", color: "#6b7280" }}>Redeem coins for instant discount (Max 20% of subtotal: {Math.floor(subtotal * 0.20)} coins)</p>

                <div style={{ display: "flex", alignItems: "center", justifyBox: "space-between", background: "#f9fafb", padding: "10px 16px", borderRadius: "14px", border: "1px solid #e5e7eb", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#374151" }}>Use Coins:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={() => handleCoinsChange(coinsToRedeem - 1)}
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                border: "1px solid #d1d5db",
                                background: "white",
                                fontSize: "16px",
                                fontWeight: "800",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifybox: "center",
                                justifyContent: "center"
                            }}
                        >
                            -
                        </button>
                        <span style={{ fontSize: "15px", fontWeight: "850", minWidth: "20px", textAlign: "center" }}>
                            {coinsToRedeem}
                        </span>
                        <button
                            onClick={() => handleCoinsChange(coinsToRedeem + 1)}
                            style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                border: "1px solid #d1d5db",
                                background: "white",
                                fontSize: "16px",
                                fontWeight: "800",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifybox: "center",
                                justifyContent: "center"
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>

                {coinsToRedeem > 0 && (
                    <div style={{ marginTop: "10px", background: "#d1fae5", color: "#065f46", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", textAlign: "center" }}>
                        🎉 Applied! You Save ₹{coinsToRedeem}
                    </div>
                )}
            </div>
        )
    );

    const renderBillDetails = () => (
        <div style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
            <CartBillDetails billBreakdown={billBreakdown} />

            {/* Extra highlight of savings */}
            {(billBreakdown.couponDiscount > 0 || billBreakdown.buyCoinsDiscount > 0 || billBreakdown.originalTotal > billBreakdown.total) && (
                <div style={{ background: "rgba(34, 197, 94, 0.08)", color: "#16a34a", padding: "12px", borderRadius: "14px", marginTop: "14px", fontSize: "13px", fontWeight: "800", textAlign: "center" }}>
                    Total Savings on this order: ₹{billBreakdown.originalTotal - billBreakdown.total} 🎉
                </div>
            )}

            {/* Proceed Button rendered in flow */}
            {cartItems.length > 0 && (
                <button
                    disabled={!selectedAddressId || !isAddressServiceable}
                    onClick={() => {
                        if (!isLoggedIn) {
                            openLogin(() => navigate("/payment"));
                        } else {
                            navigate("/payment");
                        }
                    }}
                    style={{
                        width: "100%",
                        background: (selectedAddressId && isAddressServiceable) ? "#318616" : "#9ca3af",
                        color: "white",
                        border: "none",
                        padding: "16px",
                        borderRadius: "16px",
                        fontSize: "16px",
                        fontWeight: "800",
                        cursor: (selectedAddressId && isAddressServiceable) ? "pointer" : "not-allowed",
                        marginTop: "16px",
                        boxShadow: (selectedAddressId && isAddressServiceable) ? "0 4px 12px rgba(49,134,22,0.25)" : "none",
                        transition: "all 0.2s"
                    }}
                >
                    {!isLoggedIn ? "Continue with Phone Number →" : !selectedAddressId ? "Select Delivery Address to Continue" : !isAddressServiceable ? "Location Unserviceable" : "Proceed to Pay"}
                </button>
            )}
        </div>
    );

    const renderOtherRecommendations = () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* CAMPUS & HOSTEL ESSENTIALS */}
            <div style={{ background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1f2937", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🛍</span> Campus & Hostel Essentials
                </h3>
                <div style={{
                    display: "flex",
                    gap: "14px",
                    overflowX: "auto",
                    paddingBottom: "10px",
                    scrollbarWidth: "none"
                }} className="hide-scrollbar">
                    {studentEssentials.map((prod) => (
                        <div
                            key={prod._id}
                            style={{
                                minWidth: "140px",
                                width: "140px",
                                background: "white",
                                borderRadius: "18px",
                                padding: "10px",
                                border: "1px solid #f3f4f6",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.01)",
                                position: "relative"
                            }}
                        >
                            <span style={{ position: "absolute", top: "4px", left: "4px", background: "#3b82f6", color: "white", fontSize: "8px", fontWeight: "850", padding: "2px 5px", borderRadius: "4px", textTransform: "uppercase", zIndex: 1 }}>Hostel Kit</span>
                            <img src={getOptimizedImageUrl(prod.image, "thumbnail", prod)} alt={prod.name} style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "10px", marginTop: "12px", marginBottom: "6px" }} />
                            <div>
                                <h4 style={{ fontSize: "12px", fontWeight: "700", color: "#1f2937", margin: "0 0 2px 0", height: "30px", overflow: "hidden" }}>{prod.name}</h4>
                                <p style={{ color: "#6b7280", fontSize: "10px", margin: "0 0 6px 0" }}>{prod.weight}</p>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <b style={{ fontSize: "13px", color: "#111827" }}>₹{prod.price}</b>
                                {renderQuantityControl(prod, "upsell_added")}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* EMERGENCY ESSENTIALS */}
            {renderProductCarousel("Emergency Essentials", "🚨", emergencyEssentials, "upsell_added")}

            {/* OTHER CAROUSELS */}
            {renderProductCarousel("Recommended For You", "✨", recommendedList, "recommendation_add_to_cart")}
            {renderProductCarousel("Trending Near You", "🔥", trendingList, "recommendation_add_to_cart")}
            {renderProductCarousel("Best Deals Today", "⚡", bestDeals, "recommendation_add_to_cart")}
        </div>
    );

    return (
        <div className="page-with-bottom-nav" style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            <div style={{ maxWidth: "1600px", margin: "0 auto", padding: windowWidth < 768 ? "12px" : "24px", paddingBottom: "140px" }}>

                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button onClick={() => navigate("/")} style={{ border: "none", background: "transparent", fontSize: "28px", cursor: "pointer" }}>←</button>
                        <h1 style={{ fontSize: windowWidth < 768 ? "22px" : "30px", fontWeight: "850", margin: 0, color: "#111827" }}>
                            Checkout Cart
                        </h1>
                    </div>
                    <div style={{ padding: "10px 14px", borderRadius: "14px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "18px" }}>🛒</span>
                        <b style={{ color: "#318616" }}>{cartItems.length} Items</b>
                    </div>
                </div>

                {/* MAIN GRID LAYOUT */}
                {isDesktop ? (
                    /* DESKTOP 70/30 DOUBLE-COLUMN LAYOUT */
                    <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "24px" }}>
                        {/* LEFT COLUMN: Cart items, Did You Forget, Emergency, etc. */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {renderCartItems()}
                            {renderDidYouForget()}
                            {renderOtherRecommendations()}
                        </div>

                        {/* RIGHT COLUMN: Address selection, Coupons, BuyCoins, Green Initiative, Bill Details, Checkout button (Sticky) */}
                        <div style={{ position: "sticky", top: "24px", height: "fit-content", display: "flex", flexDirection: "column", gap: "20px" }}>
                            {renderAddressSection()}
                            {renderCoupons()}
                            {renderBuyCoins()}
                            {renderGreenInitiative()}
                            {renderBillDetails()}
                        </div>
                    </div>
                ) : (
                    /* MOBILE FLOW: Cart -> Address -> Coupons -> BuyCoins -> Green Initiative -> Bill Details -> Checkout Button -> Recommendations */
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {renderCartItems()}
                        {renderAddressSection()}
                        {renderCoupons()}
                        {renderBuyCoins()}
                        {renderGreenInitiative()}
                        {renderBillDetails()}
                        {renderDidYouForget()}
                        {renderOtherRecommendations()}
                    </div>
                )}

            </div>

            {/* FIXED STICKY BOTTOM BAR FOR MOBILE */}
            {!isDesktop && cartItems.length > 0 && (
                <div style={{
                    position: "fixed",
                    bottom: `${MOBILE_NAV_TOTAL_OFFSET}px`,
                    left: "0",
                    right: "0",
                    background: "white",
                    padding: "14px 20px",
                    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    zIndex: 999
                }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>Total to Pay</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                            <span style={{ fontSize: "22px", fontWeight: "850", color: "#111827" }}>₹{total}</span>
                            {originalTotal > total && <s style={{ fontSize: "14px", color: "#9ca3af" }}>₹{originalTotal}</s>}
                        </div>
                    </div>

                    <button
                        disabled={!selectedAddressId || !isAddressServiceable}
                        onClick={() => {
                            if (!isLoggedIn) {
                                openLogin(() => navigate("/payment"));
                            } else {
                                navigate("/payment");
                            }
                        }}
                        style={{
                            background: (selectedAddressId && isAddressServiceable) ? "#318616" : "#9ca3af",
                            color: "white",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "14px",
                            fontSize: "14px",
                            fontWeight: "800",
                            cursor: (selectedAddressId && isAddressServiceable) ? "pointer" : "not-allowed",
                            boxShadow: (selectedAddressId && isAddressServiceable) ? "0 4px 12px rgba(49,134,22,0.2)" : "none"
                        }}
                    >
                        {!isLoggedIn ? "Continue with Phone Number →" : !selectedAddressId ? "Select Address" : !isAddressServiceable ? "Unserviceable" : "Proceed to Pay"}
                    </button>
                </div>
            )}

            {/* ADDRESS MODAL (ADD / EDIT) */}
            {showAddressModal && (
                <div className="address-modal-wrapper" style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 99999,
                    padding: "20px",
                    backdropFilter: "blur(4px)"
                }}>
                    <form onSubmit={handleAddressFormSubmit} className="address-modal-form" style={{
                        background: "white",
                        borderRadius: "24px",
                        padding: "24px",
                        width: "100%",
                        maxWidth: "460px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        maxHeight: "90vh",
                        overflowY: "auto"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1f2937" }}>
                                {addressForm.id ? "Edit Delivery Address" : "Add New Address"}
                            </h3>
                            <button type="button" onClick={() => setShowAddressModal(false)} style={{ border: "none", background: "transparent", fontSize: "18px", cursor: "pointer", fontWeight: "800" }}>✕</button>
                        </div>

                        {/* Real Interactive Leaflet Map */}
                        <div style={{
                            width: "100%",
                            height: windowWidth < 768 ? "300px" : "320px",
                            borderRadius: "16px",
                            overflow: "hidden",
                            border: "1px solid #e5e7eb",
                            position: "relative"
                        }}>
                            <MapContainer
                                center={mapCenter}
                                zoom={16}
                                style={{ width: "100%", height: "100%", zIndex: 1 }}
                                zoomControl={true}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <Marker
                                    position={markerPos}
                                    draggable={true}
                                    icon={L.icon({
                                        iconUrl: markerIcon,
                                        iconRetinaUrl: markerIcon2x,
                                        shadowUrl: markerShadow,
                                        iconSize: [25, 41],
                                        iconAnchor: [12, 41],
                                        popupAnchor: [1, -34],
                                        shadowSize: [41, 41],
                                        className: "leaflet-marker-bounce"
                                    })}
                                    eventHandlers={{
                                        dragend: (e) => {
                                            const latLng = e.target.getLatLng();
                                            handleMapClickOrMarkerDrag(latLng.lat, latLng.lng);
                                        }
                                    }}
                                />
                                <ChangeMapView center={mapCenter} />
                                <MapEventsHandler onMapClick={(coords) => handleMapClickOrMarkerDrag(coords[0], coords[1])} />
                            </MapContainer>
                        </div>

                        {/* Live Serviceability Banner under Map */}
                        {serviceabilityMessage && (
                            <div style={{
                                padding: "10px 14px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "800",
                                background: isModalAddressServiceable ? "#d1fae5" : "#fee2e2",
                                color: isModalAddressServiceable ? "#065f46" : "#991b1b"
                            }}>
                                {serviceabilityMessage}
                            </div>
                        )}

                        {/* Use Current Location Action Button */}
                        <button
                            type="button"
                            onClick={detectGpsLocation}
                            disabled={gpsDetecting}
                            style={{
                                padding: "10px",
                                background: "#f3f4f6",
                                border: "1.5px solid #cbd5e1",
                                borderRadius: "10px",
                                color: "#374151",
                                fontWeight: "750",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                cursor: gpsDetecting ? "not-allowed" : "pointer"
                            }}
                        >
                            📍 {gpsDetecting ? "Detecting Location..." : "Auto-Detect My GPS Location"}
                        </button>

                        {/* Confirmation of Geocoded Location */}
                        {showLocationConfirm && (
                            <div style={{
                                background: "#f0fdf4",
                                padding: "12px",
                                borderRadius: "14px",
                                border: "1px solid #bbf7d0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px"
                            }}>
                                <span style={{ fontSize: "11px", color: "#166534", fontWeight: "800" }}>Detected Location:</span>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#1f2937", fontWeight: "700", lineHeight: "1.4" }}>
                                    {detectedAddressText}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAddressForm(prev => ({
                                            ...prev,
                                            addressLine: detectedAddressText,
                                            latitude: markerPos[0],
                                            longitude: markerPos[1]
                                        }));
                                        setShowLocationConfirm(false);
                                        setToast({ couponCode: "Location confirmed successfully", discountAmount: 0 });
                                        setTimeout(() => setToast(null), 1500);
                                    }}
                                    style={{
                                        background: "#16a34a",
                                        color: "white",
                                        border: "none",
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        fontWeight: "800",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)"
                                    }}
                                >
                                    [ Confirm Location ]
                                </button>
                            </div>
                        )}

                        {/* Label selector */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "6px" }}>Address Label</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {["Hostel", "Home", "PG", "Office", "Other"].map((lbl) => (
                                    <button
                                        key={lbl}
                                        type="button"
                                        onClick={() => setAddressForm(prev => ({ ...prev, label: lbl }))}
                                        style={{
                                            flex: 1,
                                            padding: "8px",
                                            borderRadius: "10px",
                                            border: `1.5px solid ${addressForm.label === lbl ? "#318616" : "#e5e7eb"}`,
                                            background: addressForm.label === lbl ? "rgba(49, 134, 22, 0.04)" : "white",
                                            color: addressForm.label === lbl ? "#318616" : "#4b5563",
                                            fontWeight: "750",
                                            fontSize: "12px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={addressForm.fullName}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Enter full name"
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>Phone Number</label>
                            <input
                                type="tel"
                                required
                                value={addressForm.phone}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter 10-digit mobile number"
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                            />
                        </div>

                        {/* Address Line (Read-only representation from Map Pin) */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>Address / Area</label>
                            <textarea
                                required
                                readOnly
                                rows={2}
                                value={addressForm.addressLine}
                                placeholder="Locate and Confirm your address on the map above"
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f3f4f6", fontSize: "13px", outline: "none", resize: "none", cursor: "not-allowed" }}
                            />
                            <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#6b7280" }}>Address area is automatically derived from your confirmed map pin location.</p>
                        </div>

                        {/* Landmark */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>Landmark (Optional)</label>
                            <input
                                type="text"
                                value={addressForm.landmark}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                                placeholder="e.g. Near MIT Gate, Next to food court"
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                            />
                        </div>

                        {/* Room Number */}
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>Room / Flat / Floor Number</label>
                            <input
                                type="text"
                                value={addressForm.roomNumber}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                                placeholder="e.g. Room 204 Block A"
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                            />
                        </div>

                        {/* Default Checkbox */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={addressForm.isDefault}
                                onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                            <label htmlFor="isDefault" style={{ fontSize: "12px", fontWeight: "700", color: "#4b5563", cursor: "pointer" }}>
                                Set as Default Address
                            </label>
                        </div>

                        <button
                            type="submit"
                            style={{
                                width: "100%",
                                background: "#318616",
                                color: "white",
                                border: "none",
                                padding: "12px",
                                borderRadius: "12px",
                                fontWeight: "800",
                                fontSize: "14px",
                                cursor: "pointer",
                                marginTop: "8px"
                            }}
                        >
                            Save and Select Address
                        </button>
                    </form>
                </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div style={{
                    position: "fixed",
                    bottom: "90px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#10b981",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.25)",
                    zIndex: 99999,
                    fontWeight: "800",
                    fontSize: "13px",
                    animation: "toastSlideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                }}>
                    {toast.couponCode === "Address Selected" ? "📍 Saved Address Selected!" :
                        toast.couponCode.includes("success") ? `✅ ${toast.couponCode}` :
                            `✅ ${toast.couponCode} Applied! Saving ₹${toast.discountAmount}`}
                </div>
            )}

            {/* PHONE MODAL FOR GUEST CHECKOUT */}
            {showPhoneModal && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 99999,
                    padding: "20px",
                    backdropFilter: "blur(4px)"
                }}>
                    <form onSubmit={handlePhoneSubmit} style={{
                        background: "white",
                        borderRadius: "24px",
                        padding: "24px",
                        width: "100%",
                        maxWidth: "400px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        fontFamily: "'Outfit', 'Inter', sans-serif"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1f2937" }}>
                                Continue with Phone Number
                            </h3>
                            <button type="button" onClick={() => setShowPhoneModal(false)} style={{ border: "none", background: "transparent", fontSize: "18px", cursor: "pointer", fontWeight: "800" }}>✕</button>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: "600", lineHeight: "1.4" }}>
                            Please enter your phone number to place your order.
                        </p>

                        <div>
                            <input
                                type="tel"
                                placeholder="Enter 10-digit Phone Number"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    borderRadius: "12px",
                                    border: "1.5px solid #e5e7eb",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    outline: "none",
                                    boxSizing: "border-box"
                                }}
                            />
                            {phoneError && (
                                <p style={{ color: "#ef4444", fontSize: "12px", margin: "6px 0 0 0", fontWeight: "700" }}>
                                    {phoneError}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            style={{
                                background: "#318616",
                                color: "white",
                                border: "none",
                                padding: "14px",
                                borderRadius: "12px",
                                fontSize: "14px",
                                fontWeight: "800",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)"
                            }}
                        >
                            Continue with Phone Number
                        </button>
                    </form>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes toastSlideUp {
                    0% { transform: translate(-50%, 20px); opacity: 0; }
                    100% { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes pulseShimmer {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                @keyframes markerBounce {
                    0% { transform: translateY(-40px); opacity: 0; }
                    60% { transform: translateY(10px); }
                    80% { transform: translateY(-5px); }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .leaflet-marker-bounce {
                    animation: markerBounce 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                @media (max-width: 767px) {
                    .address-modal-wrapper {
                        padding: 0 !important;
                        align-items: flex-end !important;
                    }
                    .address-modal-form {
                        max-width: 100% !important;
                        width: 100% !important;
                        height: 100vh !important;
                        max-height: 100vh !important;
                        border-radius: 0 !important;
                        padding: 16px !important;
                    }
                }
            `}} />
        </div>
    );
}
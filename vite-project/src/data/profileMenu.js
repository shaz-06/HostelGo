import {
  MapPin,
  Heart,
  Bookmark,
  Coins,
  ShoppingBag,
  Tag,
  FileText,
  Wallet,
  CreditCard,
  Gift,
  Award,
  History,
  Store,
  Users,
  Briefcase,
  HelpCircle,
  Phone,
  MessageSquare,
  AlertTriangle,
  Shield,
  FileSignature,
  RotateCcw,
  Share2,
  Info,
  Bell,
  LogOut
} from "lucide-react";

export const profileMenuConfig = [
  {
    title: "Your Information",
    items: [
      {
        id: "address-book",
        label: "Address Book",
        icon: "https://img.icons8.com/?size=100&id=gVlcJ1bs9RFp&format=png&color=000000",
        actionType: "navigate",
        path: "/address"
      },
      {
        id: "wishlist",
        label: "Wishlist",
        icon: "https://img.icons8.com/?size=100&id=5twNojKL5zU7&format=png&color=000000",
        actionType: "navigate",
        path: "/wishlist"
      },
      {
        id: "saved-items",
        label: "Saved Items",
        icon: "https://img.icons8.com/?size=100&id=3fxG1r3aX8Qo&format=png&color=000000",
        actionType: "navigate",
        path: "/save-for-later"
      },
      {
        id: "buycoins",
        label: "BuyCoins",
        icon: "https://img.icons8.com/?size=100&id=2mE7IySyKxeA&format=png&color=000000",
        actionType: "navigate",
        path: "/buycoins/transactions"
      },
      {
        id: "order-history",
        label: "Order History",
        icon: "https://img.icons8.com/?size=100&id=TGsUUNBPyMx1&format=png&color=000000",
        actionType: "navigate",
        path: "/orders"
      },
      {
        id: "coupons",
        label: "Coupons",
        icon: "https://img.icons8.com/?size=100&id=nhLHGUIsUNsU&format=png&color=000000",
        actionType: "navigate",
        path: "/cart"
      },
      {
        id: "gst-details",
        label: "GST Details",
        icon: FileText,
        actionType: "navigate",
        path: "/profile/edit"
      }
    ]
  },
  {
    title: "Payments",
    items: [
      {
        id: "buyto-wallet",
        label: "Buyto Wallet",
        icon: "https://img.icons8.com/?size=100&id=MjAYkOMsbYOO&format=png&color=000000",
        actionType: "navigate",
        path: "/wallet"
      },
      {
        id: "payment-methods",
        label: "Payment Settings",
        icon: "https://img.icons8.com/?size=100&id=OXnKVMqSMQPz&format=png&color=000000",
        actionType: "navigate",
        path: "/payment-settings"
      },
      {
        id: "gift-cards",
        label: "Claim Gift Cards",
        icon: "https://img.icons8.com/?size=100&id=aPAHTIQEcgiq&format=png&color=000000",
        actionType: "navigate",
        path: "/wallet"
      },
      {
        id: "rewards",
        label: "Your Rewards",
        icon: "https://img.icons8.com/?size=100&id=hjQcdq1rY4qT&format=png&color=000000",
        actionType: "navigate",
        path: "/buycoins/rewards"
      },
      {
        id: "transactions",
        label: "Transaction Hubs",
        icon: "https://img.icons8.com/?size=100&id=AIPfWoh4WrhL&format=png&color=000000",
        actionType: "navigate",
        path: "/buycoins/transactions"
      }
    ]
  },
  {
    title: "Buyto",
    items: [
      {
        id: "become-seller",
        label: "Become Seller",
        icon: "https://img.icons8.com/?size=100&id=WBGSDb5LN2fp&format=png&color=000000",
        actionType: "navigate",
        path: "/rider/signup"
      },
      {
        id: "refer-earn",
        label: "Refer & Earn",
        icon: "https://img.icons8.com/?size=100&id=8VXh2TzKXNG8&format=png&color=000000",
        actionType: "navigate",
        path: "/buycoins/rewards"
      },
      {
        id: "partner-with-buyto",
        label: "Partner with Buyto",
        icon: "https://img.icons8.com/?size=100&id=80676&format=png&color=000000",
        actionType: "navigate",
        path: "/about"
      },
      {
        id: "careers",
        label: "Careers",
        icon: "https://img.icons8.com/?size=100&id=VfcK55OADyK5&format=png&color=000000",
        actionType: "navigate",
        path: "/about"
      }
    ]
  },
  {
    title: "Support",
    items: [
      {
        id: "help-center",
        label: "Help Center",
        icon: "https://img.icons8.com/?size=100&id=19nQzXuCO2It&format=png&color=000000",
        actionType: "navigate",
        path: "/help"
      },
      {
        id: "contact-us",
        label: "Contact Us",
        icon: "https://img.icons8.com/?size=100&id=hTTzWSpAOgIV&format=png&color=000000",
        actionType: "navigate",
        path: "/contact"
      },
      {
        id: "chat-support",
        label: "Chat Support",
        icon: "https://img.icons8.com/?size=100&id=SKPXwfsncJbF&format=png&color=000000",
        actionType: "navigate",
        path: "/support/chat"
      },
      {
        id: "report-issue",
        label: "Report an Issue",
        icon: "https://img.icons8.com/?size=100&id=p79PqSNjz7DK&format=png&color=000000",
        actionType: "navigate",
        path: "/contact"
      }
    ]
  },
  {
    title: "Legal",
    items: [
      {
        id: "privacy-policy",
        label: "Privacy Policy",
        icon: "https://img.icons8.com/?size=100&id=BL6umjxvbHck&format=png&color=000000",
        actionType: "navigate",
        path: "/privacy-policy"
      },
      {
        id: "terms-conditions",
        label: "Terms & Conditions",
        icon: "https://img.icons8.com/?size=100&id=98D3Zv5q9RkV&format=png&color=000000",
        actionType: "navigate",
        path: "/terms"
      },
      {
        id: "refund-policy",
        label: "Refund policy",
        icon: "https://img.icons8.com/?size=100&id=y8yDCDC1vdTt&format=png&color=000000",
        actionType: "navigate",
        path: "/refund-policy"
      }
    ]
  },
  {
    title: "Other Information",
    items: [
      {
        id: "share-app",
        label: "Share the app",
        icon: "https://img.icons8.com/?size=100&id=jMRRA7Bku6yA&format=png&color=000000",
        actionType: "callback",
        actionKey: "onShare"
      },
      {
        id: "about-buyto",
        label: "About us",
        icon: "https://img.icons8.com/?size=100&id=xxQh3SPI3ID7&format=png&color=000000",
        actionType: "navigate",
        path: "/about"
      },
      {
        id: "notification-preferences",
        label: "Notification preferences",
        icon: "https://img.icons8.com/?size=100&id=TQvX68dIobCH&format=png&color=000000",
        actionType: "navigate",
        path: "/notifications"
      },
      {
        id: "logout",
        label: "Logout",
        icon: "https://img.icons8.com/?size=100&id=j5sJqtadgqDL&format=png&color=000000",
        actionType: "callback",
        actionKey: "onLogout",
        danger: true
      }
    ]
  }
];

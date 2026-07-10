import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ChevronDown, ChevronUp, ArrowLeft, Mail } from "lucide-react";

// Helper to generate SEO-friendly IDs
const getSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

// Helper to highlight matches
const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ backgroundColor: "#fef08a", color: "#1e293b", padding: "0 2px", borderRadius: "2px" }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default function FAQPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaqId, setOpenFaqId] = useState(null);

  const accordionRefs = useRef({});

  // 1. Debounce Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Comprehensive Dataset
  const faqData = useMemo(() => [
    {
      category: "General",
      question: "What is Buyto?",
      answer: "Buyto is a next-generation quick commerce platform designed to simplify your daily shopping. We offer an ultra-fast grocery delivery service that brings fresh produce, dairy, household essentials, personal care items, electronics, and daily requirements straight to your doorstep. Buyto Instant leverages local micro-warehouses to fulfill orders in minutes, saving you time and removing the hassle of physical shopping trips. By combining technology with efficient logistics, we deliver a reliable, secure, and premium doorstep delivery experience suited for modern urban life."
    },
    {
      category: "General",
      question: "How does Buyto work?",
      answer: "Using Buyto is incredibly simple. Customers download our mobile app or access our online grocery shopping website, enter their location, and browse thousands of products across categories like groceries, snacks, beverages, and home care. Once you place an order, our system assigns it to the nearest micro-fulfillment center. Store partners pack the items, and our delivery agents receive the route details to execute a swift instant delivery. You can follow your order via live GPS tracking from dispatch until it arrives safely at your doorstep."
    },
    {
      category: "General",
      question: "Where is Buyto available?",
      answer: "Currently, Buyto is rapidly expanding its quick commerce footprint across major cities and student hubs in India, including specific regions in coastal Karnataka such as Udupi. We operate localized micro-fulfillment hubs to maintain our delivery guarantees. To verify serviceability in your exact neighborhood, simply enter your address or pin code on our homepage. If we aren't active in your area yet, you can sign up for notifications, and we will update you as soon as our instant delivery network expands to your location."
    },
    {
      category: "General",
      question: "What products can I order on Buyto?",
      answer: "Our inventory spans a massive selection of items. You can order fresh fruits, organic vegetables, dairy staples, bread, eggs, household cleaners, personal hygiene products, beverages, quick snacks, baby care essentials, and even electronics and fashion. Whether you need ingredients for dinner, late-night munchies, or last-minute household items, Buyto Instant serves as your one-stop digital convenience store, offering same-day delivery of premium-quality brands directly to you."
    },
    {
      category: "General",
      question: "Is Buyto available 24/7?",
      answer: "Yes, Buyto operations are structured to support your needs around the clock. Our quick commerce service is available 24 hours a day, 7 days a week, though product availability and specific delivery speeds may vary slightly during late-night hours due to local regulations and courier availability. Whether you need early morning breakfast supplies or late-night snacks, Buyto Minutes delivery keeps moving to make sure you never have to wait for your critical grocery delivery needs."
    },
    {
      category: "Delivery",
      question: "How fast does Buyto deliver?",
      answer: "Our delivery speeds are among the fastest in the quick commerce industry. Most grocery delivery orders are fulfilled in under 10 to 30 minutes. We achieve this speed by optimizing our local micro-fulfillment centers (dark stores) and routing our delivery partners using smart technology. By keeping warehouse operations localized, we drastically reduce transit distances, allowing us to offer standard doorstep delivery speeds that feel truly instant."
    },
    {
      category: "Delivery",
      question: "What are Buyto Minutes deliveries?",
      answer: "Buyto Minutes is our premium, ultra-fast delivery service tier designed for urgent situations. When you choose Buyto Minutes during checkout, your order is flagged as high priority, and dispatchers immediately assign a dedicated delivery partner. This service is optimized to deliver your online grocery shopping list in less than 15 minutes, making it the perfect solution for last-minute recipe ingredients, emergency medicine, or immediate snack cravings."
    },
    {
      category: "Delivery",
      question: "What is the delivery charge?",
      answer: "We strive to keep our instant delivery charges as affordable as possible. Our delivery fees are calculated dynamically based on distance, order value, and weather conditions. A nominal base delivery fee applies to standard orders. These fees are displayed clearly on the checkout page before payment. You can also view our fee structure details on our [Shipping Policy](/shipping-policy) page to understand how rates are determined during peak hours or heavy rain."
    },
    {
      category: "Delivery",
      question: "Is there free delivery?",
      answer: "Yes! We offer free delivery on orders that exceed a specific cart value threshold (typically ₹99). Additionally, new users often receive free delivery on their first few orders. We also run regular promotional campaigns where we offer free delivery coupons. Keep an eye on our homepage banner and promotional notifications to take advantage of these savings on your next online grocery shopping order."
    },
    {
      category: "Delivery",
      question: "Can I track my order live?",
      answer: "Absolutely. Once your order is confirmed, you can track its progress in real-time. Our mobile app and website feature an interactive tracking interface showing when your items are being packed, when the courier leaves the store, and their live movement on a map. For complete tracking features, visit our [Order Tracking](/profile) page after placing your order to see live updates and contact details for your delivery partner."
    },
    {
      category: "Delivery",
      question: "What if my order is delayed?",
      answer: "While we maintain an exceptional track record for on-time delivery, occasional delays can occur due to extreme weather, heavy traffic, or high order volumes. If your delivery is delayed, we will notify you immediately with an updated ETA. In such cases, we offer compensation in the form of BuyCoins or discounts. If you have concerns about a delayed package, please reach out to our team immediately through our [Contact Page](/contact)."
    },
    {
      category: "Delivery",
      question: "Can I schedule a delivery?",
      answer: "Yes, we offer scheduled slots alongside our instant delivery options. During checkout, you can opt for same-day delivery at a later time or choose a convenient slot for the next day. This is ideal for bulk grocery delivery orders or when you want to ensure you are home to receive fresh fruits and vegetables. Simply select 'Schedule Delivery' and choose your preferred window before making your payment."
    },
    {
      category: "Orders",
      question: "How do I place an order?",
      answer: "Placing an order is extremely simple. First, search for items using our search bar or browse through our product categories. Add the items you need to your cart, and review your selection on our [Cart Page](/cart). When ready, click 'Proceed to Checkout', verify your delivery address, select a payment method, and complete the order. Your request will be instantly transmitted to our local warehouse for immediate packaging."
    },
    {
      category: "Orders",
      question: "Can I cancel my order?",
      answer: "To ensure fast delivery, our packing process begins immediately. You can cancel your order free of charge within 60 seconds of placing it. After this window, cancellations are only possible if the store has not yet packed your order. If you need to request a cancellation, navigate to your active order page and check if the 'Cancel Order' option is still active, or contact customer support."
    },
    {
      category: "Orders",
      question: "Can I modify my order after placing it?",
      answer: "Because we process orders in minutes to maintain our instant delivery promise, we cannot modify items once an order is confirmed. If you forgot an item, the fastest solution is to place a separate order for the additional products. If you need to remove an item or change your address, please cancel the order within the 60-second grace period and place a new one with the correct details."
    },
    {
      category: "Orders",
      question: "What happens if an item is out of stock?",
      answer: "If an item in your order goes out of stock during packaging, we will handle it based on your preferences. You can choose to receive a call for substitutes, allow us to automatically replace it with a similar item, or simply refund the missing item. Any refunds for out-of-stock products are processed immediately to your original payment source or credited as BuyCoins to your wallet."
    },
    {
      category: "Orders",
      question: "How do I reorder a previous purchase?",
      answer: "We make repeating your regular grocery delivery orders fast and easy. Navigate to your Profile page, click on 'My Orders', and view your order history. Each past invoice has a 'Reorder' button that adds all the items from that purchase directly back into your cart in a single click. From there, you can adjust quantities or proceed straight to checkout for a fast reorder."
    },
    {
      category: "Payments",
      question: "Which payment methods are accepted?",
      answer: "We support a wide array of secure payment options to make online grocery shopping seamless. You can pay using UPI (Google Pay, PhonePe, Paytm), Debit and Credit Cards (Visa, Mastercard, RuPay), Net Banking, and popular digital wallets. All transactions are processed through highly secure payment gateways to safeguard your financial details. You can view payment configurations on our [Terms & Conditions](/terms) page."
    },
    {
      category: "Payments",
      question: "Is Cash on Delivery (COD) available?",
      answer: "Yes, Cash on Delivery is available for most locations and order types. You can select 'Cash on Delivery' at checkout and pay our delivery partner when they arrive at your door. We accept cash and, in many cases, our delivery partners carry UPI QR codes so you can pay digitally at the time of delivery. Please note that COD may have order limits based on user account history."
    },
    {
      category: "Payments",
      question: "Are online payments secure?",
      answer: "Security is our top priority. All online payments on Buyto are protected using industry-standard SSL encryption and follow strict PCI-DSS guidelines. We partner with India's leading payment processors, including Razorpay, to ensure your card details and banking credentials are never stored on our servers. Your transactions are fully protected with multi-factor authentication (such as OTPs) for maximum peace of mind."
    },
    {
      category: "Payments",
      question: "Will I receive an invoice?",
      answer: "Yes, a digital invoice is generated for every order. As soon as your transaction is completed, a summary is sent to your registered email address. You can also view, print, or download detailed PDF invoices for any past order by logging into your account, navigating to 'My Orders' in your profile, and clicking 'Download Invoice' on the respective transaction."
    },
    {
      category: "Refunds & Returns",
      question: "How do refunds work?",
      answer: "If you receive a damaged, incorrect, or missing item, you are eligible for a refund. To initiate a refund request, navigate to 'My Orders' in your profile, select the order, click 'Raise an Issue', and upload a picture of the item. Our support team will review the request and approve it if it aligns with our [Refund Policy](/refund-policy). Once approved, refunds are processed instantly."
    },
    {
      category: "Refunds & Returns",
      question: "How long does it take to receive a refund?",
      answer: "Once a refund is approved, it is initiated immediately. Refunds credited to your BuyCoins wallet are available instantly for your next purchase. For refunds sent to your original payment method (bank account, credit card, or UPI), the funds typically reflect within 5 to 7 business days, depending on your bank's processing cycles. Read more on our [Refund Policy](/refund-policy) page."
    },
    {
      category: "Refunds & Returns",
      question: "Can I return groceries?",
      answer: "For hygiene and safety reasons, perishable goods like fresh fruits, vegetables, dairy, bread, and frozen foods cannot be returned once delivered. However, if there is a quality issue, we will issue a full refund or replacement. Non-perishable packaged items can be returned within 24 hours of delivery if they are unopened, sealed, and in their original packaging."
    },
    {
      category: "Refunds & Returns",
      question: "What if I receive a damaged product?",
      answer: "We take immense care in packaging, but if an item arrives damaged, we will make it right. Please take a photo of the damaged product and report it within 3 hours of delivery through our app's support chat or by visiting our [Contact Page](/contact). We will issue a replacement or process a full refund to your account immediately after verifying the issue."
    },
    {
      category: "Refunds & Returns",
      question: "What if an item is missing from my order?",
      answer: "If an item is missing, please check your digital receipt to see if it was marked as out-of-stock and refunded. If you were charged for the item but it did not arrive, contact our support team immediately. We will check with the delivery partner and warehouse, and either arrange a priority delivery of the missing item or issue a full refund to your wallet."
    },
    {
      category: "Account",
      question: "How do I create a Buyto account?",
      answer: "Creating a Buyto account takes less than a minute. Simply open our app or website, click on 'Sign Up' or 'Login', and enter your mobile number. We will send a secure One-Time Password (OTP) to your phone. Enter the OTP, fill in basic details like your name and email, and your account will be active. Your details are secured in accordance with our [Privacy Policy](/privacy-policy)."
    },
    {
      category: "Account",
      question: "Can I order without creating an account?",
      answer: "To ensure secure payments, order tracking, and account security, we require users to register with a valid mobile number before checkout. However, you can browse products, add items to your cart, check prices, and search the platform as a guest without creating an account. This allows you to explore our quick commerce catalog before registering."
    },
    {
      category: "Account",
      question: "How do I reset my password?",
      answer: "Buyto uses secure passwordless OTP logins for most user accounts, meaning you do not need to memorize a password. If you set a custom password for your account, you can reset it by clicking 'Forgot Password' on the login screen. We will verify your identity via an OTP sent to your registered mobile number, allowing you to set a new password securely."
    },
    {
      category: "Account",
      question: "How do I change my phone number?",
      answer: "To update your phone number, navigate to your Profile page, click on 'Account Settings', and select 'Update Phone Number'. For security, you will need to complete OTP verification on both your old phone number and your new phone number. If you no longer have access to your old number, please contact customer support for assistance."
    },
    {
      category: "Offers",
      question: "How do promo codes work?",
      answer: "Promo codes offer discounts, free items, or cashbacks. To apply a promo code, add items to your cart and go to the Cart page. Under 'Apply Coupon', you will see active offers. Select a coupon from the list or type in a custom code and click 'Apply'. The discount will be reflected immediately in your bill details before you proceed to checkout."
    },
    {
      category: "Offers",
      question: "Can I use multiple coupons?",
      answer: "No, we only allow one promo code or coupon code to be applied per order. This is standard across quick commerce platforms. However, you can combine a coupon discount with existing store discounts on individual products and redeem your earned BuyCoins rewards in the same transaction to maximize your savings."
    },
    {
      category: "Offers",
      question: "Why is my coupon not working?",
      answer: "Coupons may fail to apply if the order does not meet the minimum cart value, if the code has expired, or if it is restricted to specific categories or payment methods. Make sure to read the terms of the coupon by clicking 'Info' next to the code. If you believe there is an error, please reach out to our team through our support page."
    },
    {
      category: "Offers",
      question: "How do I earn rewards?",
      answer: "We reward loyalty through our BuyCoins program. For every order you place, you earn a percentage of the purchase value back as BuyCoins. You can also earn extra coins by participating in review challenges, referring friends, or buying promotional items. BuyCoins can be redeemed directly at checkout as cash discounts on your future orders."
    },
    {
      category: "Sellers",
      question: "Where do Buyto products come from?",
      answer: "Buyto partners directly with authorized distributors, local farmers, and certified brand partners. We house products in our own micro-fulfillment centers to ensure rigorous quality control. This direct-sourcing model allows us to guarantee that all items are fresh, authentic, and stored under optimal temperature-controlled conditions before delivery."
    },
    {
      category: "Sellers",
      question: "Are products genuine?",
      answer: "Yes, we guarantee that 100% of the products sold on Buyto are genuine and authentic. We bypass middle-men and source directly from authorized brand partners and manufacturers. Every item undergoes quality checks at our fulfillment centers, and we actively monitor expiration dates to ensure you receive only high-quality products."
    },
    {
      category: "Sellers",
      question: "How are fresh fruits and vegetables sourced?",
      answer: "We source our fresh fruits and vegetables daily from local farms and trusted agricultural partners. Items are sorted and quality-checked at our sorting facility before being shipped to local micro-warehouses. We maintain cold-chain storage to preserve nutrients and freshness, ensuring farm-fresh produce reaches your doorstep in pristine condition."
    },
    {
      category: "Privacy & Security",
      question: "Is my personal information safe?",
      answer: "Yes, your privacy is protected under strict security protocols. We use advanced encryption standards (AES-256) to secure your personal data, address information, and contact details. We comply with all national data protection standards. For a complete breakdown of how we handle and protect your information, please read our [Privacy Policy](/privacy-policy)."
    },
    {
      category: "Privacy & Security",
      question: "Does Buyto share my data?",
      answer: "No, Buyto does not sell or share your personal data with third-party advertisers. We only share essential details (like address and phone number) with your assigned delivery partner to facilitate order delivery. For payment processing, secure third-party gateways are used directly, ensuring your banking information remains private and protected."
    },
    {
      category: "Privacy & Security",
      question: "How do I delete my account?",
      answer: "If you wish to delete your account, navigate to 'Account Settings' on your profile page and select 'Delete Account'. This will permanently remove your personal details, order history, and active BuyCoins from our servers. Please note that this action is irreversible, and we will delete all data in compliance with our data retention rules."
    },
    {
      category: "Delivery Partners",
      question: "How can I become a Buyto delivery partner?",
      answer: "Joining our delivery network is a great way to earn flexible income. To apply, navigate to the 'Join as Delivery Partner' section on our website or download our partner app. Complete the registration form, upload the required documents, and attend a brief online training session. Once approved, you can start accepting orders and earning immediately."
    },
    {
      category: "Delivery Partners",
      question: "What are the requirements?",
      answer: "To become a delivery partner, you must be at least 18 years old, own a smartphone (Android or iOS), and have a reliable vehicle (bicycle, scooter, or motorcycle). You will need to provide a valid driving license, vehicle registration, Aadhaar card, and active bank account details for weekly payouts. Background checks are conducted before approval."
    },
    {
      category: "Delivery Partners",
      question: "How are delivery partners paid?",
      answer: "Our partners receive weekly payouts directly to their bank accounts. Earnings consist of a base rate per delivery, distance incentives, and peak-hour bonuses. Partners keep 100% of the customer tips they receive. We also offer medical insurance coverage and performance bonuses to active delivery partners to support their well-being."
    },
    {
      category: "Businesses",
      question: "Can local stores sell on Buyto?",
      answer: "Yes, we support local commerce and partner with local businesses, supermarkets, and specialty stores to broaden our quick commerce reach. By listing on Buyto, local merchants can immediately access thousands of customers in their vicinity and leverage our fast logistics network to fulfill deliveries without managing their own couriers."
    },
    {
      category: "Businesses",
      question: "How do I register my business?",
      answer: "To register your business, visit our 'Seller Registration' portal and submit details including your business name, GST number, FSSAI license (for food items), and bank details. Our seller onboarding team will review your application, assist in listing your products, and help set up integration with our micro-fulfillment network."
    },
    {
      category: "Support",
      question: "How can I contact Buyto support?",
      answer: "You can reach our support team 24/7 through several channels. The fastest way to get help is through the in-app support chat on our [Contact Page](/contact). You can also email us at support@buyto.co.in or call our helpline number listed on your invoice. Our support staff is always ready to assist you with active orders, refunds, or technical issues."
    },
    {
      category: "Support",
      question: "What should I do if my order has an issue?",
      answer: "If your order has an issue (damaged product, missing item, or delayed courier), open your profile and select the order in question. Click 'Raise an Issue' and select the specific items affected. You can choose to start a live support chat or request a call. We will resolve your issue immediately by processing a refund or arranging a replacement."
    },
    {
      category: "Support",
      question: "How quickly does customer support respond?",
      answer: "We aim for rapid response times. Live chat requests are usually connected to a support executive in under 60 seconds. Emails sent to support@buyto.co.in are resolved within 2 hours. Our dedicated quick commerce support team is equipped to issue instant refunds, update delivery instructions, and handle merchant concerns in real time."
    },
    {
      category: "SEO",
      question: "What is the best grocery delivery app in India?",
      answer: "Buyto is quickly establishing itself as a premier grocery delivery app in India, especially in coastal Karnataka regions like Udupi. We differentiate our quick commerce service by offering localized warehouse operations, guaranteed fresh sourcing, and ultra-fast delivery. By combining local micro-warehouses with state-of-the-art logistics technology, we ensure your essential groceries reach you in optimal condition, making us a top choice for modern online grocery shopping."
    },
    {
      category: "SEO",
      question: "Which app delivers groceries in minutes?",
      answer: "Buyto is the go-to app that delivers groceries in minutes. Through Buyto Instant and our signature Buyto Minutes service, we specialize in delivering fresh fruits, vegetables, snacks, beverages, and dairy in under 15 minutes. We optimize our micro-fulfillment centers locally to minimize packing and dispatch delays, bringing true quick commerce speed directly to your doorstep."
    },
    {
      category: "SEO",
      question: "Is Buyto better than traditional grocery shopping?",
      answer: "Yes, Buyto offers significant advantages over traditional grocery shopping. Instead of traveling to a supermarket, standing in long checkout queues, and carrying heavy bags, Buyto allows you to perform online grocery shopping from home. We deliver fresh produce and daily essentials directly to your doorstep in minutes, giving you back valuable time while maintaining competitive pricing."
    },
    {
      category: "SEO",
      question: "Which app offers instant grocery delivery?",
      answer: "Buyto offers leading instant grocery delivery services. Our quick commerce model is designed for immediate fulfillment, ensuring that fresh groceries, snacks, household items, and personal care products are dispatched instantly. Our delivery agents bring orders to your doorstep within minutes, eliminating the need to wait hours or days for your grocery delivery."
    },
    {
      category: "SEO",
      question: "How does Buyto compare with Blinkit?",
      answer: "While Blinkit is a major player in quick commerce, Buyto offers a highly personalized local grocery delivery experience. We specialize in served areas (like Udupi) with tailored inventories, local brand partnerships, and optimized routes. Buyto Instant provides faster packing speeds, higher quality checks on fresh produce, and a rewarding BuyCoins loyalty program, delivering premium value."
    },
    {
      category: "SEO",
      question: "How does Buyto compare with Zepto?",
      answer: "Zepto is known for 10-minute deliveries, and Buyto matches this speed with our local micro-fulfillment centers. Buyto Instant separates itself by offering an intuitive interface, better local customer support, and direct sourcing from regional farms. This ensures fresh fruits and vegetables are of superior quality, providing an exceptional online grocery shopping experience."
    },
    {
      category: "SEO",
      question: "How does Buyto compare with Instamart?",
      answer: "Swiggy Instamart is integrated into a multi-service app, whereas Buyto is a dedicated, laser-focused quick commerce and grocery delivery platform. This focus allows us to provide a clutter-free shopping experience, faster customer support response times, and lower delivery fee thresholds, making Buyto a more efficient choice for your daily household needs."
    },
    {
      category: "SEO",
      question: "Why choose Buyto for grocery delivery?",
      answer: "You should choose Buyto because we combine speed, quality, and community value. We guarantee authentic products, fresh farm sourcing, and ultra-fast delivery. Our loyalty program, BuyCoins, offers real cashback on every order. With transparent pricing, 24/7 customer support, and dedicated micro-fulfillment centers, Buyto delivers the ultimate convenience in quick commerce."
    },
    {
      category: "SEO",
      question: "What is Buyto Instant?",
      answer: "Buyto Instant is our core quick commerce service tier, offering instant delivery of groceries, fresh vegetables, dairy products, snacks, and daily essentials. Using our network of localized dark stores, Buyto Instant ensures that order preparation, packing, and dispatch occur in under 5 minutes, allowing couriers to reach your doorstep shortly after checkout."
    },
    {
      category: "SEO",
      question: "How do Buyto Minutes deliveries work?",
      answer: "Buyto Minutes deliveries work by prioritizing your order in our local micro-fulfillment centers. Once chosen, packers prioritize your basket, and our system matches the order with the nearest active courier. This seamless pipeline reduces warehouse packing times to under 3 minutes, facilitating a rapid instant delivery to your doorstep in minutes."
    }
  ], []);

  // Filter Categories
  const categories = useMemo(() => [
    "all",
    "General",
    "Delivery",
    "Orders",
    "Payments",
    "Refunds & Returns",
    "Account",
    "Offers",
    "Sellers",
    "Privacy & Security",
    "Delivery Partners",
    "Businesses",
    "Support",
    "SEO"
  ], []);

  // 2. Filter FAQs by Category and Query (Memoized)
  const filteredFaqs = useMemo(() => {
    return faqData.filter((faq) => {
      const categoryMatch = selectedCategory === "all" || faq.category === selectedCategory;
      const query = debouncedQuery.trim().toLowerCase();
      if (!query) return categoryMatch;

      const questionMatch = faq.question.toLowerCase().includes(query);
      const answerMatch = faq.answer.toLowerCase().includes(query);
      const catMatch = faq.category.toLowerCase().includes(query);

      return categoryMatch && (questionMatch || answerMatch || catMatch);
    });
  }, [faqData, selectedCategory, debouncedQuery]);

  // Group filtered FAQs by category for semantic rendering
  const groupedFaqs = useMemo(() => {
    const groups = {};
    filteredFaqs.forEach((faq) => {
      if (!groups[faq.category]) {
        groups[faq.category] = [];
      }
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFaqs]);

  // 3. Schema JSON-LD Generation (Memoized)
  const faqSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqData.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }, [faqData]);

  const breadcrumbSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.buyto.co.in"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Help",
          "item": "https://www.buyto.co.in/profile"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Frequently Asked Questions",
          "item": "https://www.buyto.co.in/faq"
        }
      ]
    };
  }, []);

  // 4. Inject Meta Tags & Schema into Head on Mount, Clean up on Unmount
  useEffect(() => {
    // FAQ Schema
    const faqScript = document.createElement("script");
    faqScript.type = "application/ld+json";
    faqScript.id = "faq-jsonld";
    faqScript.text = JSON.stringify(faqSchema);
    document.head.appendChild(faqScript);

    // Breadcrumb Schema
    const breadcrumbScript = document.createElement("script");
    breadcrumbScript.type = "application/ld+json";
    breadcrumbScript.id = "breadcrumb-jsonld";
    breadcrumbScript.text = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(breadcrumbScript);

    // Page Meta Tags
    document.title = "Buyto FAQs | Delivery, Orders, Payments & Support";
    
    let metaDescription = document.querySelector("meta[name='description']");
    let isNewDesc = false;
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
      isNewDesc = true;
    }
    const oldDesc = metaDescription.getAttribute("content");
    metaDescription.setAttribute("content", "Find answers to common questions about Buyto, including Buyto Instant deliveries, Buyto Minutes, payments, refunds, orders, delivery partners, and customer support.");

    // Robots Tag
    let metaRobots = document.querySelector("meta[name='robots']");
    let isNewRobots = false;
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      metaRobots.content = "index, follow";
      document.head.appendChild(metaRobots);
      isNewRobots = true;
    }

    // Open Graph
    const ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    ogTitle.content = "Buyto FAQs | Delivery, Orders, Payments & Support";
    document.head.appendChild(ogTitle);

    const ogDesc = document.createElement("meta");
    ogDesc.setAttribute("property", "og:description");
    ogDesc.content = "Find answers to common questions about Buyto, including Buyto Instant deliveries, Buyto Minutes, payments, refunds, orders, delivery partners, and customer support.";
    document.head.appendChild(ogDesc);

    const ogUrl = document.createElement("meta");
    ogUrl.setAttribute("property", "og:url");
    ogUrl.content = "https://www.buyto.co.in/faq";
    document.head.appendChild(ogUrl);

    const ogType = document.createElement("meta");
    ogType.setAttribute("property", "og:type");
    ogType.content = "website";
    document.head.appendChild(ogType);

    const twitterCard = document.createElement("meta");
    twitterCard.name = "twitter:card";
    twitterCard.content = "summary_large_image";
    document.head.appendChild(twitterCard);

    return () => {
      faqScript.remove();
      breadcrumbScript.remove();
      if (isNewDesc) {
        metaDescription.remove();
      } else {
        metaDescription.setAttribute("content", oldDesc || "");
      }
      if (isNewRobots) {
        metaRobots.remove();
      }
      ogTitle.remove();
      ogDesc.remove();
      ogUrl.remove();
      ogType.remove();
      twitterCard.remove();
    };
  }, [faqSchema, breadcrumbSchema]);

  // 5. Handling Dynamic Deep Linking & History Navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        setOpenFaqId(id);
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            // Respect sticky header offset (around 80px)
            const yOffset = -90; 
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }, 100);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Initial check on load
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleQuestionToggle = (id) => {
    if (openFaqId === id) {
      setOpenFaqId(null);
      // Remove hash cleanly without page jump
      window.history.pushState(null, "", window.location.pathname + window.location.search);
    } else {
      setOpenFaqId(id);
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const handleKeyDown = (event, id) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleQuestionToggle(id);
    }
  };

  // Convert raw text links in answer into standard anchor tags
  const renderAnswerText = (text) => {
    // Regex matches [Link Text](/path)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      const prevText = text.substring(lastIndex, match.index);
      if (prevText) {
        parts.push(<HighlightText key={`text-${lastIndex}`} text={prevText} highlight={debouncedQuery} />);
      }
      const linkText = match[1];
      const linkHref = match[2];
      parts.push(
        <a
          key={`link-${match.index}`}
          href={linkHref}
          onClick={(e) => {
            if (linkHref.startsWith("/")) {
              e.preventDefault();
              navigate(linkHref);
            }
          }}
          style={{
            color: "#16a34a",
            fontWeight: "700",
            textDecoration: "underline",
            transition: "color 0.15s ease"
          }}
          onMouseOver={(e) => e.target.style.color = "#15803d"}
          onMouseOut={(e) => e.target.style.color = "#16a34a"}
        >
          {linkText}
        </a>
      );
      lastIndex = markdownLinkRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(<HighlightText key={`text-${lastIndex}`} text={remainingText} highlight={debouncedQuery} />);
    }

    return parts;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "80px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: "#1e293b",
        boxSizing: "border-box"
      }}
    >
      {/* Sticky Sub-Header with Breadcrumb & Back button */}
      <div
        style={{
          position: "sticky",
          top: "var(--header-height, 60px)",
          zIndex: 900,
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          padding: "12px 20px",
          boxSizing: "border-box"
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          {/* Visual Clickable Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>
            <span
              onClick={() => navigate("/")}
              style={{ cursor: "pointer", transition: "color 0.15s" }}
              onMouseOver={(e) => e.target.style.color = "#16a34a"}
              onMouseOut={(e) => e.target.style.color = "#64748b"}
            >
              Home
            </span>
            <span style={{ margin: "0 8px" }}>&gt;</span>
            <span
              onClick={() => navigate("/profile")}
              style={{ cursor: "pointer", transition: "color 0.15s" }}
              onMouseOver={(e) => e.target.style.color = "#16a34a"}
              onMouseOut={(e) => e.target.style.color = "#64748b"}
            >
              Help
            </span>
            <span style={{ margin: "0 8px" }}>&gt;</span>
            <span style={{ color: "#16a34a" }}>Frequently Asked Questions</span>
          </nav>

          <button
            onClick={() => navigate("/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "999px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "14px",
              boxShadow: "0 4px 10px rgba(22, 163, 74, 0.2)",
              transition: "transform 0.15s ease, background 0.15s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#15803d";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#16a34a";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <ArrowLeft size={16} /> Back to Profile
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 20px" }}>
        
        {/* Header Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "40px", fontWeight: "900", color: "#0f172a", marginBottom: "12px", letterSpacing: "-1px" }}>
            Buyto Frequently Asked Questions
          </h1>
          <p style={{ fontSize: "18px", color: "#64748b", maxWidth: "600px", margin: "0 auto 24px auto", fontWeight: "500" }}>
            Get instant solutions to deliveries, payments, refunds, and support inquiries.
          </p>

          {/* Premium Search Box */}
          <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}>
            <Search style={{ position: "absolute", left: "18px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
            <input
              type="text"
              placeholder="Search by topic, question, or keyword (e.g. 'refund')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 20px 16px 52px",
                fontSize: "16px",
                border: "2px solid #e2e8f0",
                borderRadius: "16px",
                outline: "none",
                background: "#ffffff",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxSizing: "border-box",
                fontWeight: "500"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#16a34a";
                e.target.style.boxShadow = "0 0 0 4px rgba(22, 163, 74, 0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.03)";
              }}
            />
          </div>
        </div>

        {/* Count/Status Indicator */}
        {debouncedQuery.trim() !== "" && (
          <div style={{ textAlign: "center", marginBottom: "20px", fontSize: "15px", fontWeight: "600", color: "#475569" }}>
            Found {filteredFaqs.length} match{filteredFaqs.length === 1 ? "" : "es"} for "{debouncedQuery}"
          </div>
        )}

        {/* Categories Navigation Layout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Mobile Horizontal Chips View */}
          <div className="mobile-only-chips" style={{ overflowX: "auto", display: "flex", gap: "8px", paddingBottom: "10px", WebkitOverflowScrolling: "touch" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: "8px 16px",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: selectedCategory === cat ? "#16a34a" : "#e2e8f0",
                  background: selectedCategory === cat ? "#16a34a" : "#fff",
                  color: selectedCategory === cat ? "#fff" : "#475569",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {cat === "all" ? "All Categories" : cat === "SEO" ? "Popular Keywords" : cat}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "35px", alignItems: "flex-start" }}>
            {/* Desktop Sidebar Navigation */}
            <aside className="desktop-only-sidebar" style={{ width: "260px", flexShrink: 0, position: "sticky", top: "140px", background: "white", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "850", color: "#0f172a", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Filter Categories
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: selectedCategory === cat ? "rgba(22, 163, 74, 0.08)" : "transparent",
                      color: selectedCategory === cat ? "#16a34a" : "#475569",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseOver={(e) => {
                      if (selectedCategory !== cat) e.currentTarget.style.background = "#f1f5f9";
                    }}
                    onMouseOut={(e) => {
                      if (selectedCategory !== cat) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {cat === "all" ? "All Categories" : cat === "SEO" ? "Popular Keywords" : cat}
                  </button>
                ))}
              </div>
            </aside>

            {/* Accordion List Content */}
            <main style={{ flexGrow: 1, minWidth: 0 }}>
              {filteredFaqs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "40px" }}>🔍</span>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "16px", marginBottom: "8px" }}>
                    No FAQs matched your search
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "15px", maxWidth: "340px", margin: "0 auto" }}>
                    Try searching for another topic or navigate through categories on the left.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                  {Object.keys(groupedFaqs).map((catName) => (
                    <section key={catName} aria-labelledby={`cat-heading-${catName}`} style={{ background: "white", padding: "24px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
                      
                      <h2 id={`cat-heading-${catName}`} style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", borderBottom: "2px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#16a34a" }}>●</span> {catName === "SEO" ? "Popular Keywords" : catName}
                      </h2>

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {groupedFaqs[catName].map((faq) => {
                          const slugId = getSlug(faq.question);
                          const isOpen = openFaqId === slugId;

                          return (
                            <article
                              key={slugId}
                              id={slugId}
                              ref={(el) => (accordionRefs.current[slugId] = el)}
                              style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                overflow: "hidden",
                                transition: "border-color 0.15s, box-shadow 0.15s"
                              }}
                            >
                              <button
                                aria-expanded={isOpen}
                                aria-controls={`faq-answer-${slugId}`}
                                onClick={() => handleQuestionToggle(slugId)}
                                onKeyDown={(e) => handleKeyDown(e, slugId)}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "18px 20px",
                                  background: isOpen ? "#f8fafc" : "#ffffff",
                                  border: "none",
                                  outline: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "12px",
                                  transition: "background-color 0.15s"
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.parentElement.style.borderColor = "#16a34a";
                                  e.currentTarget.parentElement.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.1)";
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.parentElement.style.borderColor = "#e2e8f0";
                                  e.currentTarget.parentElement.style.boxShadow = "none";
                                }}
                              >
                                <h3 style={{ fontSize: "16px", fontWeight: "700", color: isOpen ? "#16a34a" : "#1e293b", margin: 0, transition: "color 0.15s" }}>
                                  <HighlightText text={faq.question} highlight={debouncedQuery} />
                                </h3>
                                <span style={{ color: isOpen ? "#16a34a" : "#94a3b8", display: "flex", alignItems: "center" }}>
                                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </span>
                              </button>

                              <div
                                id={`faq-answer-${slugId}`}
                                style={{
                                  maxHeight: isOpen ? "400px" : "0",
                                  opacity: isOpen ? 1 : 0,
                                  overflow: "hidden",
                                  transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease-out",
                                  background: "#ffffff"
                                }}
                              >
                                <div style={{ padding: "20px", borderTop: "1px solid #f1f5f9", lineHeight: "1.7", fontSize: "15px", color: "#475569", fontWeight: "500" }}>
                                  <p style={{ margin: 0 }}>
                                    {renderAnswerText(faq.answer)}
                                  </p>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Help Contact Banner Card */}
        <div
          style={{
            marginTop: "50px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            border: "1px solid #bbf7d0",
            padding: "40px 30px",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(22, 163, 74, 0.05)",
            textAlign: "center",
            boxSizing: "border-box"
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>💬</div>
          <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#14532d", margin: "0 0 10px 0" }}>
            Still Need Help?
          </h2>
          <p style={{ color: "#166534", fontSize: "16px", maxW: "520px", margin: "0 auto 24px auto", lineHeight: "1.6", fontWeight: "500" }}>
            Can't find the answers you need? Our customer support agents are active 24/7 to resolve order issues, payment glitches, or delivery inquiries.
          </p>

          <a
            href="mailto:support@buyto.co.in"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              color: "#16a34a",
              border: "1px solid #bbf7d0",
              padding: "14px 28px",
              borderRadius: "16px",
              fontWeight: "750",
              fontSize: "16px",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
              transition: "transform 0.15s, box-shadow 0.15s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(22, 163, 74, 0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.02)";
            }}
          >
            <Mail size={18} /> support@buyto.co.in
          </a>
        </div>
      </div>

      {/* Inject custom CSS for responsive behavior */}
      <style>{`
        .mobile-only-chips {
          display: none !important;
        }
        @media (max-width: 768px) {
          .desktop-only-sidebar {
            display: none !important;
          }
          .mobile-only-chips {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
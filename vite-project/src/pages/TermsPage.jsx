import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import BackToTop from "../components/common/BackToTop";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-[#0F1115] text-[#111827] dark:text-[#FFFFFF] pb-16 font-sans page-with-bottom-nav">
      <SEO 
        title="Terms & Conditions" 
        description="Read the Terms & Conditions governing the use of Buyto and its services." 
      />

      {/* Top Bar with Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-8 flex justify-between items-center">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm font-semibold text-[#318616] hover:text-[#286f12] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#318616] rounded-lg px-3 py-1.5 border border-[#318616]/20 dark:border-emerald-400/20 bg-[#318616]/5 dark:bg-emerald-400/5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Profile
        </button>
      </div>

      {/* Header Section */}
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-8 text-left space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
          <span className="w-2 h-2 rounded-full bg-[#318616] animate-pulse"></span>
          <span className="text-xs font-semibold text-[#318616] dark:text-emerald-400 uppercase tracking-wider">User Agreement</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.1]">
          Terms & Conditions
        </h1>
        <p className="text-lg text-[#4B5563] dark:text-gray-300 leading-relaxed">
          Please read these Terms & Conditions carefully before using the Buyto platform and services.
        </p>
        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-1">
          Last Updated: September 2026
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* 1. Acceptance of Terms */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            By creating an account, placing an order, or accessing the Buyto application and related interfaces, you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, you should not access or use the platform.
          </p>
        </div>

        {/* 2. User Accounts & Registration */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            2. User Accounts & Registration
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            To place orders, you must register using your mobile number and authenticate via One-Time Password (OTP) verification through supported verification services such as MSG91. You are responsible for keeping your credentials confidential and account details accurate. You agree to notify us immediately of any unauthorized account access.
          </p>
        </div>

        {/* 3. Product Information & Availability */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            3. Product Information & Availability
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            We endeavor to display product images, pricing, and availability as accurately as possible. However, item availability in quick-commerce is dynamic. If an item becomes out of stock during checkout or verification, we reserve the right to remove it from your order and initiate a refund for any prepaid portion associated with that item.
          </p>
        </div>

        {/* 4. Orders & Verification */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            4. Orders & Verification
          </h2>
         <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
  All orders placed on Buyto are subject to acceptance and verification.
  An order may be cancelled or rejected if an item is unavailable,
  the delivery address is outside our service area, payment cannot be
  verified, or the order raises security or fraud concerns.
</p>
        </div>

        {/* 5. Pricing, Fees & Taxes */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            5. Pricing, Fees & Taxes
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Prices displayed in the product catalog are subject to change. The final price, inclusive of all charges, is calculated and displayed on the checkout screen before payment. Charges as applicable may include:
          </p>
          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li><strong>Delivery Fees</strong>: Varied based on order value, distance, or active store configuration. Standard configuration applies a fee on lower-value orders, which may be reduced or waived above specified order thresholds.</li>
            <li><strong>Small Cart Fees</strong>: An additional fee may apply to orders below a minimum subtotal configuration to cover delivery routing costs.</li>
            <li><strong>Surcharges</strong>: Inclement weather surcharges (e.g. rain fee) or late-night surcharges (e.g. for orders placed between late night and early morning hours) may apply dynamically.</li>
            <li><strong>Taxes and Handling</strong>: Goods and Services Tax (GST) and store handling fees are calculated based on applicable categories and order volumes.</li>
            <li><strong>Cash on Delivery (COD) Fees</strong>: An additional convenience charge may apply if Cash on Delivery is selected.</li>
          </ul>
        </div>

        {/* 6. Payments & Payment Providers */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            6. Payments & Payment Providers
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            We support online payment methods (such as cards, UPI, net banking) and Cash on Delivery (COD). Online transactions are securely routed through third-party gateways (e.g. Razorpay). Buyto does not store sensitive payment card credentials. Payment card information is handled by the applicable payment provider in accordance with its security practices and policies.
          </p>
        </div>

        {/* 7. Delivery & Serviceability */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            7. Delivery & Serviceability
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto operates within specific service zones. Serviceability is verified using browser coordinates or user-selected addresses. We dispatch shipments through partner courier services (such as Borzo). Depending on the order, information such as pickup locations, customer delivery addresses, contact names, contact phone numbers, available delivery coordinates, and applicable Cash on Delivery amounts may be shared to facilitate delivery.
          </p>
        </div>

        {/* 8. Cancellations */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            8. Cancellations
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Orders cannot be cancelled directly through the app interface once they have entered the packaging, preparation, or dispatch stages. If you need to request cancellation, you must contact customer support immediately. In the event that a courier dispatch fails or delivery is rejected without justification, you may be held liable for delivery fees.
          </p>
        </div>

        {/* 9. Returns & Refunds */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            9. Returns & Refunds
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Due to the perishable nature of groceries and daily essentials, returns are evaluated on a case-by-case basis (e.g. damaged packaging or incorrect items delivered) via customer support. Approved refunds will be credited back to your original payment source or wallet, subject to bank processing cycles.
          </p>
        </div>

        {/* 10. Offers, Coupons & BuyCoins */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            10. Offers, Coupons & BuyCoins
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Reward tokens ("BuyCoins") and promotional coupons are subject to strict platform parameters:
          </p>
          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li><strong>Earning</strong>: Customers earn BuyCoins based on qualifying product purchases at configured rates (e.g. 1 BuyCoin per ₹100 of final product value, excluding discounts).</li>
            <li><strong>Redemption</strong>: BuyCoins may be redeemed for eligible discounts according to the
redemption rules displayed in the Buyto application at the time of use.</li>
            <li><strong>Cancellation Reversals</strong>: Promotional coupons are subject to the eligibility, minimum order value,
validity period, and other conditions displayed when the coupon is offered.</li>
          </ul>
        </div>

        {/* 11. Prohibited Uses */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            11. Prohibited Uses
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            You agree not to abuse the platform by making fraudulent orders, creating duplicate accounts to bypass promotion limits, reverse-engineering platform logic, deploying automated scrapers, or uploading corrupted materials.
          </p>
        </div>

        {/* 12. Intellectual Property */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            12. Intellectual Property
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            All text, product descriptions, interface designs, logos, software elements, and visual brand assets on Buyto are the exclusive property of the company or its content licensors and are protected under copyright and trademark laws.
          </p>
        </div>

        {/* 13. Limitation of Liability */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            13. Limitation of Liability
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto is provided on an "as-is" and "as-available" basis without any express warranties. We use reasonable technical and organizational measures designed to protect personal information, but do not warrant that delivery services, network connections, or item stock levels will be completely error-free or uninterrupted. To the maximum extent permitted by applicable law, Buyto's liability in connection with the platform will be limited as permitted by applicable law.
          </p>
        </div>

        {/* 14. Indemnification */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            14. Indemnification
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            You agree to indemnify and hold harmless Buyto, its affiliates, processing networks, and delivery partners from any claims, damages, or legal costs arising out of your violation of these Terms or your misuse of the platform.
          </p>
        </div>

        {/* 15. Account Suspension & Termination */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            15. Account Suspension & Termination
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            We reserve the right to suspend, terminate, or restrict your access to your Buyto account immediately, without notice, if we identify violations of these Terms, non-payment, fraud, abuse of promotional offers, or threats to rider and store safety.
          </p>
        </div>

        {/* 16. Account & Data Deletion */}
<div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
  <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
    16. Account & Data Deletion
  </h2>

  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
    You may request deletion of your Buyto account by contacting our support
    team at{" "}
    <a
      href="mailto:supportbuyto@gmail.com"
      className="text-[#318616] dark:text-emerald-400 hover:underline"
    >
      supportbuyto@gmail.com
    </a>.
    Account deletion requests may be subject to verification and applicable
    legal, transaction, fraud-prevention, or record-retention requirements.
  </p>
</div>

        {/* 17. Changes to Terms */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            16. Changes to Terms
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            We may modify these Terms at any time to reflect changing regulations, platform features, or store parameters. The updated Terms will be made available here, with the "Last Updated" timestamp modified accordingly. Continued use of Buyto constitutes acceptance of the modified Terms.
          </p>
        </div>

        {/* 18. Governing Law */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            17. Governing Law & Dispute Resolution
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            These Terms, their interpretation, and any disputes arising from them are governed by applicable laws. Any claims or legal issues related to the platform are subject to resolution before courts of appropriate jurisdiction.
          </p>
        </div>

        {/* 19. Third-Party Services */}
        <div className="p-6 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            18. Third-Party Services
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto relies on selected third-party service providers to support parts of the platform, including payments, delivery, authentication, notifications, media hosting, and analytics. Depending on the service involved, these providers may process information necessary to perform their functions on behalf of Buyto. Their processing is governed by their respective terms and privacy policies. Relevant services may include:
          </p>
          <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li>Razorpay — payment processing</li>
            <li>Borzo — delivery and logistics services</li>
            <li>MSG91 — OTP and phone verification</li>
            <li>Firebase Cloud Messaging — push notifications</li>
            <li>Cloudinary — image and media hosting</li>
            <li>Google Tag Manager — analytics and measurement infrastructure</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pt-2">
            The specific information shared with a third-party provider depends on the service being used and the functionality required.
          </p>
        </div>

        {/* 20. Contact Information */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            19. Contact Information
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            For clarifications regarding these Terms & Conditions, please contact us:
          </p>
          <div className="inline-flex flex-col gap-2 p-4 bg-[#F4FBF7] dark:bg-[#122218] rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 text-xs">
            <span className="font-bold text-[#318616] dark:text-emerald-400">Email Support</span>
            <a href="mailto:supportbuyto@gmail.com" className="hover:underline font-medium text-gray-700 dark:text-gray-200">supportbuyto@gmail.com</a>
            <span className="font-bold text-[#318616] dark:text-emerald-400 mt-2">In-App Live Chat</span>
            <button onClick={() => navigate("/support/chat")} className="hover:underline text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer">Open Buyto Assistant</button>
          </div>
        </div>

        {/* Buyto Customer Promise */}
        <div className="p-8 md:p-10 bg-gradient-to-tr from-[#318616] to-[#22C55E] rounded-3xl shadow-premium text-white space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl -ml-20 -mb-20"></div>
          
          <h2 className="text-2xl font-extrabold relative z-10">
            Our Shopping Promise
          </h2>
          <p className="text-emerald-50 text-sm leading-relaxed relative z-10 max-w-2xl">
            We promise to be clear, transparent, and fair. By setting reasonable rules, we ensure a reliable, safe, and pleasant experience for all our customers and delivery riders.
          </p>
        </div>

      </div>
      <BackToTop />
    </div>
  );
}
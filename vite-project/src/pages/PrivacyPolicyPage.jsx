import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import BackToTop from "../components/common/BackToTop";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-[#0F1115] text-[#111827] dark:text-[#FFFFFF] pb-16 font-sans page-with-bottom-nav">
      <SEO 
        title="Privacy Policy" 
        description="Learn how Buyto collects, uses, protects, and manages your personal information." 
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
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.1]">
          Privacy Policy
        </h1>
        <p className="text-lg text-[#4B5563] dark:text-gray-300 leading-relaxed">
          Your privacy matters. Buyto is committed to protecting your personal information and keeping your data secure.
        </p>
        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-1">
          Last Updated: September 2026
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Information We Collect */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
            Information We Collect
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Depending on how you use Buyto, we may collect information necessary to provide and improve our services.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#318616] dark:text-emerald-400">Account & Verification</h3>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 list-disc pl-4">
                <li>Full Name</li>
                <li>Mobile phone number</li>
                <li>Email address (where voluntarily provided)</li>
                <li>OTP verification information processed through services such as MSG91</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#318616] dark:text-emerald-400">Order & Delivery Information</h3>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 list-disc pl-4">
                <li>Delivery address details and room numbers</li>
                <li>Order history and purchased items</li>
                <li>Coordinates for delivery verification</li>
                <li>Specific delivery coordinates or instructions</li>
              </ul>
            </div>

            <div className="space-y-2 md:col-span-2">
              <h3 className="text-base font-bold text-[#318616] dark:text-emerald-400">Payment Information</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Payments may be processed through third-party payment providers (such as Razorpay). Buyto receives transaction-related details, such as payment IDs and status indicators, necessary to confirm and manage your payment. <strong>Buyto does not store sensitive payment card credentials</strong>. Payment card information is handled by the applicable payment provider in accordance with its security practices and policies.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#318616] dark:text-[#22C55E]">Location Information</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Where permitted by your browser or device permissions, Buyto may use geolocation coordinates to verify service availability. When you save a delivery address, relevant location information may also be stored as part of that address and may be shared with delivery providers when necessary to fulfill an order.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-[#318616] dark:text-[#22C55E]">Device & Technical Information</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                We may collect basic technical information such as device type, operating system, browser or app information, diagnostic information, and crash-related data to maintain platform stability and improve our services.
              </p>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            How We Use Your Information
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            We use the details collected from you for operational, support, and refinement purposes:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li>Operating and managing your shopping account</li>
            <li>Processing, verifying, and delivering store orders</li>
            <li>Coordinating deliveries with logistics partners</li>
            <li>Validating payments and handling refunds</li>
            <li>Answering support tickets and chat queries</li>
            <li>Sending order updates and account warnings</li>
            <li>Analyzing system usage to fix bugs and improve performance</li>
            <li>Preventing fraudulent orders and security abuses</li>
          </ul>
        </div>

        {/* Notifications & Communications */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Notifications & Communications
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto may send important communications related to your account, active orders, payments, deliveries, or safety updates. Device and push-notification registration tokens are synchronized with our servers to deliver real-time order alerts. Where promotional communications are activated, you may toggle your choices at any time through the <strong>Notification Preferences</strong> section in your profile dashboard.
          </p>
        </div>

        {/* How We Share Information */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            How We Share Information
          </h2>
          <p className="text-xs font-semibold text-[#318616] dark:text-emerald-400 leading-relaxed">
            Buyto does not sell your personal information.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            We share information only with third-party vendors whose operations are necessary for service fulfillment, including:
          </p>
          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li><strong>Payment Gateways (Razorpay)</strong>: Securely initialize, process, and confirm transactions. Buyto receives transaction metadata (such as order IDs, payment IDs, status indicators, and transaction timestamps) to confirm payments, but does not store sensitive card credentials.</li>
            <li><strong>Logistics and Courier Integrations (Borzo)</strong>: Depending on the order, information such as pickup locations, customer delivery addresses, contact names, contact phone numbers, available delivery coordinates, and applicable Cash on Delivery amounts may be shared to facilitate delivery.</li>
            <li><strong>Cloud Infrastructure and Media Hosts (Cloudinary)</strong>: Processes and serves product images, static assets, and user-provided avatars.</li>
            <li><strong>Analytics & Measurement Tools (Google Tag Manager)</strong>: Analytics and measurement tools may process technical and usage information to help us understand and improve the service.</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Additionally, we may disclose account information if required to comply with law enforcement, subpoenas, or legal processes, or to safeguard Buyto assets, customer safety, and system security.
          </p>
        </div>

        {/* Data Security & Retention */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-[#111827] dark:text-white">Data Security</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              We use reasonable technical and organizational measures designed to protect personal information from unauthorized access, misuse, loss, alteration, or disclosure. However, no internet-based transmission system can guarantee absolute data security.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-[#111827] dark:text-white">Data Retention</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              We retain personal information for as long as reasonably necessary for the purposes described in this policy, including account administration, transactions, legal obligations, dispute resolution, and security.
            </p>
          </div>
        </div>

        {/* Your Privacy Choices */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Your Privacy Choices
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Depending on applicable local regulations and the information involved, you have options to control how your details are managed:
          </p>
          <ul className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li>You may review or correct your basic profile details within your user dashboard.</li>
            <li>You may opt out of device location sharing by turning off permission toggles within your browser or mobile settings.</li>
            <li>You can configure communication and alert preferences.</li>
            <li>If you require assistance regarding your personal information, or wish to request corrections or updates to your details, you can reach out directly to our support team at <a href="mailto:supportbuyto@gmail.com" className="text-[#318616] dark:text-emerald-400 hover:underline">supportbuyto@gmail.com</a>.</li>
            <li>You may request information about how your personal data is handled by contacting our support team.</li>
          </ul>
        </div>

        {/* Account & Data Deletion */}
<div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
  <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
    Account & Data Deletion
  </h2>

  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
    You may request deletion of your Buyto account and associated personal
    information by contacting our support team at
    <a
      href="mailto:supportbuyto@gmail.com"
      className="text-[#318616] dark:text-emerald-400 hover:underline ml-1"
    >
      supportbuyto@gmail.com
    </a>.
  </p>

  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
    Some information may be retained where necessary to complete transactions,
    comply with legal obligations, resolve disputes, prevent fraud, or maintain
    required business records.
  </p>
</div>

        {/* Cookies & Similar Technologies */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Cookies & Similar Technologies
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto uses browser storage utilities, such as <strong>localStorage</strong> and <strong>sessionStorage</strong>, to maintain your active login session, shopping cart selections, and cached delivery addresses. Third-party services may use cookies or similar identifiers where necessary to provide their services, verify transactions, prevent fraud, or maintain secure states. Buyto does not directly use advertising cookies.
          </p>
        </div>

        {/* Information We Do Not Collect */}
<div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
  <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
    Information We Do Not Collect
  </h2>

  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300 list-disc pl-4">
    <li>Buyto does not store your payment card credentials.</li>
    <li>Buyto does not sell your personal information.</li>
    <li>Buyto does not use personal information for unrelated purposes without appropriate notice or permission.</li>
  </ul>
</div>

        {/* Legal Disclosures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-[#111827] dark:text-white">Children's Privacy</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Buyto is intended for general users and is not knowingly designed to collect personal information from children in violation of applicable law. If you believe a child has provided personal information to Buyto inappropriately, please contact us so that we can review the situation.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-[#111827] dark:text-white">Third-Party Services</h3>
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
        </div>

        {/* Changes to This Privacy Policy */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Changes to This Privacy Policy
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            We may update this policy periodically to account for software upgrades, operational expansions, or regulatory revisions. When edits occur, we will update the "Last Updated" timestamp at the top of the policy page.
          </p>
        </div>

        {/* Contact Us */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Contact Us
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            For questions about how we handle user records or to make privacy inquiries, write to us at:
          </p>
          <div className="inline-flex flex-col gap-2 p-4 bg-[#F4FBF7] dark:bg-[#122218] rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 text-xs">
            <span className="font-bold text-[#318616] dark:text-emerald-400">Email Support</span>
            <a href="mailto:supportbuyto@gmail.com" className="hover:underline font-medium text-gray-700 dark:text-gray-200">supportbuyto@gmail.com</a>
            <span className="font-bold text-[#318616] dark:text-emerald-400 mt-2">In-App Live Chat</span>
            <button onClick={() => navigate("/support/chat")} className="hover:underline text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer">Open Buyto Assistant</button>
          </div>
        </div>

        {/* Buyto Privacy Promise */}
        <div className="p-8 md:p-10 bg-gradient-to-tr from-[#318616] to-[#22C55E] rounded-3xl shadow-premium text-white space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl -ml-20 -mb-20"></div>
          
          <h2 className="text-2xl font-extrabold relative z-10">
            Our Privacy Promise
          </h2>
          <p className="text-emerald-50 text-sm leading-relaxed relative z-10 max-w-2xl">
            Your trust matters to us. We aim to collect and use personal information responsibly, protect it with appropriate safeguards, and use it primarily to provide, maintain, secure, and improve the Buyto experience.
          </p>
        </div>

      </div>
      <BackToTop />
    </div>
  );
}
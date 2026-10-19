import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import BackToTop from "../components/common/BackToTop";

export default function CookiesPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-[#0F1115] text-[#111827] dark:text-[#FFFFFF] pb-16 font-sans page-with-bottom-nav">
      <SEO
        title="Cookies & Similar Technologies Policy"
        description="Learn how Buyto uses cookies, browser storage, and similar technologies to operate and improve its services."
      />

      {/* Top Bar with Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-8 flex justify-between items-center">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm font-semibold text-[#318616] hover:text-[#286f12] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#318616] rounded-lg px-3 py-1.5 border border-[#318616]/20 dark:border-emerald-400/20 bg-[#318616]/5 dark:bg-emerald-400/5 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Profile
        </button>
      </div>

      {/* Header Section */}
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-8 text-left space-y-4">
        

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.1]">
          Cookies & Similar Technologies Policy
        </h1>

        <p className="text-lg text-[#4B5563] dark:text-gray-300 leading-relaxed">
          Learn how Buyto uses cookies, browser storage, and similar
          technologies to operate, secure, and improve the platform.
        </p>

        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-1">
          Last Updated: September 2026
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {/* 1. Introduction */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            1. Introduction
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            This Cookies & Similar Technologies Policy explains how Buyto
            uses cookies, browser storage technologies, and similar
            technologies when you use the Buyto website, mobile application,
            and related services.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            This policy should be read together with the Buyto Privacy Policy
            and Terms & Conditions.
          </p>
        </div>

        {/* 2. What Are Cookies */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            2. What Are Cookies & Similar Technologies?
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Cookies are small pieces of information that may be stored by a
            website or service on a user's device. They can help websites
            remember information about a session, preferences, or interactions.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto also uses browser storage technologies such as
            <strong> localStorage</strong> and
            <strong> sessionStorage</strong>. These technologies are not
            identical to cookies but can serve similar purposes within the
            application.
          </p>
        </div>

        {/* 3. How Buyto Uses Storage */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            3. How Buyto Uses Browser Storage
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto primarily uses browser storage technologies to support
            essential application functionality and provide a smoother
            shopping experience.
          </p>

          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li>Maintaining active login and application session state</li>
            <li>Remembering shopping cart selections</li>
            <li>Storing selected or cached delivery address information</li>
            <li>Remembering relevant application preferences</li>
            <li>Supporting application performance and reliability</li>
          </ul>
        </div>

        {/* 4. Essential Storage */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            4. Essential Storage
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Some storage mechanisms are necessary for Buyto to function
            correctly. They may be used to maintain authentication state,
            shopping cart information, security-related state, and other
            essential application functionality.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Disabling essential browser storage may affect the ability to use
            certain Buyto features or maintain an active session.
          </p>
        </div>

        {/* 5. Authentication & Security */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            5. Authentication & Security
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto may use storage mechanisms and identifiers to maintain
            authenticated sessions, support account security, prevent misuse,
            and help protect transactions.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Authentication and verification services may also process
            information required to verify account access and protect the
            platform.
          </p>
        </div>

        {/* 6. Shopping Cart & Preferences */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            6. Shopping Cart & Preferences
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto may use local browser storage to remember shopping cart
            selections and relevant preferences so that your shopping
            experience remains consistent between application interactions.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Cached information may be updated, replaced, or removed as the
            application changes or when you clear your browser or application
            storage.
          </p>
        </div>

        {/* 7. Location & Delivery Information */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            7. Location & Delivery Information
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto may store selected or cached delivery address information
            locally to make it easier to complete future shopping and delivery
            interactions.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Location permissions and geolocation information are governed by
            your device or browser permissions and are also described in the
            Buyto Privacy Policy.
          </p>
        </div>

        {/* 8. Analytics & Measurement */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            8. Analytics & Measurement
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto may use analytics and measurement infrastructure to
            understand technical performance, usage patterns, and how the
            platform can be improved.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Where third-party analytics or measurement services are used,
            those services may process technical or usage information
            according to their own policies.
          </p>
        </div>

        {/* 9. Third-Party Services */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            9. Third-Party Services
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Certain third-party services integrated with Buyto may use cookies,
            identifiers, storage technologies, or similar mechanisms as part
            of the services they provide.
          </p>

          <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400 list-disc pl-4">
            <li>
              <strong>Razorpay</strong> — payment processing and transaction
              security
            </li>
            <li>
              <strong>Borzo</strong> — delivery and logistics services
            </li>
            <li>
              <strong>MSG91</strong> — OTP and phone verification
            </li>
            <li>
              <strong>Firebase Cloud Messaging</strong> — push notifications
            </li>
            <li>
              <strong>Cloudinary</strong> — image and media hosting
            </li>
            <li>
              <strong>Google Tag Manager</strong> — analytics and measurement
              infrastructure
            </li>
          </ul>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            The technologies and information used by each third-party service
            depend on the functionality being provided. Their processing is
            governed by their respective terms and privacy policies.
          </p>
        </div>

        {/* 10. Advertising Cookies */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            10. Advertising Cookies
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto does not directly use advertising cookies for its own
            advertising activities.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            If this changes in the future, this policy will be updated to
            describe the relevant technologies and their purposes.
          </p>
        </div>

        {/* 11. Managing Cookies & Storage */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            11. Managing Cookies & Storage
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Depending on your device, browser, or operating system, you may be
            able to control, clear, restrict, or disable cookies and local
            storage through your settings.
          </p>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Please note that disabling or clearing essential storage may cause
            certain Buyto features, authentication sessions, cart information,
            or preferences to stop working as intended.
          </p>
        </div>

        {/* 12. Data & Privacy */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            12. Data & Privacy
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Information associated with cookies, browser storage, or similar
            technologies may form part of the information handled by Buyto.
            How Buyto collects, uses, shares, protects, and retains personal
            information is described in our Privacy Policy.
          </p>
        </div>

        {/* 13. Changes to This Policy */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            13. Changes to This Policy
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            We may update this policy periodically to reflect changes in our
            technology, services, operational practices, or applicable
            requirements. When changes are made, the "Last Updated" date at
            the top of this page will be updated accordingly.
          </p>
        </div>

        {/* 14. Contact Us */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            14. Contact Us
          </h2>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            If you have questions about this Cookies & Similar Technologies
            Policy or how Buyto uses browser storage and similar technologies,
            you can contact us:
          </p>

          <div className="inline-flex flex-col gap-2 p-4 bg-[#F4FBF7] dark:bg-[#122218] rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 text-xs">
            <span className="font-bold text-[#318616] dark:text-emerald-400">
              Email Support
            </span>

            <a
              href="mailto:supportbuyto@gmail.com"
              className="hover:underline font-medium text-gray-700 dark:text-gray-200"
            >
              supportbuyto@gmail.com
            </a>

            <span className="font-bold text-[#318616] dark:text-emerald-400 mt-2">
              In-App Live Chat
            </span>

            <button
              onClick={() => navigate("/support/chat")}
              className="hover:underline text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              Open Buyto Assistant
            </button>
          </div>
        </div>

        {/* Buyto Cookie Promise */}
        <div className="p-8 md:p-10 bg-gradient-to-tr from-[#318616] to-[#22C55E] rounded-3xl shadow-premium text-white space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl -ml-20 -mb-20"></div>

          <h2 className="text-2xl font-extrabold relative z-10">
            Our Commitment
          </h2>

          <p className="text-emerald-50 text-sm leading-relaxed relative z-10 max-w-2xl">
            Buyto aims to use cookies, browser storage, and similar
            technologies responsibly and primarily to provide essential
            functionality, maintain security, support shopping features, and
            improve the Buyto experience.
          </p>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
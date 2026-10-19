import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import BackToTop from "../components/common/BackToTop";

export default function RefundPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-[#0F1115] text-[#111827] dark:text-[#FFFFFF] pb-16 font-sans page-with-bottom-nav">
      <SEO
        title="Refund Policy"
        description="Learn about Buyto's refund eligibility, issue reporting, and refund processing."
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
          <span className="text-xs font-semibold text-[#318616] dark:text-emerald-400 uppercase tracking-wider">Refund Guidelines</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.1]">
          Refund Policy
        </h1>
        <p className="text-lg text-[#4B5563] dark:text-gray-300 leading-relaxed">
          Customer satisfaction is important to Buyto. We aim to ensure that every order is delivered accurately and in good condition.
        </p>
        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-1">
          Last Updated: September 2026
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {/* Eligible Refund Cases */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
            <span className="text-[#318616] dark:text-emerald-400">✅</span> Eligible Refund Cases
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Depending on the circumstances, a refund or appropriate resolution may be available for:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300 list-disc pl-4">
            <li>Damaged products</li>
            <li>Incorrect items delivered</li>
            <li>Missing products</li>
            <li>Failed or undelivered orders</li>
            <li>Payment deducted but the order was not successfully confirmed</li>
            <li>Other issues determined eligible by Buyto support</li>
          </ul>
        </div>

        {/* Cases That May Not Qualify */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-red-100/50 dark:border-red-900/20 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
            <span className="text-red-500">❌</span> Cases That May Not Qualify
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Refunds may not be available where:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300 list-disc pl-4">
            <li>An incorrect or incomplete delivery address was provided by the customer</li>
            <li>An order was rejected or refused after dispatch without a valid reason</li>
            <li>A perishable product was consumed before the issue was reported</li>
            <li>The issue was caused by circumstances outside Buyto's reasonable control</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic pt-1">
            Eligibility may depend on the specific circumstances of the order.
          </p>
        </div>

        {/* Reporting an Order Issue */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Reporting an Order Issue
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            If you receive a damaged, incorrect, or incomplete order, contact Buyto support as soon as reasonably possible. Please provide:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex gap-3 p-3 bg-gray-50 dark:bg-[#15171D] rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#318616]/10 text-[#318616] dark:bg-emerald-400/10 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">1</div>
              <div>
                <h4 className="text-xs font-bold text-[#111827] dark:text-white">Order Details</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Order ID, description of the issue, and relevant product details.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 dark:bg-[#15171D] rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#318616]/10 text-[#318616] dark:bg-emerald-400/10 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">2</div>
              <div>
                <h4 className="text-xs font-bold text-[#111827] dark:text-white">Visual Evidence</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Photos or other evidence of damage or incorrect items when requested.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            This helps us investigate and resolve the issue more quickly.
          </p>
        </div>

        {/* Refund Processing */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Refund Processing
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            If a refund is approved, it will generally be initiated to the original payment method or another applicable method supported by Buyto.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Buyto does not guarantee a specific refund processing time once the refund has been initiated.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            For payment failures or orders that were not successfully confirmed, any applicable refund will be processed according to the payment transaction status.
          </p>
        </div>

        {/* Need Help? */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Need Help?
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            If you believe your order qualifies for a refund, contact our support team with your Order ID and issue details.
          </p>
          <div className="inline-flex flex-col gap-2 p-4 bg-[#F4FBF7] dark:bg-[#122218] rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 text-xs">
            <span className="font-bold text-[#318616] dark:text-emerald-400">Email Support</span>
            <a href="mailto:supportbuyto@gmail.com" className="hover:underline font-medium text-gray-700 dark:text-gray-200">supportbuyto@gmail.com</a>
            <span className="font-bold text-[#318616] dark:text-emerald-400 mt-2">In-App Live Chat</span>
            <button onClick={() => navigate("/support/chat")} className="hover:underline text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer">Open Buyto Assistant</button>
          </div>
        </div>

        {/* Buyto Promise Card */}
        <div className="p-8 md:p-10 bg-gradient-to-tr from-[#318616] to-[#22C55E] rounded-3xl shadow-premium text-white space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl -ml-20 -mb-20"></div>

          <h2 className="text-2xl font-extrabold relative z-10">
            Our Refund Commitment
          </h2>
          <p className="text-emerald-50 text-sm leading-relaxed relative z-10 max-w-2xl">
            We review every issue diligently. Our goal is to resolve issues quickly, transparently, and fairly to keep your shopping experience dependable.
          </p>
        </div>

      </div>
      <BackToTop />
    </div>
  );
}
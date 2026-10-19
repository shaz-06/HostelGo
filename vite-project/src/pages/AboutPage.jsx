import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import BuytoLogo from "../components/common/BuytoLogo";
import BackToTop from "../components/common/BackToTop";

export default function AboutPage() {
  const navigate = useNavigate();

  const offerings = [
    {
      title: "Groceries & Fresh Produce",
      desc: "Fresh vegetables, fruits, dairy, snacks, beverages, and everyday food essentials.",
      icon: (
        <svg className="w-8 h-8 text-[#318616]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "Electronics & Tech",
      desc: "Gadgets, accessories, electronics, and everyday technology products.",
      icon: (
        <svg className="w-8 h-8 text-[#318616]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Beauty & Personal Care",
      desc: "Skincare, grooming, personal-care, and beauty essentials.",
      icon: (
        <svg className="w-8 h-8 text-[#318616]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      title: "Pharmacy",
      desc: "Everyday healthcare and pharmacy products, subject to applicable requirements.",
      icon: (
        <svg className="w-8 h-8 text-[#318616]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Fashion & Lifestyle",
      desc: "Fashion, accessories, and lifestyle products for everyday needs.",
      icon: (
        <svg className="w-8 h-8 text-[#318616]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      title: "Home & Hostel Essentials",
      desc: "Products for your home, room, hostel, and everyday living.",
      icon: (
        <svg className="w-8 h-8 text-[#318616]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    }
  ];

  const features = [
    {
      title: "Fast & Convenient",
      desc: "Find what you need without unnecessary trips to multiple stores.",
      icon: "⚡"
    },
    {
      title: "Everything in One Place",
      desc: "Explore multiple everyday categories through one shopping platform.",
      icon: "🛒"
    },
    {
      title: "Built Around You",
      desc: "Discover products and services designed around your everyday shopping needs.",
      icon: "📍"
    },
    {
      title: "Great Value",
      desc: "Find offers, deals, and rewards designed to provide more value.",
      icon: "💰"
    },
    {
      title: "BuyCoins",
      desc: "Earn BuyCoins through eligible purchases and use them for available rewards and benefits.",
      icon: "🪙"
    },
    {
      title: "Secure Shopping",
      desc: "A shopping experience designed with secure payments and customer protection in mind.",
      icon: "🔒"
    }
  ];

  const commitments = [
    {
      title: "Secure",
      desc: "We focus on protecting customer information and providing secure transactions.",
      icon: (
        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: "Reliable",
      desc: "We continuously work toward a dependable and consistent shopping experience.",
      icon: (
        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Customer First",
      desc: "The customer experience guides how we build and improve Buyto.",
      icon: (
        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-[#0F1115] text-[#111827] dark:text-[#FFFFFF] pb-16 font-sans page-with-bottom-nav">
      <SEO 
        title="About Us" 
        description="Learn about Buyto, our mission, our vision, and our goal of making everyday shopping simpler, faster, and more convenient." 
      />

      {/* Top Bar with Back Button */}
      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-8 flex justify-between items-center">
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

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-16 md:py-20 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        <div className="flex-1 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
            <span className="w-2 h-2 rounded-full bg-[#318616] animate-pulse"></span>
            <span className="text-xs font-semibold text-[#318616] dark:text-emerald-400 uppercase tracking-wider">About Buyto</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.1]">
            Everyday Shopping, <span className="text-[#318616] dark:text-emerald-400">Made Simpler</span>.
          </h1>
          <p className="text-lg md:text-xl text-[#4B5563] dark:text-gray-300 font-medium max-w-2xl leading-relaxed">
            Buyto is a quick-commerce platform designed to make everyday shopping simple, convenient, and accessible.
          </p>
          <p className="text-base text-[#6B7280] dark:text-gray-400 max-w-2xl leading-relaxed">
            From fresh groceries and daily essentials to electronics, fashion, beauty, pharmacy, and more, Buyto brings multiple everyday categories together in one convenient shopping experience.
          </p>
        </div>
        <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
          <div className="relative p-6 md:p-10 bg-gradient-to-tr from-[#F0FDF4] to-[#FFFBEB] dark:from-[#112516] dark:to-[#222115] rounded-[2rem] border border-emerald-100/50 dark:border-emerald-900/20 shadow-premium">
            <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-[#FEE2E2] dark:bg-red-950/40 flex items-center justify-center text-lg">🛍️</div>
            <BuytoLogo size="xl" responsive={false} clickable={false} />
          </div>
        </div>
      </section>

      {/* What is Buyto? */}
      <section className="bg-[#FFFDF6] dark:bg-[#15171B] border-y border-yellow-100/55 dark:border-yellow-900/10 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] dark:text-white">
            What is Buyto?
          </h2>
          <div className="space-y-6 text-[#4B5563] dark:text-gray-300 text-base md:text-lg leading-relaxed max-w-3xl mx-auto text-left md:text-center">
            <p className="font-semibold text-[#111827] dark:text-white text-lg md:text-xl">
              Buyto is built around a simple idea:
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-[#318616] dark:text-emerald-400 py-2 border-y border-[#318616]/10 dark:border-emerald-400/10">
              "You shouldn't have to go everywhere to find what you need."
            </p>
            <p>
              Buyto brings products from different everyday categories into one platform, helping customers discover, order, and receive the things they need more conveniently.
            </p>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              Whether you're looking for fresh vegetables, snacks, personal-care products, electronics, home essentials, or other everyday products, Buyto is designed to make the experience easier.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] dark:text-white">
            What We Offer
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            A diverse range of categories designed to meet your everyday needs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {offerings.map((item, index) => (
            <div key={index} className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-[#111827] dark:text-white">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Buyto? */}
      <section className="bg-emerald-50/40 dark:bg-[#111C14]/30 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] dark:text-white">
              Why Buyto?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              The principles that shape the Buyto shopping experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, index) => (
              <div key={index} className="p-6 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#111827] dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
        {/* Mission Card */}
        <div className="p-8 md:p-10 bg-[#FFFDF9] dark:bg-[#201D16] rounded-3xl border border-amber-100/50 dark:border-amber-900/20 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E2128] flex items-center justify-center text-2xl shadow-sm">🎯</div>
            <h2 className="text-3xl font-extrabold text-[#111827] dark:text-white">Our Mission</h2>
            <p className="text-lg font-semibold text-amber-600 dark:text-amber-400 leading-relaxed">
              "To make everyday shopping simpler, faster, and more convenient for everyone."
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              We continuously work to improve product discovery, ordering, payments, delivery, and the overall customer experience.
            </p>
          </div>
        </div>

        {/* Vision Card */}
        <div className="p-8 md:p-10 bg-[#F4FBF7] dark:bg-[#122218] rounded-3xl border border-emerald-100/50 dark:border-emerald-900/20 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E2128] flex items-center justify-center text-2xl shadow-sm">🌍</div>
            <h2 className="text-3xl font-extrabold text-[#111827] dark:text-white">Our Vision</h2>
            <p className="text-lg font-semibold text-[#318616] dark:text-emerald-400 leading-relaxed">
              "To create a trusted everyday shopping platform that brings convenience, technology, and accessibility together."
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We want Buyto to become a place where customers can easily find the products they need for everyday life.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Behind Buyto */}
      <section className="bg-gray-50 dark:bg-[#15181E] border-y border-gray-100 dark:border-gray-800 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-2xl mx-auto">💡</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] dark:text-white">
            Technology Behind Buyto
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Buyto combines modern technology with commerce to create a smoother shopping experience.
          </p>
          
          <div className="max-w-md mx-auto text-left bg-white dark:bg-[#1E2128] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mt-4">
            <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
              {[
                "Smart product discovery",
                "Personalized shopping experiences",
                "Secure payments",
                "Digital order management",
                "Real-time order updates",
                "Convenient delivery",
                "Rewards and loyalty features"
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#318616]"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm font-semibold text-[#318616] dark:text-emerald-400 pt-4">
            "Technology is not simply about making shopping digital. It's about making shopping easier and more useful."
          </p>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] dark:text-white">
            Our Commitment
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {commitments.map((item, index) => (
            <div key={index} className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-[#111827] dark:text-white">{item.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Looking Ahead */}
      <section className="bg-amber-50/20 dark:bg-[#201D16]/10 border-y border-amber-100/30 dark:border-amber-900/5 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-2xl mx-auto">🚀</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] dark:text-white">
            We're Just Getting Started
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Buyto is continuously evolving. We're working to expand our product selection, improve the shopping experience, strengthen availability, and make everyday commerce more convenient.
          </p>
          <p className="text-lg md:text-xl font-bold text-[#318616] dark:text-emerald-400 pt-2">
            "Buyto is built to make everyday shopping easier—one order at a time."
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-4 pt-16 md:pt-24 text-center">
        <div className="p-8 md:p-16 bg-gradient-to-tr from-[#318616] to-[#22C55E] rounded-[2rem] shadow-premium text-white space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl -ml-20 -mb-20"></div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight relative z-10">
            Ready to Shop?
          </h2>
          <p className="text-emerald-50 text-base md:text-lg max-w-md mx-auto relative z-10">
            Discover what you need, explore Buyto, and start shopping.
          </p>
          <div className="pt-4 relative z-10">
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3.5 bg-white text-[#318616] font-bold text-base md:text-lg rounded-full hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95 shadow-md focus:outline-none focus:ring-4 focus:ring-white/40 cursor-pointer"
            >
              Start Shopping →
            </button>
          </div>
        </div>
      </section>
      <BackToTop />
    </div>
  );
}
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/common/SEO";
import BackToTop from "../components/common/BackToTop";
import { AuthContext } from "../context/AuthContext";

export default function PrivacyGrievancePage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    grievanceType: "",
    name: "",
    contact: "",
    description: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [grievanceId, setGrievanceId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!token) {
    alert("Please log in to submit a privacy grievance.");
    return;
  }

  setSubmitting(true);

  try {
    const response = await fetch(
      `${window.API_BASE_URL}/api/privacy-grievances`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          grievanceType: formData.grievanceType,
          name: formData.name,
          contact: formData.contact,
          description: formData.description,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Failed to submit privacy grievance."
      );
    }

    setGrievanceId(data.grievanceId);
setSubmitted(true);



    // Clear form after successful submission
    setFormData({
      grievanceType: "",
      name: "",
      contact: "",
      description: "",
    });
  } catch (error) {
    console.error("Privacy grievance submission failed:", error);
    alert(error.message || "Something went wrong. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-[#FDFDFB] dark:bg-[#0F1115] text-[#111827] dark:text-white pb-16 font-sans page-with-bottom-nav">
      <SEO
        title="Privacy & Data Grievance"
        description="Submit a privacy or personal data grievance to Buyto."
      />

      {/* Top Bar */}
      <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-8">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm font-semibold text-[#318616] hover:text-[#286f12] dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#318616] rounded-lg px-3 py-1.5 border border-[#318616]/20 dark:border-emerald-400/20 bg-[#318616]/5 dark:bg-emerald-400/5 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
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

      {/* Header */}
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-8 text-left space-y-4">
       

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.1]">
          Privacy & Data Grievance
        </h1>

        <p className="text-lg text-[#4B5563] dark:text-gray-300 leading-relaxed">
          If you have a concern about how Buyto handles your personal data,
          you can submit a privacy or data-related grievance using this form.
        </p>

        <div className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider pt-1">
          Last Updated: September 2026
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {/* Information Card */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Raise a Privacy Concern
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            You may use this form to raise concerns relating to your personal
            data, privacy preferences, or the exercise of applicable data
            protection rights.
          </p>

          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc pl-5">
            <li>Personal data correction</li>
            <li>Personal data deletion</li>
            <li>Privacy or data-processing concern</li>
            <li>Consent or privacy preference concern</li>
            <li>Unauthorised use of personal data</li>
            <li>Data security concern</li>
            <li>Other privacy-related concerns</li>
          </ul>
        </div>

        {/* Grievance Form */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          {submitted ? (
  <div className="py-8 text-center space-y-5">
    <div className="mx-auto w-14 h-14 rounded-full bg-[#318616]/10 text-[#318616] flex items-center justify-center text-2xl">
      ✓
    </div>

    <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
      Grievance Submitted
    </h2>

    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
      Your privacy grievance has been successfully submitted to Buyto.
      Please keep the reference number below for future communication.
    </p>

    {grievanceId && (
      <div className="mx-auto max-w-md p-4 rounded-xl bg-gray-50 dark:bg-[#15171D] border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
          Grievance Reference
        </p>

        <p className="mt-2 font-mono text-sm font-bold text-[#318616] break-all">
          {grievanceId}
        </p>
      </div>
    )}

    <button
      type="button"
      onClick={() => navigate("/profile")}
      className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#318616] text-white font-semibold hover:bg-[#286f12] transition-colors"
    >
      Back to Profile
    </button>
  </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Grievance Type */}
              <div className="space-y-2">
                <label
                  htmlFor="grievanceType"
                  className="text-sm font-semibold text-[#111827] dark:text-white"
                >
                  Grievance Type
                </label>

                <select
                  id="grievanceType"
                  name="grievanceType"
                  value={formData.grievanceType}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15171D] text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#318616]/30 focus:border-[#318616]"
                >
                  <option value="">Select grievance type</option>
                  <option value="privacy-concern">
                    Privacy concern
                  </option>
                  <option value="data-correction">
                    Personal data correction
                  </option>
                  <option value="data-deletion">
                    Personal data deletion
                  </option>
                  <option value="consent">
                    Consent / privacy preference
                  </option>
                  <option value="unauthorised-use">
                    Unauthorised use of personal data
                  </option>
                  <option value="security">
                    Data security concern
                  </option>
                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-[#111827] dark:text-white"
                >
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15171D] placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#318616]/30 focus:border-[#318616]"
                />
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <label
                  htmlFor="contact"
                  className="text-sm font-semibold text-[#111827] dark:text-white"
                >
                  Email or Mobile Number
                </label>

                <input
                  id="contact"
                  name="contact"
                  type="text"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Enter your email or mobile number"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15171D] placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#318616]/30 focus:border-[#318616]"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-semibold text-[#111827] dark:text-white"
                >
                  Describe Your Concern
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your privacy or data-related concern..."
                  required
                  rows={6}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15171D] placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-[#318616]/30 focus:border-[#318616]"
                />
              </div>

              {/* Submit */}
              <button
  type="submit"
  disabled={submitting}
  className="w-full rounded-xl bg-[#318616] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#286f12] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#318616]/30"
>
  {submitting ? "Submitting..." : "Submit Grievance"}
</button>
            </form>
          )}
        </div>

        {/* Contact Card */}
        <div className="p-6 md:p-8 bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-[#111827] dark:text-white">
            Need Help?
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            If you are unable to use the form or have questions about your
            privacy rights, you can contact Buyto directly.
          </p>

          <div className="inline-flex flex-col gap-2 p-4 bg-[#F4FBF7] dark:bg-[#122218] rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 text-sm">
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
              type="button"
              onClick={() => navigate("/support/chat")}
              className="hover:underline text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              Open Buyto Assistant
            </button>
          </div>
        </div>

        {/* Commitment */}
        <div className="p-8 md:p-10 bg-gradient-to-tr from-[#318616] to-[#22C55E] rounded-3xl shadow-premium text-white space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl -ml-20 -mb-20" />

          <h2 className="text-2xl font-extrabold relative z-10">
            Your Privacy Matters
          </h2>

          <p className="text-white text-sm leading-relaxed relative z-10 max-w-2xl">
            Buyto aims to handle personal data responsibly and to provide
            appropriate channels for privacy-related concerns and requests.
          </p>
        </div>
      </div>

      <BackToTop />
    </div>
  );
}
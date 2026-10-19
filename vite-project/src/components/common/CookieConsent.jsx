import React, { useEffect, useState } from "react";


const CONSENT_KEY = "buyto_cookie_consent";

export default function CookieConsent() {

  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const [analytics, setAnalytics] = useState(false);

  

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);

      if (!saved) {
        setVisible(true);
        return;
      }

      const preferences = JSON.parse(saved);
      setAnalytics(preferences.analytics === true);
    } catch (error) {
      console.error("Failed to read cookie consent:", error);
      setVisible(true);
    }
  }, []);

  const saveConsent = (analyticsEnabled) => {
    const preferences = {
      essential: true,
      analytics: analyticsEnabled,
      advertising: false,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify(preferences)
    );

    setAnalytics(analyticsEnabled);
    setVisible(false);
    setShowPreferences(false);

    // Notify the application that consent changed
    window.dispatchEvent(
      new CustomEvent("buytoConsentChanged", {
        detail: preferences,
      })
    );
  };

  const acceptAll = () => {
    saveConsent(true);
  };

  const rejectNonEssential = () => {
    saveConsent(false);
  };

  const savePreferences = () => {
    saveConsent(analytics);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-3 md:p-5">
      <div className="mx-auto max-w-3xl bg-white dark:bg-[#1E2128] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">

        {!showPreferences ? (
          <div className="p-5 md:p-6">

            <div className="flex gap-4">

              <div className="hidden sm:flex w-11 h-11 rounded-full bg-[#F0F9EC] dark:bg-[#17351A] items-center justify-center text-xl shrink-0">
                🍪
              </div>

              <div className="flex-1">

                <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                  We use cookies & similar technologies
                </h2>

                <p className="mt-2 text-xs md:text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  Buyto uses essential storage to keep the app working,
                  including login and shopping cart functionality. We may
                  also use analytics technologies to understand and improve
                  the Buyto experience.
                </p>

                <button
  onClick={navigateToCookiesPolicy}
  className="mt-2 text-xs font-semibold text-[#318616] dark:text-emerald-400 hover:underline"
>
  Learn more about our Cookies Policy
</button>

              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-5">

              <button
                onClick={rejectNonEssential}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Reject Non-Essential
              </button>

              <button
                onClick={() => setShowPreferences(true)}
                className="flex-1 px-4 py-3 rounded-xl border border-[#318616]/30 text-sm font-semibold text-[#318616] dark:text-emerald-400 hover:bg-[#F4FBF7] dark:hover:bg-[#122218] transition-colors"
              >
                Manage Preferences
              </button>

              <button
                onClick={acceptAll}
                className="flex-1 px-4 py-3 rounded-xl bg-[#318616] hover:bg-[#286f12] text-white text-sm font-bold transition-colors"
              >
                Accept All
              </button>

            </div>

          </div>
        ) : (

          <div className="p-5 md:p-6">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Cookie Preferences
              </h2>

              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl"
                aria-label="Close preferences"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3">

              {/* Essential */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#15181D] border border-gray-100 dark:border-gray-800">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Essential
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Required for login, cart, security and core app functionality.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[#318616] dark:text-emerald-400">
                    Always On
                  </span>

                </div>

              </div>

              {/* Analytics */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#15181D] border border-gray-100 dark:border-gray-800">

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Analytics
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Helps us understand usage and improve Buyto.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={analytics}
                    onClick={() => setAnalytics(prev => !prev)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      analytics
                        ? "bg-[#318616]"
                        : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        analytics
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>

                </div>

              </div>

              {/* Advertising */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#15181D] border border-gray-100 dark:border-gray-800">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Advertising
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Buyto currently does not directly use advertising cookies.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-gray-400">
                    Off
                  </span>

                </div>

              </div>

            </div>

            <button
              onClick={savePreferences}
              className="w-full mt-5 px-4 py-3 rounded-xl bg-[#318616] hover:bg-[#286f12] text-white text-sm font-bold transition-colors"
            >
              Save Preferences
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

/*
 * Keep navigation outside the component logic so this component
 * does not need to depend on React Router.
 */
function navigateToCookiesPolicy() {
  window.history.pushState({}, "", "/cookies-policy");
  window.dispatchEvent(new PopStateEvent("popstate"));
}
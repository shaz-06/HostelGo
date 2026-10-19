import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-7xl font-bold text-[#318616]">
            404
          </h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Page Not Found
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#318616] text-white font-semibold hover:bg-[#286d12] transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
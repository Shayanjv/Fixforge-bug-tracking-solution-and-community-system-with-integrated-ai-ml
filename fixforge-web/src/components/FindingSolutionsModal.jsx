import React from "react";

export default function FindingSolutionsModal({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <h3 className="text-lg font-semibold text-gray-800">
          🔍 Finding related solutions...
        </h3>
        <p className="text-sm text-gray-500 text-center">
          We’re analyzing your bug with CodeBERT to check for similar solved issues.
        </p>
      </div>
    </div>
  );
}

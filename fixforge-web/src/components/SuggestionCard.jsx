// SuggestionCard.jsx
import React from "react";
import { ArrowRight } from "lucide-react";

export default function SuggestionCard({ suggestion = {}, onView }) {
  const handleView = () => {
    if (onView) onView(suggestion.id);
    else console.log("Viewing fix for:", suggestion.id);
  };

  const similarity = Number.isFinite(suggestion.similarity) ? Math.round(suggestion.similarity) : 0;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleView}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleView()}
      className="group bg-white rounded-lg border border-gray-100 shadow-sm p-6 transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B46C1] cursor-pointer"
      style={{ position: "relative", isolation: "isolate" }}
      aria-label={`Suggestion: ${suggestion.title}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span 
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" 
          style={{ backgroundColor: "#F3E8FF", color: "#6B46C1" }}
        >
          {similarity}% match
        </span>
      </div>

      <h3 className="text-gray-900 text-lg font-semibold mb-2 group-hover:text-[#6B46C1] transition-colors">
        {suggestion.title || "Untitled suggestion"}
      </h3>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {suggestion.description || "No description provided."}
      </p>

      {suggestion.solution && (
        <p className="text-sm text-green-700 mb-3">💡 {suggestion.solution}</p>
      )}

      {suggestion.code && (
        <pre className="bg-gray-50 border border-gray-100 rounded-md p-3 mt-3 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
          <code>{suggestion.code}</code>
        </pre>
      )}

      <div className="mt-4 flex items-center justify-between" style={{ position: "relative", zIndex: 10 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleView();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: "#6B46C1",
            color: "#FFFFFF",
            position: "relative",
            zIndex: 50,
            border: "none",
            fontWeight: 500
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5A3BA3"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6B46C1"}
        >
          View Fix <ArrowRight className="w-4 h-4" style={{ color: "#FFFFFF" }} />
        </button>
      </div>
    </article>
  );
}

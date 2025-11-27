import React, { useState } from "react";
import { ArrowUp, Paperclip, Send } from "lucide-react";

export function BugCard({ bug, onVote, onAddSolution }) {
  const [solutionText, setSolutionText] = useState("");

  const submit = () => {
    const content = (solutionText || "").trim();
    if (!content) return;
    onAddSolution && onAddSolution(bug.id, content);
    setSolutionText("");
  };

  const getSeverityColor = (s) => {
    switch (s) {
      case "Critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "High":     return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Medium":   return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Low":      return "bg-green-500/20 text-green-400 border-green-500/30";
      default:         return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case "Open":        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "In Progress": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Resolved":    return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Closed":      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:            return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 hover:border-purple-400 transition-all shadow-xl shadow-purple-100/50 hover:shadow-2xl hover:shadow-purple-200/60">
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => onVote && onVote(bug.id)}
            aria-label="Upvote"
            className="group bg-white hover:bg-purple-600 text-purple-600 hover:text-white rounded-full p-3 transition-all shadow-md border-2 border-purple-300 hover:border-purple-600 hover:shadow-lg hover:shadow-purple-400/50"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <span className="text-gray-900">{bug.votes ?? 0}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-gray-900 text-xl">{bug.title}</h3>
            <span className={`px-3 py-1 rounded-full border text-sm ${getStatusColor(bug.status)}`}>
              {bug.status}
            </span>
          </div>

          <p className="text-gray-700 mb-4">{bug.description}</p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-gray-600 text-sm">
              Created: {bug.created_at ? new Date(bug.created_at).toLocaleString() : ""}
            </span>
            <span className={`px-3 py-1 rounded-full border text-sm ${getSeverityColor(bug.severity)}`}>
              {bug.severity}
            </span>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 text-sm">
              {bug.client_type || bug.client || "Unknown"}
            </span>
            {(bug.tags || []).map((tag, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-300 text-sm">
                {tag}
              </span>
            ))}
          </div>

          {(bug.attachments || []).length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <Paperclip className="w-4 h-4" />
                <span className="text-sm">Attachments:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(bug.attachments || []).map((att, idx) => {
                  const name = typeof att === "string" ? att : att.file_path || att.name || `attachment-${idx}`;
                  return (
                    <span key={idx} className="px-3 py-1 bg-purple-50 text-gray-800 rounded text-sm border border-purple-200">
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {(bug.solutions || []).length > 0 && (
            <div className="mb-4">
              <h4 className="text-gray-900 mb-3">Solutions ({(bug.solutions || []).length})</h4>
              <div className="space-y-3">
                {(bug.solutions || []).map((sol) => (
                  <div key={sol.id || `${sol.createdAt}-${Math.random()}`} className="bg-purple-50/50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-purple-700">{sol.author}</span>
                        <span className="text-gray-600 text-sm ml-2">{sol.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-700">
                        <ArrowUp className="w-4 h-4" />
                        <span className="text-sm">{sol.votes ?? 0}</span>
                      </div>
                    </div>
                    <p className="text-gray-800">{sol.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a solution..."
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && submit()}
              className="flex-1 bg-white text-gray-900 placeholder-gray-500 rounded-lg px-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
            />
            <button
              onClick={submit}
              aria-label="Submit solution"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg px-4 py-2 transition-all flex items-center gap-2 shadow-lg shadow-purple-300/50 hover:shadow-purple-400/60 text-sm"
            >
              <Send className="w-4 h-4" />
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

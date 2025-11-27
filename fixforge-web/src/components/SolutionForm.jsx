import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { ArrowUp, Code, Sparkles, ArrowLeft } from "lucide-react";
import { useUserContext } from "../context/UserContext";
import { toast } from "sonner";

// Utility: Extracts code blocks from AI markdown
function extractCodeBlocks(markdown) {
  // Matches code blocks after headings (e.g. "Problematic Code", "Fixed Code")
  const originalMatch = markdown.match(/Problematic Code[^\n]*?``````/i);
  const fixedMatch = markdown.match(/Fixed Code[^\n]*?``````/i);

  return {
    original: originalMatch ? originalMatch[1].trim() : "",
    fixed: fixedMatch ? fixedMatch[1].trim() : ""
  };
}

export default function SolutionForm() {
  const { user, loading } = useUserContext();
  const location = useLocation();
  
  // Get pre-filled data from AI Suggested page
  const prefilledData = location.state || {};
  
  const [bugId, setBugId] = useState(prefilledData.bugId || "");
  const [bugs, setBugs] = useState([]);
  const [title, setTitle] = useState(prefilledData.title || "");
  const [explanation, setExplanation] = useState(prefilledData.content || "");
  const [code, setCode] = useState(prefilledData.content || "// Paste or write your fix here\n");
  const [patch, setPatch] = useState("");
  const [status, setStatus] = useState("");

  const [solutions, setSolutions] = useState([]);
  const [loadingSolutions, setLoadingSolutions] = useState(true);

  const [originalCode, setOriginalCode] = useState("// Original snippet (optional)\n");
  const [fixedCode, setFixedCode] = useState("// Fixed snippet (optional)\n");
  const [showDiff, setShowDiff] = useState(false);

  const [pendingUpvotes, setPendingUpvotes] = useState(new Set());
  
  useEffect(() => {
  if (prefilledData.fromAI && prefilledData.content) {
    const parsed = extractCodeBlocks(prefilledData.content);
    console.log('=== Parsed code from AI markdown:', parsed);
    if (parsed.original) setOriginalCode(parsed.original);
    if (parsed.fixed) setFixedCode(parsed.fixed);
    if (parsed.fixed) setCode(parsed.fixed);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);



  // Show notification if coming from AI
  useEffect(() => {
    if (prefilledData.fromAI) {
      toast.success("AI suggestion loaded!", {
        description: "Review and edit before posting"
      });
    }
  }, [prefilledData.fromAI]);

  // Fetch bugs for the select list
  useEffect(() => {
    const base = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
    const key = import.meta.env.VITE_EXT_KEY || "";
    if (!base) return;

    fetch(`${base}/bugs`, { headers: key ? { "x-api-key": key } : {} })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Server ${res.status}`))))
      .then((data) => setBugs(Array.isArray(data) ? data : data.items || []))
      .catch(() => setBugs([]));
  }, []);

  // Fetch solutions for selected bug
  useEffect(() => {
    const base = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
    const key = import.meta.env.VITE_EXT_KEY || "";
    if (!base) return;
    if (!bugId) {
      setSolutions([]);
      setLoadingSolutions(false);
      return;
    }

    setLoadingSolutions(true);
    fetch(`${base}/bugs/${encodeURIComponent(bugId)}/solutions`, {
      headers: key ? { "x-api-key": key } : {},
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Server ${res.status}`))))
      .then((data) => setSolutions(Array.isArray(data) ? data : data.items || []))
      .catch(() => setSolutions([]))
      .finally(() => setLoadingSolutions(false));
  }, [bugId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    
    // Validate user
    if (!user || !user.id) {
      toast.error("Please log in to post a solution");
      setStatus("");
      return;
    }
    
    try {
      const base = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
      const key = import.meta.env.VITE_EXT_KEY || "";
      if (!base) throw new Error("Missing API base");
      if (!bugId) throw new Error("Select or enter a bug ID");

      const body = { 
        bug_id: bugId,  // Changed from bugId to bug_id
        title, 
        explanation, 
        code, 
        patch,
        user_id: user.id,
        author: user.display_name || user.username || user.email,
        from_ai: prefilledData.fromAI || false
      };
      
      const res = await fetch(`${base}/solutions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...(key ? { "x-api-key": key } : {}) 
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }
      
      const data = await res.json();

      // Optimistic insert
      setSolutions((prev) => [{ ...data, votes: data.votes ?? 0 }, ...prev]);
      toast.success("✅ Solution posted successfully!");

      // Reset form
      setTitle("");
      setExplanation("");
      setCode("// Paste or write your fix here\n");
      setPatch("");
      setOriginalCode("// Original snippet (optional)\n");
      setFixedCode("// Fixed snippet (optional)\n");
      setStatus("");

    } catch (err) {
      console.error("Post solution error:", err);
      toast.error(`Failed to post: ${err.message}`);
      setStatus("");
    }
  };

  const handleUpvote = async (solutionId) => {
    if (pendingUpvotes.has(solutionId)) return;
    if (!user || !user.id) {
      toast.error("Please log in to upvote");
      return;
    }

    setPendingUpvotes((prev) => new Set(prev).add(solutionId));

    // Optimistic UI update
    setSolutions((prev) =>
      prev.map((s) => (s.id === solutionId ? { ...s, votes: (s.votes || 0) + 1 } : s))
    );

    try {
      const base = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
      const key = import.meta.env.VITE_EXT_KEY || "";
      if (!base) return;
      
      const res = await fetch(`${base}/solutions/${encodeURIComponent(solutionId)}/upvote`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(key ? { "x-api-key": key } : {})
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!res.ok) throw new Error("Upvote failed");
      
      toast.success("Upvoted!");
    } catch (err) {
      // Revert on failure
      setSolutions((prev) =>
        prev.map((s) => (s.id === solutionId ? { ...s, votes: Math.max((s.votes || 1) - 1, 0) } : s))
      );
      toast.error("Failed to upvote");
    } finally {
      setPendingUpvotes((prev) => {
        const copy = new Set(prev);
        copy.delete(solutionId);
        return copy;
      });
    }
  };

  const sortedSolutions = useMemo(
    () => [...solutions].sort((a, b) => (b.votes || 0) - (a.votes || 0)),
    [solutions]
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header with AI indicator */}
      {prefilledData.fromAI && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="font-semibold text-purple-900">AI-Generated Solution</h3>
            <p className="text-sm text-purple-700">Review and customize before posting</p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200 shadow-xl shadow-purple-100/50 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {prefilledData.fromAI ? "Post AI Solution" : "Post a Solution"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bug ID</label>
              <input
                type="text"
                value={bugId}
                onChange={(e) => setBugId(e.target.value)}
                placeholder="e.g., FF-104"
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none"
                required
                disabled={prefilledData.bugId} // Disable if from AI
              />
              <p className="text-xs text-gray-500 mt-1">
                {prefilledData.bugId ? "From AI suggestion" : "Type manually or pick from list"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pick from bugs</label>
              <select
                value={bugId}
                onChange={(e) => setBugId(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none"
                disabled={prefilledData.bugId}
              >
                <option value="">— select —</option>
                {bugs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Solution title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Concise title for your fix"
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
            <textarea
              rows="6"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Describe root cause and how your fix addresses it"
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code editor</label>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Editor
                height="300px"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val ?? "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                  smoothScrolling: true,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original snippet</label>
              <textarea
                rows="6"
                value={originalCode}
                onChange={(e) => setOriginalCode(e.target.value)}
                placeholder="Paste the original code (optional)"
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fixed snippet</label>
              <textarea
                rows="6"
                value={fixedCode}
                onChange={(e) => setFixedCode(e.target.value)}
                placeholder="Paste the fixed code (optional)"
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Diff preview</label>
              <button
                type="button"
                onClick={() => setShowDiff((s) => !s)}
                className="text-purple-600 hover:text-purple-700 text-sm transition-colors"
              >
                {showDiff ? "Hide Diff" : "Show Diff Preview"}
              </button>
            </div>

            {showDiff && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <ReactDiffViewer
                  oldValue={originalCode}
                  newValue={fixedCode}
                  splitView={true}
                  compareMethod={DiffMethod.WORDS}
                  styles={{
                    variables: {
                      light: {
                        diffViewerBackground: "#fff",
                        addedBackground: "#ecfdf5",
                        removedBackground: "#fef2f2",
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patch (optional)</label>
            <textarea
              rows="6"
              value={patch}
              onChange={(e) => setPatch(e.target.value)}
              placeholder={`--- a/file.js
+++ b/file.js
@@ -1,3 +1,3 @@
-console.log("bug");
+console.log("fix");`}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:outline-none font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold shadow-md hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50"
            >
              {status === "loading" ? "Posting..." : "Post Solution"}
            </button>
          </div>
        </form>
      </div>

      {/* Solutions list */}
      <section className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Solutions for {bugId || "—"}</h3>

        {loadingSolutions && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse" />
            ))}
          </div>
        )}

        {!loadingSolutions && sortedSolutions.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-600">No solutions yet. Be the first to help!</p>
          </div>
        )}

        {!loadingSolutions && sortedSolutions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSolutions.map((s) => (
              <article
                key={s.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 hover:border-purple-400 transition-all shadow-xl shadow-purple-100/50"
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpvote(s.id)}
                      disabled={pendingUpvotes.has(s.id)}
                      aria-label={`Upvote ${s.title}`}
                      className={`group bg-white hover:bg-purple-600 text-purple-600 hover:text-white rounded-full p-3 transition-all shadow-md border-2 border-purple-300 hover:border-purple-600 ${
                        pendingUpvotes.has(s.id) ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className="text-gray-900 font-semibold">{s.votes ?? 0}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{s.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded border border-purple-300">
                            Bug #{s.bug_id || s.bugId}
                          </span>
                          <span>by {s.author}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-4">{s.explanation}</p>

                    {s.code && (
                      <div className="bg-[#0f1724] rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="w-4 h-4 text-green-400" />
                          <span className="text-gray-400 text-sm">Code Solution</span>
                        </div>
                        <pre className="text-[#d4d4d4] text-sm overflow-x-auto max-h-48">
                          <code style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}>
                            {s.code}
                          </code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { BugCard } from "./BugCard";

export default function Dashboard() {
  const API_BASE = "http://127.0.0.1:8000";

  // Data
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest"); // "latest" | "votes"
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  // Fetch bugs with attachments + solutions
  const fetchBugs = async () => {
    try {
      const res = await fetch(`${API_BASE}/bugs`);
      if (!res.ok) throw new Error("Failed to fetch bugs");
      const data = await res.json();
      setBugs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, []);

  // Upvote bug
  const handleUpvote = async (bugId) => {
    try {
      const res = await fetch(`${API_BASE}/bugs/${bugId}/upvote`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to upvote");
      await fetchBugs();
    } catch (err) {
      console.error(err);
    }
  };

  // Add solution (from BugCard)
  const handleAddSolution = async (bugId, content) => {
    const trimmed = (content || "").trim();
    if (!trimmed) return;
    try {
      const res = await fetch(`${API_BASE}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bug_id: bugId, content: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to submit solution");
      await fetchBugs();
    } catch (err) {
      console.error(err);
    }
  };

  // Reset filters
  const handleReset = () => {
    setSearch("");
    setSort("latest");
    setStatusFilter("");
    setSeverityFilter("");
    setClientFilter("");
  };

  // Apply filters & sorting
  const filteredBugs = bugs
    .filter((b) => {
      const hay = [
        b.title,
        b.description,
        b.id,
        ...(Array.isArray(b.tags) ? b.tags : []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(search.toLowerCase());
    })
    .filter((b) => (statusFilter ? (b.status || b.status === statusFilter) && b.status === statusFilter : true))
    .filter((b) => (severityFilter ? b.severity === severityFilter : true))
    .filter((b) => (clientFilter ? (b.client_type || b.client) === clientFilter : true))
    .sort((a, b) => {
      if (sort === "votes") return (b.votes || 0) - (a.votes || 0);
      // latest first (support created_at or createdAt)
      const ta = new Date(a.created_at || a.createdAt || 0).getTime();
      const tb = new Date(b.created_at || b.createdAt || 0).getTime();
      return tb - ta;
    });

  if (loading) {
    return <p className="p-6">Loading bugs...</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-gray-900 text-4xl">Bug Dashboard</h1>
        <button
          onClick={fetchBugs}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg border border-purple-500 transition-all shadow-lg shadow-purple-300/50 hover:shadow-purple-400/60 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-purple-200 shadow-xl shadow-purple-100/50">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search bugs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-gray-900 placeholder-gray-500 rounded-lg pl-10 pr-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
          >
            <option value="latest">Sort: Latest</option>
            <option value="votes">Sort: Most Voted</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
          >
            <option value="">Status: All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={`w-full rounded-lg px-4 py-3 border transition-all cursor-pointer ${
              severityFilter === ""
                ? "bg-white text-gray-900 border-purple-300 focus:border-purple-500"
                : "bg-purple-600 text-white border-purple-500 focus:border-purple-400"
            } focus:outline-none focus:ring-2 focus:ring-purple-200`}
          >
            <option value="">Severity: All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 border border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer"
          >
            <option value="">Client: All</option>
            <option value="Web">Web</option>
            <option value="Desktop">Desktop</option>
            <option value="Mobile">Mobile</option>
            <option value="API">API</option>
          </select>
        </div>

        <div className="mt-4">
          <button
            onClick={handleReset}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-lg border border-purple-500 transition-all shadow-lg shadow-purple-300/50 hover:shadow-purple-400/60"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Bug cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredBugs.map((bug) => (
          <BugCard
            key={bug.id}
            bug={{
              // normalize fields so BugCard can use either naming convention
              ...bug,
              createdAt: bug.created_at || bug.createdAt,
              client: bug.client || bug.client_type,
            }}
            onVote={handleUpvote}
            onAddSolution={handleAddSolution}
          />
        ))}
      </div>
    </div>
  );
}

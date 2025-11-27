import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClusterBubbleMap from "./ClusterBubbleMap";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ThumbsUp, MessageSquare, Eye } from "lucide-react";

export default function RelatedSolutions() {
  const navigate = useNavigate();
  const { bugId } = useParams();
  const API_BASE = (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000").replace(/\/+$/, "");
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  const [solutions, setSolutions] = useState([]);
  const [topSuggestions, setTopSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // ✅ Fetch ALL PUBLIC solutions for this bug
        const res = await fetch(`${API_BASE}/getsolution?bug_id=${bugId}`, {
          headers: {
            ...(API_KEY ? { "x-api-key": API_KEY } : {}),
            "Content-Type": "application/json",
          },
        });
        
        if (!res.ok) throw new Error(`Failed to fetch solutions (${res.status})`);
        const data = await res.json();
        
        if (!mounted) return;

        const solutionsData = Array.isArray(data) ? data : data.solutions || [];
        
        // ✅ Sort by votes and get top 5
        const sortedByVotes = [...solutionsData].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        const top5 = sortedByVotes.slice(0, 5);
        
        // Transform for bubble map (all solutions)
        const bubbleData = solutionsData.map((solution, idx) => ({
          id: solution.id || `solution-${idx}`,
          label: solution.title || `Solution ${idx + 1}`,
          size: (solution.votes || 0) + 5,
          color: solution.status === "Solved" ? "#10B981" : "#8B5CF6",
          votes: solution.votes || 0,
        }));

        console.log('🔵 All solutions for bug:', bugId);
        console.log('🔵 Total solutions:', solutionsData.length);
        console.log('🔵 Top 5:', top5);

        setSolutions(bubbleData);
        setTopSuggestions(top5);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bugId, API_BASE, API_KEY]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">Loading solutions...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">
          🔍 Related Solutions
        </h2>
        <p className="text-gray-600 mb-8">
          Bug ID: <span className="font-mono text-purple-600">{bugId}</span> • {solutions.length} total solutions
        </p>

        {/* Bubble Map Visualization */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Solutions Visualization (Bubble Size = Votes)
          </h3>
          {solutions.length > 0 ? (
            <ClusterBubbleMap 
              clusters={solutions}
              onBubbleClick={(solution) => {
                console.log('Solution clicked:', solution);
                navigate(`/solutions/${solution.id}`);
              }}
            />
          ) : (
            <div className="bg-white rounded-lg border border-dashed border-gray-200 p-12 text-center">
              <p className="text-gray-500">No solutions available for this bug yet</p>
              <Button 
                onClick={() => navigate(`/solve/${bugId}`)}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Be the first to solve this!
              </Button>
            </div>
          )}
        </section>

        {/* Top 5 Suggested Fixes */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Top 5 Suggested Fixes
          </h3>
          {topSuggestions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topSuggestions.map((solution, idx) => (
                <Card key={solution.id} className="p-6 hover:shadow-lg transition-shadow">
                  {/* Match Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                      {idx === 0 ? '100% match' : `${Math.max(100 - idx * 10, 50)}% match`}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      solution.status === "Solved" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {solution.status || "Open"}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {solution.title}
                  </h4>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {solution.explanation || solution.description || "No description"}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{solution.votes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{solution.comments || 0}</span>
                    </div>
                  </div>

                  {/* View Fix Button */}
                  <Button
                    onClick={() => navigate(`/solutions/${solution.id}`)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    View Fix
                    <Eye className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500">
              No solutions available yet
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

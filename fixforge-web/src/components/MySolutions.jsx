import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SolutionCard } from "./SolutionCard";
import { SolutionFilters } from "./SolutionFilters";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useUserContext } from '../context/UserContext';
import {
  Plus,
  AlertCircle,
  FileQuestion,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";

export function MySolutions() {
  const { user, loading: authLoading, error: authError } = useUserContext();
  const navigate = useNavigate();
  const API_BASE = (import.meta.env.VITE_API_BASE || "https://shy6565-fixforge-backend.hf.space
").replace(/\/+$/, "");
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [solutions, setSolutions] = useState([]);
  const [layout, setLayout] = useState("grid");
  const [isDarkMode, setIsDarkMode] = useState(false); // ✅ CHANGED: Renamed for clarity
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [filters, setFilters] = useState({
    status: "all",
    severity: "all",
    searchQuery: "",
    sortBy: "newest",
    selectedTags: [],
  });

  // Fetch user's solutions when user is authenticated
  useEffect(() => {
    if (user && user.id) {
      fetchSolutions();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const fetchSolutions = async () => {
    if (!user || !user.id) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const res = await fetch(`${API_BASE}/getsolution?user_id=${user.id}`, {
        headers: {
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const solutionsData = Array.isArray(data) ? data : data.items || [];

      setSolutions(
        solutionsData.map((s) => ({
          id: s.id,
          title: s.title || "Untitled Solution",
          description: s.explanation || s.description || "",
          status: s.status || "Open",
          tags: s.tags || [],
          votes: s.votes || 0,
          comments: s.comments || 0,
          timestamp: s.created_at || s.createdAt || new Date().toISOString(),
          severity: s.severity || "Medium",
          hasScreenshot: s.hasScreenshot || false,
          hasVoted: s.hasVoted || false,
          user_id: s.user_id,
          bug_id: s.bug_id,
        }))
      );
    } catch (err) {
      console.error("Error fetching solutions:", err);
      setHasError(true);
      toast.error("Failed to load your solutions");
    } finally {
      setIsLoading(false);
    }
  };

  // Get all unique tags
  const availableTags = useMemo(() => {
    const tags = new Set();
    solutions.forEach((s) => s.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [solutions]);

  // Filter and sort solutions
  const filteredSolutions = useMemo(() => {
    let result = [...solutions];

    if (filters.status !== "all") {
      result = result.filter((s) => s.status === filters.status);
    }
    if (filters.severity !== "all") {
      result = result.filter((s) => s.severity === filters.severity);
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    if (filters.selectedTags.length > 0) {
      result = result.filter((s) =>
        filters.selectedTags.every((tag) => s.tags.includes(tag))
      );
    }

    switch (filters.sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case "most-voted":
        result.sort((a, b) => b.votes - a.votes);
        break;
      case "most-commented":
        result.sort((a, b) => b.comments - a.comments);
        break;
    }
    return result;
  }, [solutions, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredSolutions.length / itemsPerPage);
  const paginatedSolutions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSolutions.slice(start, start + itemsPerPage);
  }, [filteredSolutions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleEdit = (id) => {
  navigate(`/solutions/${id}`, {
    state: { openInEditMode: true } // ✅ Tell SolutionDetail to open in edit mode
  });
};
  const handleView = (id) => navigate(`/solutions/${id}`);

  // ✅ REMOVED: handleDelete and confirmDelete functions

 const handleVote = async (id) => {
  if (!user || !user.id) {
    toast.error("Please log in to vote");
    return;
  }
  
  const solution = solutions.find((s) => s.id === id);
  if (!solution) return;
  
  const hasVoted = solution.hasVoted;

  // Optimistic update
  setSolutions((prev) =>
    prev.map((s) =>
      s.id === id
        ? {
            ...s,
            votes: hasVoted ? s.votes - 1 : s.votes + 1,
            hasVoted: !hasVoted,
          }
        : s
    )
  );

  try {
    // ✅ FIXED: Send user_id in request body
    const res = await fetch(`${API_BASE}/solutions/${id}/upvote`, {
      method: "POST",
      headers: {
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        "Content-Type": "application/json", // ✅ Important!
      },
      body: JSON.stringify({ user_id: user.id }), // ✅ Send user_id
    });

    if (!res.ok) {
      throw new Error("Failed to toggle upvote");
    }

    const data = await res.json();
    
    // ✅ Update with actual response from backend
    setSolutions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              votes: data.votes,
              hasVoted: data.has_upvoted,
            }
          : s
      )
    );

    toast.success(data.message);
  } catch (err) {
    console.error("Vote error:", err);
    
    // Revert on failure
    setSolutions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              votes: hasVoted ? s.votes + 1 : s.votes - 1,
              hasVoted,
            }
          : s
      )
    );
    
    toast.error("Failed to update vote");
  }
};

  const handleComment = (id) => {
    navigate(`/solutions/${id}#comments`);
  };

  // ✅ FIXED: Dark mode background classes
  const bgClass = isDarkMode 
    ? "bg-gray-900 text-white" 
    : "bg-gradient-to-br from-purple-50 via-white to-purple-50/30";

  // Auth loading state
  if (authLoading) {
    return (
      <div className={`min-h-screen ${bgClass} p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError) {
    return (
      <div className={`min-h-screen ${bgClass} p-6`}>
        <Card className={`max-w-2xl mx-auto p-12 text-center ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"} shadow-lg`}>
          <div className={`w-16 h-16 ${isDarkMode ? "bg-red-900" : "bg-red-50"} rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${isDarkMode ? "border-red-700" : "border-red-200"}`}>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Authentication Error</h3>
          <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>{authError}</p>
          <Button onClick={() => navigate('/login')} className="bg-purple-600 hover:bg-purple-700 text-white">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className={`min-h-screen ${bgClass} p-6`}>
        <Card className={`max-w-2xl mx-auto p-12 text-center ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"} shadow-lg`}>
          <div className={`w-16 h-16 ${isDarkMode ? "bg-purple-900" : "bg-purple-50"} rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${isDarkMode ? "border-purple-700" : "border-purple-200"}`}>
            <AlertCircle className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Please Log In</h3>
          <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>You need to be logged in to view your solutions.</p>
          <Button onClick={() => navigate('/login')} className="bg-purple-600 hover:bg-purple-700 text-white">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  // Loading solutions
  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} p-6`}>
        <div className="max-w-7xl mx-auto">
          <Skeleton className={`h-10 w-64 mb-6 ${isDarkMode ? "bg-gray-700" : "bg-purple-200"}`} />
          <Skeleton className={`h-48 w-full mb-6 ${isDarkMode ? "bg-gray-800" : "bg-purple-100"}`} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className={`p-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : "border-purple-100"}`}>
                <Skeleton className={`h-6 w-3/4 mb-3 ${isDarkMode ? "bg-gray-700" : "bg-purple-200"}`} />
                <Skeleton className={`h-4 w-full mb-2 ${isDarkMode ? "bg-gray-700" : "bg-purple-100"}`} />
                <Skeleton className={`h-4 w-full mb-2 ${isDarkMode ? "bg-gray-700" : "bg-purple-100"}`} />
                <Skeleton className={`h-4 w-2/3 mb-4 ${isDarkMode ? "bg-gray-700" : "bg-purple-100"}`} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className={`min-h-screen ${bgClass} p-6`}>
        <Card className={`max-w-2xl mx-auto p-12 text-center ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"} shadow-lg`}>
          <div className={`w-16 h-16 ${isDarkMode ? "bg-red-900" : "bg-red-50"} rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${isDarkMode ? "border-red-700" : "border-red-200"}`}>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Failed to Load Solutions</h3>
          <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>Please try again.</p>
          <Button onClick={fetchSolutions} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // Empty state
  if (solutions.length === 0) {
    return (
      <div className={`min-h-screen ${bgClass} p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">My Solutions</h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>Logged in as: {user.email}</p>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={isDarkMode ? "border-gray-700 hover:bg-gray-800" : ""}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
          <Card className={`p-12 text-center ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"} shadow-lg`}>
            <div className={`w-24 h-24 ${isDarkMode ? "bg-purple-900" : "bg-purple-50"} border-2 ${isDarkMode ? "border-purple-700" : "border-purple-200"} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <FileQuestion className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No Solutions Yet</h3>
            <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>Start helping the community by submitting your first solution!</p>
            <Button onClick={() => navigate("/post-solution")} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 px-8 py-6 text-lg">
              <Plus className="w-5 h-5" />
              Add New Solution
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Main view with solutions
  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Solutions</h1>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mt-1`}>Manage your submitted solutions • {user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={isDarkMode ? "border-gray-700 hover:bg-gray-800" : ""}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button onClick={() => navigate("/post-solution")} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Plus className="w-5 h-5" />
              Add Solution
            </Button>
          </div>
        </div>

        <SolutionFilters
          searchQuery={filters.searchQuery}
          onSearchChange={(v) => setFilters({ ...filters, searchQuery: v })}
          statusFilter={filters.status}
          onStatusChange={(v) => setFilters({ ...filters, status: v })}
          severityFilter={filters.severity}
          onSeverityChange={(v) => setFilters({ ...filters, severity: v })}
          selectedTags={filters.selectedTags}
          onTagToggle={(tag) => {
            setFilters({
              ...filters,
              selectedTags: filters.selectedTags.includes(tag)
                ? filters.selectedTags.filter((t) => t !== tag)
                : [...filters.selectedTags, tag],
            });
          }}
          sortBy={filters.sortBy}
          onSortChange={(v) => setFilters({ ...filters, sortBy: v })}
          onClearFilters={() =>
            setFilters({
              status: "all",
              severity: "all",
              searchQuery: "",
              sortBy: "newest",
              selectedTags: [],
            })
          }
          layout={layout}
          onLayoutChange={setLayout}
          availableTags={availableTags}
        />

        {paginatedSolutions.length === 0 ? (
          <Card className={`p-12 text-center ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No solutions found</h3>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Try adjusting your filters.</p>
          </Card>
        ) : (
          <>
            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>
              Showing <span className="font-semibold text-purple-600">{paginatedSolutions.length}</span> of{" "}
              <span className="font-semibold">{filteredSolutions.length}</span> solutions
            </div>

            <div className={layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {paginatedSolutions.map((solution) => (
                <SolutionCard
                  key={solution.id}
                  solution={solution}
                  layout={layout}
                  onEdit={handleEdit}
                  onView={handleView}
                  onVote={handleVote}
                  onComment={handleComment}
                  showDelete={false} // ✅ ADDED: Hide delete button
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={isDarkMode ? "border-gray-700 hover:bg-gray-800" : ""}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-purple-600 hover:bg-purple-700 text-white" : isDarkMode ? "border-gray-700 hover:bg-gray-800" : ""}
                      >
                        {page}
                      </Button>
                    );
                  } else if (Math.abs(page - currentPage) === 2) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={isDarkMode ? "border-gray-700 hover:bg-gray-800" : ""}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

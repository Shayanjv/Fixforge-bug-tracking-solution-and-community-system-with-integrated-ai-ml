import { useState, useEffect } from "react";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  Trophy,
  CheckCircle,
  AlertCircle,
  Bug,
  Star,
  Filter,
  Search,
  ChevronLeft
} from "lucide-react";
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';

export function ActivityPage() {
  const API_BASE = import.meta.env.VITE_API_BASE || "https://shy6565-fixforge-backend.hf.space
";
  const { user, loading: authLoading } = useUser();
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.id) {
      fetchActivities();
    }
  }, [user?.id]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, selectedFilter]);

  const fetchActivities = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/activities`, {
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let result = activities;

    // Filter by type
    if (selectedFilter !== "all") {
      result = result.filter(a => a.type === selectedFilter);
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(result);
    setCurrentPage(1);
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      solution_posted: Trophy,
      solution_accepted: CheckCircle,
      bug_reported: Bug,
      achievement: Star
    };
    return iconMap[type] || AlertCircle;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      solution_posted: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        icon: "text-purple-600",
        badge: "bg-purple-100 text-purple-700"
      },
      solution_accepted: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: "text-emerald-600",
        badge: "bg-emerald-100 text-emerald-700"
      },
      bug_reported: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "text-red-600",
        badge: "bg-red-100 text-red-700"
      },
      achievement: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: "text-yellow-600",
        badge: "bg-yellow-100 text-yellow-700"
      }
    };
    return colorMap[type] || {
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: "text-gray-600",
      badge: "bg-gray-100 text-gray-700"
    };
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filterOptions = [
    { value: "all", label: "All Activities", count: activities.length },
    { value: "solution_posted", label: "Solutions Posted", count: activities.filter(a => a.type === "solution_posted").length },
    { value: "solution_accepted", label: "Accepted", count: activities.filter(a => a.type === "solution_accepted").length },
    { value: "bug_reported", label: "Bugs Reported", count: activities.filter(a => a.type === "bug_reported").length },
    { value: "achievement", label: "Achievements", count: activities.filter(a => a.type === "achievement").length }
  ];

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIdx, startIdx + itemsPerPage);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user?.id) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
              <p className="text-sm text-gray-600">{filteredActivities.length} activities found</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Filter</h3>
              </div>
              <div className="space-y-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === option.value
                        ? "bg-purple-100 text-purple-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {option.count}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {paginatedActivities.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium">No activities found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colors = getActivityColor(activity.type);
                  const timeAgo = formatTimeAgo(activity.created_at);

                  return (
                    <div
                      key={activity.id}
                      className={`bg-white rounded-lg border ${colors.border} p-4 hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                          <Icon className={`w-5 h-5 ${colors.icon}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{timeAgo}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                          <div className="flex items-center gap-3">
                            <Badge className={colors.badge}>
                              {activity.badge}
                            </Badge>
                            {activity.points > 0 && (
                              <span className="text-sm font-medium text-green-600">+{activity.points} points</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-purple-600 text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
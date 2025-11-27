import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Trophy, Star, Target, TrendingUp, Flame, Award, Zap, Bug } from "lucide-react";
import { useUser } from '@/hooks/useUser';

export function ContributionStats() {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
  const { user, loading: authLoading } = useUser();

  const [stats, setStats] = useState({
    totalSolutions: 0,
    totalBugs: 0,
    totalUpvotes: 0,
    acceptedSolutions: 0,
    acceptanceRate: 0,
    avgResponseTime: "0h",
    streak: 0,
    longestStreak: 0,
    rank: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user?.id, authLoading]);

  const fetchStats = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const url = `${API_BASE}/users/${user.id}/contribution-stats`;
      console.log("🔵 Fetching stats from:", url);
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include" // Include cookies if needed
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("✅ Stats data received:", data);

      // Map backend fields to component state exactly
      setStats({
        totalSolutions: data.total_solutions || 0,
        totalBugs: data.total_bugs || 0,
        totalUpvotes: data.total_upvotes || 0,
        acceptedSolutions: data.accepted_solutions || 0,
        acceptanceRate: data.acceptance_rate || 0,
        avgResponseTime: data.avg_response_time || "0h",
        streak: data.streak || 0,
        longestStreak: data.longest_streak || 0,
        rank: data.rank || 0,
        thisWeek: data.this_week || 0,
        thisMonth: data.this_month || 0
      });

      console.log("✅ Stats updated successfully");
    } catch (err) {
      console.error("❌ Failed to fetch contribution stats:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Contribution Stats</h3>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">Please log in to view stats</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">Failed to load stats</p>
          <button
            onClick={fetchStats}
            className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: Trophy,
      label: "Total Solutions",
      value: formatNumber(stats.totalSolutions),
      subtext: `${stats.thisWeek} this week`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      icon: Bug,
      label: "Total Bugs",
      value: formatNumber(stats.totalBugs),
      subtext: `${stats.thisWeek} bugs this week`,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      icon: TrendingUp,
      label: "Total Upvotes",
      value: formatNumber(stats.totalUpvotes),
      subtext: `${stats.acceptedSolutions} accepted`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      icon: Target,
      label: "Avg Response",
      value: stats.avgResponseTime,
      subtext: `${stats.thisMonth} this month`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Contribution Stats</h3>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border border-purple-300">
          <Award className="w-3 h-3 mr-1" />
          Level {Math.floor(stats.totalSolutions / 10) + 1}
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statItems.map((item, idx) => (
          <div
            key={idx}
            className={`${item.bgColor} rounded-lg p-4 border-2 ${item.borderColor} hover:border-opacity-100 hover:shadow-md transition-all duration-200 cursor-pointer group`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${item.bgColor} border ${item.borderColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {item.label}
              </span>
            </div>
            <p className={`text-2xl font-bold ${item.color} mb-1`}>
              {item.value}
            </p>
            <p className="text-xs text-gray-500">{item.subtext}</p>
          </div>
        ))}
      </div>

      {/* Streak Section */}
      <div className="space-y-3">
        {stats.streak > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border-2 border-orange-200 hover:border-orange-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-orange-600">{stats.streak}</p>
                    <span className="text-sm text-orange-600">days</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Longest</p>
                <p className="text-lg font-bold text-orange-500">{stats.longestStreak} days</p>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Keep it going!</span>
                <span className="text-xs text-orange-600 font-medium">
                  {stats.streak >= 7 ? "🔥 On fire!" : "Keep posting"}
                </span>
              </div>
              <div className="w-full bg-orange-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.streak / 30) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {stats.rank > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200 hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Community Rank</p>
                  <p className="text-3xl font-bold text-purple-600">#{stats.rank}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {stats.streak === 0 && stats.totalSolutions === 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200 text-center">
            <Flame className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium text-gray-600 mb-1">Start Your Streak!</p>
            <p className="text-xs text-gray-500">Post a solution today to begin your streak</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import {
  ThumbsUp,
  MessageCircle,
  Trophy,
  CheckCircle,
  AlertCircle,
  Bug,
  GitPullRequest,
  Star,
  ArrowRight
} from "lucide-react";
import { useUser } from '@/hooks/useUser';
import { Link } from 'react-router-dom';

export function ActivityFeed() {
  const API_BASE = import.meta.env.VITE_API_BASE || "https://shy6565-fixforge-backend.hf.space";
  const { user, loading: authLoading } = useUser();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(4); // Show 4 items (2 bugs + 2 solutions)

  useEffect(() => {
    if (user?.id) {
      fetchActivities();
    }
  }, [user?.id]);

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

  if (authLoading || loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!user?.id) return null;

  const displayedActivities = activities.slice(0, displayCount);
  const hasMore = activities.length > displayCount;

  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No activity yet. Start contributing!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {activities.length} total
        </Badge>
      </div>

      <div className="space-y-3">
        {displayedActivities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colors = getActivityColor(activity.type);
          const timeAgo = formatTimeAgo(activity.created_at);

          return (
            <div
              key={activity.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border} hover:shadow-sm transition-shadow`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                <Icon className={`w-4 h-4 ${colors.icon}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${colors.badge}`}>
                    {activity.badge}
                  </Badge>
                  <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>
              </div>

              {activity.points > 0 && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-green-600">+{activity.points}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t space-y-2">
        {hasMore && (
          <button
            onClick={() => setDisplayCount(prev => prev + 4)}
            className="w-full px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            Load More Activities
          </button>
        )}
        
        <Link
          to="/profile/activity"
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          View All Activities
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}
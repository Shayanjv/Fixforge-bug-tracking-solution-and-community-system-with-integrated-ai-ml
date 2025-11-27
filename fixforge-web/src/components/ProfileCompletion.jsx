import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Check, X } from "lucide-react";
import { useUser } from '@/hooks/useUser';

export function ProfileCompletion() {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";
  
  const { user } = useUser();
  const [completionData, setCompletionData] = useState({
    percentage: 0,
    tasks: []
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/contribution-stats`, {
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        calculateCompletion(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      calculateCompletion(null);
    }
  };

  const calculateCompletion = (statsData) => {
    const tasks = [
      {
        id: 1,
        label: "Create account",
        completed: true,
        percentage: 0,
      },
      {
        id: 2,
        label: "Upload avatar",
        completed: !!(user.avatar || user.avatar_url),
        percentage: 5,
      },
      {
        id: 3,
        label: "Add bio",
        completed: !!(user.bio && user.bio.trim()),
        percentage: 0,
      },
      {
        id: 4,
        label: "Set location",
        completed: !!(user.location && user.location.trim()),
        percentage: 0,
      },
      {
        id: 5,
        label: "Add expertise",
        completed: !!(user.expertise && Array.isArray(user.expertise) && user.expertise.length > 0),
        percentage: 0,
      },
      {
        id: 6,
        label: "Report first bug",
        completed: statsData ? statsData.total_bugs > 0 : false,
        percentage: 15,
      },
      {
        id: 7,
        label: "Post first solution",
completed: statsData ? statsData.total_solutions > 0 : false,
        percentage: 15,
      },
    ];

    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const percentage = Math.round((completedTasks / totalTasks) * 100);

    setCompletionData({
      percentage,
      tasks
    });
  };

  if (!user) return null;

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Complete your profile</h3>

      <div className="flex items-start gap-6">
        {/* Progress Circle */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionData.percentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{completionData.percentage}%</span>
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 space-y-3">
          {completionData.tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {task.completed ? (
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm ${task.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                  {task.label}
                </span>
              </div>
              {task.percentage > 0 && !task.completed && (
                <span className="text-sm text-gray-400">{task.percentage}%</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

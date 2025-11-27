import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Shield, AlertTriangle, Eye, EyeOff, Flag, CheckCircle } from "lucide-react";
import { toast } from "sonner";
// ✅ ADD THIS IMPORT - Dynamic user authentication
import { useUser } from '@/hooks/useUser';

// ✅ CHANGED - Removed userId and userRole props
export function ModerationSection() {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  // ✅ ADD THIS - Get authenticated user from Supabase
  const { user, loading: authLoading } = useUser();

  const [moderationSettings, setModerationSettings] = useState({
    autoModeration: true,
    contentFiltering: true,
    spamDetection: true,
    profanityFilter: false,
    linkFiltering: true,
    reportNotifications: true
  });

  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    pendingReports: 0,
    resolvedToday: 0,
    totalFlagged: 0
  });
  const [loading, setLoading] = useState(true);

  // ✅ CHANGED - Check user role from Supabase user metadata
  const isModerator = user?.user_metadata?.role === "moderator" || 
                      user?.user_metadata?.role === "admin" ||
                      user?.app_metadata?.role === "moderator" ||
                      user?.app_metadata?.role === "admin";

  // ✅ ADD THIS - Fetch moderation settings and stats on mount
  useEffect(() => {
    if (user && isModerator) {
      fetchModerationData();
    }
  }, [user, isModerator]);

  // ✅ ADD THIS FUNCTION - Fetch moderation settings and stats
  const fetchModerationData = async () => {
    if (!user) return;

    try {
      // Fetch settings
      const settingsRes = await fetch(`${API_BASE}/users/${user.id}/moderation-settings`, {
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        }
      });

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setModerationSettings(prev => ({ ...prev, ...settingsData }));
      }

      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/moderation/stats`, {
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          pendingReports: statsData.pending_reports || 0,
          resolvedToday: statsData.resolved_today || 0,
          totalFlagged: statsData.total_flagged || 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch moderation data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (setting) => {
    // ✅ ADD THIS CHECK
    if (!user) {
      toast.error("Please log in to change settings");
      return;
    }

    const newValue = !moderationSettings[setting];
    
    // Optimistic update
    setModerationSettings(prev => ({
      ...prev,
      [setting]: newValue
    }));

    try {
      // ✅ CHANGED - Use user.id from Supabase auth
      const res = await fetch(`${API_BASE}/users/${user.id}/moderation-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          // ✅ ADD - Authorization header
          "Authorization": `Bearer ${user.id}`
        },
        body: JSON.stringify({
          [setting]: newValue
        })
      });

      if (res.ok) {
        toast.success(`${setting} ${newValue ? "enabled" : "disabled"}`);
      } else {
        throw new Error("Failed to update");
      }
    } catch (err) {
      // Revert on error
      setModerationSettings(prev => ({
        ...prev,
        [setting]: !newValue
      }));
      toast.error("Failed to update setting");
    }
  };

  const handleSaveAll = async () => {
    // ✅ ADD THIS CHECK
    if (!user) {
      toast.error("Please log in to save settings");
      return;
    }

    setSaving(true);
    try {
      // ✅ CHANGED - Use user.id from Supabase auth
      const res = await fetch(`${API_BASE}/users/${user.id}/moderation-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          // ✅ ADD - Authorization header
          "Authorization": `Bearer ${user.id}`
        },
        body: JSON.stringify(moderationSettings)
      });

      if (res.ok) {
        toast.success("Moderation settings saved");
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleViewReports = () => {
    window.location.href = "/moderation/reports";
  };

  // ✅ ADD - Loading state
  if (authLoading || loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-pulse" />
          <p className="text-sm text-gray-600">Loading moderation tools...</p>
        </div>
      </Card>
    );
  }

  // ✅ ADD - No user check
  if (!user) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
          <p className="text-sm text-gray-600">
            Please log in to access moderation tools.
          </p>
        </div>
      </Card>
    );
  }

  if (!isModerator) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Moderator Access Required</h3>
          <p className="text-sm text-gray-600">
            This section is only available to moderators and administrators.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Moderation Tools</h3>
            <p className="text-sm text-gray-600">Manage content moderation settings</p>
          </div>
        </div>
        <Badge className="bg-orange-100 text-orange-700 border border-orange-300">
          Moderator
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.pendingReports}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-600">Resolved Today</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.resolvedToday}</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-gray-600">Total Flagged</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.totalFlagged}</p>
        </div>
      </div>

      {/* Moderation Settings */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-900">Automatic Moderation</h4>

        {/* Auto Moderation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-purple-600" />
              <Label htmlFor="auto-moderation" className="font-medium cursor-pointer">
                Auto Moderation
              </Label>
            </div>
            <p className="text-sm text-gray-600">
              Automatically flag suspicious content for review
            </p>
          </div>
          <Switch
            id="auto-moderation"
            checked={moderationSettings.autoModeration}
            onCheckedChange={() => handleToggle("autoModeration")}
          />
        </div>

        {/* Content Filtering */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <Label htmlFor="content-filtering" className="font-medium cursor-pointer">
                Content Filtering
              </Label>
            </div>
            <p className="text-sm text-gray-600">
              Filter inappropriate or harmful content automatically
            </p>
          </div>
          <Switch
            id="content-filtering"
            checked={moderationSettings.contentFiltering}
            onCheckedChange={() => handleToggle("contentFiltering")}
          />
        </div>

        {/* Spam Detection */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <Label htmlFor="spam-detection" className="font-medium cursor-pointer">
                Spam Detection
              </Label>
            </div>
            <p className="text-sm text-gray-600">
              Detect and block spam posts and comments
            </p>
          </div>
          <Switch
            id="spam-detection"
            checked={moderationSettings.spamDetection}
            onCheckedChange={() => handleToggle("spamDetection")}
          />
        </div>

        {/* Profanity Filter */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <EyeOff className="w-4 h-4 text-red-600" />
              <Label htmlFor="profanity-filter" className="font-medium cursor-pointer">
                Profanity Filter
              </Label>
            </div>
            <p className="text-sm text-gray-600">
              Block or censor profane language in posts
            </p>
          </div>
          <Switch
            id="profanity-filter"
            checked={moderationSettings.profanityFilter}
            onCheckedChange={() => handleToggle("profanityFilter")}
          />
        </div>

        {/* Link Filtering */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-green-600" />
              <Label htmlFor="link-filtering" className="font-medium cursor-pointer">
                Link Filtering
              </Label>
            </div>
            <p className="text-sm text-gray-600">
              Check and filter suspicious or malicious links
            </p>
          </div>
          <Switch
            id="link-filtering"
            checked={moderationSettings.linkFiltering}
            onCheckedChange={() => handleToggle("linkFiltering")}
          />
        </div>

        {/* Report Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="w-4 h-4 text-orange-600" />
              <Label htmlFor="report-notifications" className="font-medium cursor-pointer">
                Report Notifications
              </Label>
            </div>
            <p className="text-sm text-gray-600">
              Get notified when content is reported by users
            </p>
          </div>
          <Switch
            id="report-notifications"
            checked={moderationSettings.reportNotifications}
            onCheckedChange={() => handleToggle("reportNotifications")}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <Button
          onClick={handleViewReports}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Flag className="w-4 h-4" />
          View All Reports
        </Button>
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700"
        >
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>

      {/* Warning Notice */}
      <div className="mt-6 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-semibold text-orange-900 mb-1">
              Moderator Responsibilities
            </h5>
            <p className="text-sm text-orange-800">
              As a moderator, you have access to sensitive user data and the ability to take action on reported content. 
              Please use these tools responsibly and follow community guidelines.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

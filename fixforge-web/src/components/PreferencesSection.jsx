import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Settings, Mail, Moon, Globe, Palette } from "lucide-react";
import { toast } from "sonner";
import { useUser } from '@/hooks/useUser';

export function PreferencesSection() {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  const { user, loading: authLoading } = useUser();

  // 1. Initialize with Defaults (CamelCase for Frontend)
  const [preferences, setPreferences] = useState({
  theme: localStorage.getItem("theme") || "light", // <--- THIS LINE FIXES THE FLASH
    timeZone: "UTC",
    dateFormat: "MM/DD/YYYY",
    showProfile: true,
    showActivity: true,
    showEmail: false
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 2. Fetch Preferences on Load
  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  // 3. Apply Theme whenever it changes in state
  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);
  useEffect(() => {
    localStorage.setItem("theme", preferences.theme);
    localStorage.setItem("language", preferences.language);
    localStorage.setItem("timeZone", preferences.timeZone);
    localStorage.setItem("dateFormat", preferences.dateFormat);
  }, [preferences]); 

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.add("light"); // Optional depending on your CSS setup
    } else {
      // System
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) root.classList.add("dark");
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/preferences`, {
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Backend sends camelCase (via our Python GET fix), so we can merge directly
        setPreferences(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ KEY MAPPING FUNCTION: CamelCase -> snake_case
  const getBackendPayload = (currentPrefs) => {
    return {
      theme: currentPrefs.theme,
      language: currentPrefs.language,
      time_zone: currentPrefs.timeZone,        // Map timeZone -> time_zone
      date_format: currentPrefs.dateFormat,    // Map dateFormat -> date_format
      show_profile: currentPrefs.showProfile,  // Map showProfile -> show_profile
      show_activity: currentPrefs.showActivity,// Map showActivity -> show_activity
      show_email: currentPrefs.showEmail,      // Map showEmail -> show_email
      // Add other fields if your state has them (e.g. emailNotifications -> email_notifications)
    };
  };

  const handleToggle = async (key) => {
    if (!user) return;
    
    // 1. Optimistic Update (Update UI immediately)
    const newValue = !preferences[key];
    const updatedPrefs = { ...preferences, [key]: newValue };
    setPreferences(updatedPrefs);

    try {
      // 2. Send to Backend with Mapped Keys
      const payload = getBackendPayload(updatedPrefs);
      
      const res = await fetch(`${API_BASE}/users/${user.id}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleSelectChange = async (key, value) => {
    if (!user) return;

    // 1. Optimistic Update
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);

    try {
      // 2. Send to Backend with Mapped Keys
      const payload = getBackendPayload(updatedPrefs);

      const res = await fetch(`${API_BASE}/users/${user.id}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
      // Revert not strictly necessary for selects but good practice
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = getBackendPayload(preferences);
      const res = await fetch(`${API_BASE}/users/${user.id}/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) toast.success("All preferences saved");
      else throw new Error("Failed");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults = {
      theme: "system",
      language: "en",
      timeZone: "UTC",
      dateFormat: "MM/DD/YYYY",
      showProfile: true,
      showActivity: true,
      showEmail: false
    };
    setPreferences(defaults);
    // Trigger save immediately for defaults
    // You can call handleSaveAll() logic here if you want to persist reset immediately
  };

  // ... Arrays for dropdowns (themes, languages, etc.) ...
  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" }
  ];
  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "ja", label: "Japanese" },
    { value: "zh", label: "Chinese" }
  ];
  const timeZones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern Time" },
    { value: "America/Los_Angeles", label: "Pacific Time" },
    { value: "Europe/London", label: "London" },
    { value: "Asia/Tokyo", label: "Tokyo" },
    { value: "Australia/Sydney", label: "Sydney" }
  ];
  const dateFormats = [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }
  ];

  if (authLoading || loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Preferences</h3>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Settings className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Preferences</h3>
          <p className="text-sm text-gray-600">Customize your experience</p>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-purple-600" />
          <h4 className="text-lg font-semibold text-gray-900">Appearance</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="theme" className="mb-2 flex items-center gap-2">
              <Moon className="w-4 h-4" /> Theme
            </Label>
            <Select value={preferences.theme} onValueChange={(v) => handleSelectChange("theme", v)}>
              <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
              <SelectContent>
                {themes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="language" className="mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Language
            </Label>
            <Select value={preferences.language} onValueChange={(v) => handleSelectChange("language", v)}>
              <SelectTrigger id="language"><SelectValue /></SelectTrigger>
              <SelectContent>
                {languages.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="timezone" className="mb-2">Time Zone</Label>
            <Select value={preferences.timeZone} onValueChange={(v) => handleSelectChange("timeZone", v)}>
              <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
              <SelectContent>
                {timeZones.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-format" className="mb-2">Date Format</Label>
            <Select value={preferences.dateFormat} onValueChange={(v) => handleSelectChange("dateFormat", v)}>
              <SelectTrigger id="date-format"><SelectValue /></SelectTrigger>
              <SelectContent>
                {dateFormats.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-purple-600" />
          <h4 className="text-lg font-semibold text-gray-900">Privacy</h4>
        </div>
        <div className="space-y-3">
          {/* Show Profile */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label htmlFor="show-profile" className="font-medium cursor-pointer">Show Profile</Label>
              <p className="text-sm text-gray-600">Make your profile visible to others</p>
            </div>
            <Switch 
              id="show-profile"
              checked={preferences.showProfile} 
              onCheckedChange={() => handleToggle("showProfile")} 
            />
          </div>

          {/* Show Activity */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label htmlFor="show-activity" className="font-medium cursor-pointer">Show Activity</Label>
              <p className="text-sm text-gray-600">Display your recent activity publicly</p>
            </div>
            <Switch 
              id="show-activity" 
              checked={preferences.showActivity} 
              onCheckedChange={() => handleToggle("showActivity")} 
            />
          </div>

          {/* Show Email */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Label htmlFor="show-email" className="font-medium cursor-pointer">Show Email</Label>
              <p className="text-sm text-gray-600">Display your email on your profile</p>
            </div>
            <Switch 
              id="show-email" 
              checked={preferences.showEmail} 
              onCheckedChange={() => handleToggle("showEmail")} 
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button onClick={handleResetDefaults} variant="outline" className="flex-1">
          Reset to Defaults
        </Button>
        <Button onClick={handleSaveAll} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </Card>
  );
}

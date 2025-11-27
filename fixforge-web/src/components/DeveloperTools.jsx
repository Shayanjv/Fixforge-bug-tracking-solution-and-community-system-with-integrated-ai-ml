import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Code,
  Terminal,
  Key,
  Copy,
  Check,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Database,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from '@/hooks/useUser';

export function DeveloperTools() {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  const { user, loading: authLoading } = useUser();

  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const [stats, setStats] = useState({
    apiCalls: 0,
    lastCall: "Never",
    rateLimit: "0/1000",
    dataSize: "0 MB"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeveloperData();
    }
  }, [user]);

  const fetchDeveloperData = async () => {
    if (!user) return;

    try {
      // 1. Fetch API Key
      const keyRes = await fetch(`${API_BASE}/users/${user.id}/api-keys`, {
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        }
      });

      if (keyRes.ok) {
        const keyData = await keyRes.json();
        // Backend returns the key object directly OR empty object
        if (keyData && keyData.key) {
          setApiKey(keyData.key);
        } else {
          setApiKey(""); // No active key found
        }
      }

      // 2. Fetch Stats
      const statsRes = await fetch(`${API_BASE}/users/${user.id}/api-stats`, {
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          apiCalls: statsData.api_calls || 0,
          lastCall: statsData.last_call || "Never",
          rateLimit: statsData.rate_limit || "0/1000",
          dataSize: statsData.data_size || "0 MB"
        });
      }
    } catch (err) {
      console.error("Failed to fetch developer data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/api-keys/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (res.ok) {
        const data = await res.json();
        setApiKey(data.api_key); // Matches backend response key
        toast.success("New API key generated");
      } else {
        throw new Error("Generation failed");
      }
    } catch (err) {
      toast.error("Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!user) return;
    if (!confirm("Are you sure? This will break any apps using this key.")) return;

    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/api-keys/revoke`, {
        method: "DELETE",
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        }
      });

      if (res.ok) {
        setApiKey("");
        toast.success("API key revoked");
      } else {
        throw new Error("Revoke failed");
      }
    } catch (err) {
      toast.error("Failed to revoke key");
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user.id}/export`, {
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fixforge-export-${user.id}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Data exported");
      }
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
    toast.success("Cache cleared & reloading...");
  };

  if (authLoading || loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Code className="w-6 h-6 text-purple-600 animate-pulse" />
          <h3 className="text-xl font-bold text-gray-900">Developer Tools</h3>
        </div>
        <p className="text-sm text-gray-600">Loading developer settings...</p>
      </Card>
    );
  }

  if (!user) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Code className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-900">Developer Tools</h3>
        <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700">
          Pro
        </Badge>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="api" className="gap-2"><Key className="w-4 h-4"/> API Keys</TabsTrigger>
          <TabsTrigger value="data" className="gap-2"><Database className="w-4 h-4"/> Data</TabsTrigger>
          <TabsTrigger value="debug" className="gap-2"><Terminal className="w-4 h-4"/> Debug</TabsTrigger>
        </TabsList>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Secret Key</h4>
            <p className="text-sm text-gray-600 mb-4">
              Use this key to authenticate API requests. Keep it secret!
            </p>

            {apiKey ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input 
                    value={apiKey} 
                    readOnly 
                    className="font-mono text-sm bg-gray-50 border-purple-200 text-purple-800"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyKey}>
                    {copied ? <Check className="w-4 h-4 text-green-600"/> : <Copy className="w-4 h-4"/>}
                  </Button>
                </div>
                <Button variant="destructive" size="sm" onClick={handleRevokeKey} className="gap-2">
                  <Trash2 className="w-4 h-4"/> Revoke Key
                </Button>
              </div>
            ) : (
              <Button onClick={handleGenerateKey} disabled={generating} className="gap-2 w-full">
                {generating ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Key className="w-4 h-4"/>}
                Generate New Key
              </Button>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-xs text-gray-500 uppercase">Total Calls</p>
              <p className="text-2xl font-bold text-purple-700">{stats.apiCalls}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-500 uppercase">Rate Limit</p>
              <p className="text-2xl font-bold text-blue-700">{stats.rateLimit}</p>
            </div>
          </div>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-2">Export Your Data</h4>
              <p className="text-xs text-gray-500 mb-4">Download a JSON copy of all your solutions and settings.</p>
              <Button onClick={handleExportData} disabled={exportLoading} variant="outline" className="w-full gap-2">
                {exportLoading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                Download JSON
              </Button>
            </div>
          </div>
        </TabsContent>

               {/* Debug Tab */}
        <TabsContent value="debug" className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Troubleshooting Tools</h4>
            <div className="space-y-3">
              {/* 1. Log to Console Button */}
              <Button 
                onClick={() => {
                  console.group("🛠️ FixForge Debug Info");
                  console.log("User Data:", user);
                  console.log("Current API Key:", apiKey ? "Loaded" : "Missing");
                  console.log("API Stats:", stats);
                  console.log("Browser:", navigator.userAgent);
                  console.groupEnd();
                  toast.success("Debug info printed to Browser Console (F12)");
                }} 
                variant="outline" 
                className="w-full justify-start gap-2"
              >
                <Terminal className="w-4 h-4 text-gray-600" /> 
                Log State to Console
              </Button>

              {/* 2. Hard Refresh Button */}
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full justify-start gap-2"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" /> 
                Force Reload Page
              </Button>

              {/* 3. Clear Cache Button */}
              <Button 
                onClick={handleClearCache} 
                variant="destructive" 
                className="w-full justify-start gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              >
                <Trash2 className="w-4 h-4" /> 
                Clear Local Cache & Reset
              </Button>
            </div>
          </div>

          {/* 4. System Info Panel (Visual) */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">System Diagnostics</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto shadow-inner">
              <div className="grid grid-cols-[80px_1fr] gap-y-2">
                <span className="text-gray-500">User ID:</span> 
                <span className="select-all">{user.id}</span>
                
                <span className="text-gray-500">Email:</span>
                <span className="select-all">{user.email}</span>
                
                <span className="text-gray-500">Env:</span>
                <span>{import.meta.env.MODE}</span>
                
                <span className="text-gray-500">Platform:</span>
                <span>{navigator.platform}</span>
                
                <span className="text-gray-500">API Status:</span>
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Connected
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </Card>
  );
}

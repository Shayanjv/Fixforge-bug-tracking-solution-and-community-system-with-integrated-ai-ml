import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Shield, CheckCircle2, Clock, Monitor, Github, Mail } from "lucide-react";
import { useUser } from '@/hooks/useUser';
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export function SecuritySection() {
  const { user, loading } = useUser();
  const [connectedAccounts, setConnectedAccounts] = useState({
    github: false,
    google: false
  });

  useEffect(() => {
    if (user) {
      checkProviders();
    }
  }, [user]);

  const checkProviders = () => {
    if (user?.app_metadata?.providers) {
      const providers = user.app_metadata.providers;
      setConnectedAccounts({
        github: providers.includes('github'),
        google: providers.includes('google')
      });
    }
  };

  const handleConnect = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.href, // Redirect back to this page
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error(`Error connecting ${provider}:`, error);
      toast.error(`Failed to connect ${provider}`);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!user) return null;

  // Format the last sign in time
  const lastSignIn = user.last_sign_in_at 
    ? new Date(user.last_sign_in_at).toLocaleString() 
    : "Just now";

  return (
    <div className="space-y-6">
      
      {/* Connected Accounts */}
      <Card className="bg-white border-gray-200 p-6 shadow-sm">
        <h2 className="text-gray-900 text-lg mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Connected Accounts
        </h2>

        <div className="space-y-4">
          {/* GitHub */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Github className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <p className="text-gray-700">GitHub</p>
                <p className="text-xs text-gray-500">
                  {connectedAccounts.github ? "Connected via OAuth" : "Not connected"}
                </p>
              </div>
            </div>
            {connectedAccounts.github ? (
              <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleConnect('github')}
                className="border-gray-300 text-gray-700 hover:bg-purple-50"
              >
                Connect
              </Button>
            )}
          </div>

          {/* Google */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-gray-700">Google</p>
                <p className="text-xs text-gray-500">
                  {connectedAccounts.google ? "Connected via OAuth" : "Not connected"}
                </p>
              </div>
            </div>
            {connectedAccounts.google ? (
              <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleConnect('google')}
                className="border-gray-300 text-gray-700 hover:bg-purple-50"
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Login History (From User Context) */}
      <Card className="bg-white border-gray-200 p-6 shadow-sm">
        <h2 className="text-gray-900 text-lg mb-6 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-purple-600" />
          Last Active Session
        </h2>

        <div className="p-4 border border-gray-200 rounded-xl">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 text-sm">Current Session</span>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200">Active Now</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 ml-6">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last signed in: {lastSignIn}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

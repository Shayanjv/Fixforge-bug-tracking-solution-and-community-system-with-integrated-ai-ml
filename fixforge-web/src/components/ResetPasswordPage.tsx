import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { Card } from "./ui/card";
import { Lock, CheckCircle, AlertCircle, Bug, Sparkles } from "lucide-react";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsub: { subscription: { unsubscribe: () => void } } | null = null;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setReady(true);
        }
      } catch (e) {
        console.error(e);
      }

      const { data: listener } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });
      unsub = listener;
    })();

    return () => {
      if (unsub?.subscription) unsub.subscription.unsubscribe();
    };
  }, []);

  const validate = () => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  const v = validate();
  if (v) return setError(v);

  if (!ready) {
    return setError("Invalid or missing recovery session. Open the link from your email again.");
  }

  setLoading(true);
  try {
    // 1. Update password in auth.users
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "Failed to reset password. Try again.");
      setLoading(false);
      return;
    }

    // 2. Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    // 3. Update password_hash in public.users to indicate password is now set
    if (user) {
      await supabase
        .from('users')
        .update({ password_hash: 'password_set' })
        .eq('id', user.id);
    }

    setSuccess(true);
  } catch (err: any) {
    setError(err?.message || "Unexpected error. Try again.");
  } finally {
    setLoading(false);
  }
};


  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <button
          onClick={() => navigate("/")}
          className="absolute top-6 right-6 z-10 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bug className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl text-white">FixForge</span>
        </button>

        <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl text-white mb-3">
              Password Updated!
            </h1>
            
            <p className="text-gray-400 mb-8">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 transition-all duration-300 hover:scale-[1.02]"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}></div>

      <button
        onClick={() => navigate("/")}
        className="absolute top-6 right-6 z-10 flex items-center gap-2"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Bug className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl text-white">FixForge</span>
      </button>

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 mb-4">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-200">Reset Password</span>
            </div>
            <h1 className="text-3xl text-white mb-2">
              Set a new password
            </h1>
            <p className="text-gray-400">
              Enter your new password below
            </p>
          </div>

          {!ready && (
            <div className="mb-6 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">
                Invalid or missing recovery session. Please open the link from your email again.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-white">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={`pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all ${
                    confirm && password === confirm
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500/50"
                      : ""
                  }`}
                />
              </div>
              {confirm && password === confirm && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-green-400 rounded-full"></span>
                  Passwords match
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!ready || loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 mt-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
              {!loading && <span className="ml-2">→</span>}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Remember your password?{" "}
              <span className="text-violet-400">Back to Login</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

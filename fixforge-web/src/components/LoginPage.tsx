import { useState } from "react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { Card } from "./ui/card";
import { Bug, Mail, Lock, Sparkles, ArrowLeft, AlertCircle } from "lucide-react";
import { loginWithGoogle, loginWithGitHub } from "../utils/oauth";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? "Please enter a valid email"
          : "";
      case "password":
        return value.length < 1 ? "Password is required" : "";
      default:
        return "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: "Please enter your email address first" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setErrors({ email: error.message });
    } else {
      setResetEmailSent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErrors({});

  if (!formData.email || !formData.password) {
    setErrors({ 
      email: !formData.email ? "Email is required" : "",
      password: !formData.password ? "Password is required" : ""
    });
    setLoading(false);
    return;
  }

  // Check if user exists and how they registered
  const { data: existingUser } = await supabase
    .from('users')
    .select('email, password_hash')
    .eq('email', formData.email)
    .single();

  // Only block if user ONLY has OAuth and has NOT set a password
  if (existingUser && existingUser.password_hash === 'oauth_user') {
    setErrors({ 
      email: "This email is registered via Google/GitHub. Please use social login, or click 'Forgot password?' to set a password for email login." 
    });
    setLoading(false);
    return;
  }

  // Try to authenticate with password (works for 'email_user' and 'password_set')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  setLoading(false);

  if (error) {
    setErrors({ password: "Invalid email or password" });
    return;
  }

  setLoginSuccess(true);
  setTimeout(() => navigate("/dashboard"), 1500);
};

  // Reset Email Success Screen
  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl text-white mb-2">Check Your Email</h2>
            <p className="text-gray-400 mb-6">
              We've sent a password reset link to <strong className="text-violet-400">{formData.email}</strong>
            </p>
            <Button
              onClick={() => setResetEmailSent(false)}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // OTP Functions
  const handleSendOTP = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      setOtpError("Please enter a valid email");
      return;
    }
    
    console.log("Sending OTP to:", otpEmail);
    setOtpError("");
    setOtpSent(true);
    
    setTimeout(() => {
      console.log("OTP sent successfully (Demo: code is 123456)");
    }, 500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    setOtpError("");

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    if (newOtp.every(digit => digit !== "") && index === 5) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyOTP = (code: string) => {
    setIsVerifying(true);
    
    setTimeout(() => {
      if (code === "123456") {
        setLoginSuccess(true);
        setTimeout(() => navigate("/"), 1500);
      } else {
        setOtpError("Invalid code, please try again");
        setOtpCode(["", "", "", "", "", ""]);
        document.getElementById("otp-0")?.focus();
      }
      setIsVerifying(false);
    }, 1000);
  };

  const handleResendOTP = () => {
    setOtpCode(["", "", "", "", "", ""]);
    setOtpError("");
    handleSendOTP();
  };

  // Success Screen
  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-4xl text-white mb-3">
              You're signed in!
            </h1>
            
            <p className="text-gray-400 mb-2">
              Welcome back to FixForge
            </p>
            
            <p className="text-violet-400 mb-8">
              {loginMode === "otp" ? otpEmail : formData.email}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // OTP Entry Screen
  if (loginMode === "otp" && otpSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <Button
          variant="ghost"
          className="absolute top-6 left-6 z-10 text-white hover:bg-white/10 gap-2"
          onClick={() => {
            setOtpSent(false);
            setOtpCode(["", "", "", "", "", ""]);
            setOtpError("");
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

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
              <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-violet-400" />
              </div>
              <h1 className="text-3xl text-white mb-2">
                Enter the 6-digit code
              </h1>
              <p className="text-gray-400 mb-1">
                We sent a code to
              </p>
              <p className="text-violet-400">
                {otpEmail}
              </p>
            </div>

            <div className="flex gap-2 justify-center mb-6">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl bg-white/10 border border-white/20 rounded-lg text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {otpError && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {otpError}
                </p>
              </div>
            )}

            {isVerifying && (
              <div className="mb-6 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <p className="text-sm text-violet-400 text-center flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying code...
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendOTP}
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                Resend Code
              </button>
            </div>

            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-400 text-center">
                💡 Demo mode: Use code <span className="font-mono font-bold">123456</span> to sign in
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // OTP Email Input Screen
  if (loginMode === "otp") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        <Button
          variant="ghost"
          className="absolute top-6 left-6 z-10 text-white hover:bg-white/10 gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

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
                <span className="text-sm text-violet-200">Sign in with OTP</span>
              </div>
              <h1 className="text-3xl text-white mb-2">
                Sign in to FixForge
              </h1>
              <p className="text-gray-400">
                We'll send you a one-time code
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp-email" className="text-white">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="you@example.com"
                    value={otpEmail}
                    onChange={(e) => {
                      setOtpEmail(e.target.value);
                      setOtpError("");
                    }}
                    className={`pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all ${
                      otpError ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : ""
                    }`}
                  />
                </div>
                {otpError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                    {otpError}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSendOTP}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/50"
              >
                Send OTP
                <span className="ml-2">→</span>
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Prefer password?{" "}
                <button
                  onClick={() => setLoginMode("password")}
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Sign in with password
                </button>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Get Started
                </button>
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Password Login Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}></div>

      <Button
        variant="ghost"
        className="absolute top-6 left-6 z-10 text-white hover:bg-white/10 gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Button>

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
              <span className="text-sm text-violet-200">Welcome Back</span>
            </div>
            <h1 className="text-3xl text-white mb-2">
              Sign in to FixForge
            </h1>
            <p className="text-gray-400">
              Continue your journey in fixing bugs with AI
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all ${
                    errors.email && touched.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : ""
                  }`}
                />
              </div>
              {errors.email && touched.email && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{errors.email}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all ${
                    errors.password && touched.password
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : ""
                  }`}
                />
              </div>
              {errors.password && touched.password && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 mt-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && <span className="ml-2">→</span>}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                Get Started
              </button>
            </p>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-transparent px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 mb-3"
            onClick={() => setLoginMode("otp")}
          >
            <Mail className="w-5 h-5 mr-2" />
            Sign in with OTP
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={loginWithGoogle} 
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={loginWithGitHub}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

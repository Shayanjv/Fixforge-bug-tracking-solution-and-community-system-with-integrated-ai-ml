import { useState } from "react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { Card } from "./ui/card";
import { Mail, CheckCircle } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Bug } from "lucide-react";
import { supabase } from "../lib/supabaseClient";


export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate(); 

  const validateEmail = (value: string) => {
    return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? "Please enter a valid email"
      : "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);
    if (touched) {
      setError(validateEmail(value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      return;
    }

   try {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: import.meta.env.VITE_RESET_REDIRECT,
  });
  if (error) throw error;
  setSubmitted(true);
} catch (err: any) {
  console.error(err);
  setError(err.message || "Failed to send reset email. Please try again.");
}
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        {/* Background Glow Effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        {/* Back to Login */}
       <Button
      variant="ghost"
      className="absolute top-6 left-6 z-10 text-white hover:bg-white/10 gap-2"
      onClick={() => navigate("/login")}
    ><ArrowLeft className="w-4 h-4" />
      Back to Login
    </Button>
        
          
        {/* Logo */}
        <button
           onClick={() => navigate("/")}
          className="absolute top-6 right-6 z-10 flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bug className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl text-white">FixForge</span>
        </button>

        {/* Success Card */}
        <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            
            <h1 className="text-3xl text-white mb-3">
              Check your email
            </h1>
            
            <p className="text-gray-400 mb-2">
              We've sent a password reset link to
            </p>
            
            <p className="text-violet-400 mb-6">
              {email}
            </p>
            
            <p className="text-sm text-gray-500 mb-8">
              Click the link in the email to reset your password. If you don't see the email, check your spam folder.
            </p>
            
            <Button
               onClick={() => navigate("/login")}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 transition-all duration-300 hover:scale-[1.02]"
            >
              Back to Login
            </Button>
            
            <div className="mt-6">
              <button
                onClick={() => setSubmitted(false)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Didn't receive the email? <span className="text-violet-400">Resend</span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}></div>

      {/* Back to Login */}
      <Button
        variant="ghost"
        className="absolute top-6 left-6 z-10 text-white hover:bg-white/10 gap-2"
         onClick={() => navigate("/login")}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Button>

      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 right-6 z-10 flex items-center gap-2"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Bug className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl text-white">FixForge</span>
      </button>

      {/* Forgot Password Card */}
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl text-white mb-2">
              Forgot your password?
            </h1>
            <p className="text-gray-400">
              No worries, we'll send you reset instructions
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
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
                  value={email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all ${
                    error && touched
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : ""
                  }`}
                />
              </div>
              {error && touched && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                  {error}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 mt-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/50"
            >
              Reset Password
              <span className="ml-2">→</span>
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

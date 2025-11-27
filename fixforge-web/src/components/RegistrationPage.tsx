import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

import{ Button }from "../components/button";
import { Input } from "../components/input";

import {Label} from "../components/label";
import { Card } from "./ui/card";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { useNavigate } from "react-router-dom";

import { Bug, User, Mail, Lock, Sparkles, ArrowLeft } from "lucide-react";



export function RegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);          // ✅ new
  const [sentEmail, setSentEmail] = useState("");  // ✅ new
  const [loading, setLoading] = useState(false);


  const validateField = (name: string, value: string) => {
    switch (name) {
      case "fullName":
        return value.length < 2 ? "Name must be at least 2 characters" : "";
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? "Please enter a valid email"
          : "";
      case "password":
        return value.length < 8
          ? "Password must be at least 8 characters"
          : "";
      case "confirmPassword":
        return value !== formData.password ? "Passwords do not match" : "";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email, password_hash')
      .eq('email', formData.email)
      .single();

    if (existingUser) {
      if (existingUser.password_hash === 'oauth_user') {
        setErrors({ 
          email: 'This email is already registered via Google/GitHub. Please use social login.' 
        });
      } else {
        setErrors({ 
          email: 'This email is already registered. Please sign in instead.' 
        });
      }
      setLoading(false);
      return;
    }

    // Proceed with signup
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { display_name: formData.fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      setErrors({ email: error.message });
      return;
    }

    setSent(true);
    setSentEmail(formData.email);
  };

  // ✅ Conditional render at the top
  if (sent) {
  return <RegistrationSuccess email={sentEmail} />;
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

      {/* Back to Home */}
      <Button
        variant="ghost"
        className="absolute top-6 left-6 z-10 text-white hover:bg-white/10 gap-2"
        onClick={() => navigate("/")}

      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
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

      {/* Registration Card */}
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 mb-4">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-200">Join FixForge</span>
            </div>
            <h1 className="text-3xl text-white mb-2">
              Create your FixForge account
            </h1>
            <p className="text-gray-400">
              Join the community of developers fixing bugs with AI-powered insights
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all ${
                    errors.fullName && touched.fullName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : ""
                  }`}
                />
              </div>
              {errors.fullName && touched.fullName && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.fullName}
                </p>
              )}
            </div>

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
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-11 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 transition-all ${
                    errors.confirmPassword && touched.confirmPassword
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/50"
                      : formData.confirmPassword && !errors.confirmPassword && touched.confirmPassword
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500/50"
                      : ""
                  }`}
                />
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.confirmPassword}
                </p>
              )}
              {!errors.confirmPassword && formData.confirmPassword && touched.confirmPassword && (
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-green-400 rounded-full"></span>
                  Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 mt-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/50"
            >
              Get Started
              <span className="ml-2">→</span>
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <button
               onClick={() => navigate("/login")}

                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
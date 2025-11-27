
import { Card } from "./ui/card";
import { Button } from "../components/button";
import { Bug, Sparkles, Share2, MessageSquare } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-3xl"></div>
      
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bug className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-white">
                FixForge
              </span>
            </div>
            <div className="flex gap-3">
              <Button
      variant="ghost"
      className="text-white hover:bg-white/10"
      onClick={() => navigate("/login")}
    >
      Sign In
    </Button>
              <Button
      className="bg-violet-600 hover:bg-violet-700"
      onClick={() => navigate("/register")}
    >
      Get Started
    </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 mb-8">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-200">
              AI-Powered Bug Tracking Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl mb-6 text-white max-w-5xl mx-auto">
            FixForge
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            The collaborative platform for tracking bugs, sharing solutions, and leveraging AI-powered insights.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="pb-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl mb-4 text-white">
              Everything you need to fix bugs faster
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed to streamline your debugging workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Report Bugs */}
            <Card className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Bug className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl mb-3 text-white">Report Bugs</h3>
                <p className="text-gray-400 leading-relaxed">
                  Submit detailed bug reports with screenshots, categorization, and client type.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </Card>

            {/* Feature 2: AI Suggestions */}
            <Card className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl mb-3 text-white">AI Suggestions</h3>
                <p className="text-gray-400 leading-relaxed">
                  Get instant AI-powered solution suggestions with confidence scores.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </Card>

            {/* Feature 3: Share Solutions */}
            <Card className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Share2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl mb-3 text-white">Share Solutions</h3>
                <p className="text-gray-400 leading-relaxed">
                  Contribute your expertise by submitting solutions with code snippets.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </Card>

            {/* Feature 4: Collaborate */}
            <Card className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl mb-3 text-white">Collaborate</h3>
                <p className="text-gray-400 leading-relaxed">
                  Discuss bugs with the community through comments and feedback.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 p-12 shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative text-center">
              <h2 className="text-3xl sm:text-4xl mb-4 text-white">
                Ready to transform your debugging workflow?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of developers already using FixForge
              </p>
              <Button 
                size="lg" 
                className="bg-white text-violet-600 hover:bg-gray-50 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
               onClick={() => navigate("/register")}
              >
                Get Started for Free
                <span className="ml-2">→</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bug className="w-4 h-4 text-white" />
            </div>
            <span className="text-white">
              FixForge
            </span>
          </div>
          <p>© 2025 FixForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
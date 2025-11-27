// TopNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function TopNav() {
  const linkClass = ({ isActive }) =>
    isActive
      ? "text-white px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm"
      : "text-gray-200 hover:text-purple-300 transition-colors px-4 py-2 rounded-lg hover:bg-white/5 backdrop-blur-sm";

  return (
    <header className="bg-gradient-to-r from-[#3b1c6e] via-[#4c2a85] to-[#3b1c6e] border-b border-purple-400/20 shadow-lg shadow-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20 justify-between">
          <div className="text-2xl font-bold text-white">FixForge</div>

          <nav className="flex items-center gap-3">
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>

            <div className="w-px h-6 bg-purple-400/20" />

            <NavLink to="/submit" className={linkClass}>
              Submit Bug
            </NavLink>

            <div className="w-px h-6 bg-purple-400/20" />

            <NavLink to="/post-solution" className={linkClass}>
              Post Solution
            </NavLink>

            <div className="w-px h-6 bg-purple-400/20" />

            <NavLink to="/my-bugs" className={linkClass}>
              My Bugs
            </NavLink>

            <div className="w-px h-6 bg-purple-400/20" />

            <NavLink to="/my-solutions" className={linkClass}>
              My Solutions
            </NavLink>

            <div className="w-px h-6 bg-purple-400/20" />

            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}

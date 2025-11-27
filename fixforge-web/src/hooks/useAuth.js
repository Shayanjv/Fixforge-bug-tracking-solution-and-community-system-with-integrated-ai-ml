import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE; // Make sure your backend API base URL is set here

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const u = localStorage.getItem("fixforge_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  // Function to register or login user and sync to your backend DB
  async function signIn(email, password) {
    setLoading(true);
    setError(null);
    try {
      // Call your backend login endpoint - adjust URL and method as needed
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
      }

      const data = await res.json();

      // 'data.user' should include fields matching your DB schema: id, email, username, display_name, etc.
      setUser(data.user);
      localStorage.setItem("fixforge_user", JSON.stringify(data.user));

      // Optionally store JWT token for authenticated API calls
      localStorage.setItem("fixforge_token", data.token);
    } catch (err) {
      setError(err.message);
      setUser(null);
      localStorage.removeItem("fixforge_user");
      localStorage.removeItem("fixforge_token");
    } finally {
      setLoading(false);
    }
  }

  // Function to register new user and sync with backend DB
  async function signUp(userInfo) {
    setLoading(true);
    setError(null);
    try {
      // Call your backend register endpoint - adjust URL and method as needed
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
      }

      const data = await res.json();

      setUser(data.user);
      localStorage.setItem("fixforge_user", JSON.stringify(data.user));
      localStorage.setItem("fixforge_token", data.token);
    } catch (err) {
      setError(err.message);
      setUser(null);
      localStorage.removeItem("fixforge_user");
      localStorage.removeItem("fixforge_token");
    } finally {
      setLoading(false);
    }
  }

  // Function to logout
  function signOut() {
    setUser(null);
    localStorage.removeItem("fixforge_user");
    localStorage.removeItem("fixforge_token");
  }

  return { user, loading, error, signIn, signUp, signOut };
}

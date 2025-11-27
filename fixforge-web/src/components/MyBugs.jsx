// src/components/MyBugs.jsx
import React, { useEffect, useState } from "react";
// src/components/MyBugs.jsx
// src/components/MyBugs.jsx
import { useUserContext } from "../context/UserContext";



import { BugCard } from "./BugCard";

const API_BASE = "http://127.0.0.1:8000";

export default function MyBugs() {
  const { user, loading, error } = useUserContext();

  const [bugs, setBugs] = useState([]);
  const [loadingBugs, setLoadingBugs] = useState(true);
  const [bugError, setBugError] = useState(null);

  // Debug logs
  console.log("MyBugs - User:", user);
  console.log("MyBugs - Loading:", loading);
  console.log("MyBugs - Error:", error);

  useEffect(() => {
    if (loading) return; // Wait for user context to load
    if (!user) {
      setLoadingBugs(false);
      return;
    }

    const fetchUserBugs = async () => {
      setLoadingBugs(true);
      setBugError(null);
      try {
        console.log("Fetching bugs for user:", user.id);
        const res = await fetch(`${API_BASE}/bugs?user_id=${user.id}`);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error:", errorText);
          throw new Error(`Failed to fetch bugs: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Fetched bugs:", data);

        const mappedBugs = (Array.isArray(data) ? data : []).map((bug) => ({
          id: bug.id,
          title: bug.title,
          description: bug.description,
          tags: bug.tags || [],
          severity: bug.severity || "",
          client: bug.client_type || "",
          status: bug.status || "Open",
          votes: bug.votes || 0,
          screenshotUrl: bug.screenshot_url || null,
          cluster: bug.cluster || null,
          x: bug.x || null,
          y: bug.y || null,
          created_at: bug.created_at || null,
          updated_at: bug.updated_at || null,
          category: bug.category || "",
          screenshotNotes: bug.screenshot_notes || "",
          userId: bug.user_id || null,
          language: bug.language || "",
          framework: bug.framework || "",
        }));

        setBugs(mappedBugs);
      } catch (err) {
        console.error("Error fetching bugs:", err);
        setBugError(err.message);
      } finally {
        setLoadingBugs(false);
      }
    };

    fetchUserBugs();
  }, [user, loading]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">Loading user data...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  // Show not logged in state
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600">Please log in to view your bugs.</p>
      </div>
    );
  }

  // Show bugs loading state
  if (loadingBugs) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl mb-6">My Reported Bugs</h1>
        <p className="text-gray-600">Loading your bugs...</p>
      </div>
    );
  }

  // Show bug fetch error
  if (bugError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl mb-6">My Reported Bugs</h1>
        <p className="text-red-600">Error loading bugs: {bugError}</p>
      </div>
    );
  }

  // Show empty state
  if (bugs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl mb-6">My Reported Bugs</h1>
        <p className="text-gray-600">You have not reported any bugs yet.</p>
      </div>
    );
  }

  // Show bugs list
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl mb-6">My Reported Bugs</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {bugs.map((bug) => (
          <BugCard key={bug.id} bug={bug} />
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useUserContext } from '../context/UserContext';
import { CommentsSection } from "./CommentsSection";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export function SolutionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserContext();

  const readOnly = location.state?.readOnly || false;

  const API_BASE = (import.meta.env.VITE_API_BASE || "https://shy6565-fixforge-backend.hf.space
").replace(/\/+$/, "");
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  const [solution, setSolution] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false); // ✅ Track upvote state
  const [isUpvoting, setIsUpvoting] = useState(false); // ✅ Loading state
  const [editedSolution, setEditedSolution] = useState({
    title: "",
    explanation: "",
    code: "",
    status: "Open",
  });

  // Fetch solution details
  useEffect(() => {
    const fetchSolution = async () => {
      try {
        setIsLoading(true);
        const url = user?.id 
          ? `${API_BASE}/getsolution/${id}?user_id=${user.id}`
          : `${API_BASE}/getsolution/${id}`;
        
        const res = await fetch(url, {
          headers: {
            ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch solution");
        }

        const data = await res.json();
        setSolution(data);
        setHasUpvoted(data.has_upvoted || false); // ✅ Set initial upvote state
        setEditedSolution({
          title: data.title,
          explanation: data.explanation,
          code: data.code,
          status: data.status || "Open",
        });
      } catch (err) {
        console.error("Error fetching solution:", err);
        toast.error("Failed to load solution");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSolution();
    }
  }, [id, API_BASE, API_KEY, user]);

  // ✅ UPDATED: Toggle upvote function
  const handleUpvote = async () => {
    if (!user || !user.id) {
      toast.error("You must be logged in to upvote");
      return;
    }

    setIsUpvoting(true);

    try {
      const res = await fetch(`${API_BASE}/solutions/${id}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // ✅ Update UI immediately
        setSolution((prev) => ({ 
          ...prev, 
          votes: data.votes 
        }));
        setHasUpvoted(data.has_upvoted);
        
        toast.success(data.message);
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || "Failed to toggle upvote");
      }
    } catch (err) {
      console.error("Upvote error:", err);
      toast.error("Failed to toggle upvote");
    } finally {
      setIsUpvoting(false);
    }
  };

  // Handle save changes
  const handleSave = async () => {
    if (!user || !user.id) {
      toast.error("You must be logged in to edit");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE}/getsolution/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        body: JSON.stringify({
          ...editedSolution,
          user_id: user.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSolution(data);
        setIsEditing(false);
        toast.success("Solution updated successfully");
        navigate("/my-solutions");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Update failed");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to update solution");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${solution?.title}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    if (!user || !user.id) {
      toast.error("You must be logged in to delete solutions");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/getsolution/${id}?user_id=${user.id}`, {
        method: "DELETE",
        headers: {
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          "Content-Type": "application/json",
        },
      });
      
      if (res.ok) {
        toast.success("Solution deleted successfully");
        navigate("/my-solutions");
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || "Failed to delete solution");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete solution");
    }
  };

  const canEdit = !readOnly && solution?.user_id === user?.id;
  const showUpvote = !canEdit;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card className="p-6">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-6" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Solution Not Found</h2>
          <p className="text-gray-600 mb-6">
            The solution you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/my-solutions")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Solutions
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 hover:bg-gray-100 text-gray-700"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-8 mb-6 bg-white shadow-sm">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedSolution.title}
              onChange={(e) =>
                setEditedSolution({ ...editedSolution, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-gray-900">
              {solution.title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {new Date(solution.created_at).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4" />
            <span>{solution.votes || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>{solution.comments_count || 0}</span>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
            {solution.status || editedSolution.status}
          </div>
        </div>

        {readOnly && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              👁️ <strong>View Mode:</strong> You're viewing this solution from related suggestions.
            </p>
          </div>
        )}

        {isEditing && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Change Status
            </label>
            <div className="flex gap-3">
              {["Open", "In Progress", "Solved", "Needs Review"].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setEditedSolution({ ...editedSolution, status })
                  }
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    editedSolution.status === status
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Explanation
          </label>
          {isEditing ? (
            <textarea
              value={editedSolution.explanation}
              onChange={(e) =>
                setEditedSolution({
                  ...editedSolution,
                  explanation: e.target.value,
                })
              }
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {solution.explanation}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Code Solution
          </label>
          {isEditing ? (
            <textarea
              value={editedSolution.code}
              onChange={(e) =>
                setEditedSolution({ ...editedSolution, code: e.target.value })
              }
              rows={12}
              className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 resize-none"
            />
          ) : (
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
              <code>{solution.code}</code>
            </pre>
          )}
        </div>

        {canEdit && (
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedSolution({
                      title: solution.title,
                      explanation: solution.explanation,
                      code: solution.code,
                      status: solution.status || "Open",
                    });
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Solution
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        )}

        {/* ✅ UPDATED UPVOTE BUTTON */}
        {showUpvote && (
          <div className="pt-4 border-t border-gray-100">
            <Button
              onClick={handleUpvote}
              disabled={!user || isUpvoting}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                hasUpvoted
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50"
              }`}
            >
              <ThumbsUp 
                className={`w-4 h-4 mr-2 ${hasUpvoted ? "fill-white" : ""}`} 
              />
              {isUpvoting 
                ? "Loading..." 
                : hasUpvoted 
                  ? `Upvoted (${solution.votes || 0})` 
                  : `Upvote (${solution.votes || 0})`
              }
            </Button>
            {!user && (
              <p className="text-sm text-gray-500 mt-2">
                Please log in to upvote this solution
              </p>
            )}
          </div>
        )}
      </Card>

      <CommentsSection solutionId={id} />
    </div>
  );
}

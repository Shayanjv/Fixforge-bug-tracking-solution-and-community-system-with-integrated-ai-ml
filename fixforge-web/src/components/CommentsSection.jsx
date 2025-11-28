import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { useUserContext } from '../context/UserContext';
import { MessageSquare, Send, Edit, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export function CommentsSection({ solutionId }) {
  const { user } = useUserContext();
  const API_BASE = (import.meta.env.VITE_API_BASE || "https://shy6565-fixforge-backend.hf.space").replace(/\/+$/, "");

  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchComments();
  }, [solutionId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/comments/solution/${solutionId}`, {
        headers: {
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers: {
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          solution_id: solutionId,
          user_id: user.id,
          content: newComment.trim(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      setNewComment("");
      await fetchComments();
      toast.success("Comment posted!");
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: "PUT",
        headers: {
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      await fetchComments();
      setEditingId(null);
      setEditContent("");
      toast.success("Comment updated!");
    } catch (err) {
      console.error("Error updating comment:", err);
      toast.error("Failed to update comment");
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`${API_BASE}/comments/${commentId}?solution_id=${solutionId}`, {
        method: "DELETE",
        headers: {
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      await fetchComments();
      toast.success("Comment deleted");
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-purple-600" />
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      {user ? (
        <Card className="p-4 mb-6 bg-purple-50 border-purple-200">
          <form onSubmit={handleSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows="3"
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end mt-3">
              <Button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6 text-center bg-gray-50 border-gray-200 mb-6">
          <p className="text-gray-600">Please log in to comment</p>
        </Card>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <Card className="p-8 text-center bg-gray-50">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No comments yet. Be the first to comment!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4 border-purple-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold text-gray-900">
                    {comment.author.display_name}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {formatTime(comment.created_at)}
                    {comment.updated_at !== comment.created_at && " (edited)"}
                  </span>
                </div>
                {user && user.id === comment.user_id && (
                  <div className="flex gap-2">
                    {editingId === comment.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveEdit(comment.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(comment)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {editingId === comment.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

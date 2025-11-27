import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useUserContext } from '../context/UserContext';
import {
  ThumbsUp,
  MessageCircle,
  Edit,
  Eye,
  AlertTriangle,
  Image as ImageIcon
} from "lucide-react";

export function SolutionCard({
  solution,
  layout = "grid",
  onEdit,
  onView,
  onVote,
  onComment
}) {
  const { user } = useUserContext();
  
  const statusColors = {
    Open: "bg-blue-50 text-blue-700 border-blue-200",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
    Solved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Needs Review": "bg-rose-50 text-rose-700 border-rose-200"
  };

  const severityColors = {
    Low: "bg-green-50 text-green-700 border-green-200",
    Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Critical: "bg-red-50 text-red-700 border-red-200"
  };

  const truncate = (text, max) => {
    if (!text) return "No description";
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  const formatVotes = (votes) => votes > 999 ? "999+" : votes;
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just now";
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

  const isGrid = layout === "grid";
  
  // Check if current user is the owner of this solution
  const isOwner = user && solution.user_id && user.id === solution.user_id;

  // Stop event propagation for buttons
  const handleButtonClick = (e, callback, ...args) => {
  e.stopPropagation();
  if (callback) callback(...args);
};


  return (
    <Card 
      onClick={() => onView && onView(solution.id)}
      className={`group relative p-6 hover:shadow-lg transition-all cursor-pointer border-purple-100 hover:border-purple-300 ${
        isGrid ? "flex flex-col" : "flex flex-row gap-6"
      }`}
    >
      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-50/0 via-purple-50/50 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" />

      <div className="relative z-10 flex-1">
        {/* Status & Severity */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={`${statusColors[solution.status]} border font-medium`}>
            {solution.status}
          </Badge>
          {solution.severity && (
            <Badge className={`${severityColors[solution.severity]} border font-medium`}>
              {solution.severity}
            </Badge>
          )}
          {solution.status === "Needs Review" && (
            <AlertTriangle className="w-4 h-4 text-rose-500" title="Needs Review" />
          )}
          {solution.hasScreenshot && (
            <ImageIcon className="w-4 h-4 text-purple-500" title="Has Screenshot" />
          )}
          {/* Owner badge */}
          {isOwner && (
            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
              Your Solution
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {solution.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {truncate(solution.description, 150)}
        </p>

        {/* Tags */}
        {solution.tags && solution.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {solution.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                {tag}
              </Badge>
            ))}
            {solution.tags.length > 3 && (
              <Badge variant="outline" className="text-gray-600 border-gray-200">
                +{solution.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
           <button
  onClick={(e) => handleButtonClick(e, onVote, solution.id)}
  className={`flex items-center gap-1 transition-colors ${
    solution.hasVoted ? "text-purple-600" : "hover:text-purple-600"
  }`}
  title={user ? "Upvote" : "Login to vote"}
  disabled={!user}
>
  <ThumbsUp className={`w-4 h-4 ${solution.hasVoted ? "fill-purple-600" : ""}`} />
  <span className="font-medium">{formatVotes(solution.votes || 0)}</span>
</button>
            <button
              onClick={(e) => handleButtonClick(e, onComment, solution.id)}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors"
              title="Comments"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{solution.comments || 0}</span>
            </button>
          </div>

          <span className="text-xs text-gray-500">
            {formatTimestamp(solution.timestamp)}
          </span>
        </div>

        {/* Action Buttons - ✅ REMOVED DELETE BUTTON */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button
            size="sm"
            onClick={(e) => handleButtonClick(e, onView, solution.id)}
            className="gap-1 bg-purple-600 hover:bg-purple-700 text-white flex-1"
          >
            <Eye className="w-4 h-4" />
            View
          </Button>
          
          {/* Show Edit only for owners - Delete button removed */}
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleButtonClick(e, onEdit, solution.id)}
              className="gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

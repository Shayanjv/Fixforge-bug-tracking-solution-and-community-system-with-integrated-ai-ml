from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.core.config import supabase
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()

class CommentCreate(BaseModel):
    solution_id: str
    user_id: str
    content: str

class CommentUpdate(BaseModel):
    content: str

@router.get("/solution/{solution_id}")
def get_comments(solution_id: str):
    """Get all comments for a solution with user info."""
    try:
        # Join with users table to get user details
        res = supabase.table("comments").select(
            "*, users(id, email, username, display_name)"
        ).eq("solution_id", solution_id).order("created_at", desc=False).execute()
        
        # Format response
        comments = []
        for comment in res.data or []:
            user_info = comment.get("users", {})
            comments.append({
                "id": comment["id"],
                "solution_id": comment["solution_id"],
                "user_id": comment["user_id"],
                "content": comment["content"],
                "created_at": comment["created_at"],
                "updated_at": comment.get("updated_at"),
                "author": {
                    "id": user_info.get("id"),
                    "email": user_info.get("email"),
                    "username": user_info.get("username"),
                    "display_name": user_info.get("display_name") or user_info.get("username") or user_info.get("email", "").split("@")[0]
                }
            })
        
        return comments
    except Exception as e:
        print(f"Error fetching comments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch comments: {e}")


@router.post("")
def create_comment(comment: CommentCreate):
    """Create a new comment."""
    try:
        if not comment.content.strip():
            raise HTTPException(status_code=400, detail="Comment content cannot be empty")
        
        comment_id = str(uuid.uuid4())
        new_comment = {
            "id": comment_id,
            "solution_id": comment.solution_id,
            "user_id": comment.user_id,
            "content": comment.content.strip(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        res = supabase.table("comments").insert(new_comment).execute()
        
        # Update solution comment count
        solution_res = supabase.table("solutions").select("comments").eq("id", comment.solution_id).execute()
        if solution_res.data:
            current_count = solution_res.data[0].get("comments", 0) or 0
            supabase.table("solutions").update({"comments": current_count + 1}).eq("id", comment.solution_id).execute()
        
        return {"message": "Comment created successfully", "comment": res.data[0] if res.data else new_comment}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create comment: {e}")


@router.put("/{comment_id}")
def update_comment(comment_id: str, comment_update: CommentUpdate):
    """Update a comment."""
    try:
        if not comment_update.content.strip():
            raise HTTPException(status_code=400, detail="Comment content cannot be empty")
        
        update_data = {
            "content": comment_update.content.strip(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        res = supabase.table("comments").update(update_data).eq("id", comment_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        return {"message": "Comment updated successfully", "comment": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating comment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update comment: {e}")


@router.delete("/{comment_id}")
def delete_comment(comment_id: str, solution_id: str = Query(...)):
    """Delete a comment."""
    try:
        # Check if comment exists
        check = supabase.table("comments").select("id").eq("id", comment_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Delete comment
        supabase.table("comments").delete().eq("id", comment_id).execute()
        
        # Update solution comment count
        solution_res = supabase.table("solutions").select("comments").eq("id", solution_id).execute()
        if solution_res.data:
            current_count = solution_res.data[0].get("comments", 0) or 0
            supabase.table("solutions").update({"comments": max(0, current_count - 1)}).eq("id", solution_id).execute()
        
        return {"message": "Comment deleted successfully", "comment_id": comment_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting comment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete comment: {e}")

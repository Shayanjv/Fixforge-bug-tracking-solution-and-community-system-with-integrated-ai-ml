from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid
from app.core.config import supabase
from typing import Optional

router = APIRouter()
async def mark_milestone_complete(user_id: str, milestone_name: str):
    """Mark a milestone as complete for a user"""
    try:
        print(f"🔵 Marking milestone '{milestone_name}' for user: {user_id}")
        
        result = supabase.from_("user_milestones").upsert({
            "user_id": user_id,
            "milestone_name": milestone_name,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "is_completed": True
        }, on_conflict="user_id,milestone_name").execute()
        
        print(f"✅ Milestone '{milestone_name}' marked as complete")
        return True
        
    except Exception as e:
        print(f"❌ Error marking milestone: {e}")
        return False
class SolutionIn(BaseModel):
    bug_id: str  # Changed from bugId to bug_id for consistency
    title: str
    explanation: str
    code: str
    patch: Optional[str] = None
    user_id: str  # Made required
    author: Optional[str] = None
    from_ai: Optional[bool] = False  # NEW: Track if from AI

class UpvoteRequest(BaseModel):
    user_id: str

@router.post("/")
async def submit_solution(payload: SolutionIn):
    """
    Submit a solution (manual or AI-generated).
    Works for both /post-solution route and AI suggestion posting.
    """
    print(f"📝 Submitting solution for bug: {payload.bug_id}")
    print(f"👤 User: {payload.user_id}, Author: {payload.author}")
    print(f"🤖 From AI: {payload.from_ai}")
    
    # Validate required fields
    if not payload.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    if not payload.bug_id:
        raise HTTPException(status_code=400, detail="bug_id is required")
    
    solution_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    solution = {
        "id": solution_id,
        "bug_id": payload.bug_id,
        "title": payload.title,
        "explanation": payload.explanation,
        "code": payload.code,
        "patch": payload.patch,
        "user_id": payload.user_id,
        "author": payload.author or "Anonymous",
        "from_ai": payload.from_ai,
        "votes": 0,
        "created_at": created_at,
    }

    try:
        # 1. Verify bug exists
        bug_check = supabase.table("bugs").select("id").eq("id", payload.bug_id).execute()
        if not bug_check.data:
            raise HTTPException(status_code=404, detail=f"Bug {payload.bug_id} not found")
        
        # 2. Verify user exists
        user_check = supabase.table("users").select("id").eq("id", payload.user_id).execute()
        if not user_check.data:
            raise HTTPException(status_code=404, detail=f"User {payload.user_id} not found")
        
        # 3. Insert the solution
        insert_result = supabase.table("solutions").insert(solution).execute()
        
        if not insert_result.data:
            raise HTTPException(status_code=500, detail="Failed to insert solution")

        # 4. Mark the related bug as solved
        supabase.table("bugs").update({"status": "Solved"}).eq("id", payload.bug_id).execute()
        
        print(f"✅ Solution {solution_id} created successfully")
        # ✅ Mark milestone as complete
        await mark_milestone_complete(payload.user_id, "post-first-solution")                           

        
        return {
            "message": "Solution submitted and bug marked as Solved",
            "solution": insert_result.data[0] if insert_result.data else solution
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Solution submission error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to insert solution: {str(e)}")

@router.get("/bug/{bug_id}")
def get_solutions_for_bug(bug_id: str):
    """
    Get all solutions for a specific bug.
    Returns solutions with author info and vote counts.
    """
    try:
        print(f"🔍 Fetching solutions for bug: {bug_id}")
        
        res = supabase.table("solutions")\
            .select("*")\
            .eq("bug_id", bug_id)\
            .order("votes", desc=True)\
            .execute()
        
        solutions = res.data or []
        print(f"📊 Found {len(solutions)} solutions")
        
        return solutions
    except Exception as e:
        print(f"❌ Error fetching solutions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch solutions: {str(e)}")

@router.get("/{solution_id}")
def get_solution(solution_id: str):
    """
    Get a specific solution by ID.
    """
    try:
        res = supabase.table("solutions")\
            .select("*")\
            .eq("id", solution_id)\
            .execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Solution not found")
        
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch solution: {str(e)}")

@router.post("/{solution_id}/upvote")
def toggle_upvote(solution_id: str, payload: UpvoteRequest):
    """
    Toggle upvote for a solution using existing votes table.
    - If user hasn't upvoted: Add upvote
    - If user has upvoted: Remove upvote
    Returns updated vote count and user's upvote status.
    """
    try:
        user_id = payload.user_id
        print(f"👍 Toggle upvote: solution={solution_id}, user={user_id}")
        
        # ✅ Check if solution exists
        solution_check = supabase.table("solutions")\
            .select("id")\
            .eq("id", solution_id)\
            .execute()
        
        if not solution_check.data or len(solution_check.data) == 0:
            raise HTTPException(status_code=404, detail="Solution not found")
        
        # ✅ Check if user already upvoted this solution
        existing_vote = supabase.table("votes")\
            .select("*")\
            .eq("solution_id", solution_id)\
            .eq("user_id", user_id)\
            .eq("vote_type", "upvote")\
            .execute()
        
        has_upvoted = len(existing_vote.data) > 0
        
        if has_upvoted:
            # ✅ Remove upvote
            supabase.table("votes")\
                .delete()\
                .eq("solution_id", solution_id)\
                .eq("user_id", user_id)\
                .execute()
            
            message = "Upvote removed"
            new_status = False
            print(f"➖ Upvote removed")
        else:
            # ✅ Add upvote
            supabase.table("votes")\
                .insert({
                    "solution_id": solution_id,
                    "user_id": user_id,
                    "vote_type": "upvote"
                })\
                .execute()
            
            message = "Upvoted successfully"
            new_status = True
            print(f"➕ Upvote added")
        
        # ✅ Count total upvotes for this solution
        total_upvotes = supabase.table("votes")\
            .select("*", count="exact")\
            .eq("solution_id", solution_id)\
            .eq("vote_type", "upvote")\
            .execute()
        
        vote_count = total_upvotes.count or 0
        
        # ✅ Update votes count in solutions table for caching
        supabase.table("solutions")\
            .update({"votes": vote_count})\
            .eq("id", solution_id)\
            .execute()
        
        print(f"✅ Final vote count: {vote_count}")
        
        return {
            "message": message,
            "votes": vote_count,
            "has_upvoted": new_status,
            "solution_id": solution_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upvote error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to toggle upvote: {str(e)}")

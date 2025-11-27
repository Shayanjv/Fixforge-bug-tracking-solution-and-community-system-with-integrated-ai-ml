from fastapi import APIRouter, HTTPException, Query,Depends
from pydantic import BaseModel
from app.core.config import supabase
from typing import Optional
from app.dependencies import get_user_from_api_key
router = APIRouter()

class StatusUpdate(BaseModel):
    status: str  # "Open", "In Progress", "Solved", "Needs Review"

@router.get("")
def get_solutions(
    user_id: str = Query(None), 
    bug_id: str = Query(None),
    # ✅ Add this optional dependency
    api_key_user_id: Optional[str] = Depends(get_user_from_api_key)
):
    """
    Get all solutions.
    - If API Key is present: Returns solutions for the API Key owner (unless overridden).
    - If no API Key: Works as a public/normal endpoint.
    """
    try:
        query = supabase.table("solutions").select("*")
        
        # Logic: If API key is used, default to showing THAT user's solutions
        # unless they explicitly asked for someone else's (user_id param)
        if api_key_user_id and not user_id:
            user_id = api_key_user_id

        # ✅ Filter by user_id
        if user_id:
            query = query.eq("user_id", user_id)
        
        # ✅ Filter by bug_id
        if bug_id:
            query = query.eq("bug_id", bug_id)
        
        res = query.order("created_at", desc=True).execute()
        return res.data or []
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch solutions: {e}")
@router.get("/{solution_id}")
def get_solution_detail(solution_id: str, user_id: str = Query(None)):
    """Get detailed information for a specific solution."""
    try:
        res = supabase.table("solutions").select("*").eq("id", solution_id).execute()
        
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Solution not found")
        
        solution = res.data[0]
        
        # ✅ Check if current user has upvoted this solution
        if user_id:
            upvote_check = supabase.table("votes")\
                .select("*")\
                .eq("solution_id", solution_id)\
                .eq("user_id", user_id)\
                .eq("vote_type", "upvote")\
                .execute()
            
            solution["has_upvoted"] = len(upvote_check.data) > 0
        else:
            solution["has_upvoted"] = False
        
        return solution
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch solution: {e}")

@router.put("/{solution_id}")
def update_solution(solution_id: str, update_data: dict):
    """Update a solution (for edit functionality)."""
    try:
        user_id = update_data.get("user_id")
        
        # Check if solution exists and get owner
        check = supabase.table("solutions").select("id, user_id").eq("id", solution_id).execute()
        
        if not check.data or len(check.data) == 0:
            raise HTTPException(status_code=404, detail="Solution not found")
        
        # ✅ Verify ownership
        solution_owner = check.data[0]["user_id"]
        if user_id and solution_owner != user_id:
            raise HTTPException(status_code=403, detail="You can only edit your own solutions")
        
        # Remove user_id from update_data to avoid overwriting
        update_payload = {k: v for k, v in update_data.items() if k != "user_id"}
        
        # Update the solution
        res = supabase.table("solutions")\
            .update(update_payload)\
            .eq("id", solution_id)\
            .execute()
        
        return {
            "message": "Solution updated successfully", 
            "solution": res.data[0] if res.data else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update solution: {e}")

@router.patch("/{solution_id}/status")
def update_solution_status(solution_id: str, status_update: StatusUpdate):
    """Update only the status of a solution."""
    try:
        valid_statuses = ["Open", "In Progress", "Solved", "Needs Review"]
        if status_update.status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: {valid_statuses}"
            )
        
        # Update and immediately fetch the result
        res = supabase.table("solutions")\
            .update({"status": status_update.status})\
            .eq("id", solution_id)\
            .execute()
        
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Solution not found")
        
        return {
            "message": "Status updated successfully", 
            "solution": res.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Status update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update status: {e}")

@router.delete("/{solution_id}")
def delete_solution(solution_id: str, user_id: str = Query(...)):
    """Delete a solution by ID - only if user owns it."""
    try:
        # Check if solution exists AND get its owner
        check = supabase.table("solutions")\
            .select("id, user_id")\
            .eq("id", solution_id)\
            .execute()
        
        if not check.data or len(check.data) == 0:
            raise HTTPException(status_code=404, detail="Solution not found")
        
        # ✅ Verify ownership
        solution_owner = check.data[0]["user_id"]
        if solution_owner != user_id:
            raise HTTPException(
                status_code=403, 
                detail="You can only delete your own solutions"
            )
        
        # Delete the solution (votes will cascade delete automatically)
        supabase.table("solutions").delete().eq("id", solution_id).execute()
        
        return {
            "message": "Solution deleted successfully", 
            "solution_id": solution_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete solution: {e}")

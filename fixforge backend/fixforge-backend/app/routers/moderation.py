# routers/moderation.py
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.core.config import supabase

router = APIRouter( tags=["moderation"])

@router.put("/{user_id}/moderation-settings")
async def update_moderation_settings(
    user_id: str,
    settings: dict,
    x_api_key: Optional[str] = Header(None)
):
    try:
        # Verify user is moderator/admin
        user = supabase.table("users").select("role").eq("id", user_id).execute()
        if not user.data or user.data[0].get("role") not in ["moderator", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Update settings
        result = supabase.table("moderation_settings").upsert({
            "user_id": user_id,
            **settings
        }).execute()
        
        return {"success": True, "settings": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# routers/api_keys.py
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import secrets
from app.core.config import supabase


router = APIRouter( tags=["api-keys"])

@router.post("/generate")
async def generate_api_key(data: dict, x_api_key: Optional[str] = Header(None)):
    try:
        user_id = data.get("user_id")
        # Generate secure API key
        api_key = f"fxf_{secrets.token_urlsafe(32)}"
        
        # Store in database
        # supabase.table("api_keys").insert({"user_id": user_id, "key": api_key}).execute()
        
        return {"api_key": api_key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/revoke")
async def revoke_api_key(x_api_key: Optional[str] = Header(None)):
    # Delete from database
    return {"success": True}

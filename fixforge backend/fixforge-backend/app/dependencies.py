from fastapi import Header, HTTPException
from app.core.config import supabase

async def get_user_from_api_key(x_api_key: str = Header(None)):
    """Returns user_id if API key is valid, else None"""
    if not x_api_key:
        return None
        
    # Check DB for key
    res = supabase.from_("api_keys").select("user_id").eq("key", x_api_key).eq("is_active", True).execute()
    
    if res.data:
        return res.data[0]["user_id"]
    
    # If key provided but invalid -> Error (don't let them guess)
    raise HTTPException(status_code=401, detail="Invalid API Key")

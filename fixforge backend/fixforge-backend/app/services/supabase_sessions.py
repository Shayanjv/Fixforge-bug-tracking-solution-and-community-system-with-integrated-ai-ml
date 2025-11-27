# Filename: app/services/supabase_session.py

import uuid
from datetime import datetime
from app.core.config import supabase

def upsert_user_and_session(profile: dict):
    """
    Upsert a user record into the 'users' table matching the schema:
    id (UUID), email, username, display_name, updated_at.
    
    Generates a UUID for id if profile 'provider_user_id' is missing or invalid.
    Derives username from email prefix.
    """

    # Validate or generate UUID for user ID
    try:
        user_id = str(uuid.UUID(profile.get("provider_user_id", "")))
    except (ValueError, TypeError):
        user_id = str(uuid.uuid4())

    # Derive username from email before '@'
    username = profile.get("email", "").split("@")[0]

    user_data = {
        "id": user_id,
        "email": profile.get("email"),
        "username": username,
        "display_name": profile.get("name"),
        "updated_at": datetime.utcnow().isoformat(),
    }

    response = supabase.table("users").upsert(user_data).execute()

    if response.error:
        print("Supabase upsert error:", response.error)

    return response.data

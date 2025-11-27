# app/routers/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import secrets
from passlib.hash import bcrypt
from app.core.config import supabase


router = APIRouter( tags=["auth"])

# Replace these with real DB access (e.g., Supabase client or ORM)
db_users = ...                 # users table access
db_reset_tokens = ...          # password_reset_tokens table access
email_sender = ...             # function/service to send emails

class ForgotRequest(BaseModel):
    email: EmailStr

class ResetRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(payload: ForgotRequest):
    user = db_users.get_by_email(payload.email)
    # Always return 200 to avoid leaking which emails exist
    if not user:
        return {"message": "If the email exists, a reset link was sent."}

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    db_reset_tokens.insert({
        "user_id": user["id"],
        "token": token,
        "expires_at": expires_at,
        "used": False,
    })

    # Local dev: use localhost URL
    reset_url = f"http://localhost:5173/reset-password?token={token}"

    # Production later: use your real domain
    # reset_url = f"https://fixforge.com/reset-password?token={token}"

    email_sender.send(
        to=payload.email,
        subject="Reset your FixForge password",
        html=f"""
          <p>Click the link below to reset your password. It expires in 1 hour.</p>
          <p><a href="{reset_url}">{reset_url}</a></p>
        """
    )

    return {"message": "If the email exists, a reset link was sent."}

@router.post("/reset-password")
async def reset_password(payload: ResetRequest):
    token_row = db_reset_tokens.get_by_token(payload.token)
    if (
        not token_row
        or token_row["used"]
        or token_row["expires_at"] < datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db_users.get_by_id(token_row["user_id"])
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    hashed = bcrypt.hash(payload.new_password)
    db_users.update(user["id"], {"password_hash": hashed})

    db_reset_tokens.update(token_row["id"], {"used": True})

    return {"message": "Password reset successful"}

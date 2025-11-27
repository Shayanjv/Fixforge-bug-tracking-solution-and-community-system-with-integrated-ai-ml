# app/routers/users.py
from fastapi import APIRouter, HTTPException, UploadFile, File  # ✅ Add UploadFile and File
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import supabase
from datetime import datetime
import uuid
import base64 
from datetime import datetime, timedelta, timezone


router = APIRouter(tags=["users"])

# --- Models ---
class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None  # ✅ Add avatar_url support
    expertise: Optional[List[str]] = None  # ✅ Add expertise tags support
    website: Optional[str] = None

class PreferencesUpdate(BaseModel):
    theme: Optional[str] = "light"  # ✅ Changed from "system" to "light"
    email_notifications: Optional[bool] = True
    push_notifications: Optional[bool] = True
    solution_updates: Optional[bool] = True
    comment_replies: Optional[bool] = True
    weekly_digest: Optional[bool] = False
    marketing_emails: Optional[bool] = False
    language: Optional[str] = "en"
    time_zone: Optional[str] = "UTC"
    date_format: Optional[str] = "MM/DD/YYYY"
    show_profile: Optional[bool] = True
    show_activity: Optional[bool] = True
    show_email: Optional[bool] = False


# --- Core User Endpoints ---

@router.get("/{user_id}")
async def get_user_profile(user_id: str):
    """Get complete user profile with all fields"""
    try:
        response = supabase.from_("users").select("*").eq("id", user_id).limit(1).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = response.data[0]
        
        # ✅ Map 'avatar' to 'avatar_url' for frontend compatibility
        if 'avatar' in user and user['avatar']:
            user['avatar_url'] = user['avatar']
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}")
async def update_user_profile(user_id: str, user_data: UserUpdate):
    """Update user profile - supports all fields"""
    try:
        updates = {k: v for k, v in user_data.dict().items() if v is not None}
        
        # ✅ Map 'avatar_url' to 'avatar' for database
        if 'avatar_url' in updates:
            updates['avatar'] = updates.pop('avatar_url')
        
        # ✅ Add updated_at timestamp
        updates['updated_at'] = datetime.now().isoformat()
        
        print(f"🔵 Updating user {user_id} with data:", updates)
        
        # Update the user
        result = supabase.from_("users").update(updates).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        updated_user = result.data[0]
        
        # ✅ Map 'avatar' back to 'avatar_url' for response
        if 'avatar' in updated_user and updated_user['avatar']:
            updated_user['avatar_url'] = updated_user['avatar']
        
        print(f"🔵 Update successful:", updated_user)
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🔴 Error updating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{user_id}")
async def partial_update_user_profile(user_id: str, user_data: UserUpdate):
    """Partial update - same as PUT but kept for compatibility"""
    return await update_user_profile(user_id, user_data)

# --- Preferences ---
@router.get("/{user_id}/preferences")
async def get_user_preferences(user_id: str):
    try:
        res = supabase.from_("user_preferences").select("*").eq("user_id", user_id).single().execute()
        
        if res.data:
            prefs = res.data
            # ✅ MAP snake_case (DB) TO camelCase (Frontend)
            return {
                "theme": prefs.get("theme", "system"),
                "emailNotifications": prefs.get("email_notifications", True),
                "pushNotifications": prefs.get("push_notifications", True),
                "solutionUpdates": prefs.get("solution_updates", True),
                "commentReplies": prefs.get("comment_replies", True),
                "weeklyDigest": prefs.get("weekly_digest", False),
                "marketingEmails": prefs.get("marketing_emails", False),
                "language": prefs.get("language", "en"),
                "timeZone": prefs.get("time_zone", "UTC"),
                "dateFormat": prefs.get("date_format", "MM/DD/YYYY"),
                "showProfile": prefs.get("show_profile", True),
                "showActivity": prefs.get("show_activity", True),
                "showEmail": prefs.get("show_email", False),
            }
        else:
            # Return defaults if no record exists
            return {
                "theme": "light", 
                "emailNotifications": True,
                "pushNotifications": True,
                "solutionUpdates": True,
                "commentReplies": True,
                "weeklyDigest": False,
                "marketingEmails": False,
                "language": "en",
                "timeZone": "UTC",
                "dateFormat": "MM/DD/YYYY",
                "showProfile": True,
                "showActivity": True,
                "showEmail": False,
            }
    except Exception as e:
        print(f"Error fetching preferences: {e}")
        # Return defaults on error to prevent frontend crash
        return {} 

# 3. PUT Endpoint (Receives snake_case from Frontend mapping)
@router.put("/{user_id}/preferences")
async def update_user_preferences(user_id: str, prefs: PreferencesUpdate):
    try:
        # Prepare data for Supabase (snake_case)
        data = {
            "user_id": user_id,
            "theme": prefs.theme,
            "email_notifications": prefs.email_notifications,
            "push_notifications": prefs.push_notifications,
            "solution_updates": prefs.solution_updates,
            "comment_replies": prefs.comment_replies,
            "weekly_digest": prefs.weekly_digest,
            "marketing_emails": prefs.marketing_emails,
            "language": prefs.language,
            "time_zone": prefs.time_zone,
            "date_format": prefs.date_format,
            "show_profile": prefs.show_profile,
            "show_activity": prefs.show_activity,
            "show_email": prefs.show_email,
        }
        
        # Upsert to Database
        supabase.from_("user_preferences").upsert(data).execute()
        
        return {"message": "Preferences updated", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Security ---


# --- Developer Tools ---

@router.get("/{user_id}/api-keys")
async def get_api_keys(user_id: str):
    """Fetch the active API key for a user"""
    try:
        # Fetch only the most recent active key
        res = supabase.from_("api_keys")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
            
        if res.data and len(res.data) > 0:
            return res.data[0] # Return single key object
        return {} # Return empty if no key exists
    except Exception as e:
        print(f"Error fetching API keys: {e}")
        return {}

@router.get("/{user_id}/api-stats")
async def get_api_stats(user_id: str):
    """Fetch usage stats (Mocked for now, connect to real logging later)"""
    # In a real app, you would query a 'request_logs' table here
    return {
        "api_calls": 124,          # Example: Mock data or fetch count from DB
        "last_call": "2 mins ago",
        "rate_limit": "124/1000",
        "data_size": "1.2 MB"
    }

@router.post("/{user_id}/api-keys/generate")
async def generate_api_key(user_id: str):
    """Generate a new API key"""
    try:
        new_key = f"fx_{uuid.uuid4().hex[:24]}" # Production-style prefix
        
        key_data = {
            "user_id": user_id,
            "name": "Production Key",
            "key": new_key,
            "created_at": datetime.now().isoformat(),
            "is_active": True
        }
        
        # Insert new key
        res = supabase.from_("api_keys").insert(key_data).execute()
        
        if res.data:
            return {"api_key": new_key, "created_at": key_data["created_at"]}
        raise HTTPException(status_code=500, detail="Failed to create key")
        
    except Exception as e:
        print(f"Error generating key: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}/api-keys/revoke")
async def revoke_api_key(user_id: str):
    """Revoke (delete) all API keys for this user"""
    try:
        # Delete all keys for this user
        supabase.from_("api_keys").delete().eq("user_id", user_id).execute()
        return {"message": "Key revoked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Export/Import Logic
@router.get("/{user_id}/export")
async def export_user_data(user_id: str):
    """Export user data as JSON"""
    try:
        # Fetch user's solutions/bugs/profile
        solutions = supabase.from_("solutions").select("*").eq("user_id", user_id).execute()
        
        export_data = {
            "user_id": user_id,
            "exported_at": datetime.now().isoformat(),
            "solutions": solutions.data if solutions.data else []
        }
        return export_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Stats & Activities ---



# app/routers/users.py

@router.get("/{user_id}/activities")
async def get_user_activities(user_id: str):
    """Get user's recent activities - includes profile AND bugs/solutions"""
    try:
        print(f"🔵 Fetching activities for user: {user_id}")
        
        # Try to fetch from activities table
        res = supabase.from_("activities").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
        
        if res.data and len(res.data) > 0:
            print(f"✅ Found {len(res.data)} activities from database")
            return res.data
        
        # If no activities, generate from user data
        print(f"🔵 No activities found, generating from user data...")
        
        from datetime import datetime, timedelta
        generated_activities = []
        
        # === FETCH REAL BUGS REPORTED BY USER ===
        print(f"📊 Fetching bugs reported by user...")
        bugs_res = supabase.from_("bugs").select(
            "id, title, created_at"
        ).eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
        
        bugs = bugs_res.data if bugs_res.data else []
        print(f"✅ Found {len(bugs)} bugs reported")
        
        # Add bug activities
        for bug in bugs:
            generated_activities.append({
                "id": f"bug-{bug['id']}",
                "user_id": user_id,
                "type": "bug_reported",
                "title": "Bug Reported",
                "description": f"You reported: {bug['title'][:50]}...",
                "created_at": bug['created_at'],
                "badge": "Bug Report",
                "points": 10,
                "metadata": {"bug_id": bug['id']}
            })
        
        # === FETCH REAL SOLUTIONS POSTED BY USER ===
        print(f"📊 Fetching solutions posted by user...")
        solutions_res = supabase.from_("solutions").select(
            "id, title, created_at, status"
        ).eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
        
        solutions = solutions_res.data if solutions_res.data else []
        print(f"✅ Found {len(solutions)} solutions posted")
        
        # Add solution activities
        for solution in solutions:
            is_accepted = solution.get('status') == 'accepted'
            activity_type = "solution_accepted" if is_accepted else "solution_posted"
            badge = "Accepted ✓" if is_accepted else "Solution"
            points = 25 if is_accepted else 15
            
            generated_activities.append({
                "id": f"solution-{solution['id']}",
                "user_id": user_id,
                "type": activity_type,
                "title": "Solution Posted" if not is_accepted else "Solution Accepted",
                "description": f"You posted: {solution['title'][:50]}...",
                "created_at": solution['created_at'],
                "badge": badge,
                "points": points,
                "metadata": {"solution_id": solution['id']}
            })
        
        # === FETCH USER PROFILE FOR ACHIEVEMENTS ===
        print(f"👤 Fetching user profile...")
        user_res = supabase.from_("users").select("*").eq("id", user_id).limit(1).execute()
        
        if user_res.data:
            user = user_res.data[0]
            
            # Activity: Account Created
            if user.get('created_at'):
                created_date = user['created_at']
                generated_activities.append({
                    "id": f"auto-{user_id}-created",
                    "user_id": user_id,
                    "type": "achievement",
                    "title": "Account Created",
                    "description": f"Welcome to FixForge, {user.get('display_name', 'User')}!",
                    "created_at": created_date,
                    "badge": "Joined",
                    "points": 0,
                    "metadata": {}
                })
            
            # Activity: Profile Completed
            if user.get('bio') and user['bio'].strip():
                activity_date = datetime.fromisoformat(user['created_at'].replace('Z', '+00:00')) + timedelta(hours=1)
                generated_activities.append({
                    "id": f"auto-{user_id}-bio",
                    "user_id": user_id,
                    "type": "achievement",
                    "title": "Profile Completed",
                    "description": "You added a bio to your profile",
                    "created_at": activity_date.isoformat(),
                    "badge": "Profile",
                    "points": 5,
                    "metadata": {}
                })
            
            # Activity: Avatar Set
            if user.get('avatar') and user['avatar']:
                activity_date = datetime.fromisoformat(user['created_at'].replace('Z', '+00:00')) + timedelta(hours=2)
                generated_activities.append({
                    "id": f"auto-{user_id}-avatar",
                    "user_id": user_id,
                    "type": "achievement",
                    "title": "Avatar Set",
                    "description": "You uploaded a profile picture",
                    "created_at": activity_date.isoformat(),
                    "badge": "Avatar",
                    "points": 3,
                    "metadata": {}
                })
            
            # Activity: Expertise Added
            if user.get('expertise') and isinstance(user['expertise'], list) and len(user['expertise']) > 0:
                activity_date = datetime.fromisoformat(user['created_at'].replace('Z', '+00:00')) + timedelta(hours=3)
                tags = ", ".join(user['expertise'][:3])
                generated_activities.append({
                    "id": f"auto-{user_id}-expertise",
                    "user_id": user_id,
                    "type": "achievement",
                    "title": "Expertise Added",
                    "description": f"You added expertise tags: {tags}",
                    "created_at": activity_date.isoformat(),
                    "badge": "Skills",
                    "points": 5,
                    "metadata": {"tags": user['expertise']}
                })
        
        # Sort by created_at (newest first)
        generated_activities.sort(key=lambda x: x['created_at'], reverse=True)
        
        print(f"✅ Generated {len(generated_activities)} total activities")
        print(f"   - {len(bugs)} bug reports")
        print(f"   - {len(solutions)} solutions")
        print(f"   - Profile achievements")
        
        return generated_activities
        
    except Exception as e:
        print(f"❌ Error fetching activities: {e}")
        import traceback
        traceback.print_exc()
        return []
@router.post("/{user_id}/complete-milestone")
async def complete_milestone(user_id: str, task: str):
    """
    Mark a milestone task as completed
    task: "report-first-bug", "post-first-solution", etc.
    """
    try:
        print(f"🔵 Marking milestone '{task}' as complete for user: {user_id}")
        
        from datetime import datetime, timezone
        
        # Insert or update milestone record
        result = supabase.from_("user_milestones").upsert({
            "user_id": user_id,
            "milestone_name": task,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "is_completed": True
        }, on_conflict="user_id,milestone_name").execute()
        
        print(f"✅ Milestone '{task}' marked as complete")
        return {"status": "completed", "milestone": task}
        
    except Exception as e:
        print(f"❌ Error completing milestone: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@router.get("/{user_id}/milestones")
async def get_user_milestones(user_id: str):
    """Get all completed milestones for a user"""
    try:
        res = supabase.from_("user_milestones").select("*").eq("user_id", user_id).execute()
        return res.data if res.data else []
    except Exception as e:
        print(f"❌ Error fetching milestones: {e}")
        return []


@router.get("/{user_id}/export")
async def export_user_data(user_id: str):
    return {"message": "Export started"}

# app/routers/users.py

@router.post("/{user_id}/upload/avatar")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    """
    Upload user avatar image and store as base64 in database.
    """
    try:
        print(f"🔵 Avatar upload request for user: {user_id}")
        print(f"🔵 File: {file.filename}, Type: {file.content_type}")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            print(f"❌ Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file contents
        try:
            contents = await file.read()
            print(f"🔵 File size: {len(contents)} bytes")
        except Exception as read_error:
            print(f"❌ Error reading file: {read_error}")
            raise HTTPException(status_code=400, detail="Failed to read file")
        
        # Validate file size (5MB max)
        if len(contents) > 5 * 1024 * 1024:
            print(f"❌ File too large: {len(contents)} bytes")
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Encode to base64
        try:
            base64_image = base64.b64encode(contents).decode('utf-8')
            avatar_url = f"data:{file.content_type};base64,{base64_image}"
            print(f"🔵 Base64 encoded, length: {len(avatar_url)}")
        except Exception as encode_error:
            print(f"❌ Error encoding image: {encode_error}")
            raise HTTPException(status_code=500, detail="Failed to encode image")
        
        # Update user's avatar in database
        try:
            print(f"🔵 Updating database for user {user_id}")
            result = supabase.from_("users").update({
                "avatar": avatar_url,
                "updated_at": datetime.now().isoformat()
            }).eq("id", user_id).execute()
            
            print(f"🔵 Database response: {result}")
            
            if not result.data:
                print(f"❌ User not found: {user_id}")
                raise HTTPException(status_code=404, detail="User not found")
            
        except Exception as db_error:
            print(f"❌ Database error: {db_error}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
        
        print(f"✅ Avatar updated successfully for user {user_id}")
        
        return {
            "url": avatar_url,
            "avatar_url": avatar_url,
            "message": "Avatar uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in avatar upload: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    
@router.get("/{user_id}/contribution-stats")
async def get_contribution_stats(user_id: str):
    """
    Calculate contribution stats from actual database schema
    """
    try:
        print(f"🔵 Calculating stats for user: {user_id}")
        
        # Fetch all solutions by this user
        solutions_res = supabase.from_("solutions").select(
            "id, user_id, status, created_at"
        ).eq("user_id", user_id).execute()
        
        solutions = solutions_res.data if solutions_res.data else []
        print(f"✅ Found {len(solutions)} solutions")

        # Fetch all bugs by this user
        bugs_res = supabase.from_("bugs").select(
            "id, user_id, created_at"
        ).eq("user_id", user_id).execute()
        
        bugs = bugs_res.data if bugs_res.data else []
        print(f"✅ Found {len(bugs)} bugs")

        # Get solution IDs to count upvotes
        solution_ids = [s["id"] for s in solutions]
        total_upvotes = 0
        
        if solution_ids:
            votes_res = supabase.from_("votes").select("id").in_(
                "solution_id", solution_ids
            ).eq("vote_type", "upvote").execute()
            
            total_upvotes = len(votes_res.data) if votes_res.data else 0
            print(f"✅ Found {total_upvotes} upvotes")

        # === CALCULATE BASIC COUNTS ===
        total_solutions = len(solutions)
        total_bugs = len(bugs)
        accepted_solutions = len([s for s in solutions if s.get("status") == "accepted"])
        acceptance_rate = round((accepted_solutions / total_solutions * 100)) if total_solutions > 0 else 0

        # === CALCULATE THIS WEEK / THIS MONTH ===
        # USE TIMEZONE-AWARE DATETIME
        from datetime import timezone
        now = datetime.now(timezone.utc)  # ← FIX: Make it timezone-aware
        one_week_ago = now - timedelta(days=7)
        one_month_ago = now - timedelta(days=30)
        
        this_week = len([s for s in solutions 
                        if datetime.fromisoformat(s["created_at"].replace("Z", "+00:00")) > one_week_ago])
        
        this_month = len([s for s in solutions 
                         if datetime.fromisoformat(s["created_at"].replace("Z", "+00:00")) > one_month_ago])
        
        print(f"✅ This week: {this_week}, This month: {this_month}")

        # === CALCULATE STREAK ===
        sorted_solutions = sorted(solutions, key=lambda x: x["created_at"], reverse=True)
        current_streak = 0
        longest_streak = 0

        if sorted_solutions:
            today = datetime.now(timezone.utc).date()  # ← FIX: Timezone-aware
            current_date = today
            temp_streak = 0
            
            for solution in sorted_solutions:
                solution_date = datetime.fromisoformat(
                    solution["created_at"].replace("Z", "+00:00")
                ).date()
                
                day_diff = (current_date - solution_date).days
                
                # If this solution is from today or yesterday (consecutive)
                if day_diff == temp_streak:
                    temp_streak += 1
                else:
                    # Streak broken
                    longest_streak = max(longest_streak, temp_streak)
                    if day_diff <= 1:  # Start new streak if yesterday or today
                        temp_streak = 1
                    else:
                        temp_streak = 0
                
                current_date = solution_date  # Move to next date
            
            longest_streak = max(longest_streak, temp_streak)
            current_streak = temp_streak if (today - datetime.fromisoformat(sorted_solutions[0]["created_at"].replace("Z", "+00:00")).date()).days <= 1 else 0

        print(f"✅ Streak: {current_streak}, Longest: {longest_streak}")

        # === CALCULATE RANK ===
        rank = max(1, round(10000 / (total_solutions + accepted_solutions + total_upvotes + 1)))

        # === CALCULATE AVG RESPONSE TIME ===
        avg_response_time = "0h"
        if solutions:
            # Calculate average time between solution creation
            solution_times = [
                datetime.fromisoformat(s["created_at"].replace("Z", "+00:00")) 
                for s in solutions
            ]
            solution_times.sort()
            
            if len(solution_times) > 1:
                time_diffs = [
                    (solution_times[i+1] - solution_times[i]).total_seconds() / 3600
                    for i in range(len(solution_times) - 1)
                ]
                avg_hours = sum(time_diffs) / len(time_diffs)
                avg_response_time = f"{round(avg_hours)}h"

        # === BUILD RESPONSE ===
        result = {
            "total_solutions": total_solutions,
            "accepted_solutions": accepted_solutions,
            "total_upvotes": total_upvotes,
            "total_bugs": total_bugs,
            "acceptance_rate": acceptance_rate,
            "avg_response_time": avg_response_time,
            "streak": current_streak,
            "longest_streak": longest_streak,
            "rank": rank,
            "this_week": this_week,
            "this_month": this_month
        }
        
        print(f"✅ Stats calculated: {result}")
        return result
    
    except Exception as e:
        print(f"❌ Error calculating contribution stats: {e}")
        import traceback
        traceback.print_exc()
        return {
            "total_solutions": 0,
            "accepted_solutions": 0,
            "total_upvotes": 0,
            "total_bugs": 0,
            "acceptance_rate": 0,
            "avg_response_time": "0h",
            "streak": 0,
            "longest_streak": 0,
            "rank": 0,
            "this_week": 0,
            "this_month": 0
        }

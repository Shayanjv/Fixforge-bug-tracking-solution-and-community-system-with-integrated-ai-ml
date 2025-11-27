from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from datetime import datetime, timezone
from fastapi import  Query

import uuid, json
from app.core.config import supabase  # Supabase client
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Only define globally once, at the module level!



router = APIRouter()
if "model" not in globals():
    model = SentenceTransformer("all-MiniLM-L6-v2")

# ✅ ADD THIS HELPER FUNCTION
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



@router.post("/submit")
async def submit_bug(
    title: str = Form(...),
    description: str = Form(...),
    severity: str = Form("Low"),
    clientType: str = Form("Web"),
    tags: str = Form("[]"),
    user_id: str = Form(...),  # Add this
    screenshot: UploadFile = File(None),
):
    bug_id = f"FF-{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()


    try:
        tags_list = json.loads(tags)
        if not isinstance(tags_list, list):
            tags_list = [str(tags_list)]
    except Exception:
        tags_list = []
    # --- DUPLICATE CHECK LOGIC ---
    new_text = f"{title} {description} {severity} {clientType} {' '.join(tags_list)}"
    new_vec = model.encode(new_text).reshape(1, -1)

    bugs_res = supabase.table("bugs").select("*").execute()
    bugs = bugs_res.data or []

    if bugs:
        bug_texts = [
            f"{b['title']} {b['description']} {b['severity']} {b['client_type']} {' '.join(b.get('tags', []))}"
            for b in bugs
        ]
        bug_vecs = model.encode(bug_texts)
        sims = cosine_similarity(new_vec, bug_vecs)[0]
        max_idx = sims.argmax()
        max_sim = float(sims[max_idx])
        matched_bug_id = bugs[max_idx]["id"]

        if max_sim >= 0.85:

            solutions_res = supabase.table("solutions").select("id").eq("bug_id", matched_bug_id).execute()
            has_solutions = bool(solutions_res.data and len(solutions_res.data) > 0)
            solution_count = len(solutions_res.data or [])
            return {
                "message": "Duplicate bug found",
                "bug_id": matched_bug_id,
                "similarity_score": max_sim,
                "has_solutions": has_solutions,
                "solution_count": solution_count,
                "is_duplicate": True,
            }
    # --- END of DUPLICATE CHECK LOGIC ---

    bug = {
        "id": bug_id,
        "title": title,
        "description": description,
        "severity": severity,
        "client_type": clientType,
        "tags": tags_list,
        "status": "Open",
        "votes": 0,
        "created_at": created_at,
        "user_id": user_id,  # Save user_id
    }



    try:
        supabase.table("bugs").insert(bug).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase bug insert failed: {e}")
    await mark_milestone_complete(user_id, "report-first-bug")
    
    # Handle screenshot upload and attachment record
    if screenshot:
        bucket = "screenshots"
        file_path = f"{bug_id}/{screenshot.filename}"
        data = await screenshot.read()

        try:
            supabase.storage.from_(bucket).upload(
                file_path,
                data,
                {"contentType": screenshot.content_type or "application/octet-stream"},
            )
            file_url = supabase.storage.from_(bucket).get_public_url(file_path)

            # Insert into attachments table
            attachment = {
                "bug_id": bug_id,
                "file_path": file_path,
                "file_url": file_url,
                "created_at": created_at,
            }
            supabase.table("attachments").insert(attachment).execute()

        except Exception as e:
            print("Screenshot upload or attachment insert failed:", e)

    return {"message": "Bug submitted successfully", "bug_id": bug_id}
from fastapi import Path

@router.post("/{bug_id}/upvote")
def upvote_bug(bug_id: str = Path(...)):
    try:
        # Increment votes atomically
        res = supabase.rpc("increment_votes", {"row_id": bug_id}).execute()
        # If you don’t have a Postgres function, fallback to manual update:
        if not res.data:
            bug = supabase.table("bugs").select("votes").eq("id", bug_id).single().execute()
            if not bug.data:
                raise HTTPException(status_code=404, detail="Bug not found")
            current_votes = bug.data["votes"] or 0
            supabase.table("bugs").update({"votes": current_votes + 1}).eq("id", bug_id).execute()
        return {"message": "Upvoted successfully", "bug_id": bug_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upvote: {e}")
@router.get("/")
def list_bugs(user_id: str = Query(None)):
    try:
        # Fetch bugs: filter if user_id provided
        query = supabase.table("bugs").select("*").order("created_at", desc=True)
        if user_id:
            query = query.eq("user_id", user_id)
        
        bugs_res = query.execute()
        bugs = bugs_res.data or []

        # If no bugs found for this user_id
        if user_id and not bugs:
            return {"message": "No bugs yet", "bugs": []}

        # Fetch attachments
        attachments_res = supabase.table("attachments").select("*").execute()
        attachments = attachments_res.data or []

        # Fetch solutions
        solutions_res = supabase.table("solutions").select("*").execute()
        solutions = solutions_res.data or []

        # Group attachments by bug_id
        attachments_map = {}
        for att in attachments:
            attachments_map.setdefault(att["bug_id"], []).append(att)

        # Group solutions by bug_id
        solutions_map = {}
        for sol in solutions:
            solutions_map.setdefault(sol["bug_id"], []).append(sol)

        # Attach to bugs
        for bug in bugs:
            bug["attachments"] = attachments_map.get(bug["id"], [])
            bug["solutions"] = solutions_map.get(bug["id"], [])

        return bugs

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bugs: {e}")
    
@router.get("/{bug_id}/solutions")
def get_solutions_for_bug(bug_id: str):
    try:
        res = supabase.table("solutions").select("*").eq("bug_id", bug_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch solutions: {e}")
@router.post("/submit")
async def submit_bug(
    title: str = Form(...),
    description: str = Form(...),
    severity: str = Form(...),
    clientType: str = Form(...),
    tags: str = Form("[]"),
    user_id: str = Form(...),
    screenshot: UploadFile = File(None),
    code: str = Form(None),
    code_language: str = Form(None),
):
    try:
        bug_data = {
            "title": title,
            "description": description,
            "severity": severity,
            "client_type": clientType,
            "tags": json.loads(tags),
            "user_id": user_id,
            "status": "open",
        }
        
        # ✅ Add code if provided
        if code:
            bug_data["code"] = code
            bug_data["code_language"] = code_language or "javascript"
        
        # ✅ Initialize screenshot_url as None
        screenshot_url = None
        
        # ✅ Handle screenshot upload
        if screenshot:
            try:
                # Generate unique filename
                file_extension = screenshot.filename.split('.')[-1]
                unique_filename = f"{uuid.uuid4()}.{file_extension}"
                file_path = f"bug-screenshots/{unique_filename}"
                
                # Read file content
                file_content = await screenshot.read()
                
                # Upload to Supabase Storage
                storage_response = supabase.storage.from_("bug-screenshots").upload(
                    file_path,
                    file_content,
                    {"content-type": screenshot.content_type}
                )
                
                # Get public URL
                screenshot_url = supabase.storage.from_("bug-screenshots").get_public_url(file_path)
                
                print(f"✅ Screenshot uploaded: {screenshot_url}")
                
            except Exception as upload_error:
                print(f"⚠️ Screenshot upload failed: {upload_error}")
                # Continue without screenshot
        
        # ✅ Add screenshot URL to bug data if it exists
        if screenshot_url:
            bug_data["screenshot"] = screenshot_url
        
        # Insert bug into database
        result = supabase.from_("bugs").insert(bug_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to insert bug")
        
        bug_id = result.data[0]["id"]
        
        print(f"✅ Bug created: {bug_id}")
                # ✅ Mark milestone as complete
        await mark_milestone_complete(user_id, "report-first-bug")

        # Rest of your code for duplicate detection...
        return {
            "message": "Bug submitted successfully",
            "bug_id": bug_id,
            "is_duplicate": False,
            "has_solutions": False
        }
        
    except Exception as e:
        print(f"❌ Bug submission error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

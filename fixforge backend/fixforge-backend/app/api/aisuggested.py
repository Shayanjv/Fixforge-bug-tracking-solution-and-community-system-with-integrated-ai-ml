import os, time, requests, base64
from fastapi import APIRouter, HTTPException
from supabase import create_client

router = APIRouter(tags=["AISuggested"])

# --- Supabase client ---
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# --- Models ---
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-1.5-pro-latest")
FALLBACK_MODEL = "models/gemini-1.5-flash-latest"
GEMINI_BASE = os.getenv("GEMINI_BASE", "https://generativelanguage.googleapis.com/v1beta")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Helpers ---
def get_bug_context(bug_id: str):
    res = supabase.table("bugs").select("*").eq("id", bug_id).execute()
    if res.data:
        return res.data[0]
    return None

def get_screenshot_base64(screenshot_url: str) -> str:
    """Download screenshot and convert to base64"""
    try:
        response = requests.get(screenshot_url, timeout=10)
        if response.status_code == 200:
            return base64.b64encode(response.content).decode('utf-8')
    except Exception as e:
        print(f"Failed to fetch screenshot: {e}")
    return None

def build_prompt(bug: dict) -> str:
    """Build prompt with code and screenshot context"""
    prompt = f"""
Bug ID: {bug['id']}
Title: {bug['title']}
Description: {bug['description']}
Category: {bug.get('category', 'N/A')}
Client Type: {bug.get('client_type', 'N/A')}
Severity: {bug.get('severity', 'N/A')}
"""

    # ✅ Add code context if available
    if bug.get('code'):
        code_lang = bug.get('code_language', 'unknown')
        prompt += f"""

**USER'S CODE ({code_lang.upper()}):**
"""

    # ✅ Add screenshot notes if available
    if bug.get('screenshot_notes'):
        prompt += f"""
Screenshot Context: {bug['screenshot_notes']}
"""

    prompt += """

**Task:** Analyze this bug and provide a comprehensive fix.

**Your response should include:**

1. **Root Cause Analysis**
   - What is causing this bug?
   - Why is it happening in this specific context?

2. **Debugging Checklist**
   - Step-by-step debugging approach
   - What to check first, second, third

3. **Fix Implementation**
   - Provide complete, working code fixes
   - Include filename and line numbers
   - Explain each change

4. **Testing Strategy**
   - How to verify the fix works
   - Edge cases to test

5. **Prevention**
   - How to avoid this bug in the future
   - Best practices

**Format your code blocks like this:**
"""
    return prompt

def call_gemini_with_image(prompt: str, screenshot_base64: str, model: str, retries: int = 2, delay: int = 5) -> str:
    """Call Gemini with both text prompt and image"""
    url = f"{GEMINI_BASE}/{model}:generateContent?key={GEMINI_API_KEY}"
    
    # Build request with image
    parts = [{"text": prompt}]
    
    if screenshot_base64:
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": screenshot_base64
            }
        })
    
    for attempt in range(retries):
        try:
            res = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": parts}]},
                timeout=120,  # Increased timeout for image processing
            )
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    return candidates[0]["content"]["parts"][0]["text"]
                return "No candidates returned."
            elif res.status_code in (503, 504):
                time.sleep(delay)
                continue
            else:
                print(f"❌ Gemini error {res.status_code}: {res.text}")
                raise HTTPException(status_code=502, detail=f"Gemini error {res.status_code}")
        except requests.exceptions.ReadTimeout:
            if attempt < retries - 1:
                time.sleep(delay)
                continue
            raise HTTPException(status_code=504, detail="Gemini request timed out.")
    raise HTTPException(status_code=503, detail=f"{model} overloaded or unresponsive.")

def call_gemini(prompt: str, model: str, retries: int = 2, delay: int = 5) -> str:
    """Call Gemini with text only (fallback)"""
    url = f"{GEMINI_BASE}/{model}:generateContent?key={GEMINI_API_KEY}"
    for attempt in range(retries):
        try:
            res = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=90,
            )
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    return candidates[0]["content"]["parts"][0]["text"]
                return "No candidates returned."
            elif res.status_code in (503, 504):
                time.sleep(delay)
                continue
            else:
                raise HTTPException(status_code=502, detail=f"Gemini error {res.status_code}: {res.text}")
        except requests.exceptions.ReadTimeout:
            if attempt < retries - 1:
                time.sleep(delay)
                continue
            raise HTTPException(status_code=504, detail="Gemini request timed out.")
    raise HTTPException(status_code=503, detail=f"{model} overloaded or unresponsive.")

# --- Route ---
@router.get("/{bug_id}")
def ai_suggested_fix(bug_id: str):
    print(f"🔵 Generating AI suggestion for bug: {bug_id}")
    
    bug = get_bug_context(bug_id)
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")

    prompt = build_prompt(bug)
    
    # ✅ Check if screenshot exists
    screenshot_base64 = None
    if bug.get('screenshot'):
        print(f"🖼️ Screenshot found, downloading and encoding...")
        screenshot_base64 = get_screenshot_base64(bug['screenshot'])
        if screenshot_base64:
            print(f"✅ Screenshot encoded ({len(screenshot_base64)} bytes)")
        else:
            print(f"⚠️ Failed to encode screenshot")

    try:
        # ✅ Use image-capable call if screenshot exists
        if screenshot_base64:
            print(f"🤖 Calling Gemini with image using {PRIMARY_MODEL}")
            suggestion = call_gemini_with_image(prompt, screenshot_base64, PRIMARY_MODEL)
        else:
            print(f"🤖 Calling Gemini (text only) using {PRIMARY_MODEL}")
            suggestion = call_gemini(prompt, PRIMARY_MODEL)
        
        model_used = PRIMARY_MODEL
        print(f"✅ Got response from {PRIMARY_MODEL}")
    except Exception as e:
        print(f"⚠️ Primary model failed: {e}, trying fallback...")
        try:
            if screenshot_base64:
                suggestion = call_gemini_with_image(prompt, screenshot_base64, FALLBACK_MODEL)
            else:
                suggestion = call_gemini(prompt, FALLBACK_MODEL)
            model_used = FALLBACK_MODEL
            print(f"✅ Got response from {FALLBACK_MODEL}")
        except Exception as fallback_error:
            print(f"❌ Both models failed: {fallback_error}")
            raise HTTPException(status_code=503, detail="AI service unavailable")

    return {
        "bug_id": bug_id,
        "title": bug["title"],
        "category": bug.get("category"),
        "client_type": bug.get("client_type"),
        "severity": bug.get("severity"),
        "has_code": bool(bug.get("code")),
        "has_screenshot": bool(bug.get("screenshot")),
        "code_language": bug.get("code_language"),
        "model_used": model_used,
        "suggestion": suggestion,
    }

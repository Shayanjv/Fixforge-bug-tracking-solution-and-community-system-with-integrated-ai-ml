# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import supabase

# Import existing API routes
from app.api import bugs, solutions , clusters, aisuggested, bug_clusters, cluster_routes

# Import new router routes (from app/routers folder)
from app.routers import getsolution, users, auth, api_keys, moderation, search
from app.routers import comments

app = FastAPI(title="FixForge Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register existing api routes - prefixes included explicitly
app.include_router(bugs.router, prefix="/bugs", tags=["Bugs"])
app.include_router(solutions.router, prefix="/solutions", tags=["solutions"])
app.include_router(clusters.router, prefix="/clusters", tags=["Clusters"])
app.include_router(bug_clusters.router, prefix="/api/bug_clusters", tags=["Bug Clusters"])
app.include_router(aisuggested.router, prefix="/aisuggested", tags=["AI Suggested"])
app.include_router(cluster_routes.router, prefix="/api/clusters", tags=["Cluster Routes"])

# Register new routers with /api prefix added here to align with frontend proxy
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(getsolution.router, prefix="/getsolution", tags=["GetSolution"])    # GET /getsolution/bug/{id} - fetch
app.include_router(api_keys.router, prefix="/api-keys", tags=["API Keys"])
app.include_router(moderation.router, prefix="/moderation", tags=["Moderation"])


app.include_router(comments.router, prefix="/comments", tags=["Comments"])

# ✅ ENDEE: Register semantic search router
app.include_router(search.router, prefix="/search", tags=["Semantic Search"])


@app.on_event("startup")
def startup_event():
    """Initialize services on startup"""
    # Initialize Endee connection
    from app.services.endee_client import endee_service
    print("✅ Endee service initialized")
    
    # Ensure storage bucket exists
    ensure_storage_bucket()

@app.on_event("startup")
def ensure_storage_bucket():
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = []
        for b in buckets:
            if isinstance(b, dict):
                name = b.get("name")
            else:
                name = getattr(b, "name", None)
                if not name:
                    try:
                        name = b["name"]
                    except Exception:
                        name = None
            if name:
                bucket_names.append(name)

        if "screenshots" not in bucket_names:
            try:
                supabase.storage.create_bucket("screenshots")
                print("Created 'screenshots' bucket.")
            except Exception as e:
                print("Failed to create 'screenshots' bucket:", e)
        else:
            print("Bucket 'screenshots' already exists.")
    except Exception as e:
        print("Storage bucket check failed:", e)

@app.get("/")
def root():
    return {"message": "FixForge backend is running 🚀"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

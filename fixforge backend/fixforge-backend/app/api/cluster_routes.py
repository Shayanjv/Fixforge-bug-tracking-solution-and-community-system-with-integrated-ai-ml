from fastapi import APIRouter, HTTPException
from app.api.cluster_job import run_dynamic_clustering

router = APIRouter()

@router.post("/refresh_clusters")
def refresh_clusters(k: int = 5):
    try:
        run_dynamic_clustering(k=k)
        return {"status": "ok", "message": f"Clusters refreshed with k={k}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

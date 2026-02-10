"""
Semantic search endpoint using Endee vector similarity.
"""

from fastapi import APIRouter, HTTPException, Query
from app.services.endee_client import endee_service
from app.core.config import supabase
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

router = APIRouter()

model = SentenceTransformer("all-MiniLM-L6-v2")


@router.get("/semantic")
def semantic_search(
    query: str = Query(..., description="Natural language search query", min_length=3),
    top_k: int = Query(10, ge=1, le=50),
    severity: str = Query(None),
    status: str = Query(None)
):
    
    query_vector = model.encode(query).tolist()
    
    filters = {}
    if severity:
        filters["severity"] = severity
    if status:
        filters["status"] = status
    
    search_results = endee_service.search_similar_bugs(
        query_vector=query_vector,
        top_k=top_k,
        metadata_filters=filters if filters else None
    )
    
    if not search_results:
        return {
            "query": query,
            "total_results": 0,
            "bugs": [],
            "message": "No similar bugs found"
        }
    
    bug_ids = [r["id"] for r in search_results]
    
    try:
        bugs_res = supabase.table("bugs").select("*").in_("id", bug_ids).execute()
        bugs_map = {b["id"]: b for b in (bugs_res.data or [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bug metadata: {e}")
    
    
    try:
        solutions_res = supabase.table("solutions").select("bug_id, id").in_("bug_id", bug_ids).execute()
        solutions_map = {}
        for sol in (solutions_res.data or []):
            bug_id = sol["bug_id"]
            solutions_map[bug_id] = solutions_map.get(bug_id, 0) + 1
    except Exception:
        solutions_map = {}
    
    results = []
    for item in search_results:
        bug_id = item["id"]
        bug = bugs_map.get(bug_id)
        
        if bug:
            results.append({
                **bug,
                "similarity_score": item["score"],
                "search_rank": len(results) + 1,
                "solution_count": solutions_map.get(bug_id, 0)
            })
    
    return {
        "query": query,
        "total_results": len(results),
        "bugs": results,
        "filters_applied": filters if filters else None
    }


@router.get("/stats")
def search_stats():
    stats = endee_service.get_collection_stats()
    return stats

# app/api/bug_clusters.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.core.config import supabase

router = APIRouter()

class Position(BaseModel):
    cluster_id: int
    x: float
    y: float

class PositionsPayload(BaseModel):
    positions: List[Position]

@router.get("/")
def list_bug_clusters():
    try:
        res = supabase.table("bug_clusters").select("*").execute()
        return {"clusters": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/positions")
def upsert_cluster_positions(payload: PositionsPayload):
    try:
        rows = [
            {"cluster_id": int(p.cluster_id), "x": float(p.x), "y": float(p.y)}
            for p in payload.positions
        ]
        # upsert requires cluster_id to be a primary key or unique constraint in your table
        res = supabase.table("bug_clusters").upsert(rows).execute()
        # supabase client may return .error or .status_code depending on version
        if getattr(res, "error", None):
            raise Exception(res.error)
        return {"status": "ok", "updated": len(rows)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

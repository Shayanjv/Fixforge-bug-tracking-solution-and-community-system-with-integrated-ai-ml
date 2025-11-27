# app/api/clusters.py
from fastapi import APIRouter, HTTPException
from app.core.config import supabase
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import random

router = APIRouter()
model = SentenceTransformer("all-MiniLM-L6-v2")

@router.get("/{bug_id}/suggestions")
def get_related_solutions(bug_id: str):
    try:
        # Fetch the new bug
        bug_res = supabase.table("bugs").select("*").eq("id", bug_id).single().execute()
        bug = bug_res.data
        if not bug:
            raise HTTPException(status_code=404, detail="Bug not found")

        # Embed new bug
        new_text = f"{bug['title']} {bug['description']} {bug['severity']} {bug['client_type']} {' '.join(bug.get('tags', []))}"
        new_vec = model.encode(new_text).reshape(1, -1)

        # Fetch solved bugs
        solved_res = supabase.table("bugs").select("*").eq("status", "Solved").execute()
        solved_bugs = solved_res.data or []

        if not solved_bugs:
            return {"clusters": [], "top_suggestions": [], "has_related": False}

        # Embed solved bugs
        solved_texts = [
            f"{b['title']} {b['description']} {b['severity']} {b['client_type']} {' '.join(b.get('tags', []))}"
            for b in solved_bugs
        ]
        solved_vecs = model.encode(solved_texts)
        sims = cosine_similarity(new_vec, solved_vecs)[0]

        # 🔎 Debug logging
        print("🔍 Similarity scores:", sims.tolist())
        print("🔍 Top score:", float(max(sims)) if len(sims) > 0 else None)


        # Rank top 3
        ranked = sorted(zip(solved_bugs, sims), key=lambda x: x[1], reverse=True)
        top_suggestions = [
            {
                "id": b["id"],
                "title": b["title"],
                "description": b["description"],
               "similarity": round(float(score) * 100, 2),  # cast to float, then percentage
            }
            for b, score in ranked[:3]
        ]
        clusters_res = supabase.table("bug_clusters").select("*").execute()
        clusters = [
            {
                "id": c["cluster_id"],
                "label": ", ".join(c["top_terms"]) if c.get("top_terms") else f"Cluster {c['cluster_id']}",
                "size": c["size"],
                "color": "#6B46C1",  # you can assign colors dynamically
                "x": random.randint(10, 90),  # spread across canvas
        "y": random.randint(10, 90),
            }
            for c in clusters_res.data or []
        ]

        # ✅ Decide if we consider them "related"
        threshold = 0.85
        has_related = bool(ranked[0][1] >= threshold) if ranked else False

        return {
             "clusters": clusters,
            "top_suggestions": top_suggestions,
            "has_related": has_related   # ✅ now a Python bool, not numpy.bool_
}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute related solutions: {e}")

# app/jobs/cluster_job.py
from app.core.config import supabase
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
import numpy as np
import datetime

def run_dynamic_clustering(k: int = 5):
    """
    One-shot job:
    - Fetch solved bugs from Supabase
    - Embed them with sentence-transformers
    - Cluster with KMeans
    - Upsert results into bug_clusters table
    """

    # 1. Fetch solved bugs
    res = supabase.table("bugs").select("*").eq("status", "Solved").execute()
    bugs = res.data or []
    if not bugs:
        print("No solved bugs found.")
        return

    # 2. Prepare texts
    texts = [
        f"{b['title']} {b['description']} {b['severity']} {b['client_type']} {' '.join(b.get('tags', []))}"
        for b in bugs
    ]

    # 3. Embed
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(texts)

    # 4. Cluster with KMeans
    kmeans = KMeans(n_clusters=k, random_state=42, n_init="auto")
    labels = kmeans.fit_predict(embeddings)

    # 5. Build cluster rows
    clusters = []
    for cluster_id in range(k):
        members = [bugs[i] for i, lbl in enumerate(labels) if lbl == cluster_id]
        size = len(members)
        if size == 0:
            continue

        # Collect top terms from titles/descriptions
        terms = []
        for m in members:
            terms.extend((m.get("title", "") + " " + m.get("description", "")).split())
        top_terms = list(set(terms[:3]))  # crude top terms

        centroid = kmeans.cluster_centers_[cluster_id].tolist()

        clusters.append({
            "cluster_id": cluster_id,
            "size": size,
            "top_terms": top_terms,
            "label": ", ".join(top_terms) if top_terms else f"Cluster {cluster_id}",
            "centroid": str(centroid),
            "last_updated": datetime.datetime.utcnow().isoformat(),
            "x": None,
            "y": None,
            "color": None,
        })

    # 6. Upsert into bug_clusters
    if clusters:
        res = supabase.table("bug_clusters").upsert(clusters).execute()
        print("Upserted clusters:", res.data)
    else:
        print("No clusters generated.")

if __name__ == "__main__":
    run_dynamic_clustering(k=5)

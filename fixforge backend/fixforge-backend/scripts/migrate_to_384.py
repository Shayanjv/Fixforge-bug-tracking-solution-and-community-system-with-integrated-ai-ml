# scripts/migrate_to_384.py
import os
import time
from collections import Counter

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans

# Supabase client import (adjust to your project)
try:
    from app.core.config import supabase
except Exception:
    from supabase import create_client
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_KEY) env vars.")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

MODEL_NAME = os.environ.get("EMBED_MODEL", "all-MiniLM-L6-v2")
DIM = 384
K = int(os.environ.get("CLUSTER_K", "6"))
BATCH = int(os.environ.get("BATCH_SIZE", "64"))

model = SentenceTransformer(MODEL_NAME)

def fetch_bugs(status=None):
    q = supabase.table("bugs").select("*")
    if status:
        q = q.eq("status", status)
    res = q.execute()
    data = getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else None)
    return data or []

def compute_and_persist_embeddings(bugs):
    texts = []
    ids = []
    for b in bugs:
        ids.append(b["id"])
        parts = [b.get("title","") or "", b.get("description","") or ""]
        tags = b.get("tags") or []
        if isinstance(tags, list):
            parts.append(" ".join(map(str, tags)))
        texts.append(" ".join([p for p in parts if p]))

    embeddings = []
    for i in range(0, len(texts), BATCH):
        batch = texts[i:i+BATCH]
        embs = model.encode(batch, show_progress_bar=False)
        for e in embs:
            embeddings.append([float(x) for x in e.tolist()])

    # persist into embedding_384 column in batches
    for i in range(0, len(ids), BATCH):
        chunk_ids = ids[i:i+BATCH]
        chunk_embs = embeddings[i:i+BATCH]
        rows = []
        for _id, emb in zip(chunk_ids, chunk_embs):
            rows.append({"id": _id, "embedding_384": emb})
        # upsert by id (or update)
        try:
            supabase.table("bugs").upsert(rows).execute()
        except Exception as e:
            print("Persist error:", e)
    return embeddings

def build_and_upsert_clusters(embeddings, bugs, k=K):
    if not embeddings:
        print("No embeddings to cluster")
        return
    X = np.vstack([np.array(e, dtype=float) for e in embeddings])
    k = min(k, len(X))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X)
    centroids = kmeans.cluster_centers_

    rows = []
    for cid in range(k):
        centroid_list = [float(x) for x in centroids[cid].tolist()]
        rows.append({
            "cluster_id": int(cid),
            "size": int((kmeans.labels_ == cid).sum()),
            "top_terms": [],            # optional: compute from bug tags/titles
            "centroid_384": centroid_list,
            "x": None,
            "y": None,
            "color": None,
            "label": f"Cluster {cid}"
        })
    supabase.table("bug_clusters").upsert(rows).execute()

if __name__ == "__main__":
    start = time.time()
    bugs = fetch_bugs(status=None)  # or pass "Open"/"Solved"
    print("Fetched", len(bugs), "bugs")
    embeddings = compute_and_persist_embeddings(bugs)
    print("Persisted embeddings for", len(embeddings), "bugs")
    build_and_upsert_clusters(embeddings, bugs)
    print("Done in %.2fs" % (time.time() - start))

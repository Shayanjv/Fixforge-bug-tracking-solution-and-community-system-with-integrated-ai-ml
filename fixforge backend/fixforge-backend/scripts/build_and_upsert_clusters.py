# scripts/build_and_upsert_clusters.py
import os
import sys
import time
from collections import Counter

import numpy as np
from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer

# Try to reuse your existing supabase client; fallback to creating one from env vars
try:
    from app.core.config import supabase
except Exception:
    try:
        from supabase import create_client
    except Exception as e:
        raise RuntimeError("Supabase client not available. Install supabase or ensure app.core.config.supabase exists.") from e
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_KEY environment variables or provide app.core.config.supabase.")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Config
MODEL_NAME = os.environ.get("EMBED_MODEL", "all-MiniLM-L6-v2")
DIM = 384
DEFAULT_K = int(os.environ.get("CLUSTER_K", "6"))
STATUS_FILTER = os.environ.get("BUG_STATUS_FILTER", "Solved")  # change if needed

model = SentenceTransformer(MODEL_NAME)


def fetch_bugs(status=None):
    print("DEBUG: fetch_bugs called with status:", repr(status))
    try:
        query = supabase.table("bugs").select("*")
        if status:
            print("DEBUG: applying status filter ->", status)
            query = query.eq("status", status)
        res = query.execute()
        print("DEBUG: raw supabase response:", res)
        data = getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else None)
        print("DEBUG: rows returned count:", len(data or []))
        # show first few statuses for quick inspection
        if data:
            print("DEBUG: sample statuses:", [r.get("status") for r in (data[:8])])
        return data or []
    except Exception as e:
        print("Failed to fetch bugs:", e)
        return []


def ensure_embedding(bug):
    """
    Ensure bug has a 384-dim embedding. If missing or wrong size, compute and store it.
    Returns a Python list of floats.
    """
    emb = bug.get("embedding")
    if isinstance(emb, list) and len(emb) == DIM:
        # ensure native floats
        return [float(x) for x in emb]

    # build text to embed
    parts = [
        str(bug.get("title", "") or ""),
        str(bug.get("description", "") or ""),
        str(bug.get("severity", "") or ""),
        str(bug.get("client_type", "") or ""),
    ]
    tags = bug.get("tags") or []
    if isinstance(tags, list):
        parts.append(" ".join(map(str, tags)))
    elif isinstance(tags, str) and tags.strip():
        parts.append(tags)

    text = " ".join([p for p in parts if p])
    vec = model.encode(text).tolist()
    vec = [float(x) for x in vec]

    # write back to DB; tolerate client variations
    try:
        supabase.table("bugs").update({"embedding": vec}).eq("id", bug["id"]).execute()
    except Exception as e:
        print(f"Warning: failed to persist embedding for bug id={bug.get('id')}: {e}")

    return vec


def build_and_upsert_clusters(k=DEFAULT_K, status=STATUS_FILTER):
    bugs = fetch_bugs(status=status)
    if not bugs:
        print("No bugs found for status:", status)
        return

    print(f"Fetched {len(bugs)} bugs. Ensuring embeddings...")
    embeddings = []
    for i, b in enumerate(bugs):
        try:
            emb = ensure_embedding(b)
            if not emb or len(emb) != DIM:
                raise ValueError(f"embedding missing or wrong dim for bug id={b.get('id')}")
            embeddings.append(np.array(emb, dtype=float))
        except Exception as e:
            print(f"Skipping bug id={b.get('id')} due to embedding error:", e)

    if not embeddings:
        print("No valid embeddings available. Exiting.")
        return

    X = np.vstack(embeddings)
    k = min(k, len(X))
    print(f"Clustering into k={k} clusters using KMeans...")
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10).fit(X)
    labels = kmeans.labels_
    centroids = kmeans.cluster_centers_

    rows = []
    for cluster_id in range(k):
        idxs = [i for i, lab in enumerate(labels) if lab == cluster_id]
        size = len(idxs)
        cluster_bugs = [bugs[i] for i in idxs]

        # compute tags list (existing logic)
        tags = []
        for b in cluster_bugs:
            t = b.get("tags")
            if isinstance(t, list):
                tags.extend([str(x).strip() for x in t if str(x).strip()])
            elif isinstance(t, str) and t.strip():
                tags.extend([x.strip() for x in t.split(",") if x.strip()])

        # fallback to title words if tags empty
        if not tags:
            words = []
            for b in cluster_bugs:
                title = str(b.get("title", "") or "")
                words.extend([w.lower() for w in title.split() if len(w) > 3])
            tags = words

        # pick top terms and sanitize
        top_terms = [t for t, _ in Counter(tags).most_common(3) if t and t.strip()]

        # final fallback and label
        if not top_terms:
            label = f"Cluster {cluster_id}"
        else:
            label = ", ".join(top_terms)

        centroid_list = [float(x) for x in centroids[cluster_id].tolist()]

        row = {
            "cluster_id": int(cluster_id),
            "size": int(size),
            "top_terms": top_terms,   # list of non-empty strings
            "centroid": centroid_list,
            "x": None,
            "y": None,
            "color": None,
            "label": label
        }
        rows.append(row)

    print(f"Upserting {len(rows)} clusters into bug_clusters...")
    try:
        res = supabase.table("bug_clusters").upsert(rows).execute()
        # check for client-specific error fields
        err = getattr(res, "error", None) or (res.get("error") if isinstance(res, dict) else None)
        if err:
            print("Upsert returned error:", err)
        else:
            print("Upsert successful.")
    except Exception as e:
        print("Upsert failed:", e)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Build clusters from bug embeddings and upsert into Supabase.")
    parser.add_argument("--k", type=int, default=DEFAULT_K, help="Number of clusters")
    parser.add_argument("--status", type=str, default=STATUS_FILTER, help="Bug status filter (e.g., Solved)")
    args = parser.parse_args()

    start = time.time()
    build_and_upsert_clusters(k=args.k, status=args.status)
    print("Done in %.2fs" % (time.time() - start))

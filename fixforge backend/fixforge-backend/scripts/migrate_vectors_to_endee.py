"""
Migration Script: Transfer Bug Embeddings from Supabase to Endee

This script:
1. Fetches all bugs from Supabase
2. Generates embeddings if missing (using sentence-transformers)
3. Upserts vectors into Endee with metadata

Run once after setting up Endee to migrate existing data.

Usage:
    python scripts/migrate_vectors_to_endee.py
    python scripts/migrate_vectors_to_endee.py --dry-run  # Preview without executing
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.endee_client import endee_service
from app.core.config import supabase
from sentence_transformers import SentenceTransformer
import argparse

# Initialize embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")


def migrate(dry_run=False):
    """
    Migrate all bug embeddings from Supabase to Endee
    
    Args:
        dry_run: If True, only show what would be migrated without executing
    """
    print("=" * 60)
    print("🚀 FixForge: Migrating Bug Vectors to Endee")
    print("=" * 60)
    
    # Fetch all bugs from Supabase
    print("\n📥 Fetching bugs from Supabase...")
    try:
        bugs_res = supabase.table("bugs").select("*").execute()
        bugs = bugs_res.data or []
        print(f"✅ Fetched {len(bugs)} bugs from Supabase")
    except Exception as e:
        print(f"❌ Failed to fetch bugs: {e}")
        return
    
    if not bugs:
        print("⚠️ No bugs found in database. Nothing to migrate.")
        return
    
    # Process each bug
    print(f"\n🔄 Processing {len(bugs)} bugs...")
    success_count = 0
    error_count = 0
    
    for i, bug in enumerate(bugs, 1):
        bug_id = bug.get("id")
        print(f"\n[{i}/{len(bugs)}] Processing {bug_id}...")
        
        try:
            # Generate embedding
            embedding = bug.get("embedding")
            if not embedding or len(embedding) != 384:
                # Generate new embedding if missing or wrong dimension
                text = f"{bug.get('title', '')} {bug.get('description', '')} {bug.get('severity', '')} {bug.get('client_type', '')}"
                tags = bug.get('tags', [])
                if isinstance(tags, list):
                    text += " " + " ".join(tags)
                
                embedding = model.encode(text).tolist()
                print(f"  📝 Generated new embedding (384 dimensions)")
            else:
                print(f"  ✓ Using existing embedding")
            
            # Prepare metadata
            metadata = {
                "title": bug.get("title", ""),
                "severity": bug.get("severity", "Low"),
                "status": bug.get("status", "Open"),
                "tags": bug.get("tags", []),
                "created_at": bug.get("created_at", "")
            }
            
            if dry_run:
                print(f"  🔍 [DRY RUN] Would upsert vector for {bug_id}")
                print(f"     Metadata: {metadata}")
                success_count += 1
            else:
                # Upsert to Endee
                result = endee_service.upsert_bug_vector(
                    bug_id=bug_id,
                    embedding=embedding,
                    metadata=metadata
                )
                
                if result:
                    print(f"  ✅ Upserted to Endee: {bug_id}")
                    success_count += 1
                else:
                    print(f"  ⚠️ Failed to upsert {bug_id}")
                    error_count += 1
                    
        except Exception as e:
            print(f"  ❌ Error processing {bug_id}: {e}")
            error_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Migration Summary")
    print("=" * 60)
    if dry_run:
        print(f"🔍 DRY RUN MODE - No changes made")
    print(f"✅ Successful: {success_count}")
    if error_count > 0:
        print(f"❌ Errors: {error_count}")
    print(f"📈 Total: {len(bugs)}")
    
    if dry_run:
        print("\n💡 To execute migration, run without --dry-run flag")
    else:
        print("\n🎉 Migration complete!")
        
        # Get collection stats
        print("\n📊 Endee Collection Stats:")
        stats = endee_service.get_collection_stats()
        print(f"   {stats}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate bug embeddings from Supabase to Endee")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview migration without executing (no changes made)"
    )
    
    args = parser.parse_args()
    
    migrate(dry_run=args.dry_run)

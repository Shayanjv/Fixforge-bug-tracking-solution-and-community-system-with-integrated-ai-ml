"""
Endee vector database client for bug embeddings.
"""

import os
import requests
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class EndeeHTTPClient:
    """HTTP client for self-hosted Endee vector DB"""
    
    def __init__(self):
        self.base_url = os.getenv("ENDEE_URL", "http://localhost:8080")
        self.api_key = os.getenv("ENDEE_API_KEY", "")
        self.index_name = os.getenv("ENDEE_INDEX", "fixforge_bugs")
        
        self.session = requests.Session()
        if self.api_key:
            self.session.headers.update({"Authorization": f"Bearer {self.api_key}"})
        
        self.session.headers.update({"Content-Type": "application/json"})
        logger.info(f"🔗 Endee client initialized: {self.base_url}")
        
        self._ensure_index()
    
    def _ensure_index(self):
        try:
            response = self.session.get(f"{self.base_url}/api/v1/index/list")
            
            if response.status_code == 200:
                indexes = response.json().get("indexes", [])
                if self.index_name not in indexes:
                    create_payload = {
                        "name": self.index_name,
                        "dimension": 384,
                        "metric": "cosine"
                    }
                    create_response = self.session.post(
                        f"{self.base_url}/api/v1/index/create",
                        json=create_payload
                    )
                    if create_response.status_code == 200:
                        logger.info(f"✅ Created Endee index: {self.index_name}")
                    else:
                        logger.warning(f"Index creation response: {create_response.status_code}")
                else:
                    logger.info(f"✅ Endee index exists: {self.index_name}")
            else:
                logger.warning(f"Could not list indexes: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Failed to ensure index: {e}")
    
    def upsert_vector(
        self, 
        vector_id: str, 
        embedding: List[float], 
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        try:
            if len(embedding) != 384:
                raise ValueError(f"Expected 384-dim embedding, got {len(embedding)}")
            
            payload = {
                "index": self.index_name,
                "vectors": [
                    {
                        "id": vector_id,
                        "values": embedding,
                        "metadata": metadata or {}
                    }
                ]
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/vector/upsert",
                json=payload
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Upserted vector to Endee: {vector_id}")
                return True
            else:
                logger.error(f"Upsert failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to upsert vector {vector_id}: {e}")
            return False
    
    def search_similar(
        self,
        query_vector: List[float],
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        try:
            if len(query_vector) != 384:
                raise ValueError(f"Expected 384-dim query vector, got {len(query_vector)}")
            
            payload = {
                "index": self.index_name,
                "vector": query_vector,
                "top_k": min(max(1, top_k), 100),
                "include_metadata": True
            }
            
            if filters:
                payload["filter"] = filters
            
            response = self.session.post(
                f"{self.base_url}/api/v1/vector/search",
                json=payload
            )
            
            if response.status_code == 200:
                results = response.json().get("matches", [])
                logger.info(f"✅ Found {len(results)} similar vectors")
                return results
            else:
                logger.error(f"Search failed: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Failed to search Endee: {e}")
            return []
    
    def delete_vector(self, vector_id: str) -> bool:
        """
        Delete a vector from Endee
        
        Args:
            vector_id: Vector identifier to delete
        
        Returns:
            True if successful, False otherwise
        """
        try:
            payload = {
                "index": self.index_name,
                "ids": [vector_id]
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/vector/delete",
                json=payload
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Deleted vector from Endee: {vector_id}")
                return True
            else:
                logger.error(f"Delete failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete vector {vector_id}: {e}")
            return False
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the Endee index
        
        Returns:
            Dictionary with stats (total_vectors, dimension, etc.)
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/v1/index/stats/{self.index_name}"
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Stats request failed: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            return {"error": str(e)}


class EndeeService:
    """
    Wrapper for Endee HTTP client with bug-specific methods.
    Provides a clean interface for FixForge bug vector operations.
    """
    
    def __init__(self):
        """Initialize Endee service"""
        self.client = EndeeHTTPClient()
    
    def upsert_bug_vector(
        self, 
        bug_id: str, 
        embedding: List[float], 
        metadata: Dict[str, Any]
    ) -> bool:
        """Store or update a bug vector in Endee"""
        metadata["bug_id"] = bug_id
        return self.client.upsert_vector(bug_id, embedding, metadata)
    
    def search_similar_bugs(
        self,
        query_vector: List[float],
        top_k: int = 10,
        metadata_filters: Optional[Dict[str, Any]] = None,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """Search for similar bugs using vector similarity"""
        results = self.client.search_similar(query_vector, top_k, metadata_filters)
        
        # Filter by minimum score
        filtered_results = [
            r for r in results 
            if r.get("score", 0) >= min_score
        ]
        
        return filtered_results
    
    def delete_bug_vector(self, bug_id: str) -> bool:
        """Delete a bug vector from Endee"""
        return self.client.delete_vector(bug_id)
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the bug vector collection"""
        return self.client.get_index_stats()


# Singleton instance
endee_service = EndeeService()

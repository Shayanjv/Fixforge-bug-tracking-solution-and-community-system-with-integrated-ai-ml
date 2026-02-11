# FixForge - AI-Powered Bug Tracking with Endee Vector Database

> **Endee Labs Internship Project Submission**  
> A full-stack bug tracking platform demonstrating semantic search, RAG, and intelligent bug recommendations using Endee vector database.

[![Endee](https://img.shields.io/badge/Vector%20DB-Endee-blue)](https://github.com/endee-io/endee)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-blue)](https://react.dev/)

---

## 📋 Table of Contents
- [Problem Statement](#-problem-statement)
- [Why Vector Databases?](#-why-vector-databases)
- [Why Endee?](#-why-endee)
- [System Architecture](#-system-architecture)
- [AI Features](#-ai-features)
- [Tech Stack](#-tech-stack)
- [Setup & Installation](#-setup--installation)
- [API Documentation](#-api-documentation)
- [Endee Labs Evaluation Alignment](#-endee-labs-evaluation-alignment)

---

## 🎯 Problem Statement

**Challenge**: Bug tracking systems suffer from duplicate bug reports, wasting developer time and creating technical debt. Traditional keyword search fails to identify semantically similar bugs with different wording.

**Example**:
- Bug A: *"Login fails on Chrome browser"*
- Bug B: *"Cannot authenticate using Chrome"*  
→ Keyword search misses these as duplicates despite identical issues.

**Our Solution**: FixForge uses **Endee vector database** to:
1. **Detect duplicates** via semantic similarity (85%+ threshold)
2. **Enable natural language search** ("authentication problems" finds all related bugs)
3. **Power RAG for AI suggestions** (retrieve similar solved bugs → grounded Gemini responses)

---

## 🔍 Why Vector Databases?

Traditional relational databases use exact keyword matching:
```sql
SELECT * FROM bugs WHERE title LIKE '%login%'
```

**Limitations**:
- ❌ Misses semantic similarities ("authentication failure" ≠ "login error")
- ❌ No ranking by relevance
- ❌ Cannot handle natural language queries

**Vector databases** enable:
- ✅ **Semantic understanding**: Embeddings capture meaning, not just words
- ✅ **Similarity ranking**: Results sorted by cosine similarity (0-100%)
- ✅ **Natural language queries**: "Why can't users log in?" works natively
- ✅ **Sub-millisecond retrieval**: Approximate Nearest Neighbor (ANN) search scales to millions of vectors

---

## ⚡ Why Endee?

We chose **Endee** (https://github.com/endee-io/endee) as our primary vector database for 5 key reasons:

### 1. **High Performance**
- Handles **1 billion vectors on a single node**
- C++ core with optimized SIMD instructions (AVX2/AVX512/NEON)
- Sub-10ms query latency for semantic search

### 2. **Self-Hosted & Open Source**
- Full control over data (critical for enterprise bug tracking)
- Apache 2.0 license
- No vendor lock-in or API rate limits

### 3. **Production-Ready**
- RESTful API with language-agnostic integration
- Docker deployment for easy scaling
- Built-in health checks and monitoring

### 4. **Developer-First**
- Simple HTTP API (no complex SDKs needed)
- Clear documentation and examples
- Active GitHub community

### 5. **Cost-Effective**
- Zero recurring costs (self-hosted)
- Scales horizontally as needed
- Perfect for internship/startup environments

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                  │
│  - Bug Submission UI   - Search Interface                │
│  - Admin Dashboard     - AI Suggestion Display           │
└──────────────────┬──────────────────────────────────────┘
                   │  HTTP/REST
                   ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python 3.9+)               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Endee HTTP Client (requests library)           │    │
│  │  - upsert_vector()    - search_similar()        │    │
│  │  - delete_vector()    - get_stats()             │    │
│  └────────┬────────────────────────────────────┬───┘    │
│           │                                    │         │
│  ┌────────▼────────┐              ┌───────────▼──────┐  │
│  │ Bug Submission  │              │ Semantic Search  │  │
│  │ + Duplicate     │              │ + RAG AI         │  │
│  │   Detection     │              │   Suggestions    │  │
│  └────────┬────────┘              └───────────┬──────┘  │
└───────────┼────────────────────────────────────┼─────────┘
            │                                    │
     HTTP POST/GET                        HTTP POST
            │                                    │
            ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│  Endee Vector Server │          │  Google Gemini API   │
│  (Docker, port 8081) │          │  (RAG responses)     │
│                      │          └──────────────────────┘
│  /api/v1/vector/     │
│    - upsert          │          ┌──────────────────────┐
│    - search          │          │  Supabase            │
│    - delete          │          │  (PostgreSQL)        │
│  /api/v1/index/      │          │  - Bug metadata      │
│    - list            │          │  - Authentication    │
│    - create          │          │  - File storage      │
│    - stats           │          └──────────────────────┘
└──────────────────────┘
```

### Component Responsibilities

| Component | Purpose | Data Stored |
|-----------|---------|-------------|
| **Endee** | Primary vector storage & semantic search | 384-dim embeddings, similarity index |
| **Supabase** | Relational metadata & authentication | Bug details (title, description, severity, status), user accounts |
| **Gemini** | RAG-powered AI suggestions | N/A (stateless API) |
| **K-Means** | Offline trend analysis ONLY | Cluster assignments (not used for search) |

> **Note**: K-Means clustering is retained for **offline analytics dashboards** and trend visualization. Real-time bug retrieval uses **Endee vector search exclusively**.

---

## 🤖 AI Features

### 1. Automatic Duplicate Detection

**Flow**:
```
User submits bug → Backend encodes (all-MiniLM-L6-v2)
→ Endee.search(vector, top_k=1, filters={status != "Closed"})
→ IF similarity >= 85% → "Duplicate found: #FF-xxxx"
→ ELSE → Insert to Supabase + Upsert to Endee
```

**Example**:
- New bug: *"Login broken on Safari"*
- Existing bug (92% similar): *"Authentication fails Safari browser"*
- **Result**: User redirected to existing bug thread, avoiding duplicate work

---

### 2. Semantic Bug Search

**Endpoint**: `GET /search/semantic?query={text}&top_k=10`

**Flow**:
```
User query: "authentication problems"
→ Encode query → 384-dim vector
→ Endee.search(query_vector, top_k=10)
→ Results ranked by similarity %:
   1. "Login fails on Chrome" (94%)
   2. "Cannot sign in" (89%)
   3. "Auth timeout error" (83%)
```

**vs Traditional Search**:
```sql
-- Keyword search
SELECT * FROM bugs WHERE title LIKE '%authentication%' OR description LIKE '%authentication%'
-- Misses: "login error", "sign in broken", "cannot authenticate"

-- Endee semantic search
-- Finds ALL semantically related bugs regardless of wording
```

---

### 3. RAG-Powered AI Suggestions

**Endpoint**: `GET /aisuggested/{bug_id}`

**Flow**:
```
1. Fetch target bug details from Supabase
2. Encode bug (title + description) → 384-dim vector
3. Query Endee for similar SOLVED bugs:
   Endee.search(vector, top_k=5, filters={status: "Solved"}, min_score=0.7)
4. Retrieve solutions from Supabase for matched bug IDs
5. Build RAG prompt:
   TARGET BUG: [current bug]
   SIMILAR SOLVED CASES:
   - Case 1 (87% similar): [bug details] → [solution]
   - Case 2 (83% similar): [bug details] → [solution]
   ...
6. Send to Gemini API with grounding context
7. Return AI-generated solution based on proven fixes
```

**Benefits**:
- **Grounded responses**: AI suggestions based on actual solutions, not generic advice
- **Ranked by relevance**: Endee ensures most similar bugs contribute to context
- **Faster resolution**: Developers see proven fixes instantly

---

## 💻 Tech Stack

### Backend
- **FastAPI** (Python 3.9+) - Async REST API
- **Endee** (C++ server) - Vector database (self-hosted via Docker)
- **Sentence Transformers** (`all-MiniLM-L6-v2`) - 384-dim embeddings
- **Supabase Python Client** - PostgreSQL + Auth
- **Google Gemini API** - RAG responses
- **NumPy / scikit-learn** - K-Means clustering (offline analytics)

### Frontend
- **React 18** + **Vite** - Modern UI framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Endee server containerization
- **PostgreSQL** - Relational database (via Supabase)
- **GitHub Actions** - CI/CD (optional)

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker Desktop
- Git

---

### Step 1: Clone Repository

```bash
git clone https://github.com/Shayanjv/fixforge.git
cd fixforge
```

---

### Step 2: Set Up Endee Vector Database

#### Option A: Docker (Recommended)

```bash
# Pull official Endee image
docker pull endeeio/endee-server:latest

# Run Endee server on port 8081
docker run -d --name endee-server -p 8081:8080 -e NDD_AUTH_TOKEN="" endeeio/endee-server:latest

# Verify Endee is running
curl http://localhost:8081/api/v1/index/list
# Expected: {"indexes":[]}
```

#### Option B: Build from Source

```bash
# Fork and clone Endee repository
git clone https://github.com/Shayanjv/endee.git
cd endee

# Build using installer (Linux/macOS)
chmod +x install.sh
./install.sh --release --avx2  # Use --neon for Apple Silicon

# Run server
./run.sh
# Server starts on http://localhost:8080
```

**For detailed Endee setup**, see [`fixforge backend/fixforge-backend/ENDEE_SETUP.md`](fixforge%20backend/fixforge-backend/ENDEE_SETUP.md)

---

### Step 3: Configure Backend

```bash
cd "fixforge backend/fixforge-backend"

# Create environment file
cp .env.example .env

# Edit .env and configure:
# ENDEE_URL=http://localhost:8081  # Or 8080 if built from source
# ENDEE_INDEX=fixforge_bugs
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_key
# GEMINI_API_KEY=your_gemini_key
```

---

### Step 4: Install Backend Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

---

### Step 5: Start Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

**Expected logs**:
```
🔗 Endee client initialized: http://localhost:8081
✅ Endee index created: fixforge_bugs
INFO: Application startup complete.
INFO: Uvicorn running on http://127.0.0.1:8000
```

---

### Step 6: Set Up Frontend

```bash
cd "../../fixforge frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

---

### Step 7: Migrate Existing Bugs (Optional)

If you have existing bugs in Supabase:

```bash
cd "../fixforge backend/fixforge-backend"

# Preview migration (dry run)
python scripts/migrate_vectors_to_endee.py --dry-run

# Execute migration
python scripts/migrate_vectors_to_endee.py
```

---

## 📡 API Documentation

### Semantic Search

**Endpoint**: `GET /search/semantic`

**Parameters**:
- `query` (string, required): Natural language search query
- `top_k` (int, optional): Number of results (default: 10, max: 50)
- `severity` (string, optional): Filter by severity ("High", "Medium", "Low")

**Example Request**:
```bash
curl "http://localhost:8000/search/semantic?query=authentication+fails&top_k=5&severity=High"
```

**Example Response**:
```json
{
  "query": "authentication fails",
  "total_results": 5,
  "bugs": [
    {
      "id": "FF-a1b2c3d4",
      "title": "Login broken on Chrome 120",
      "description": "Users cannot authenticate...",
      "similarity_score": 0.94,
      "severity": "High",
      "status": "Open",
      "search_rank": 1
    },
    ...
  ]
}
```

---

### AI Suggestions (RAG)

**Endpoint**: `GET /aisuggested/{bug_id}`

**Example Request**:
```bash
curl "http://localhost:8000/aisuggested/FF-a1b2c3d4"
```

**Example Response**:
```json
{
  "bug_id": "FF-a1b2c3d4",
  "suggestions": "Based on 3 similar solved bugs (avg similarity: 86%), the root cause is...",
  "similar_bugs_found": 3,
  "context_used": [
    {"bug_id": "FF-xyz123", "similarity": 0.89, "solution": "Updated SDK to v2.1"},
    ...
  ]
}
```

---

### Bug Submission

**Endpoint**: `POST /bugs/submit`

**Form Data**:
- `title`: Bug title
- `description`: Detailed description
- `severity`: "High" | "Medium" | "Low"
- `clientType`: "Web" | "Mobile" | "Desktop"
- `tags`: JSON array of tags
- `user_id`: Submitter user ID
- `screenshot` (optional): Image file

**Duplicate Detection**:
- If similarity ≥ 85%, returns existing bug ID
- Otherwise, creates new bug + upserts vector to Endee

---
## 🧪 Testing

### Manual Testing

```bash
# 1. Verify Endee is accessible
curl http://localhost:8081/api/v1/index/list

# 2. Submit a test bug
curl -X POST http://localhost:8000/bugs/submit \
  -F "title=Test Bug" \
  -F "description=Testing Endee integration" \
  -F "severity=Low" \
  -F "clientType=Web" \
  -F "tags=[]" \
  -F "user_id=test-123"

# Check backend logs for: ✅ Upserted vector to Endee: FF-xxxxxxxx

# 3. Test semantic search
curl "http://localhost:8000/search/semantic?query=test&top_k=5"

# 4. Submit duplicate bug (should detect similarity)
curl -X POST http://localhost:8000/bugs/submit \
  -F "title=Test Bug Duplicate" \
  -F "description=Testing Endee" \
  -F "severity=Low" \
  -F "clientType=Web" \
  -F "tags=[]" \
  -F "user_id=test-123"
# Expected: "Duplicate found" with 85%+ similarity
```

---

## 📚 Additional Resources

- [Endee Official Docs](https://docs.endee.io)
- [Endee GitHub Repository](https://github.com/endee-io/endee)
- [Implementation Walkthrough](fixforge%20backend/fixforge-backend/ENDEE_SETUP.md)
- [Test Report](artifacts/test_report.md)

---

## 👥 Team

**Project Author**: [shayana J V]  
**Submission**: Endee Labs Internship Evaluation  
**Date**: February 2026

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

**Endee** is licensed under Apache 2.0 - see [Endee License](https://github.com/endee-io/endee/blob/main/LICENSE)

---

##  Acknowledgments

- **Endee Labs** for the high-performance open-source vector database
- **Sentence Transformers** for the embedding model
- **Google Gemini** for RAG capabilities

---



# Endee Setup Instructions for FixForge

## Overview

FixForge uses **Endee** (https://github.com/endee-io/endee), a high-performance open-source vector database, as the primary vector storage for bug embeddings.

Endee is built from source and runs as a **standalone C++ server**. Your FastAPI backend communicates with Endee via REST API.

---

## Requirements

- Linux/macOS or Windows (WSL recommended)
- CMake 3.20+
- C++17 compatible compiler (GCC 9+, Clang 10+, or MSVC 2019+)
- Git

---

## Installation Steps

### 1. Fork & Clone Endee Repository

```bash
# Fork the repository on GitHub first: https://github.com/endee-io/endee
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/endee.git
cd endee
```

### 2. Build Endee (Quick Installation)

```bash
# Use the automated installer
./install.sh
```

This will:
- Detect your OS
- Check dependencies
- Configure and compile Endee
- Create the `ndd` binary

### 3. Run Endee Server

```bash
# Start Endee on default port 8080
./run.sh

# Or run the binary directly
./build/ndd
```

**Server will be available at:** `http://localhost:8080`

---

## Alternative: Docker Deployment

If you prefer Docker:

```bash
# Build Docker image
docker build -t endee .

# Run container
docker run -p 8080:8080 endee
```

Or use Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'
services:
  endee:
    image: endee
    ports:
      - "8080:8080"
    environment:
      - AUTH_TOKEN=your_optional_token
```

```bash
docker-compose up -d
```

---

## Configure FixForge Backend

Once Endee is running, configure your FastAPI backend:

### 1. Update `.env` file

```bash
cd "fixforge backend/fixforge-backend"
copy .env.example .env
```

Edit `.env`:
```bash
# Endee Configuration
ENDEE_URL=http://localhost:8080
ENDEE_API_KEY=  # Optional if you set AUTH_TOKEN
ENDEE_INDEX=fixforge_bugs
```

### 2. Verify Dependencies

```bash
pip install -r requirements.txt
```

The `requests` library is used for HTTP communication with Endee.

### 3. Start FastAPI Backend

```bash
uvicorn app.main:app --reload
```

You should see:
```
🔗 Endee client initialized: http://localhost:8080
✅ Endee index exists: fixforge_bugs
```

---

## Testing the Integration

### 1. Check Endee Index

```bash
curl http://localhost:8080/api/v1/index/list
```

Expected response:
```json
{
  "indexes": ["fixforge_bugs"]
}
```

### 2. Submit a Bug (via FastAPI)

```bash
curl -X POST http://localhost:8000/bugs/submit \
  -F "title=Login fails on Safari" \
  -F "description=Cannot authenticate" \
  -F "severity=High" \
  -F "clientType=Web" \
  -F "tags=[\"auth\"]" \
  -F "user_id=test-123"
```

Check backend logs for:
```
✅ Upserted vector to Endee: FF-xxxxxxxx
```

### 3. Test Semantic Search

```bash
curl "http://localhost:8000/search/semantic?query=authentication+problems&top_k=5"
```

---

## Troubleshooting

### Endee Server Not Starting

```bash
# Check if port 8080 is in use
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Use different port
./build/ndd --port 8081

# Update .env
ENDEE_URL=http://localhost:8081
```

### Index Not Created

```bash
# Manually create index via Endee API
curl -X POST http://localhost:8080/api/v1/index/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fixforge_bugs",
    "dimension": 384,
    "metric": "cosine"
  }'
```

### Connection Refused

- Ensure Endee server is running: `ps aux | grep ndd`
- Check server logs for errors
- Verify `ENDEE_URL` in `.env` matches server address

---

## Architecture

```
┌─────────────────┐
│  FastAPI        │
│  Backend        │
│  (port 8000)    │
└────────┬────────┘
         │ HTTP REST API
         ▼
┌─────────────────┐
│  Endee Server   │
│  (C++ Binary)   │
│  (port 8080)    │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Vector Index   │
│  (fixforge_bugs)│
│   384-dim       │
└─────────────────┘
```

---

## Production Deployment

For production:

1. **Run Endee on separate server/container**
2. **Update `ENDEE_URL`** to remote address
3. **Enable authentication** with `AUTH_TOKEN`
4. **Use HTTPS** with reverse proxy (nginx)
5. **Monitor** Endee server resource usage

---

## Resources

- Endee GitHub: https://github.com/endee-io/endee
- Endee Docs: https://docs.endee.io
- FastAPI Integration: `app/services/endee_client.py`

---

## Summary

✅ Endee runs as standalone C++ server  
✅ FastAPI communicates via HTTP REST API  
✅ No Python package installation needed for Endee  
✅ Fork the GitHub repo for collaboration  
✅ High performance (1B vectors on single node)  

Your FixForge backend is now Endee-powered! 🚀

# 🚀 Quick Start: Endee via Docker

## Current Status
- ✅ Docker installed (version 29.1.3)
- 🔄 Docker Desktop starting...

---

## Steps to Run Endee

### 1. Wait for Docker Desktop (30-60 seconds)

Look for Docker Desktop icon in system tray to turn green/running.

### 2. Pull Endee Image

```powershell
docker pull endeeio/endee:latest
```

### 3. Run Endee Server

```powershell
docker run -d --name endee-server -p 8080:8080 endeeio/endee:latest
```

**Flags explained:**
- `-d` = Run in background (detached mode)
- `--name endee-server` = Name the container for easy management
- `-p 8080:8080` = Map port 8080 to localhost:8080

### 4. Verify Endee is Running

```powershell
# Check container status
docker ps

# Test API endpoint
curl http://localhost:8080/api/v1/index/list
```

**Expected response:**
```json
{
  "indexes": []
}
```

### 5. Configure FixForge Backend

```powershell
cd "c:\Users\91959\Downloads\fixforge-1\fixforge backend\fixforge-backend"

# Ensure .env has correct settings
# ENDEE_URL=http://localhost:8080
```

### 6. Start FastAPI Backend

```powershell
uvicorn app.main:app --reload
```

**Expected logs:**
```
🔗 Endee client initialized: http://localhost:8080
✅ Endee index created: fixforge_bugs
INFO: Application startup complete
```

---

## Useful Docker Commands

```powershell
# View logs
docker logs endee-server

# Stop Endee
docker stop endee-server

# Start Endee again
docker start endee-server

# Remove container
docker rm -f endee-server

# View all containers
docker ps -a
```

---

## Troubleshooting

**Issue: "Cannot connect to Docker daemon"**
- Docker Desktop is still starting, wait 30 seconds
- Check system tray for Docker icon status

**Issue: "Port 8080 already in use"**
- Use different port: `-p 8081:8080`
- Update `.env`: `ENDEE_URL=http://localhost:8081`

**Issue: "Image not found"**
- Try: `docker pull endee/endee` (check exact image name)
- Or build from source using Dockerfile in GitHub repo

---

## Next: Test Integration

Once Endee is running, test by submitting a bug:

```powershell
curl -X POST http://localhost:8000/bugs/submit `
  -F "title=Test Bug" `
  -F "description=Testing Endee integration" `
  -F "severity=Low" `
  -F "clientType=Web" `
  -F "tags=[]" `
  -F "user_id=test123"
```

Check backend logs for:
```
✅ Upserted vector to Endee: FF-xxxxxxxx
```

---

## Status: Ready to Execute! 🚀

Continue with the commands above once Docker Desktop shows "Running".

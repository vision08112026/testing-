# 🐳 Docker Setup Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- Docker Compose (included with Docker Desktop)

---

## 🚀 Quick Start

### Option 1: Production Mode

```bash
# Start everything (backend + MongoDB)
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

**Server will be available at:** `http://localhost:5000`

---

### Option 2: Development Mode (with Hot Reload)

```bash
# Start with hot reload enabled
docker-compose -f docker-compose.dev.yml up

# Or in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f game-backend

# Stop
docker-compose -f docker-compose.dev.yml down
```

Changes to your code will automatically reload the server!

---

## 📦 What's Included

The Docker setup includes:

1. **Game Backend Server** (Node.js + Express + Socket.io)

   - Port: 5000
   - Auto-connects to MongoDB
   - JWT authentication
   - Real-time socket connections

2. **MongoDB Database**

   - Port: 27017
   - Persistent data storage
   - Auto-initialized with `game-db` database

3. **Docker Network**
   - Containers communicate internally
   - Services can reference each other by name

---

## 🛠️ Docker Commands

### Build & Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Build and start together
docker-compose up --build

# Start in detached mode (background)
docker-compose up -d
```

### Stop & Clean

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers and volumes (⚠️ deletes database data)
docker-compose down -v

# Remove everything including images
docker-compose down --rmi all -v
```

### View Logs

```bash
# All services
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Specific service
docker-compose logs game-backend
docker-compose logs mongodb

# Last 100 lines
docker-compose logs --tail=100 game-backend
```

### Container Management

```bash
# List running containers
docker-compose ps

# Execute command in container
docker-compose exec game-backend sh
docker-compose exec mongodb mongosh

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart game-backend
```

---

## 🔍 Testing the Setup

### 1. Check if containers are running

```bash
docker-compose ps
```

Expected output:

```
NAME                   IMAGE              STATUS         PORTS
game-backend-server    bhargav-app        Up             0.0.0.0:5000->5000/tcp
game-mongodb          mongo:7.0          Up             0.0.0.0:27017->27017/tcp
```

### 2. Check logs

```bash
docker-compose logs game-backend
```

Look for:

```
╔═══════════════════════════════════════╗
║   🎮 GAME BACKEND SERVER RUNNING 🎮   ║
╚═══════════════════════════════════════╝
✅ MongoDB Connected Successfully
```

### 3. Test API endpoint

```bash
curl http://localhost:5000/
```

or open in browser: `http://localhost:5000`

### 4. Register a test user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testplayer","email":"test@game.com","password":"test123"}'
```

### 5. Test with HTML client

Open `multi-player-test.html` in your browser and connect!

---

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution:**

```bash
# Stop any running Node.js servers
# Then restart Docker

# Or change port in docker-compose.yml
ports:
  - "5001:5000"  # Use port 5001 instead
```

### MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**

```bash
# Check if MongoDB container is healthy
docker-compose ps

# Restart services
docker-compose restart

# Check MongoDB logs
docker-compose logs mongodb
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker-compose logs game-backend

# Common fixes:
# 1. Rebuild images
docker-compose up --build

# 2. Clear volumes and restart
docker-compose down -v
docker-compose up
```

### Cannot Connect to Server

1. Check if containers are running:

   ```bash
   docker-compose ps
   ```

2. Check firewall settings

3. Try accessing via container IP:
   ```bash
   docker inspect game-backend-server | grep IPAddress
   ```

---

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` to change configuration:

```yaml
environment:
  PORT: 5000 # Server port
  MONGODB_URI: mongodb://mongodb:27017/game-db # Database connection
  JWT_SECRET: your_secret_key # Change in production!
  NODE_ENV: development # development or production
```

### Database Persistence

Data is stored in Docker volumes:

- `mongodb_data` - Database files
- `mongodb_config` - MongoDB configuration

To view volumes:

```bash
docker volume ls
```

To backup database:

```bash
docker-compose exec mongodb mongodump --out /backup
docker cp game-mongodb:/backup ./mongodb-backup
```

---

## 🌐 Accessing MongoDB

### From Host Machine

```bash
# Using mongosh
mongosh mongodb://localhost:27017/game-db

# Or use MongoDB Compass
# Connection String: mongodb://localhost:27017/game-db
```

### From Container

```bash
docker-compose exec mongodb mongosh

# Once inside mongosh:
use game-db
db.users.find()
db.rooms.find()
```

---

## 🚀 Production Deployment with Docker

### Build Production Image

```bash
# Build optimized image
docker build -t game-backend:latest .

# Run production container
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI=mongodb://your-production-db \
  -e JWT_SECRET=your-production-secret \
  -e NODE_ENV=production \
  --name game-backend \
  game-backend:latest
```

### Docker Hub

```bash
# Tag image
docker tag game-backend:latest yourusername/game-backend:latest

# Push to Docker Hub
docker push yourusername/game-backend:latest

# Pull and run on any server
docker pull yourusername/game-backend:latest
docker run -d -p 5000:5000 yourusername/game-backend:latest
```

---

## 📊 Monitoring

### Resource Usage

```bash
# Container stats
docker stats

# Specific container
docker stats game-backend-server
```

### Health Check

```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:5000/health
```

---

## 🧹 Cleanup

### Remove Stopped Containers

```bash
docker-compose down
```

### Clean Everything (including data)

```bash
# ⚠️ WARNING: This deletes all data!
docker-compose down -v --rmi all

# Remove dangling images
docker image prune

# Remove all unused Docker resources
docker system prune -a
```

---

## 🎯 Development Workflow

### Typical Workflow

1. **Start containers**

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Make code changes**

   - Edit files in your IDE
   - Changes auto-reload in container

3. **View logs**

   ```bash
   docker-compose logs -f game-backend
   ```

4. **Test changes**

   - Open `multi-player-test.html`
   - Test API endpoints

5. **Stop when done**
   ```bash
   docker-compose down
   ```

### Database Changes

```bash
# Reset database
docker-compose down -v
docker-compose up -d

# Inspect database
docker-compose exec mongodb mongosh
```

---

## 📝 Files Structure

```
Bhargav-app/
├── Dockerfile              # Production image
├── Dockerfile.dev          # Development image with hot reload
├── docker-compose.yml      # Production setup
├── docker-compose.dev.yml  # Development setup
├── .dockerignore          # Files to exclude from image
└── DOCKER-SETUP.md        # This guide
```

---

## ✅ Quick Checklist

- [ ] Docker Desktop installed and running
- [ ] Run `docker-compose up`
- [ ] Check logs: `docker-compose logs -f`
- [ ] Server accessible at `http://localhost:5000`
- [ ] MongoDB running on port 27017
- [ ] Test with `multi-player-test.html`

---

## 🎮 Ready to Test!

Your game backend is now running in Docker with:

- ✅ Isolated environment
- ✅ Easy setup and teardown
- ✅ Persistent database
- ✅ Hot reload for development
- ✅ Production-ready configuration

**Start playing:** Open `multi-player-test.html` in your browser!

---

## 💡 Pro Tips

1. **Use dev mode during development** for hot reload
2. **Keep volumes** to persist data between restarts
3. **Check logs** when something doesn't work
4. **Use Docker Compose** for easy multi-container management
5. **Backup database** before major changes

---

**Happy Dockerizing! 🐳**

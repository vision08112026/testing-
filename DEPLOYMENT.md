# 🚀 Deployment Guide

## Local Development (Current Setup)

✅ Already configured and running!

```bash
npm start
```

---

## 📦 Production Deployment Options

### Option 1: Heroku (Easiest)

#### Prerequisites

- Heroku account
- Heroku CLI installed

#### Steps

1. **Create Heroku app**

```bash
heroku create your-game-backend
```

2. **Add MongoDB Atlas** (Free tier)

   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free cluster
   - Get connection string
   - Add to Heroku config vars

3. **Set environment variables**

```bash
heroku config:set JWT_SECRET=your_production_secret_key
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/game-db
heroku config:set NODE_ENV=production
```

4. **Deploy**

```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

5. **Open app**

```bash
heroku open
```

---

### Option 2: Render (Free Tier Available)

#### Steps

1. **Push to GitHub**

   - Create GitHub repository
   - Push your code

2. **Create Render account**

   - Go to [Render.com](https://render.com)
   - Sign up with GitHub

3. **Create Web Service**

   - Click "New +"
   - Select "Web Service"
   - Connect your repository
   - Configure:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

4. **Add Environment Variables**

   ```
   JWT_SECRET=your_production_secret_key
   MONGODB_URI=your_mongodb_atlas_uri
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Automatic deployment

---

### Option 3: Railway (Developer Friendly)

#### Steps

1. **Create Railway account**

   - Go to [Railway.app](https://railway.app)

2. **New Project**

   - Click "New Project"
   - Select "Deploy from GitHub repo"

3. **Add MongoDB**

   - Click "New"
   - Select "Database" → "MongoDB"
   - Copy connection string

4. **Configure Variables**

   - Click on your service
   - Add environment variables:

   ```
   JWT_SECRET=your_production_secret_key
   MONGODB_URI=${{MongoDB.MONGO_URL}}
   NODE_ENV=production
   ```

5. **Deploy**
   - Automatic deployment on push

---

### Option 4: DigitalOcean App Platform

#### Steps

1. **Create App**

   - Go to DigitalOcean
   - Click "Create" → "App"

2. **Connect Repository**

   - Authorize GitHub
   - Select repository

3. **Configure**

   - Detected as Node.js
   - Add environment variables

4. **Deploy**
   - Review and launch

---

### Option 5: VPS (Advanced)

#### Ubuntu/Debian Server

1. **Setup server**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

2. **Deploy application**

```bash
# Clone repository
git clone your-repo-url
cd your-game-backend

# Install dependencies
npm install

# Create .env file
nano .env
# Add: PORT, MONGODB_URI, JWT_SECRET, NODE_ENV

# Start with PM2
pm2 start server.js --name game-backend
pm2 startup
pm2 save
```

3. **Setup Nginx reverse proxy**

```bash
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/game-backend
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/game-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🗄️ MongoDB Options

### Option 1: MongoDB Atlas (Recommended)

- Free tier: 512MB storage
- Automatic backups
- Global clusters
- [Sign up here](https://www.mongodb.com/cloud/atlas)

### Option 2: Self-hosted

- Install MongoDB on your VPS
- Manual backups
- Full control

---

## 🔒 Production Checklist

### Environment Variables

- [ ] Change `JWT_SECRET` to strong random string
- [ ] Use production MongoDB URI
- [ ] Set `NODE_ENV=production`
- [ ] Configure `PORT` if needed

### Security

- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS origins
- [ ] Add rate limiting
- [ ] Enable helmet.js
- [ ] Add request logging

### Code Updates

1. **Update CORS** in `server.js`:

```javascript
app.use(
  cors({
    origin: ["https://your-game-frontend.com"],
    credentials: true,
  })
);
```

2. **Add Helmet** for security:

```bash
npm install helmet
```

```javascript
const helmet = require("helmet");
app.use(helmet());
```

3. **Add Rate Limiting**:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

### Database

- [ ] Create indexes for performance
- [ ] Setup automated backups
- [ ] Monitor database size

### Monitoring

- [ ] Setup error logging (Sentry)
- [ ] Add uptime monitoring (UptimeRobot)
- [ ] Setup alerts for errors

---

## 📊 Performance Optimization

### 1. Enable Compression

```bash
npm install compression
```

```javascript
const compression = require("compression");
app.use(compression());
```

### 2. Database Indexing

Add to `models/User.js`:

```javascript
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
```

Add to `models/Room.js`:

```javascript
RoomSchema.index({ roomCode: 1 });
RoomSchema.index({ status: 1 });
```

### 3. Caching

Consider Redis for:

- Session storage
- Room state cache
- Leaderboards

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests (when added)
        run: npm test

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

---

## 🌐 Custom Domain

### With Heroku

```bash
heroku domains:add www.yourgame.com
# Follow DNS instructions
```

### With Render/Railway

- Go to settings
- Add custom domain
- Update DNS records

### With VPS

- Point A record to server IP
- Configure Nginx
- Setup SSL

---

## 📈 Scaling Strategy

### Stage 1: Single Server (Current)

- Good for: 100-1000 concurrent users
- Cost: Free - $10/month

### Stage 2: Load Balancer + Multiple Servers

- Add Redis for shared state
- Socket.io Redis adapter
- Good for: 1000-10,000 users
- Cost: $50-100/month

### Stage 3: Microservices

- Separate auth, game, rooms services
- Kubernetes orchestration
- Good for: 10,000+ users
- Cost: $500+/month

---

## 🆘 Troubleshooting Production

### WebSocket Connection Failed

- Ensure proxy supports WebSocket
- Check CORS settings
- Verify SSL certificate

### High Memory Usage

- Add memory limits to PM2
- Implement room cleanup
- Monitor with tools like New Relic

### Database Connection Errors

- Check MongoDB Atlas IP whitelist
- Verify connection string
- Monitor connection pool

---

## 📞 Support Resources

- **Heroku Docs**: https://devcenter.heroku.com/
- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app/
- **Socket.io Docs**: https://socket.io/docs/

---

## ✅ Launch Checklist

- [ ] Environment variables configured
- [ ] Database connected and tested
- [ ] CORS properly configured
- [ ] SSL/HTTPS enabled
- [ ] Error logging setup
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on deployment

---

**Ready to go live! 🚀**

Start with a free tier (Render/Railway/Heroku) and scale as you grow!

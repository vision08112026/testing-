# 🚀 Quick Start Guide

## Prerequisites

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)

## Setup Steps

### 1. Install MongoDB (if not already installed)

**Windows:**

- Download MongoDB Community Server
- Run the installer
- MongoDB will run as a service automatically

**Quick check if MongoDB is running:**

```bash
# Open Command Prompt or PowerShell
mongosh
# If it connects, MongoDB is running!
```

### 2. Configure Environment

The `.env` file is already created. Update if needed:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/game-db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

### 3. Start the Server

```bash
# Start in development mode (auto-reload on changes)
npm run dev

# OR start in production mode
npm start
```

You should see:

```
✅ MongoDB Connected Successfully
╔═══════════════════════════════════════╗
║   🎮 GAME BACKEND SERVER RUNNING 🎮   ║
╠═══════════════════════════════════════╣
║   Port: 5000
║   Environment: development
║   Socket.io: Enabled
╚═══════════════════════════════════════╝
```

### 4. Test the Backend

Open `client-example.html` in your browser:

```bash
# Open the file in default browser
start client-example.html
```

Or visit: `http://localhost:5000` to see the API info

## Testing the Game Flow

1. **Register/Login** multiple users (open multiple browser tabs)
2. Click **"Play Game"** in each tab
3. When 5 players join, the game auto-starts!
4. Watch the activity log to see real-time updates

## API Testing with Postman/Thunder Client

### 1. Register a User

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

### 2. Login

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "password123"
}
```

Copy the `token` from the response.

### 3. Get Waiting Rooms

```http
GET http://localhost:5000/api/rooms/waiting
Authorization: Bearer YOUR_TOKEN_HERE
```

## Socket.io Testing (JavaScript Client)

```javascript
const socket = io("http://localhost:5000", {
  auth: { token: "YOUR_JWT_TOKEN" },
});

socket.on("connected", () => {
  console.log("Connected!");
  socket.emit("playGame");
});

socket.on("roomAssigned", (room) => {
  console.log("Room Code:", room.roomCode);
  console.log("Players:", room.players);
});

socket.on("gameStarted", () => {
  console.log("GAME STARTED!");
});
```

## Troubleshooting

### MongoDB Connection Error

```
❌ MongoDB Connection Error: connect ECONNREFUSED
```

**Solution:** Make sure MongoDB is running

```bash
# Windows - Start MongoDB service
net start MongoDB
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:** Change port in `.env` file

```env
PORT=3000
```

### Socket Connection Failed

**Solution:**

1. Check server is running
2. Verify token is valid
3. Check CORS settings in server.js

## What's Next?

Now you can integrate this backend with your game client:

1. **Connect to Socket.io** with JWT token
2. **Emit `playGame`** to join/create room
3. **Listen for `gameStarted`** when 5 players ready
4. **Implement your game logic** using `gameAction` events
5. **Update player money** after game ends

## Need Help?

- Check [README.md](README.md) for full API documentation
- View [client-example.html](client-example.html) for working example
- Check server logs for detailed error messages

Happy Gaming! 🎮

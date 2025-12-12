# 🎮 Game Backend Testing Guide

## Quick Start Testing

### 1. Start the Server

```bash
npm start
```

Server will run on: `http://localhost:5000`

---

## 🧪 Testing Flow

### Step 1: Register Users

**API Endpoint:** `POST /api/auth/register`

```javascript
// Register Player 1
fetch("http://localhost:5000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "player1",
    email: "player1@game.com",
    password: "password123",
  }),
});
```

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "player1",
    "email": "player1@game.com",
    "money": 1000
  }
}
```

Repeat for player2, player3, etc.

---

### Step 2: Login (if already registered)

**API Endpoint:** `POST /api/auth/login`

```javascript
fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "player1@game.com",
    password: "password123",
  }),
});
```

---

### Step 3: Connect to Socket.io

```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN_HERE",
  },
});

// Listen for connection
socket.on("connect", () => {
  console.log("✅ Connected to server");
});

// Listen for room assignment
socket.on("room:assigned", (data) => {
  console.log("🎮 Room assigned:", data);
  // data includes: roomId, roomCode, players, playerCount, maxPlayers
});
```

---

### Step 4: Auto Room Assignment

When a player connects with socket.io, they are **automatically assigned to a room**:

- If there's a room with < 5 players → Join that room
- If all rooms are full → Create a new room
- Players can see room details instantly

---

### Step 5: Room Events

#### Player Details Update

Triggered when players join/leave or money changes:

```javascript
socket.on("room:playerDetails", (data) => {
  console.log("👥 Player Details:", data);
  // Shows: username, userId, money for each player in room
});
```

#### Game Start

Triggered when 5 players are in the room:

```javascript
socket.on("game:start", (data) => {
  console.log("🎮 Game Starting!", data);
  // data includes: roomId, roomCode, players (all 5)
});
```

#### Player Joined

```javascript
socket.on("room:playerJoined", (data) => {
  console.log("✅ New player joined:", data.username);
});
```

#### Player Left

```javascript
socket.on("room:playerLeft", (data) => {
  console.log("❌ Player left:", data.username);
});
```

---

### Step 6: Get Room Info via API

**API Endpoint:** `GET /api/rooms/:roomId`

```javascript
fetch("http://localhost:5000/api/rooms/ROOM123", {
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
  },
});
```

**Response:**

```json
{
  "roomId": "675a96fc123abc",
  "roomCode": "ROOM123",
  "players": [
    {
      "userId": "...",
      "username": "player1",
      "money": 1000,
      "joinedAt": "2025-12-12T10:30:00.000Z"
    }
  ],
  "maxPlayers": 5,
  "playerCount": 1,
  "status": "waiting",
  "createdAt": "2025-12-12T10:30:00.000Z"
}
```

---

### Step 7: List All Rooms

**API Endpoint:** `GET /api/rooms`

```javascript
fetch("http://localhost:5000/api/rooms", {
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
  },
});
```

---

## 🎯 Testing Scenarios

### Scenario 1: Single Player Connection

1. Register/login one player
2. Connect via socket.io
3. Player gets assigned to a new room
4. Room status: "waiting"

### Scenario 2: Multiple Players (3 players)

1. Connect 3 players via socket.io
2. All join the same room
3. All players receive `room:playerDetails` event
4. Can see each other's money balance

### Scenario 3: Room Full (5 players)

1. Connect 5 players
2. All join the same room
3. `game:start` event fires
4. Room status changes to "active"

### Scenario 4: 6th Player

1. Connect 6th player
2. Automatically assigned to a NEW room
3. New room code generated

---

## 🧰 Testing Tools

### Option 1: Use Provided HTML Files

Open in browser:

```
client-example.html       → Single player test
multi-player-test.html    → Multiple players test
```

### Option 2: Postman/Thunder Client

Import the API endpoints from `API-TESTING.md`

### Option 3: Node.js Client

Run the example:

```bash
node examples/node-client.js
```

---

## 🔍 Common Issues & Solutions

### Issue: "Authentication failed"

**Solution:** Make sure to include JWT token in socket auth:

```javascript
io("http://localhost:5000", {
  auth: { token: "YOUR_TOKEN" },
});
```

### Issue: "Room not found"

**Solution:** Room IDs are auto-generated. Use the roomId from `room:assigned` event

### Issue: Players not seeing each other

**Solution:** All players must connect via socket.io (not just REST API)

### Issue: Game not starting with 5 players

**Solution:** Check server logs. Ensure all 5 players are connected via socket

---

## 📊 Monitoring

Check server console for real-time logs:

- ✅ Player connections
- 🎮 Room assignments
- 👥 Player counts
- 🚀 Game starts

---

## 🎮 Client Integration Example

```javascript
// Complete client-side implementation
class GameClient {
  constructor(serverUrl, token) {
    this.socket = io(serverUrl, {
      auth: { token },
    });
    this.setupListeners();
  }

  setupListeners() {
    this.socket.on("room:assigned", (data) => {
      console.log(`Joined room: ${data.roomCode}`);
      console.log(`Players: ${data.playerCount}/${data.maxPlayers}`);
    });

    this.socket.on("room:playerDetails", (data) => {
      // Update UI with player list and money
      this.updatePlayerList(data.players);
    });

    this.socket.on("game:start", (data) => {
      // Start game UI
      this.startGame(data);
    });
  }

  updatePlayerList(players) {
    players.forEach((player) => {
      console.log(`${player.username}: $${player.money}`);
    });
  }

  startGame(data) {
    console.log("🎮 GAME STARTED!");
    console.log("Players:", data.players.length);
  }
}

// Usage
const client = new GameClient("http://localhost:5000", "YOUR_JWT_TOKEN");
```

---

## ✅ Success Checklist

- [ ] Server starts without errors
- [ ] Can register new users
- [ ] Can login existing users
- [ ] Socket.io connection works with JWT
- [ ] Players auto-assigned to rooms
- [ ] Room details show player money
- [ ] 5 players trigger game start
- [ ] 6th player creates new room
- [ ] Can get room info via API

---

## 🚀 Next Steps

1. Open `multi-player-test.html` in your browser
2. Click "Connect All Players"
3. Watch the console for room assignments and events
4. Verify game starts when 5 players connect

Happy Testing! 🎮

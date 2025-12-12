# API Testing Guide

## Using Thunder Client / Postman / Any REST Client

### 1. Register User

**Method:** POST  
**URL:** `http://localhost:5000/api/auth/register`  
**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6581234567890abcdef12345",
      "username": "player1",
      "email": "player1@example.com",
      "money": 1000
    }
  }
}
```

### 2. Login User

**Method:** POST  
**URL:** `http://localhost:5000/api/auth/login`  
**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "player1@example.com",
  "password": "password123"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6581234567890abcdef12345",
      "username": "player1",
      "email": "player1@example.com",
      "money": 1000,
      "gamesPlayed": 0,
      "gamesWon": 0
    }
  }
}
```

### 3. Get Waiting Rooms

**Method:** GET  
**URL:** `http://localhost:5000/api/rooms/waiting`  
**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6581234567890abcdef12345",
      "roomCode": "ABC123",
      "players": [
        {
          "userId": "6581234567890abcdef12345",
          "username": "player1",
          "money": 1000,
          "socketId": "abc123xyz",
          "joinedAt": "2025-12-11T10:00:00.000Z"
        }
      ],
      "maxPlayers": 5,
      "status": "waiting",
      "createdAt": "2025-12-11T10:00:00.000Z"
    }
  ]
}
```

### 4. Get Room by Code

**Method:** GET  
**URL:** `http://localhost:5000/api/rooms/ABC123`  
**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "roomCode": "ABC123",
    "status": "waiting",
    "currentPlayers": 3,
    "maxPlayers": 5,
    "players": [
      {
        "userId": "6581234567890abcdef12345",
        "username": "player1",
        "money": 1000,
        "gamesPlayed": 5,
        "gamesWon": 2,
        "joinedAt": "2025-12-11T10:00:00.000Z"
      }
    ],
    "gameStartedAt": null,
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

### 5. Get Current User's Room

**Method:** GET  
**URL:** `http://localhost:5000/api/rooms/user/current`  
**Headers:**

```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "roomCode": "ABC123",
    "players": [...],
    "status": "waiting",
    ...
  }
}
```

## Socket.io Testing

### Browser Console Testing

1. Open `client-example.html` in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Use these commands:

```javascript
// After logging in, the socket is available globally

// Join a game
socket.emit("playGame");

// Send a game action
socket.emit("gameAction", {
  type: "ATTACK",
  target: "player2",
  damage: 50,
});

// Update money
socket.emit("updateMoney", 1500);

// Leave room
socket.emit("leaveRoom");

// Listen for events
socket.on("gameStarted", (data) => {
  console.log("Game started!", data);
});
```

### Node.js Testing

Create a file `test-client.js`:

```javascript
const io = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_TOKEN_HERE", // Get from login response
  },
});

socket.on("connected", (data) => {
  console.log("Connected:", data);

  // Join game
  socket.emit("playGame");
});

socket.on("roomAssigned", (room) => {
  console.log("Room assigned:", room);
});

socket.on("gameStarted", (data) => {
  console.log("GAME STARTED!", data);
});
```

Run: `node test-client.js`

## Testing Complete Game Flow

### Scenario: 5 Players Join and Game Starts

1. **Register 5 users** (or use existing)
2. **Login each user** and save their tokens
3. **Open 5 browser tabs** with `client-example.html`
4. **Login in each tab** with different users
5. **Click "Play Game"** in each tab
6. **Watch the logs** - when 5th player joins, game auto-starts!

### Expected Event Sequence

```
Tab 1: playGame → roomAssigned (1/5 players)
Tab 2: playGame → roomAssigned (2/5 players)
      All tabs receive: playerJoined event
Tab 3: playGame → roomAssigned (3/5 players)
      All tabs receive: playerJoined event
Tab 4: playGame → roomAssigned (4/5 players)
      All tabs receive: playerJoined event
Tab 5: playGame → roomAssigned (5/5 players)
      All tabs receive: playerJoined event
      All tabs receive: gameStarted event 🎮
```

## Error Testing

### Invalid Token

```bash
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:5000/api/rooms/waiting
```

Response:

```json
{
  "success": false,
  "message": "Token is not valid"
}
```

### Missing Fields

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test"}'
```

Response:

```json
{
  "success": false,
  "errors": [
    {
      "msg": "Please enter a valid email",
      "param": "email"
    },
    {
      "msg": "Password must be at least 6 characters",
      "param": "password"
    }
  ]
}
```

## cURL Examples

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","email":"player1@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"player1@example.com","password":"password123"}'
```

### Get Waiting Rooms

```bash
curl http://localhost:5000/api/rooms/waiting \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## VS Code REST Client Extension

If using REST Client extension, create `requests.http`:

```http
### Register User
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}

### Login User
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "password123"
}

### Get Waiting Rooms
GET http://localhost:5000/api/rooms/waiting
Authorization: Bearer {{token}}

### Get Room by Code
GET http://localhost:5000/api/rooms/ABC123
Authorization: Bearer {{token}}
```

Save token from login response and replace `{{token}}` with actual value.

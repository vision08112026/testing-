# 🏗️ Game Backend Architecture

## System Overview

```
┌─────────────┐         ┌─────────────────────────────────────┐
│   Clients   │────────▶│         Express Server              │
│  (Players)  │         │  (REST API + Socket.io)             │
└─────────────┘         └─────────────────────────────────────┘
      │                             │           │
      │                             │           │
      ▼                             ▼           ▼
┌─────────────┐         ┌───────────────┐  ┌──────────────┐
│  Socket.io  │         │   MongoDB     │  │    JWT       │
│  Real-time  │         │   Database    │  │    Auth      │
└─────────────┘         └───────────────┘  └──────────────┘
```

---

## 📁 Project Structure

```
Bhargav-app/
│
├── server.js                 # Main entry point
│
├── config/
│   └── db.js                 # MongoDB connection
│
├── models/
│   ├── User.js               # User schema (username, email, password, money)
│   └── Room.js               # Room schema (roomCode, players, status)
│
├── middleware/
│   ├── auth.js               # JWT verification for REST API
│   └── socketAuth.js         # JWT verification for Socket.io
│
├── routes/
│   ├── auth.js               # /api/auth (register, login)
│   └── rooms.js              # /api/rooms (list, get room)
│
├── services/
│   └── roomManager.js        # Room logic (create, join, leave)
│
├── socket/
│   └── socketHandler.js      # Socket.io event handlers
│
└── examples/
    ├── client-example.html   # Single player test
    ├── multi-player-test.html # Multi-player test
    └── node-client.js        # Node.js client example
```

---

## 🔄 Request Flow

### 1. User Registration/Login Flow

```
Client                      Server                    Database
  │                           │                           │
  ├─── POST /api/auth/register ─▶                         │
  │                           ├──── Check if exists ─────▶│
  │                           ◀──── User not found ───────┤
  │                           ├──── Hash password         │
  │                           ├──── Create user ─────────▶│
  │                           ◀──── User created ─────────┤
  │                           ├──── Generate JWT          │
  ◀──── Return {token, user} ─┤                           │
```

### 2. Socket.io Connection Flow

```
Client                      Socket.io                 RoomManager
  │                           │                           │
  ├─── Connect with JWT ─────▶│                           │
  │                           ├── Verify JWT              │
  │                           ├─── Find/Create Room ─────▶│
  │                           │                           ├─ Check rooms
  │                           │                           ├─ < 5 players?
  │                           ◀─── Return room ───────────┤
  │                           ├─── Join socket room       │
  │                           ├─── Add player to room     │
  ◀──── 'room:assigned' ──────┤                           │
  ◀── 'room:playerDetails' ───┤                           │
  │                           │                           │
  │    (If 5th player joins)  │                           │
  ◀──── 'game:start' ─────────┤                           │
```

### 3. Room Assignment Logic

```
New player connects
       │
       ▼
   Find rooms with
   status = 'waiting'
       │
       ├─── Found room with < 5 players?
       │         │
       │         ├─── YES ──▶ Join existing room
       │         │                  │
       │         │                  ├─── Add player
       │         │                  ├─── Emit room:playerJoined
       │         │                  ├─── Emit room:playerDetails
       │         │                  │
       │         │                  ├─── Player count = 5?
       │         │                  │         │
       │         │                  │         ├─── YES ──▶ START GAME
       │         │                  │         │           ├─ Update status to 'active'
       │         │                  │         │           └─ Emit game:start
       │         │                  │         │
       │         │                  │         └─── NO ──▶ Keep waiting
       │         │
       │         └─── NO ──▶ Create new room
       │                          │
       │                          ├─── Generate room code
       │                          ├─── Add player
       │                          └─── Emit room:assigned
```

---

## 🔐 Authentication

### JWT Token Structure

```json
{
  "userId": "675a96fc123abc",
  "iat": 1702345678,
  "exp": 1702432078
}
```

### Token Usage

1. **REST API**: Include in `Authorization` header

   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Socket.io**: Include in `auth` object
   ```javascript
   io("http://localhost:5000", {
     auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
   });
   ```

---

## 📡 Socket.io Events

### Client → Server (Emitted by client)

- `connection` - Automatic when client connects

### Server → Client (Listened by client)

| Event                | When Triggered      | Data Sent                              |
| -------------------- | ------------------- | -------------------------------------- |
| `room:assigned`      | Player joins room   | roomId, roomCode, players, playerCount |
| `room:playerDetails` | Player joins/leaves | players (with money)                   |
| `room:playerJoined`  | New player joins    | username, userId                       |
| `room:playerLeft`    | Player disconnects  | username, userId                       |
| `game:start`         | 5th player joins    | roomId, roomCode, players              |
| `error`              | Any error occurs    | message                                |

---

## 💾 Database Models

### User Model

```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  money: Number (default: 1000),
  createdAt: Date
}
```

### Room Model

```javascript
{
  _id: ObjectId,
  roomCode: String (unique, e.g., "ROOM123"),
  players: [
    {
      userId: ObjectId (ref: User),
      username: String,
      money: Number,
      socketId: String,
      joinedAt: Date
    }
  ],
  maxPlayers: Number (default: 5),
  status: String (waiting/active/finished),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎮 Game Logic

### Room States

1. **waiting** - Room has < 5 players, accepting new players
2. **active** - Room has 5 players, game in progress
3. **finished** - Game completed (for future use)

### Room Lifecycle

```
CREATE ROOM
    │
    ▼
[waiting] ──▶ Player 1 joins
    │
    ▼
[waiting] ──▶ Player 2, 3, 4 join
    │
    ▼
[waiting] ──▶ Player 5 joins
    │
    ▼
[active] ──▶ GAME STARTS
    │
    ▼
[active] ──▶ Game in progress
    │
    ▼
[finished] ──▶ Game ends (future feature)
```

---

## 🔧 Configuration

### Environment Variables (.env)

```env
PORT=5000                                              # Server port
MONGODB_URI=mongodb://localhost:27017/game-db         # MongoDB connection
JWT_SECRET=your_super_secret_jwt_key                  # JWT signing key
NODE_ENV=development                                   # Environment
```

### Constants

- **MAX_PLAYERS_PER_ROOM**: 5
- **DEFAULT_USER_MONEY**: 1000
- **JWT_EXPIRATION**: 30 days

---

## 🚀 Scaling Considerations

### Current Setup (Single Server)

- Works for small-scale games
- All rooms on one server
- Limited to single server capacity

### Future Enhancements

1. **Redis for Room State**

   - Store room data in Redis
   - Share state across multiple servers

2. **Socket.io Adapter**

   - Use Redis adapter for multi-server
   - Enable horizontal scaling

3. **Microservices**

   - Separate auth service
   - Separate game service
   - Separate room management

4. **Load Balancer**
   - Distribute connections
   - Sticky sessions for Socket.io

---

## 🔒 Security Features

1. **Password Hashing** - bcrypt with salt rounds
2. **JWT Authentication** - Secure token-based auth
3. **CORS** - Cross-origin resource sharing enabled
4. **Input Validation** - Express-validator for all inputs
5. **MongoDB Injection Prevention** - Mongoose parameterized queries

---

## 📊 API Endpoints Summary

### Authentication

- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user

### Rooms

- `GET /api/rooms` - List all rooms (requires auth)
- `GET /api/rooms/:roomId` - Get room details (requires auth)

### Health

- `GET /` - Server health check

---

## 🎯 Client Integration Points

### What You Need to Implement in Your Game Client

1. **Login/Register UI**

   - Forms for username, email, password
   - Call REST API to get JWT token
   - Store token securely

2. **Socket Connection**

   - Connect with JWT token
   - Listen for room events
   - Handle disconnections

3. **Room Display**

   - Show room code
   - Show player list with money
   - Show player count (X/5)

4. **Game UI**

   - Trigger game start UI when 5 players join
   - Display game board/interface
   - Handle game state

5. **Player Money Display**
   - Real-time updates when players join
   - Show each player's balance

---

## 🧪 Testing Strategy

1. **Unit Tests** (Future)

   - Test roomManager functions
   - Test authentication middleware

2. **Integration Tests** (Future)

   - Test API endpoints
   - Test socket events

3. **Manual Testing** (Current)
   - Use provided HTML files
   - Use node-client.js
   - Test with Postman

---

## 📈 Monitoring & Logging

Current logging includes:

- Server startup
- MongoDB connections
- Socket connections/disconnections
- Room assignments
- Player joins/leaves
- Game starts

Enhance with:

- Winston/Morgan for structured logging
- Error tracking (Sentry)
- Performance monitoring (New Relic)

---

## 🎁 What's Included Out of the Box

✅ User registration & login  
✅ JWT authentication  
✅ Auto room assignment  
✅ Room player limit (5 players)  
✅ Automatic room creation  
✅ Real-time player updates  
✅ Player money tracking  
✅ Game start trigger  
✅ Socket.io integration  
✅ REST API  
✅ MongoDB persistence  
✅ Example clients

---

## 🚧 What You Need to Add (Game-Specific)

- Game rules & logic
- Game state management
- Turn-based system
- Scoring system
- Game end conditions
- Leaderboards
- Betting/wagering logic
- Chat system (optional)
- Reconnection handling

---

## 📞 Support

For questions or issues:

1. Check `TESTING-GUIDE.md` for testing instructions
2. Review `QUICKSTART.md` for setup steps
3. See `API-TESTING.md` for API documentation
4. Check server console logs for errors

---

Built with ❤️ for game developers

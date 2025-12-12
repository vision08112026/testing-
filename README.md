# Game Backend API

Complete game backend with authentication, room management, and real-time gameplay using Socket.io.

## Features

✅ User authentication (register/login with JWT)
✅ Automatic room assignment (max 5 players per room)
✅ Real-time player updates via Socket.io
✅ Auto-start game when room is full (5 players)
✅ Player money tracking
✅ Room management with unique codes

## Tech Stack

- **Node.js** & **Express.js** - Backend framework
- **Socket.io** - Real-time communication
- **MongoDB** & **Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/game-db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

4. Start the server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

**Register User**

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

**Login User**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player1@example.com",
  "password": "password123"
}
```

### Rooms

**Get Waiting Rooms**

```http
GET /api/rooms/waiting
Authorization: Bearer <token>
```

**Get Room by Code**

```http
GET /api/rooms/:roomCode
Authorization: Bearer <token>
```

**Get Current User's Room**

```http
GET /api/rooms/user/current
Authorization: Bearer <token>
```

## Socket.io Events

### Client → Server

**Connect to server**

```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN",
  },
});
```

**Play Game (Auto-assign to room)**

```javascript
socket.emit("playGame");
```

**Get Room Details**

```javascript
socket.emit("getRoomDetails", "ROOM_CODE");
```

**Leave Room**

```javascript
socket.emit("leaveRoom");
```

**Send Game Action**

```javascript
socket.emit("gameAction", {
  type: "MOVE",
  data: {
    /* your game data */
  },
});
```

**Update Player Money**

```javascript
socket.emit("updateMoney", 1500);
```

### Server → Client

**Connection Success**

```javascript
socket.on("connected", (data) => {
  console.log(data); // { message, userId, username }
});
```

**Room Assigned**

```javascript
socket.on("roomAssigned", (data) => {
  console.log(data);
  // { roomCode, status, currentPlayers, maxPlayers, players, gameStartedAt }
});
```

**Player Joined Room**

```javascript
socket.on("playerJoined", (data) => {
  console.log(data);
  // { roomCode, player, currentPlayers, players }
});
```

**Game Started (5 players ready)**

```javascript
socket.on("gameStarted", (data) => {
  console.log(data);
  // { roomCode, players, gameStartedAt }
});
```

**Player Left Room**

```javascript
socket.on("playerLeft", (data) => {
  console.log(data);
  // { roomCode, username, currentPlayers, players }
});
```

**Game Action Received**

```javascript
socket.on("gameActionReceived", (data) => {
  console.log(data);
  // { userId, username, action }
});
```

**Money Updated**

```javascript
socket.on("moneyUpdated", (data) => {
  console.log(data); // { money }
});
```

**Error**

```javascript
socket.on("error", (data) => {
  console.error(data.message);
});
```

## Client Example (JavaScript)

```javascript
import io from "socket.io-client";

// 1. Login first to get token
const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "player1@example.com",
    password: "password123",
  }),
});

const { data } = await loginResponse.json();
const token = data.token;

// 2. Connect to Socket.io with token
const socket = io("http://localhost:5000", {
  auth: { token },
});

// 3. Listen for events
socket.on("connected", (data) => {
  console.log("Connected:", data);

  // Start playing - will auto-assign to room
  socket.emit("playGame");
});

socket.on("roomAssigned", (room) => {
  console.log("Joined room:", room.roomCode);
  console.log("Players in room:", room.currentPlayers);
  console.log("Player details:", room.players);
});

socket.on("playerJoined", (data) => {
  console.log("New player joined:", data.player.username);
  console.log("Total players:", data.currentPlayers);
});

socket.on("gameStarted", (data) => {
  console.log("🎮 GAME STARTED!");
  console.log("Players:", data.players);
  // Start your game logic here
});

// 4. Send game actions
socket.emit("gameAction", {
  type: "MOVE",
  position: { x: 10, y: 20 },
});

// 5. Leave room when done
socket.emit("leaveRoom");
```

## How It Works

1. **User Registration/Login**: Users register or login to get a JWT token
2. **Play Game**: Client emits `playGame` event with token
3. **Auto Room Assignment**: Server finds an available room (< 5 players) or creates a new one
4. **Room Updates**: All players in the room receive real-time updates when someone joins
5. **Game Start**: When 5th player joins, game automatically starts
6. **Player Details**: Room shows all player info including username and money
7. **Custom Game Logic**: Use `gameAction` event to implement your specific game mechanics

## Project Structure

```
Bhargav-app/
├── config/
│   └── db.js                 # Database connection
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── socketAuth.js        # Socket.io authentication
├── models/
│   ├── User.js              # User model
│   └── Room.js              # Room model
├── routes/
│   ├── auth.js              # Authentication routes
│   └── rooms.js             # Room routes
├── services/
│   └── roomManager.js       # Room management logic
├── socket/
│   └── socketHandler.js     # Socket.io event handlers
├── .env                     # Environment variables
├── .gitignore
├── package.json
├── server.js               # Main server file
└── README.md
```

## Customization

You can customize the game logic by:

1. **Modify Room Settings**: Change `maxPlayers` in [models/Room.js](models/Room.js)
2. **Add Game Data**: Use `gameData` field in Room model to store game-specific info
3. **Custom Events**: Add new socket events in [socket/socketHandler.js](socket/socketHandler.js)
4. **Player Stats**: Extend User model with more game stats

## Notes

- Rooms are automatically deleted when empty
- Game auto-starts when room reaches 5 players
- Players are automatically removed from rooms on disconnect
- Each room has a unique 6-character code
- JWT tokens expire in 7 days

## Support

For issues or questions, please create an issue in the repository.

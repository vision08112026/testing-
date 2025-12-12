// Example Node.js client implementation
const io = require("socket.io-client");
const fetch = require("node-fetch");

const API_URL = "http://localhost:5000";

class GameClient {
  constructor() {
    this.socket = null;
    this.token = null;
    this.user = null;
  }

  // Register a new user
  async register(username, email, password) {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.token = result.data.token;
        this.user = result.data.user;
        console.log("✅ Registered successfully:", this.user);
        return result;
      } else {
        console.error("❌ Registration failed:", result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  // Login existing user
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.token = result.data.token;
        this.user = result.data.user;
        console.log("✅ Logged in successfully:", this.user);
        return result;
      } else {
        console.error("❌ Login failed:", result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  // Connect to socket
  connectSocket() {
    if (!this.token) {
      throw new Error("Please login first");
    }

    this.socket = io(API_URL, {
      auth: { token: this.token },
    });

    this.setupSocketListeners();
  }

  // Setup socket event listeners
  setupSocketListeners() {
    this.socket.on("connected", (data) => {
      console.log("🔌 Connected to server:", data);
    });

    this.socket.on("roomAssigned", (room) => {
      console.log("🏠 Assigned to room:", room);
    });

    this.socket.on("playerJoined", (data) => {
      console.log("👤 Player joined:", data.player.username);
      console.log("   Total players:", data.currentPlayers);
      console.log("   All players:", data.players);
    });

    this.socket.on("gameStarted", (data) => {
      console.log("🎮 GAME STARTED!");
      console.log("   Room:", data.roomCode);
      console.log("   Players:", data.players.length);
      console.log("   Started at:", data.gameStartedAt);
    });

    this.socket.on("playerLeft", (data) => {
      console.log("👋 Player left:", data.username);
      console.log("   Remaining players:", data.currentPlayers);
    });

    this.socket.on("gameActionReceived", (data) => {
      console.log("🎯 Game action from", data.username + ":", data.action);
    });

    this.socket.on("leftRoom", (data) => {
      console.log("🚪 Left room");
    });

    this.socket.on("error", (data) => {
      console.error("❌ Error:", data.message);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });
  }

  // Join/create a game room
  playGame() {
    if (!this.socket) {
      throw new Error("Please connect socket first");
    }
    console.log("🎲 Searching for game...");
    this.socket.emit("playGame");
  }

  // Leave current room
  leaveRoom() {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("leaveRoom");
  }

  // Send a game action
  sendGameAction(action) {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("gameAction", action);
  }

  // Update player money
  updateMoney(newMoney) {
    if (!this.socket) {
      throw new Error("Socket not connected");
    }
    this.socket.emit("updateMoney", newMoney);
  }

  // Get waiting rooms (REST API)
  async getWaitingRooms() {
    try {
      const response = await fetch(`${API_URL}/api/rooms/waiting`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error getting waiting rooms:", error);
      throw error;
    }
  }

  // Get room by code (REST API)
  async getRoomByCode(roomCode) {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomCode}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error getting room:", error);
      throw error;
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Example usage
async function example() {
  const client = new GameClient();

  try {
    // Register or login
    await client.register("player1", "player1@example.com", "password123");
    // OR
    // await client.login('player1@example.com', 'password123');

    // Connect to socket
    client.connectSocket();

    // Wait a bit for connection
    setTimeout(() => {
      // Join a game
      client.playGame();

      // Send a game action after joining
      setTimeout(() => {
        client.sendGameAction({
          type: "MOVE",
          position: { x: 10, y: 20 },
        });
      }, 2000);
    }, 1000);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Uncomment to run example
// example();

module.exports = GameClient;

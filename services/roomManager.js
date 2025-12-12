const Room = require("../models/Room");
const User = require("../models/User");

class RoomManager {
  constructor(io) {
    this.io = io;
  }

  // Find or create an available room for a player
  async findOrCreateRoom(userId, username, money, socketId) {
    try {
      // Find a waiting room that's not full
      let room = await Room.findOne({
        status: "waiting",
        "players.5": { $exists: false }, // Room has less than 5 players
      });

      // If no available room, create a new one
      if (!room) {
        const roomCode = Room.generateRoomCode();
        room = new Room({
          roomCode,
          players: [],
        });
      }

      // Add player to room
      const playerData = {
        userId,
        username,
        money,
        socketId,
        joinedAt: new Date(),
      };

      await room.addPlayer(playerData);

      // Update user's current room
      await User.findByIdAndUpdate(userId, {
        currentRoomId: room.roomCode,
        socketId: socketId,
      });

      // Populate player data
      await room.populate(
        "players.userId",
        "username email money gamesPlayed gamesWon"
      );

      return room;
    } catch (error) {
      console.error("Error finding/creating room:", error);
      throw error;
    }
  }

  // Get room by code
  async getRoomByCode(roomCode) {
    try {
      const room = await Room.findOne({ roomCode }).populate(
        "players.userId",
        "username email money gamesPlayed gamesWon"
      );
      return room;
    } catch (error) {
      console.error("Error getting room:", error);
      throw error;
    }
  }

  // Remove player from room
  async removePlayerFromRoom(userId, socketId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.currentRoomId) {
        return null;
      }

      const room = await Room.findOne({ roomCode: user.currentRoomId });
      if (!room) {
        return null;
      }

      await room.removePlayer(userId);

      // Update user
      await User.findByIdAndUpdate(userId, {
        currentRoomId: null,
        socketId: null,
      });

      // If room is empty, delete it
      if (room.players.length === 0) {
        await Room.deleteOne({ _id: room._id });
        return null;
      }

      await room.populate(
        "players.userId",
        "username email money gamesPlayed gamesWon"
      );
      return room;
    } catch (error) {
      console.error("Error removing player from room:", error);
      throw error;
    }
  }

  // Start game when room has 5 players
  async checkAndStartGame(roomCode) {
    try {
      const room = await Room.findOne({ roomCode }).populate(
        "players.userId",
        "username email money gamesPlayed gamesWon"
      );

      if (!room) {
        return null;
      }

      // Start game if room has 5 players and is in waiting status
      if (room.players.length === 5 && room.status === "waiting") {
        await room.startGame();

        // Emit game start event to all players in the room
        this.io.to(roomCode).emit("gameStarted", {
          roomCode: room.roomCode,
          players: room.players,
          gameStartedAt: room.gameStartedAt,
        });

        return room;
      }

      return room;
    } catch (error) {
      console.error("Error checking/starting game:", error);
      throw error;
    }
  }

  // Get all waiting rooms
  async getWaitingRooms() {
    try {
      const rooms = await Room.find({ status: "waiting" })
        .populate("players.userId", "username email money")
        .sort({ createdAt: -1 });
      return rooms;
    } catch (error) {
      console.error("Error getting waiting rooms:", error);
      throw error;
    }
  }

  // Get room details with player info
  getRoomDetails(room) {
    return {
      roomCode: room.roomCode,
      status: room.status,
      currentPlayers: room.players.length,
      maxPlayers: room.maxPlayers,
      players: room.players.map((p) => ({
        username: p.username,
        money: p.money,
        joinedAt: p.joinedAt,
      })),
      gameStartedAt: room.gameStartedAt,
    };
  }
}

module.exports = RoomManager;

const socketAuthMiddleware = require("../middleware/socketAuth");
const RoomManager = require("../services/roomManager");
const User = require("../models/User");

const initializeSocket = (io) => {
  const roomManager = new RoomManager(io);

  // Socket authentication
  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    try {
      // Update user online status
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: true,
        socketId: socket.id,
      });

      // AUTO-ASSIGN to room immediately on connection
      const room = await roomManager.findOrCreateRoom(
        socket.user._id,
        socket.user.username,
        socket.user.money,
        socket.id
      );

      // Join socket room
      socket.join(room.roomCode);

      // Send room details to player
      socket.emit("room:assigned", {
        roomId: room._id.toString(),
        roomCode: room.roomCode,
        players: room.players.map((p) => ({
          userId: p.userId.toString(),
          username: p.username,
          money: p.money,
        })),
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        status: room.status,
      });

      // Send player details to all in room
      io.to(room.roomCode).emit("room:playerDetails", {
        roomCode: room.roomCode,
        players: room.players.map((p) => ({
          userId: p.userId.toString(),
          username: p.username,
          money: p.money,
        })),
      });

      // Notify all players in room about new player
      socket.to(room.roomCode).emit("room:playerJoined", {
        roomCode: room.roomCode,
        username: socket.user.username,
        userId: socket.user._id.toString(),
        playerCount: room.players.length,
      });

      console.log(
        `🎮 ${socket.user.username} auto-assigned to room ${room.roomCode} (${room.players.length}/${room.maxPlayers})`
      );

      // Check if game should start (5 players)
      await roomManager.checkAndStartGame(room.roomCode);
    } catch (error) {
      console.error("Error in auto-room assignment:", error);
      socket.emit("error", { message: "Failed to join game" });
    }

    // Event: Player wants to play (auto-assign to room)
    socket.on("playGame", async () => {
      try {
        const room = await roomManager.findOrCreateRoom(
          socket.user._id,
          socket.user.username,
          socket.user.money,
          socket.id
        );

        // Join socket room
        socket.join(room.roomCode);

        // Send room details to player
        socket.emit("roomAssigned", roomManager.getRoomDetails(room));

        // Notify all players in room about new player
        io.to(room.roomCode).emit("playerJoined", {
          roomCode: room.roomCode,
          player: {
            username: socket.user.username,
            money: socket.user.money,
          },
          currentPlayers: room.players.length,
          players: room.players.map((p) => ({
            username: p.username,
            money: p.money,
            joinedAt: p.joinedAt,
          })),
        });

        console.log(
          `🎮 ${socket.user.username} joined room ${room.roomCode} (${room.players.length}/${room.maxPlayers})`
        );

        // Check if game should start (5 players)
        await roomManager.checkAndStartGame(room.roomCode);
      } catch (error) {
        console.error("Error in playGame:", error);
        socket.emit("error", { message: "Failed to join game" });
      }
    });

    // Event: Get room details
    socket.on("getRoomDetails", async (roomCode) => {
      try {
        const room = await roomManager.getRoomByCode(roomCode);

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        socket.emit("roomDetails", roomManager.getRoomDetails(room));
      } catch (error) {
        console.error("Error getting room details:", error);
        socket.emit("error", { message: "Failed to get room details" });
      }
    });

    // Event: Leave room
    socket.on("leaveRoom", async () => {
      try {
        const room = await roomManager.removePlayerFromRoom(
          socket.user._id,
          socket.id
        );

        if (room) {
          socket.leave(room.roomCode);

          // Notify remaining players
          io.to(room.roomCode).emit("playerLeft", {
            roomCode: room.roomCode,
            username: socket.user.username,
            currentPlayers: room.players.length,
            players: room.players.map((p) => ({
              username: p.username,
              money: p.money,
            })),
          });

          console.log(`🚪 ${socket.user.username} left room ${room.roomCode}`);
        }

        socket.emit("leftRoom", { message: "You left the room" });
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("error", { message: "Failed to leave room" });
      }
    });

    // Event: Send game action (custom game logic)
    socket.on("gameAction", async (data) => {
      try {
        const user = await User.findById(socket.user._id);

        if (!user.currentRoomId) {
          socket.emit("error", { message: "You are not in a room" });
          return;
        }

        // Broadcast action to all players in room
        io.to(user.currentRoomId).emit("gameActionReceived", {
          userId: socket.user._id,
          username: socket.user.username,
          action: data,
        });

        console.log(`🎯 Game action from ${socket.user.username}:`, data);
      } catch (error) {
        console.error("Error in gameAction:", error);
        socket.emit("error", { message: "Failed to process game action" });
      }
    });

    // Event: Update player money (for game results)
    socket.on("updateMoney", async (newMoney) => {
      try {
        await User.findByIdAndUpdate(socket.user._id, { money: newMoney });

        socket.emit("moneyUpdated", { money: newMoney });

        console.log(`💰 ${socket.user.username} money updated to ${newMoney}`);
      } catch (error) {
        console.error("Error updating money:", error);
        socket.emit("error", { message: "Failed to update money" });
      }
    });

    // Event: Disconnect
    socket.on("disconnect", async () => {
      try {
        console.log(
          `❌ User disconnected: ${socket.user.username} (${socket.id})`
        );

        // Update user status
        await User.findByIdAndUpdate(socket.user._id, {
          isOnline: false,
          socketId: null,
        });

        // Remove from room if in one
        const room = await roomManager.removePlayerFromRoom(
          socket.user._id,
          socket.id
        );

        if (room) {
          io.to(room.roomCode).emit("playerLeft", {
            roomCode: room.roomCode,
            username: socket.user.username,
            currentPlayers: room.players.length,
            players: room.players.map((p) => ({
              username: p.username,
              money: p.money,
            })),
          });
        }
      } catch (error) {
        console.error("Error on disconnect:", error);
      }
    });
  });

  console.log("🔌 Socket.io initialized");
};

module.exports = initializeSocket;

const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
    },
    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        money: Number,
        socketId: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    maxPlayers: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    gameStartedAt: {
      type: Date,
      default: null,
    },
    gameData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique room code
roomSchema.statics.generateRoomCode = function () {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Check if room is full
roomSchema.methods.isFull = function () {
  return this.players.length >= this.maxPlayers;
};

// Add player to room
roomSchema.methods.addPlayer = function (playerData) {
  if (this.isFull()) {
    throw new Error("Room is full");
  }
  this.players.push(playerData);
  return this.save();
};

// Remove player from room
roomSchema.methods.removePlayer = function (userId) {
  this.players = this.players.filter(
    (p) => p.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Start game
roomSchema.methods.startGame = function () {
  this.status = "playing";
  this.gameStartedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Room", roomSchema);

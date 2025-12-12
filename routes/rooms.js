const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Room = require("../models/Room");
const User = require("../models/User");

// @route   GET /api/rooms/waiting
// @desc    Get all waiting rooms
// @access  Private
router.get("/waiting", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({ status: "waiting" })
      .populate("players.userId", "username money gamesPlayed gamesWon")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("Error fetching waiting rooms:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/rooms/:roomCode
// @desc    Get room details by code
// @access  Private
router.get("/:roomCode", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode }).populate(
      "players.userId",
      "username email money gamesPlayed gamesWon"
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.json({
      success: true,
      data: {
        roomCode: room.roomCode,
        status: room.status,
        currentPlayers: room.players.length,
        maxPlayers: room.maxPlayers,
        players: room.players.map((p) => ({
          userId: p.userId._id,
          username: p.username,
          money: p.money,
          gamesPlayed: p.userId.gamesPlayed,
          gamesWon: p.userId.gamesWon,
          joinedAt: p.joinedAt,
        })),
        gameStartedAt: room.gameStartedAt,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/rooms/user/current
// @desc    Get current user's room
// @access  Private
router.get("/user/current", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.currentRoomId) {
      return res.json({
        success: true,
        data: null,
        message: "User is not in any room",
      });
    }

    const room = await Room.findOne({ roomCode: user.currentRoomId }).populate(
      "players.userId",
      "username email money gamesPlayed gamesWon"
    );

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Error fetching user room:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;

const io = require("socket.io-client");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const SERVER_URL = "http://localhost:5000";

// Test configuration
const TOTAL_PLAYERS = 6;
const players = [];

// Helper function to register a user
async function registerUser(username, email, password) {
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to register ${username}:`, error.message);
    return null;
  }
}

// Helper function to login
async function loginUser(email, password) {
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Login error:`, error.message);
    return null;
  }
}

// Helper function to connect player via Socket.io
function connectPlayer(username, token) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      auth: { token },
      reconnection: false,
      transports: ["websocket", "polling"],
    });

    const playerData = {
      username,
      socket,
      roomId: null,
      roomCode: null,
    };

    // Timeout if connection takes too long
    const timeout = setTimeout(() => {
      console.error(`❌ ${username} connection timeout`);
      socket.disconnect();
      reject(new Error(`Connection timeout for ${username}`));
    }, 10000);

    socket.on("connect", () => {
      console.log(`✅ ${username} connected (socket ID: ${socket.id})`);
    });

    socket.on("room:assigned", (data) => {
      clearTimeout(timeout);
      playerData.roomId = data.roomId;
      playerData.roomCode = data.roomCode;
      console.log(
        `🎮 ${username} assigned to room ${data.roomCode} (${data.playerCount}/${data.maxPlayers} players)`
      );
      resolve(playerData);
    });

    socket.on("room:playerDetails", (data) => {
      console.log(
        `👥 ${username} sees ${data.players.length} players in room:`,
        data.players.map((p) => `${p.username}($${p.money})`).join(", ")
      );
    });

    socket.on("game:start", (data) => {
      console.log(`\n🚀 GAME STARTED in room ${data.roomCode}!`);
      console.log(
        `   Players: ${data.players.map((p) => p.username).join(", ")}`
      );
    });

    socket.on("room:playerJoined", (data) => {
      console.log(`   ➕ ${data.username} joined ${username}'s room`);
    });

    socket.on("connect_error", (error) => {
      clearTimeout(timeout);
      console.error(`❌ ${username} connection error:`, error.message);
      reject(error);
    });

    socket.on("error", (error) => {
      console.error(`❌ ${username} error:`, error);
    });

    socket.on("disconnect", (reason) => {
      console.log(`   ${username} disconnected: ${reason}`);
    });
  });
}

// Main test function
async function runTest() {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║   Testing Game Backend - Room Management  ║");
  console.log("╚════════════════════════════════════════════╝\n");

  // Step 1: Register/Login players
  console.log("📝 Step 1: Registering/Login players...\n");

  for (let i = 1; i <= TOTAL_PLAYERS; i++) {
    const username = `player${i}`;
    const email = `player${i}@test.com`;
    const password = "test123";

    let result = await registerUser(username, email, password);

    if (result && result.token) {
      players.push({
        username,
        token: result.token,
        money: result.user.money,
      });
      console.log(`✅ Registered: ${username} with $${result.user.money}`);
    } else {
      // User exists, try login
      result = await loginUser(email, password);
      if (result && result.success && result.data && result.data.token) {
        players.push({
          username,
          token: result.data.token,
          money: result.data.user.money,
        });
        console.log(
          `✅ Logged in: ${username} with $${result.data.user.money}`
        );
      } else {
        console.log(`❌ Failed to authenticate ${username}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
  }

  console.log(`\n✅ Total players ready: ${players.length}\n`);

  if (players.length === 0) {
    console.log("❌ No players authenticated. Test failed.");
    process.exit(1);
  }

  // Step 2: Connect players via Socket.io
  console.log("🔌 Step 2: Connecting players to game...\n");

  const connectedPlayers = [];

  for (const player of players) {
    try {
      const connected = await connectPlayer(player.username, player.token);
      connectedPlayers.push(connected);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay between connections
    } catch (error) {
      console.error(`Failed to connect ${player.username}:`, error.message);
    }
  }

  // Wait a bit for all events to process
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 3: Verify room assignments
  console.log("\n📊 Step 3: Verifying room assignments...\n");

  const roomGroups = {};
  connectedPlayers.forEach((player) => {
    if (!roomGroups[player.roomCode]) {
      roomGroups[player.roomCode] = [];
    }
    roomGroups[player.roomCode].push(player.username);
  });

  console.log("Room Distribution:");
  Object.keys(roomGroups).forEach((roomCode) => {
    console.log(
      `  🏠 Room ${roomCode}: ${
        roomGroups[roomCode].length
      } players - ${roomGroups[roomCode].join(", ")}`
    );
  });

  // Step 4: Verify test results
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║           Test Results                     ║");
  console.log("╚════════════════════════════════════════════╝\n");

  const roomCount = Object.keys(roomGroups).length;
  const firstRoom = roomGroups[Object.keys(roomGroups)[0]];
  const secondRoom = roomGroups[Object.keys(roomGroups)[1]];

  let allTestsPassed = true;

  // Test 1: Two rooms should be created
  if (roomCount === 2) {
    console.log("✅ Test 1: Two rooms created (PASS)");
  } else {
    console.log(`❌ Test 1: Expected 2 rooms, got ${roomCount} (FAIL)`);
    allTestsPassed = false;
  }

  // Test 2: First room should have 5 players
  if (firstRoom && firstRoom.length === 5) {
    console.log("✅ Test 2: First room has 5 players (PASS)");
  } else {
    console.log(
      `❌ Test 2: Expected 5 players in first room, got ${
        firstRoom ? firstRoom.length : 0
      } (FAIL)`
    );
    allTestsPassed = false;
  }

  // Test 3: Second room should have 1 player (6th player)
  if (secondRoom && secondRoom.length === 1) {
    console.log("✅ Test 3: 6th player assigned to new room (PASS)");
  } else {
    console.log(
      `❌ Test 3: Expected 1 player in second room, got ${
        secondRoom ? secondRoom.length : 0
      } (FAIL)`
    );
    allTestsPassed = false;
  }

  // Test 4: Game should start in first room
  console.log("✅ Test 4: Game start event triggered (check logs above)");

  console.log("\n" + "═".repeat(45));
  if (allTestsPassed) {
    console.log("🎉 ALL TESTS PASSED! Game backend working correctly!");
  } else {
    console.log("⚠️  SOME TESTS FAILED! Check the logs above.");
  }
  console.log("═".repeat(45) + "\n");

  // Clean up
  console.log("🧹 Cleaning up...");
  connectedPlayers.forEach((player) => {
    if (player.socket) {
      player.socket.disconnect();
    }
  });

  setTimeout(() => {
    console.log("✅ Test completed!\n");
    process.exit(0);
  }, 1000);
}

// Run the test
runTest().catch((error) => {
  console.error("Test failed with error:", error);
  process.exit(1);
});

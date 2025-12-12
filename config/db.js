const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Railway provides MONGO_URL, fallback to MONGODB_URI for custom setups
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI;

    // Debug logging
    console.log("🔍 Environment Check:");
    console.log("   NODE_ENV:", process.env.NODE_ENV);
    console.log("   MONGO_URL exists:", !!process.env.MONGO_URL);
    console.log("   MONGODB_URI exists:", !!process.env.MONGODB_URI);
    console.log(
      "   Using URI:",
      mongoUri ? mongoUri.substring(0, 20) + "..." : "UNDEFINED"
    );

    if (!mongoUri) {
      console.error("❌ FATAL: No MongoDB URI found in environment variables");
      console.error("   Looking for: MONGO_URL or MONGODB_URI");
      console.error(
        "   Available env vars:",
        Object.keys(process.env).filter(
          (k) => k.includes("MONGO") || k.includes("DB")
        )
      );
      throw new Error("MongoDB URI not found in environment variables");
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

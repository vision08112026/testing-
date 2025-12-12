const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    // Debug logging for Railway
    console.log("🔍 Environment Check:");
    console.log("   NODE_ENV:", process.env.NODE_ENV);
    console.log("   MONGODB_URI exists:", !!mongoUri);
    console.log("   MONGODB_URI length:", mongoUri ? mongoUri.length : 0);
    console.log(
      "   MONGODB_URI preview:",
      mongoUri ? mongoUri.substring(0, 20) + "..." : "UNDEFINED"
    );

    if (!mongoUri) {
      console.error(
        "❌ FATAL: MONGODB_URI is not set in environment variables"
      );
      console.error(
        "   Available env vars:",
        Object.keys(process.env).filter(
          (k) => k.includes("MONGO") || k.includes("DB")
        )
      );
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error("   Full error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

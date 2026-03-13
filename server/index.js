require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const orderRoutes = require("./routes/orders");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.send("Green Mandi API Running");
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set in server/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "green-mandi",
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

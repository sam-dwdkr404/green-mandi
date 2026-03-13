const mongoose = require("mongoose");
require("dotenv").config();
const Listing = require("./models/Listing");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/green-mandi";

const seedData = [
  {
    crop: "Tobacco",
    farmer: "Ravi Patil",
    quantity: 500,
    price: 160,
    location: "Nipani"
  },
  {
    crop: "Sugarcane",
    farmer: "Savita Khot",
    quantity: 1000,
    price: 4,
    location: "Sankeshwar"
  },
  {
    crop: "Tobacco",
    farmer: "Arun Jadhav",
    quantity: 200,
    price: 165,
    location: "Nipani"
  },
  {
    crop: "Cotton",
    farmer: "Ravi Patil",
    quantity: 300,
    price: 68,
    location: "Kolhapur"
  },
  {
    crop: "Maize",
    farmer: "Savita Khot",
    quantity: 800,
    price: 22,
    location: "Gadhinglaj"
  },
  {
    crop: "Jowar",
    farmer: "Arun Jadhav",
    quantity: 400,
    price: 38,
    location: "Chikodi"
  },
  {
    crop: "Groundnut",
    farmer: "Ravi Patil",
    quantity: 150,
    price: 64,
    location: "Nipani"
  },
  {
    crop: "Tomato",
    farmer: "Savita Khot",
    quantity: 100,
    price: 22,
    location: "Gadhinglaj"
  }
];

async function seed() {
  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGO_DB_NAME || "green-mandi"
    });
    console.log("Connected to MongoDB for seeding...");

    // Optional: Clear existing listings to avoid duplicates if desired
    // await Listing.deleteMany({});
    // console.log("Cleared existing listings.");

    await Listing.insertMany(seedData);
    console.log("Successfully seeded agricultural data!");
    
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();

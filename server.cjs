const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Allow your frontend to access backend
app.use(express.json());

// MongoDB connection URI and client setup
const uri = "mongodb://localhost:27017"; // Change if your MongoDB URI is different
const client = new MongoClient(uri);

const JWT_SECRET = "your_jwt_secret_key"; // Change to a strong secret in production

async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectToMongo();

// User collection for authentication
const dbName = "exceluploaderdb";
const usersCollectionName = "login"; // Changed from "users" to "login"

// Seed users from users.json file with hashed passwords
async function seedUsersFromFile() {
  try {
    const db = client.db(dbName);
    const usersCollection = db.collection(usersCollectionName);

    const usersFilePath = path.join(__dirname, "users.json");
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));

    for (const user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await usersCollection.updateOne(
        { username: user.username },
        { $set: { password: hashedPassword } },
        { upsert: true }
      );
      console.log(`Seeded/Updated user ${user.username}`);
    }
  } catch (err) {
    console.error("Error seeding users:", err);
  }
}
seedUsersFromFile();

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt for username:", username);

    // Predefined credentials
    const predefinedUsers = {
      "sundar": "123",
      "seenu": "456",
      "user2": "password2",
      "admin": "admin123"
    };

    if (!predefinedUsers[username] || predefinedUsers[username] !== password) {
      console.log("Invalid username or password for user:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ token, username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Existing endpoints...

app.post("/api/run-uipath", (req, res) => {
  const uiRobotPath = `"C:\\Program Files\\UiPath\\Studio\\UiRobot.exe"`; // ✅ Make sure this path is correct
  const packagePath = `"C:\\finalyearproject\\Attendancevoicemail\\Attendancevoicemial.1.0.6.nupkg"`; // Updated to your published package path

  exec(`${uiRobotPath} -file ${packagePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error("UiPath error:", error);
      console.error("UiPath stderr:", stderr);
      return res.status(500).json({ message: "Failed to run UiPath process", error: error.message, details: stderr });
    }
    console.log("UiPath Output:", stdout);
    res.status(200).json({ message: "UiPath process started successfully" });
  });
});

// New endpoint to save student data to MongoDB
app.post("/save-to-mongodb", async (req, res) => {
  try {
    const db = client.db(dbName); // Database name

    const studentsData = req.body;
    if (!Array.isArray(studentsData)) {
      return res.status(400).json({ message: "Invalid data format, expected an array" });
    }

    // Extract file name and timestamp from first record for collection naming
    const { savedFileName, savedAt } = studentsData[0] || {};
    if (!savedFileName || !savedAt) {
      return res.status(400).json({ message: "Missing savedFileName or savedAt in data" });
    }

    // Remove file extension from savedFileName
    const fileNameWithoutExt = savedFileName.replace(/\.[^/.]+$/, "");

    // Sanitize collection name: remove spaces, special chars, and limit length
    const safeFileName = fileNameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);

    // Extract date and time from savedAt ISO string
    const dateObj = new Date(savedAt);

    // Format date as dd; mm : yyyy
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = dateObj.getFullYear();
    const formattedDate = `${day}:${month}:${year}`;

    // Format time in 12-hour format as hour;minutes
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedTime = `${hours}:${minutes}`;

    const collectionName = `${safeFileName}_${formattedDate}_${formattedTime}`;

    const collection = db.collection(collectionName);

    const result = await collection.insertMany(studentsData);
    res.status(200).json({ message: `Inserted ${result.insertedCount} students into collection ${collectionName}` });
  } catch (err) {
    console.error("Error saving to MongoDB:", err);
    res.status(500).json({ message: "Failed to save data to MongoDB" });
  }
});

app.get("/collections", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    res.status(200).json({ collections: collectionNames });
  } catch (err) {
    console.error("Error fetching collections:", err);
    res.status(500).json({ message: "Failed to fetch collections" });
  }
});

app.get("/collection-data/:collectionName", async (req, res) => {
  try {
    const db = client.db(dbName);
    const collectionName = req.params.collectionName;
    const collection = db.collection(collectionName);
    const data = await collection.find({}).limit(100).toArray(); // limit to 100 docs
    res.status(200).json({ data });
  } catch (err) {
    console.error("Error fetching collection data:", err);
    res.status(500).json({ message: "Failed to fetch collection data" });
  }
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});

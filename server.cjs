// server.js
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Allow your frontend to access backend
app.use(express.json());

// MongoDB connection URI and client setup
const uri = "mongodb://localhost:27017"; // Change if your MongoDB URI is different
const client = new MongoClient(uri);

async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectToMongo();

app.post("/api/run-uipath", (req, res) => {
  const uiRobotPath = `"C:\\Program Files\\UiPath\\Studio\\UiRobot.exe"`; // ✅ Make sure this path is correct
  const xamlPath = `"C:\\finalyearproject\\Attendancevoicemail\\Main.xaml"`; // ✅ Replace with your actual XAML file path

  exec(`${uiRobotPath} -f ${xamlPath}`, (error, stdout) => {
    if (error) {
      console.error("UiPath error:", error);
      return res.status(500).json({ message: "Failed to run UiPath processssssss" });
    }
    console.log("UiPath Output:", stdout);
    res.status(200).json({ message: "UiPath process started successfully" });
  });
});

// New endpoint to save student data to MongoDB
  app.post("/save-to-mongodb", async (req, res) => {
    try {
      const db = client.db("exceluploaderdb"); // Database name

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
      const formattedDate = `${day}; ${month} : ${year}`;

      // Format time in 12-hour format as hour;minutes
      let hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const formattedTime = `${hours};${minutes}`;

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
    const db = client.db("exceluploaderdb");
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
    const db = client.db("exceluploaderdb");
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

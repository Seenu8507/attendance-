const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] })); // Allow your frontend to access backend from both ports
app.use(express.json());

const bodyParser = require("body-parser");
const xml2js = require("xml2js");

app.use(bodyParser.text({ type: "application/xml" }));
app.use(express.urlencoded({ extended: true })); // To parse application/x-www-form-urlencoded

// MongoDB connection URI and client setup
const uri = process.env.MONGODB_URI || "mongodb+srv://myuser:mypassword@exceluploaderdb.chfdjie.mongodb.net/?retryWrites=true&w=majority&appName=exceluploaderdb";
const client = new MongoClient(uri);

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // Change to a strong secret in production

// Middleware to log incoming Twilio webhook requests for debugging
app.use("/api/twilio-webhook", (req, res, next) => {
  console.log("Twilio webhook received with headers:", req.headers);
  console.log("Twilio webhook received with body:", req.body);
  next();
});

// Twilio webhook handler
app.post("/api/twilio-webhook", async (req, res) => {
  try {
    if (!req.is('application/xml') && !req.is('text/xml') && !req.is('application/x-www-form-urlencoded')) {
      console.warn("Unsupported content-type for Twilio webhook:", req.headers['content-type']);
      return res.status(400).send("Unsupported content-type");
    }

    let digits = null;
    let result = null;

    if (req.is('application/xml') || req.is('text/xml')) {
      // Parse XML body
      const xml = req.body;
      const parser = new xml2js.Parser({ explicitArray: false });
      result = await parser.parseStringPromise(xml);
      digits = result?.Gather?.Digits || null;
    } else if (req.is('application/x-www-form-urlencoded')) {
      // Parse URL-encoded form data (Twilio default)
      digits = req.body.Digits || null;
      result = req.body; // raw form data as object
    }

    // Map digit to leave type
    let leaveType = null;
    switch (digits) {
      case "1":
        leaveType = "fever";
        break;
      case "2":
        leaveType = "function";
        break;
      case "3":
        leaveType = "personal reason";
        break;
      case "4":
        leaveType = "other reason";
        break;
      default:
        leaveType = "invalid or no input";
    }

    const db = client.db("leavedata");

    // Store the raw parsed data in "responses" collection
    const responsesCollection = db.collection("responses");
    await responsesCollection.insertOne({ data: result, receivedAt: new Date() });

    // Create collection name based on current date and time
    const now = new Date();

    // Store the leave report in a single collection "leaveReports"
    const leaveReportsCollection = db.collection("leaveReports");
    await leaveReportsCollection.insertOne({
      leaveType,
      digits,
      receivedAt: now,
      rawData: result
    });

    // Respond with TwiML to acknowledge
    const twimlResponse = `
      <Response>
        <Say>Thank you for your response: ${leaveType}</Say>
      </Response>
    `;

    res.type("text/xml");
    res.status(200).send(twimlResponse);
  } catch (error) {
    console.error("Error processing Twilio webhook:", error.stack || error);
    res.status(500).send("Internal Server Error");
  }
});

// New endpoint to fetch leave reports with student info aggregated from all timestamped collections
app.get("/api/leave-reports", async (req, res) => {
  try {
    const db = client.db("leaveRecord");

    // Get all collection names that start with "leaveReports_"
    const collections = await db.listCollections().toArray();
    const leaveReportCollections = collections
      .map(c => c.name)
      .filter(name => name.startsWith("leaveReports_"));

    // Aggregate leave reports from all these collections
    let allLeaveReports = [];
    for (const colName of leaveReportCollections) {
      const collection = db.collection(colName);
      const reports = await collection.find({}).toArray();
      allLeaveReports = allLeaveReports.concat(reports);
    }

    // Sort all leave reports by receivedAt descending and limit to 100
    allLeaveReports.sort((a, b) => b.receivedAt - a.receivedAt);
    allLeaveReports = allLeaveReports.slice(0, 100);

    // Get all collection names to find student data collections
    const studentCollections = collections
      .map(c => c.name)
      .filter(name => !["responses", "login"].includes(name) && !name.startsWith("leaveReports_"));

    // For each leave report, try to find matching student by phone number in student collections
    const enrichedReports = await Promise.all(allLeaveReports.map(async (report) => {
      let studentInfo = null;
      let parentNumber = null;

      // Extract phone number from rawData if available
      const phoneNumber = report.rawData?.From || report.rawData?.Caller || null;

      if (phoneNumber) {
        for (const colName of studentCollections) {
          const collection = db.collection(colName);
          studentInfo = await collection.findOne({
            $or: [
              { PhoneNumber: phoneNumber },
              { ParentPhoneNumber: phoneNumber },
              { ParentNumber: phoneNumber }
            ]
          });
          if (studentInfo) {
            parentNumber = studentInfo.Parent_mob || studentInfo.ParentPhoneNumber || studentInfo.ParentNumber || null;
            break;
          }
        }
      }

      return {
        leaveType: report.leaveType,
        digits: report.digits,
        receivedAt: report.receivedAt,
        studentName: studentInfo ? studentInfo.StudentName || studentInfo.Name || null : null,
        parentNumber: parentNumber,
        year: studentInfo ? studentInfo.year || null : null,
        dept: studentInfo ? studentInfo.dept || null : null,
        rawData: report.rawData
      };
    }));

    res.status(200).json({ leaveReports: enrichedReports });
  } catch (error) {
    console.error("Error fetching leave reports:", error);
    res.status(500).json({ message: "Failed to fetch leave reports" });
  }
});

// New endpoint to fetch raw leave reports without enrichment for testing
app.get("/api/leave-reports-raw", async (req, res) => {
  try {
    const db = client.db("leaveRecord");
    const leaveReportsCollection = db.collection("leaveReports");

    const leaveReports = await leaveReportsCollection.find({}).sort({ receivedAt: -1 }).limit(100).toArray();

    console.log("Fetched raw leaveReports:", leaveReports);

    res.status(200).json({ leaveReports });
  } catch (error) {
    console.error("Error fetching raw leave reports:", error);
    res.status(500).json({ message: "Failed to fetch raw leave reports" });
  }
});

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
      if (stderr.includes("A foreground process is already running")) {
        return res.status(409).json({ message: "UiPath process already running. Please wait for it to finish." });
      }
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

// New endpoints for leavedata database collections and data
app.get("/leavedata/collections", async (req, res) => {
  try {
    const db = client.db("leavedata");
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    res.status(200).json({ collections: collectionNames });
  } catch (err) {
    console.error("Error fetching leavedata collections:", err);
    res.status(500).json({ message: "Failed to fetch leavedata collections" });
  }
});

app.get("/leavedata/collection-data/:collectionName", async (req, res) => {
  try {
    const db = client.db("leavedata");
    const collectionName = req.params.collectionName;
    const collection = db.collection(collectionName);
    const data = await collection.find({}).limit(100).toArray();
    res.status(200).json({ data });
  } catch (err) {
    console.error("Error fetching leavedata collection data:", err);
    res.status(500).json({ message: "Failed to fetch leavedata collection data" });
  }
});

// New endpoints for leaveRecord database collections and data
app.get("/leaveRecord/collections", async (req, res) => {
  try {
    const db = client.db("leaveRecord");
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    res.status(200).json({ collections: collectionNames });
  } catch (err) {
    console.error("Error fetching leaveRecord collections:", err);
    res.status(500).json({ message: "Failed to fetch leaveRecord collections" });
  }
});

app.get("/leaveRecord/collection-data/:collectionName", async (req, res) => {
  try {
    const db = client.db("leaveRecord");
    const collectionName = req.params.collectionName;
    const collection = db.collection(collectionName);
    const data = await collection.find({}).limit(100).toArray();
    res.status(200).json({ data });
  } catch (err) {
    console.error("Error fetching leaveRecord collection data:", err);
    res.status(500).json({ message: "Failed to fetch leaveRecord collection data" });
  }
});

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/attendanceDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Mongoose Schema
const attendanceSchema = new mongoose.Schema({}, { strict: false });
const Attendance = mongoose.model("Attendance", attendanceSchema);

// Route to store Excel data
app.post("/api/save-excel", async (req, res) => {
  try {
    const excelData = req.body;
    await Attendance.insertMany(excelData);
    res.status(200).json({ message: "Data saved to MongoDB" });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Failed to save data" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// server.js
const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // Allow your frontend to access backend
app.use(express.json());

app.post("/api/run-uipath", (req, res) => {
  const uiRobotPath = `"C:\\Program Files\\UiPath\Studio\\UiRobot.exe"`; // ✅ Make sure this path is correct
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

app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});

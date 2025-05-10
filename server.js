const express = require("express");
const cors    = require("cors");
const { exec } = require("child_process");

const app = express();

// Allow only your frontend origin
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Your existing endpoint
app.post("/api/save-excel", (req, res) => {
  const uiRobotPath = `"C:\\Program Files\\UiPath\\Studio\\UiRobot.exe"`;
  const xamlPath    = `"C:\\finalyearproject\\Attendancevoicemail\\Main.xaml"`;

  exec(`${uiRobotPath} -f ${xamlPath}`, (error, stdout) => {
    if (error) {
      console.error("UiPath Error:", error);
      return res.status(500).json({ message: "Failed to run UiPath process" });
    }
    console.log("UiPath Output:", stdout);
    res.status(200).json({ message: "UiPath process started successfully" });
  });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));

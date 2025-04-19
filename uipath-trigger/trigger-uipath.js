const express = require("express");
const { exec } = require("child_process");
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(require("cors")());

app.post("/trigger-uipath", (req, res) => {
  const excelPath = req.body.filePath;

  if (!excelPath) {
    return res.status(400).send("Missing filePath");
  }

  const xamlPath = "C:\Users\seenu\OneDrive\Documents\UiPath\Attendancevoicemial\Main.xaml"; // 🛠 Replace this
  const command = 'UiRobot.exe -file ${xamlPath} -input "{\\"excelFilePath\\": \\"${excelPath}\\"}"';

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Error:", error.message);
      return res.status(500).send("Failed to run UiPath");
    }
    console.log("Success:", stdout);
    res.send("UiPath triggered");
  });
});

app.listen(PORT, () => console.log('✅ UiPath Trigger API running on http://localhost:${PORT}'));
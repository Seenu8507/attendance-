import { exec } from "child_process";

const port = 5000;

const startNgrok = () => {
  const ngrokProcess = exec(`ngrok http ${port}`);

  ngrokProcess.stdout.on("data", (data) => {
    console.log(`ngrok: ${data}`);
  });

  ngrokProcess.stderr.on("data", (data) => {
    console.error(`ngrok error: ${data}`);
  });

  ngrokProcess.on("close", (code) => {
    console.log(`ngrok process exited with code ${code}`);
  });
};

startNgrok();

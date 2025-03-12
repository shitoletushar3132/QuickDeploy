import { exec } from "child_process";
import path from "path";
import fs from "fs";

export function buildProject(id: string) {
  return new Promise((resolve) => {
    const projectPath = path.join(__dirname, `output/${id}`);
    const distPath = path.join(projectPath, "build");

    const list = fs.readdirSync(projectPath);

    if (!list.includes("package.json")) {
      // Ensure dist directory exists
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath);
      }

      // Copy all files from projectPath to dist
      list.forEach((file) => {
        const srcPath = path.join(projectPath, file);
        const destPath = path.join(distPath, file);
        // Check if it's a file or directory
        if (fs.statSync(srcPath).isDirectory()) {
          // If it's a directory, create a corresponding directory in dist
          fs.mkdirSync(destPath, { recursive: true });
        } else {
          // If it's a file, copy it
          fs.copyFileSync(srcPath, destPath);
        }
      });

      resolve("Static site files moved to dist");
      return;
    }

    // If package.json exists, run npm install & build
    const child = exec(`cd ${projectPath} && npm install && npm run build`);

    child.stdout?.on("data", function (data) {
      console.log("stdout: " + data);
    });
    child.stderr?.on("data", function (data) {
      console.log("stderr: " + data);
    });
    child.on("close", function (code) {
      resolve("Project built and moved to dist");
    });
  });
}

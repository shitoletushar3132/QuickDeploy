"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProject = buildProject;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function buildProject(id) {
    return new Promise((resolve) => {
        var _a, _b;
        const projectPath = path_1.default.join(__dirname, `output/${id}`);
        const distPath = path_1.default.join(projectPath, "build");
        const list = fs_1.default.readdirSync(projectPath);
        if (!list.includes("package.json")) {
            // Ensure dist directory exists
            if (!fs_1.default.existsSync(distPath)) {
                fs_1.default.mkdirSync(distPath);
            }
            // Copy all files from projectPath to dist
            list.forEach((file) => {
                const srcPath = path_1.default.join(projectPath, file);
                const destPath = path_1.default.join(distPath, file);
                // Check if it's a file or directory
                if (fs_1.default.statSync(srcPath).isDirectory()) {
                    // If it's a directory, create a corresponding directory in dist
                    fs_1.default.mkdirSync(destPath, { recursive: true });
                }
                else {
                    // If it's a file, copy it
                    fs_1.default.copyFileSync(srcPath, destPath);
                }
            });
            resolve("Static site files moved to dist");
            return;
        }
        // If package.json exists, run npm install & build
        const child = (0, child_process_1.exec)(`cd ${projectPath} && npm install && npm run build`);
        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on("data", function (data) {
            console.log("stdout: " + data);
        });
        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on("data", function (data) {
            console.log("stderr: " + data);
        });
        child.on("close", function (code) {
            resolve("Project built and moved to dist");
        });
    });
}

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const simple_git_1 = __importDefault(require("simple-git"));
const cors_1 = __importDefault(require("cors"));
const util_1 = require("./util");
const path_1 = __importDefault(require("path"));
const files_1 = require("./files");
const dotenv_1 = __importDefault(require("dotenv"));
const awsConfig_1 = require("./awsConfig");
const redis_1 = require("redis");
const removefiles_1 = require("./removefiles");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
function initializeRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        const publisher = (0, redis_1.createClient)();
        const subscriber = (0, redis_1.createClient)();
        yield publisher.connect();
        yield subscriber.connect();
        return { publisher, subscriber };
    });
}
initializeRedis().then(({ publisher, subscriber }) => {
    app.post("/deploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const repoUrl = req.body.repoUrl;
        const name = repoUrl.split("/").pop().split(".")[0];
        const id = (0, util_1.generateRandomId)(name);
        const repoPath = path_1.default.join(__dirname, `output/${id}`);
        res.json({ id });
        try {
            yield publisher.hSet("status", id, "cloning");
            yield (0, simple_git_1.default)().clone(repoUrl, path_1.default.join(__dirname, `output/${id}`));
            yield publisher.hSet("status", id, "uploading");
            const files = (0, files_1.getAllFiles)(path_1.default.join(__dirname, `output/${id}`));
            yield Promise.all(files.map((file) => (0, awsConfig_1.uploadFile)(file.slice(__dirname.length + 1), file)));
            yield publisher.lPush("build-queue", id);
            yield publisher.hSet("status", id, "uploaded");
        }
        catch (error) {
            yield publisher.hSet("status", id, "failed");
            res.status(500).send("server error");
        }
        finally {
            (0, removefiles_1.cleanUpFile)(repoPath);
            console.log(`cleaned up: ${repoPath}`);
        }
    }));
    app.get("/status/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const id = req.params.id;
            const response = yield subscriber.hGet("status", id);
            res.json({ status: response || "Unknown" });
        }
        catch (_a) {
            res.json({ message: "error on server" });
        }
    }));
    app.listen(3000, () => {
        console.log("Server started at port 3000");
    });
});

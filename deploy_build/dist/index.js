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
const redis_1 = require("redis");
const aws_1 = require("./aws");
const utils_1 = require("./utils");
const removefiles_1 = require("./removefiles");
const path_1 = __importDefault(require("path"));
const subscriber = (0, redis_1.createClient)();
subscriber.connect();
const publisher = (0, redis_1.createClient)();
publisher.connect();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        while (1) {
            const response = yield subscriber.brPop((0, redis_1.commandOptions)({ isolated: true }), "build-queue", 0);
            let buildPath;
            if (response) {
                buildPath = path_1.default.join(__dirname, "/output", response.element);
                try {
                    console.log("Starting S3 Download...");
                    yield (0, aws_1.downloadS3Folder)(`output/${response.element}`);
                    console.log("Downloaded Successfully");
                    console.log("Starting Build Process...");
                    publisher.hSet("status", response.element, "building");
                    yield (0, utils_1.buildProject)(response.element);
                    console.log("Build Successfully");
                    console.log("Copying Final Distribution...");
                    (0, aws_1.copyFinalDist)(response.element);
                    console.log("Final Distribution Copied Successfully");
                    publisher.hSet("status", response.element, "deployed");
                }
                catch (error) {
                    publisher.hSet("status", response.element, "failed");
                    console.error("Error in the process:", error);
                }
                finally {
                    (0, removefiles_1.cleanUpFile)(buildPath);
                }
            }
        }
    });
}
main();

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
const aws_sdk_1 = require("aws-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
app.get("/*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const host = req.hostname;
    const id = host.split(".")[0];
    let filePath = req.path === "/" ? "/index.html" : req.path;
    filePath = filePath.replace(/^\/+/, ""); // Remove leading /
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
        throw new Error("S3_BUCKET_NAME is not defined in environment variables.");
    }
    const s3Key = `dist/${id}/${filePath}`;
    console.log(`Checking S3 Key: ${s3Key}`);
    try {
        const contents = yield s3
            .getObject({
            Bucket: bucketName,
            Key: s3Key,
        })
            .promise();
        const type = filePath.endsWith(".html")
            ? "text/html"
            : filePath.endsWith(".css")
                ? "text/css"
                : "application/javascript";
        res.set("Content-Type", type);
        // Set cache control headers
        res.set("Cache-Control", "public, max-age=86400, immutable"); // Cache for 24 hours
        // Optionally, add ETag and Last-Modified headers for cache validation
        const etag = contents.ETag;
        //@ts-ignore
        const lastModified = new Date(contents.LastModified).toUTCString();
        res.set("ETag", etag);
        res.set("Last-Modified", lastModified);
        res.send(contents.Body);
    }
    catch (error) {
        console.error("S3 Fetch Error:", error);
        res.status(404).send("File not found");
    }
}));
app.listen(3001);

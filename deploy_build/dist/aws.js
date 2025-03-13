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
exports.downloadS3Folder = void 0;
exports.copyFinalDist = copyFinalDist;
const aws_sdk_1 = require("aws-sdk");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const downloadS3Folder = (prefix) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
        throw new Error("S3_BUCKET_NAME is not defined in the environment variables.");
    }
    console.log(prefix);
    const allFiles = yield s3
        .listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix,
    })
        .promise();
    const allPromise = ((_a = allFiles.Contents) === null || _a === void 0 ? void 0 : _a.map((_a) => __awaiter(void 0, [_a], void 0, function* ({ Key }) {
        return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path_1.default.join(__dirname, Key);
            const outputFile = fs_1.default.createWriteStream(finalOutputPath);
            const dirName = path_1.default.dirname(finalOutputPath);
            if (!fs_1.default.existsSync(dirName)) {
                fs_1.default.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
                Bucket: bucketName,
                Key,
            })
                .createReadStream()
                .pipe(outputFile)
                .on("finish", () => {
                resolve("");
            });
        }));
    }))) || [];
    console.log("awaiting");
    yield Promise.all(allPromise === null || allPromise === void 0 ? void 0 : allPromise.filter((x) => x !== undefined));
});
exports.downloadS3Folder = downloadS3Folder;
function copyFinalDist(id) {
    const folderPath = path_1.default.join(__dirname, `output/${id}/dist`);
    const folderToUse = fs_1.default.existsSync(folderPath) ? "dist" : "build";
    const finalFolderPath = path_1.default.join(__dirname, `output/${id}/${folderToUse}`);
    const allFiles = getAllFiles(finalFolderPath);
    allFiles.forEach((file) => {
        uploadFile(`dist/${id}` + file.slice(folderPath.length + 1), file);
    });
}
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    // Read the file content
    const fileContent = fs_1.default.readFileSync(localFilePath);
    // Ensure that the S3 bucket name is set
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
        throw new Error("S3_BUCKET_NAME is not defined in the environment variables.");
    }
    try {
        // Upload the file to S3
        const response = yield s3
            .upload({
            Body: fileContent,
            Bucket: bucketName, // Ensure bucketName is a string
            Key: fileName, // Correct key as 'Key'
        })
            .promise();
    }
    catch (error) {
        console.error("Error uploading file:", error);
    }
});
const getAllFiles = (folderPath) => {
    let response = [];
    const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
        const fullFilePath = path_1.default.join(folderPath, file);
        if (fs_1.default.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath));
        }
        else {
            response.push(fullFilePath);
        }
    });
    return response;
};

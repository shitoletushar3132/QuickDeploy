import { S3 } from "aws-sdk";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const downloadS3Folder = async (prefix: string) => {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error(
      "S3_BUCKET_NAME is not defined in the environment variables."
    );
  }

  console.log(prefix);
  const allFiles = await s3
    .listObjectsV2({
      Bucket: bucketName,
      Prefix: prefix,
    })
    .promise();

  const allPromise =
    allFiles.Contents?.map(async ({ Key }) => {
      return new Promise(async (resolve) => {
        if (!Key) {
          resolve("");
          return;
        }

        const finalOutputPath = path.join(__dirname, Key);

        const outputFile = fs.createWriteStream(finalOutputPath);

        const dirName = path.dirname(finalOutputPath);

        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
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
      });
    }) || [];

  console.log("awaiting");

  await Promise.all(allPromise?.filter((x) => x !== undefined));
};

export function copyFinalDist(id: string) {
  const folderPath = path.join(__dirname, `output/${id}/dist`);

  const folderToUse = fs.existsSync(folderPath) ? "dist" : "build";

  const finalFolderPath = path.join(__dirname, `output/${id}/${folderToUse}`);

  const allFiles = getAllFiles(finalFolderPath);

  allFiles.forEach((file) => {
    uploadFile(`dist/${id}` + file.slice(folderPath.length + 1), file);
  });
}

const uploadFile = async (fileName: string, localFilePath: string) => {
  // Read the file content
  const fileContent = fs.readFileSync(localFilePath);

  // Ensure that the S3 bucket name is set
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error(
      "S3_BUCKET_NAME is not defined in the environment variables."
    );
  }

  try {
    // Upload the file to S3
    const response = await s3
      .upload({
        Body: fileContent,
        Bucket: bucketName, // Ensure bucketName is a string
        Key: fileName, // Correct key as 'Key'
      })
      .promise();
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

const getAllFiles = (folderPath: string) => {
  let response: string[] = [];

  const allFilesAndFolders = fs.readdirSync(folderPath);

  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
};

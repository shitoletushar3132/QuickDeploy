import { S3 } from "aws-sdk";
import fs from "fs";

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadFile = async (fileName: string, localFilePath: string) => {
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

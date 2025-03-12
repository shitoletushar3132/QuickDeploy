import express from "express";
import fs from "fs";

import { S3 } from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

app.get("/*", async (req, res) => {
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
    const contents = await s3
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
    res.send(contents.Body);
  } catch (error) {
    console.error("S3 Fetch Error:", error);
    res.status(404).send("File not found");
  }
});

app.listen(3001);

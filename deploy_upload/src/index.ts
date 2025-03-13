import express from "express";
import simpleGit from "simple-git";
import cors from "cors";
import { generateRandomId } from "./util";
import path from "path";
import { getAllFiles } from "./files";
import dotenv from "dotenv";
import { uploadFile } from "./awsConfig";
import { createClient } from "redis";
import { cleanUpFile } from "./removefiles";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

async function initializeRedis() {
  const publisher = createClient();
  const subscriber = createClient();

  await publisher.connect();
  await subscriber.connect();

  return { publisher, subscriber };
}

initializeRedis().then(({ publisher, subscriber }) => {
  app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    const name = repoUrl.split("/").pop().split(".")[0];
    const id = generateRandomId(name);

    const repoPath = path.join(__dirname, `output/${id}`);
    res.json({ id });

    try {
      await publisher.hSet("status", id, "cloning");
      await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

      await publisher.hSet("status", id, "uploading");
      const files = getAllFiles(path.join(__dirname, `output/${id}`));

      await Promise.all(
        files.map((file) => uploadFile(file.slice(__dirname.length + 1), file))
      );

      await publisher.lPush("build-queue", id);
      await publisher.hSet("status", id, "uploaded");
    } catch (error) {
      await publisher.hSet("status", id, "failed");
      res.status(500).send("server error");
    } finally {
      cleanUpFile(repoPath);
      console.log(`cleaned up: ${repoPath}`);
    }
  });

  app.get("/status/:id", async (req, res) => {
    try {
      const id = req.params.id as string;
      const response = await subscriber.hGet("status", id);
      res.json({ status: response || "Unknown" });
    } catch {
      res.json({ message: "error on server" });
    }
  });

  app.listen(3000, () => {
    console.log("Server started at port 3000");
  });
});

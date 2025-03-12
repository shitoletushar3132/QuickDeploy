import { commandOptions, createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";
import { cleanUpFile } from "./removefiles";
import path from "path";

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

async function main() {
  while (1) {
    const response = await subscriber.brPop(
      commandOptions({ isolated: true }),
      "build-queue",
      0
    );

    let buildPath;

    if (response) {
      buildPath = path.join(__dirname, "/output", response.element);
      try {
        console.log("Starting S3 Download...");
        await downloadS3Folder(`output/${response.element}`);
        console.log("Downloaded Successfully");

        console.log("Starting Build Process...");
        await buildProject(response.element);
        console.log("Build Successfully");

        console.log("Copying Final Distribution...");
        copyFinalDist(response.element);
        console.log("Final Distribution Copied Successfully");
        publisher.hSet("status", response.element, "Deployed");
      } catch (error) {
        publisher.hSet("status", response.element, "failed");
        console.error("Error in the process:", error);
      } finally {
        cleanUpFile(buildPath);
      }
    }
  }
}

main();

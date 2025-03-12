import fs from "fs/promises";
export const cleanUpFile = async (repoPath: string) => {
  try {
    // Clean up the cloned repo after deployment
    await fs.rm(repoPath, { recursive: true, force: true });
    console.log(`Cleaned up: ${repoPath}`);
  } catch (cleanupError) {
    console.error("Cleanup failed:", cleanupError);
  }
};

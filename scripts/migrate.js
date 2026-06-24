const { execSync } = require("child_process");

if (!process.env.DATABASE_URL) {
  console.log("Skipping prisma migrate deploy (no DATABASE_URL set)");
  process.exit(0);
}

const MAX_ATTEMPTS = 4;
const DELAY_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`Running prisma migrate deploy (attempt ${attempt}/${MAX_ATTEMPTS})...`);
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      console.log("Migrations applied successfully.");
      return;
    } catch (err) {
      const isLockTimeout =
        err.stderr?.toString().includes("advisory lock") ||
        err.stdout?.toString().includes("advisory lock") ||
        err.message?.includes("advisory lock") ||
        err.message?.includes("P1002");

      if (isLockTimeout && attempt < MAX_ATTEMPTS) {
        console.log(`Advisory lock timeout — retrying in ${DELAY_MS / 1000}s...`);
        await sleep(DELAY_MS);
      } else if (isLockTimeout) {
        // All retries exhausted on a lock timeout — migrations are likely already applied.
        // Log a warning but don't fail the build.
        console.warn("Warning: prisma migrate deploy timed out on advisory lock after all retries.");
        console.warn("Continuing build — migrations may already be applied.");
        return;
      } else {
        // Non-lock error — fail the build.
        throw err;
      }
    }
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});

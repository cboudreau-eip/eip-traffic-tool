const { execSync } = require("child_process");

if (process.env.DATABASE_URL) {
  console.log("Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log("Skipping prisma migrate deploy (no DATABASE_URL set)");
}

const fs = require("fs");
const path = require("path");

const destination = process.argv[2];

if (!destination) {
  console.error("Usage: node tools/copy_latest_generated_image.js <destination>");
  process.exit(2);
}

const generatedRoot =
  "/Users/byungkim/.codex/generated_images/019f35c9-036d-7543-acb5-47525bcb5674";

const files = fs
  .readdirSync(generatedRoot)
  .filter((name) => name.endsWith(".png"))
  .map((name) => path.join(generatedRoot, name))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

if (!files.length) {
  console.error(`No generated PNG files found in ${generatedRoot}`);
  process.exit(1);
}

fs.copyFileSync(files[0], destination);
console.log(`Copied ${files[0]} -> ${destination}`);

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const svgPath = path.join(__dirname, "../public/logo-icon.svg");
const svgContent = fs.readFileSync(svgPath, "utf8");

const outDir = path.join(__dirname, "../public/icons");

const names = ["icon-firma", "icon-sofor", "icon-veli"];
const sizes = [192, 512];

async function main() {
  for (const name of names) {
    for (const size of sizes) {
      const suffix = size === 512 ? "-512" : "";
      const outFile = path.join(outDir, `${name}${suffix}.png`);
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outFile);
      console.log(`✓ ${path.basename(outFile)}`);
    }
  }
  console.log("Tüm ikonlar oluşturuldu.");
}

main().catch(console.error);

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "../public/icons");

const panels = [
  { name: "icon-firma", svg: "icon-firma.svg" },
  { name: "icon-sofor", svg: "icon-sofor.svg" },
  { name: "icon-veli", svg: "icon-veli.svg" },
];

const sizes = [192, 512];

async function main() {
  for (const panel of panels) {
    const svgPath = path.join(outDir, panel.svg);
    const svgContent = fs.readFileSync(svgPath, "utf8");
    for (const size of sizes) {
      const suffix = size === 512 ? "-512" : "";
      const outFile = path.join(outDir, `${panel.name}${suffix}.png`);
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

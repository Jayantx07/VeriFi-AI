// Render react-icons (Simple Icons brand marks + Google Material icons) to PNGs for the ABC deck.
// Usage: node make_icons.js <outDir> <Name1,Name2,...>
// Writes <outDir>/<Name>_<HEX>.png for every colour in COLORS.
const fs = require("fs");
const path = require("path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const si = require("react-icons/si");
const md = require("react-icons/md");

const COLORS = ["FFFFFF", "3C4043", "4285F4", "EA4335", "FBBC04", "34A853"];

async function main() {
  const [outDir, list] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const missing = [];
  for (const name of list.split(",")) {
    const Comp = si[name] || md[name];
    if (!Comp) { missing.push(name); continue; }
    for (const c of COLORS) {
      const file = path.join(outDir, `${name}_${c}.png`);
      if (fs.existsSync(file)) continue;
      const svg = renderToStaticMarkup(React.createElement(Comp, { size: 256, color: "#" + c }));
      await sharp(Buffer.from(svg)).resize(256, 256).png().toFile(file);
    }
  }
  if (missing.length) { console.error("missing icons: " + missing.join(", ")); process.exit(1); }
  console.log("icons ready");
}
main();

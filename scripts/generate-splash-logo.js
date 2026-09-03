#!/usr/bin/env node
/**
 * Builds native splash PNG assets from SVG sources.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const assets = path.join(root, "assets/images");

const targets = [
  {
    svg: path.join(assets, "splash-mark.svg"),
    out: path.join(assets, "splash-mark.png"),
    width: 180,
    height: 180,
  },
  {
    svg: path.join(assets, "splash-logo.svg"),
    out: path.join(assets, "splash-logo.png"),
    width: 840,
    height: 200,
  },
];

async function render({ svg, out, width, height }) {
  const source = fs.readFileSync(svg);
  await sharp(source, { density: 300 })
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(out);
  console.log("Wrote", out);
}

async function main() {
  for (const target of targets) {
    await render(target);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

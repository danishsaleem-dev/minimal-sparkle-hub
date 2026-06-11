import { writeFileSync, existsSync } from "fs";
import { join } from "path";

const outputDir = join(process.cwd(), ".vercel/output");

if (!existsSync(outputDir)) {
  console.error("No .vercel/output directory found — skipping postbuild.");
  process.exit(0);
}

const config = {
  version: 3,
  routes: [
    {
      src: "/assets/(.*)",
      headers: { "cache-control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/__server" },
  ],
};

writeFileSync(
  join(outputDir, "config.json"),
  JSON.stringify(config, null, 2)
);

console.log("✓ Generated .vercel/output/config.json");

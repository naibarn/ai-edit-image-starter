#!/usr/bin/env node
import { globby } from "globby";
import fs from "fs/promises";
import path from "path";

const repoRoot = process.cwd();
const globals = path.join(repoRoot, "frontend", "src", "app", "globals.css");

const run = async () => {
  const files = await globby(["frontend/src/**/*.{module.css,module.scss,module.sass}"]);
  let changed = 0;
  for (const file of files) {
    const src = await fs.readFile(file, "utf8");
    if (!/@apply\s+/m.test(src)) continue;             // ไม่มี @apply ไม่ต้องแตะ
    if (/@reference\s+["'][^"']+["']/m.test(src)) continue; // มีแล้ว ข้าม
    const rel = path.relative(path.dirname(path.resolve(file)), globals).split(path.sep).join("/");
    await fs.writeFile(file, `@reference "${rel}";\n${src}`, "utf8");
    changed++;
    console.log("patched", file, "-> @reference", rel);
  }
  console.log(`✅ add-tailwind-reference: patched ${changed} file(s).`);
};

run().catch((e) => { console.error(e); process.exit(1); });
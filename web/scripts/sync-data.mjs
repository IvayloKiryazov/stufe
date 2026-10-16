// Copy the pipeline output (../data/*.json) into public/data so the built app
// can fetch it. Runs before dev and build (see package.json).
import { mkdir, copyFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../../data");
const dest = path.resolve(here, "../public/data");

await mkdir(dest, { recursive: true });
if (existsSync(src)) {
  let n = 0;
  for (const f of await readdir(src)) {
    if (f.endsWith(".json")) {
      await copyFile(path.join(src, f), path.join(dest, f));
      n++;
    }
  }
  console.log(`synced ${n} data files -> ${dest}`);
} else {
  console.warn(`no data directory at ${src}`);
}

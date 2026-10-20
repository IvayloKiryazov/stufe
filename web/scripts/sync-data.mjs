// Copy the pipeline output (../data/*) into public/data so the built app can
// fetch it. Runs before dev and build (see package.json).
//
// We only ship what the client actually fetches (an allowlist), so build-time
// inputs such as vocab_frequency.json and any personal Anki import
// (vocab_personal.json) are never published. The deck itself is shipped split
// per level under data/items/ so the app can load it on demand (issue #102).
import { mkdir, copyFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../../data");
const dest = path.resolve(here, "../public/data");

const FILES = ["levels.json", "reading.json", "attribution.json", "conjugations.json"];
const DIRS = ["items"];

// Clean first so removed/renamed level files never linger.
await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });

if (existsSync(src)) {
  let n = 0;
  for (const f of FILES) {
    const from = path.join(src, f);
    if (existsSync(from)) {
      await copyFile(from, path.join(dest, f));
      n++;
    }
  }
  for (const d of DIRS) {
    const fromDir = path.join(src, d);
    if (!existsSync(fromDir)) continue;
    const toDir = path.join(dest, d);
    await mkdir(toDir, { recursive: true });
    for (const f of await readdir(fromDir)) {
      if (f.endsWith(".json")) {
        await copyFile(path.join(fromDir, f), path.join(toDir, f));
        n++;
      }
    }
  }
  console.log(`synced ${n} data files -> ${dest}`);
} else {
  console.warn(`no data directory at ${src}`);
}

// Optional durable backup via the File System Access API (issue #99).
// The user grants a real file once; we then keep it up to date, so progress
// survives clearing browser data (and syncs if the file is in a synced folder).
import { idbGetValue, idbSetValue } from "./persist";
import { store } from "./store";

const KEY = "backup-handle";
let handle: { createWritable: () => Promise<{ write: (t: string) => Promise<void>; close: () => Promise<void> }> } | null =
  null;

export function backupSupported(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

export async function initBackup(): Promise<void> {
  handle = await idbGetValue(KEY);
}

/** Ask the user for a backup file; returns false if unsupported/cancelled. */
export async function chooseBackupFile(): Promise<boolean> {
  if (!backupSupported()) return false;
  try {
    const picked = await (window as unknown as {
      showSaveFilePicker: (o: unknown) => Promise<unknown>;
    }).showSaveFilePicker({
      suggestedName: "stufe-progress.json",
      types: [{ description: "Stufe backup", accept: { "application/json": [".json"] } }],
    });
    handle = picked as typeof handle;
    await idbSetValue(KEY, picked);
    await writeBackup();
    return true;
  } catch {
    return false;
  }
}

export async function writeBackup(): Promise<void> {
  if (!handle) return;
  try {
    const writable = await handle.createWritable();
    await writable.write(store.export());
    await writable.close();
  } catch {
    /* file moved/denied — ignore */
  }
}

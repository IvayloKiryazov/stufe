import type { Item } from "./data";
import { fold } from "./grade";

export function norm(s: string): string {
  return fold(String(s).trim())
    .replace(/[.!?,;:]+$/, "")
    .replace(/\s+/g, " ");
}

export function judge(item: Item, given: string): { ok: boolean; msg: string } {
  const typed = item.kind === "cloze" || item.kind === "gender" || item.kind === "plural";
  const expected = typed ? [item.answer ?? "", ...(item.alt ?? [])] : [item.de ?? ""];
  const g = norm(given);
  const ok = g !== "" && expected.some((e) => norm(e) === g);
  let msg = "";
  if (!ok && item.kind === "noun" && item.de) {
    const parts = item.de.split(" ");
    const article = parts[0];
    const noun = norm(parts.slice(1).join(" "));
    const gp = g.split(" ");
    if (gp.length === 1 && gp[0] === noun) msg = `Add the article. It is ${article}.`;
    else if (gp.length > 1 && gp.slice(1).join(" ") === noun)
      msg = `Right noun, wrong article. It is ${article}.`;
  }
  return { ok, msg };
}

export function speechText(item: Item): string {
  if (item.kind === "cloze") return (item.prompt ?? "").replace("___", item.answer ?? "");
  return item.sentence_de || item.de || "";
}

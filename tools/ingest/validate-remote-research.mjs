import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateRemoteSnapshot } from "./collect-remote-research.mjs";

const root = resolve(new URL("../..", import.meta.url).pathname);
const directory = resolve(root, "data/research/remote");
const latest = readdirSync(directory).filter((file) => file.endsWith(".json")).sort().at(-1);
if (!latest) throw new Error("No remote research snapshot exists.");
const snapshot = JSON.parse(readFileSync(resolve(directory, latest), "utf8"));
const errors = validateRemoteSnapshot(snapshot);
if (errors.length) throw new Error(`Remote research validation failed for ${latest}:\n${errors.join("\n")}`);
console.log(`Validated remote research snapshot ${latest}: ${snapshot.shortlist.length} shortlist entries, ${snapshot.sources.filter((source) => source.status === "ok").length}/${snapshot.sources.length} source groups available.`);

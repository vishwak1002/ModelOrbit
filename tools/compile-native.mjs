import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const temp = mkdtempSync(join(tmpdir(), "modelorbit-native-"));
mkdirSync(join(temp, "module-cache"));
const compilerEnv = { ...process.env, SWIFT_MODULECACHE_PATH: join(temp, "module-cache"), CLANG_MODULE_CACHE_PATH: join(temp, "module-cache") };
const report = { schemaVersion: "0.2.0", checkedAt: new Date().toISOString(), ios: { status: "unknown" }, android: { status: "unknown" } };
try {
  try { execFileSync("swiftc", [resolve(root, "pocs/ios-coreai/main.swift"), "-o", join(temp, "ios-poc")], { encoding: "utf8", env: compilerEnv, stdio: ["ignore", "pipe", "pipe"] }); report.ios = { status: "pass", compiler: execFileSync("swift", ["--version"], { encoding: "utf8", env: compilerEnv }).trim().split(/\r?\n/)[0] }; }
  catch (error) { report.ios = { status: "failed", reason: String(error.stderr || error.message).trim().slice(0, 400) }; }
  try { execFileSync("kotlinc", [resolve(root, "pocs/android-executorch/Main.kt"), "-d", join(temp, "android-poc.jar")], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); report.android = { status: "pass", compiler: execFileSync("kotlinc", ["-version"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim().split(/\r?\n/)[0] }; }
  catch (error) { report.android = { status: "blocked", reason: "Kotlin compiler/Android build toolchain unavailable on this host." }; }
  console.log(JSON.stringify(report, null, 2));
} finally { rmSync(temp, { recursive: true, force: true }); }

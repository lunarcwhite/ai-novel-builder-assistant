// Custom ESM loader for tests (stdlib only, no new dependency).
//
// Two jobs:
// 1. Resolve the `@/` path alias to ./src with TypeScript extension probing,
//    including extensionless relative imports (e.g. `./tree` -> `./tree.ts`).
// 2. Redirect `@supabase/ssr` and `next/headers` to local stubs so feature
//    code runs in local-dev in-memory mode without network or credentials.
//
// Usage:
//   node --experimental-strip-types --loader ./tests/loader.mjs \
//     --test tests/*.test.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const supportDir = path.dirname(fileURLToPath(import.meta.url));
const testsDir = path.dirname(supportDir);
const repoRoot = path.dirname(testsDir);

const STUBS = new Map([
  ["@supabase/ssr", "supabase-ssr.mjs"],
  ["next/headers", "next-headers.mjs"],
]);

function tryFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (STUBS.has(specifier)) {
    const file = path.join(supportDir, "stubs", STUBS.get(specifier));
    return { url: pathToFileURL(file).href, shortCircuit: true };
  }

  if (specifier.startsWith("@/")) {
    const file = tryFile(path.join(repoRoot, "src", specifier.slice(2)));
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }

  if (
    specifier.startsWith(".") &&
    context.parentURL &&
    context.parentURL.startsWith("file:")
  ) {
    const base = path.dirname(fileURLToPath(context.parentURL));
    const file = tryFile(path.resolve(base, specifier));
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }

  return next(specifier, context);
}

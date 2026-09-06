#!/usr/bin/env node
/**
 * 宣言していない外部依存を使っていないか検査する。
 *
 * npm workspaces は hoisting により全パッケージが全依存を参照できてしまうため、
 * パッケージマネージャ自身はこれを防げない（ADR package-manager）。
 * この検査は pnpm を選ばなかったことの対価であり、外してはいけない。
 *
 * package.json の "ynetlabo": { "externalDeps": "none" } を宣言したパッケージは
 * 外部 import を 1 件も許さない（ADR plain-web-custom-elements の「依存ゼロ」）。
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC_EXT = /\.(m?[jt]sx?|vue)$/;
const IMPORT_RE =
  /(?:^|[\s;{(])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]/g;

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p, out) : SRC_EXT.test(name) && out.push(p);
  }
  return out;
};

/** "@scope/pkg/sub" -> "@scope/pkg" / "pkg/sub" -> "pkg" */
const bare = (s) => (s.startsWith("@") ? s.split("/").slice(0, 2).join("/") : s.split("/")[0]);

const problems = [];
for (const group of ["packages", "apps"]) {
  const base = join(ROOT, group);
  if (!existsSync(base)) continue;
  for (const name of readdirSync(base)) {
    const pkgDir = join(base, name);
    const pkgFile = join(pkgDir, "package.json");
    if (!existsSync(pkgFile)) continue;
    const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
    const declared = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
    ]);
    const zero = pkg.ynetlabo?.externalDeps === "none";

    for (const file of walk(join(pkgDir, "src"))) {
      const code = readFileSync(file, "utf8");
      for (const m of code.matchAll(IMPORT_RE)) {
        const spec = m[1] ?? m[2] ?? m[3];
        if (!spec) continue;
        if (spec.startsWith(".") || spec.startsWith("/")) continue;      // 相対
        if (spec.startsWith("node:")) continue;                          // 組み込み
        const dep = bare(spec);
        const where = `${relative(ROOT, file)}`;
        if (zero) {
          problems.push(`${pkg.name}: 依存ゼロのはずが "${spec}" を import (${where})`);
        } else if (!declared.has(dep)) {
          problems.push(`${pkg.name}: package.json に無い "${dep}" を import (${where})`);
        }
      }
    }
  }
}

if (problems.length) {
  console.error("宣言外の依存が見つかりました:\n" + problems.map((p) => "  - " + p).join("\n"));
  console.error("\npackage.json に宣言するか、import をやめてください。");
  process.exit(1);
}
console.log("check:deps  宣言外の依存なし");

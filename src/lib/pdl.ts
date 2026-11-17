export type TreeItem = { path: string; type: string };
export type RepoInfo = { size: number; description: string | null };
export type Score = { percent: number; review: string };

export const DATES = ["26 de noviembre", "17 de diciembre"] as const;

export function computeScore(repo: RepoInfo, tree: TreeItem[]): Score {
  const paths = tree.map((t) => t.path.toLowerCase());
  const has = (fn: (p: string) => boolean) => paths.some(fn);
  const base = (p: string) => p.split("/").pop() ?? p;
  const missing: string[] = [];
  let pts = 0;
  const code = Math.min(40, Math.round((repo.size / 500) * 40));
  pts += code;
  if (code < 40) missing.push(`código (${repo.size} KB)`);
  if (has((p) => base(p).startsWith("readme"))) pts += 15; else missing.push("README");
  if (has((p) => p === "docs" || p.startsWith("docs/") || /\.(pdf|pptx)$/.test(p))) pts += 15;
  else missing.push("docs/PDF");
  if (has((p) => /\.(png|jpe?g|gif|svg|webp)$/.test(p))) pts += 10; else missing.push("imágenes");
  if (repo.description && repo.description.trim()) pts += 10; else missing.push("descripción");
  if (has((p) => base(p).startsWith("license") || base(p).startsWith("licence"))) pts += 10;
  else missing.push("LICENSE");
  return { percent: pts, review: missing.length ? `Falta: ${missing.join(", ")}` : "Completo ✓" };
}

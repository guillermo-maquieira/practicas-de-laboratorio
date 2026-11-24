export type TreeItem = { path: string; type: string };
export type RepoInfo = { size: number; description: string | null };
export type Score = { percent: number; review: string };

export const DATES = ["26/11/26", "17/12/26"] as const;
export const ALL_DATES = "Todas" as const;

/** Rows whose effective date matches the filter ("Todas" keeps every row). */
export function filterByDate<T extends { date: string }>(rows: T[], date: string): T[] {
  if (date === ALL_DATES) return rows;
  return rows.filter((r) => r.date === date);
}

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
  return {
    percent: pts,
    review: missing.length
      ? `El repositorio está incompleto. Faltan: ${missing.join(", ")}.`
      : "El repositorio está completo y cumple con todos los requisitos.",
  };
}

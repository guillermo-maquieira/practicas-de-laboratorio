import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { computeScore, DATES, type Score } from "@/lib/pdl";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDL – Prácticas de Laboratorio" },
      { name: "description", content: "Registro de alumnos y progreso de sus repositorios de GitHub." },
      { property: "og:title", content: "PDL – Prácticas de Laboratorio" },
      { property: "og:description", content: "Registro de alumnos y progreso de sus repositorios de GitHub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Student = { id: string; name: string; last: string; repo: string; date: string };
type Override = { percent?: number; review?: string; date?: string; approved?: boolean };
type Cached = { at: number; score: Score | null };
const TTL = 30 * 60 * 1000;
const PIN = "8954";
const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) ?? "") as T; } catch { return d; } };
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

async function fetchScore(repo: string): Promise<Score | null> {
  const cache = load<Record<string, Cached>>("pdl-cache", {});
  const c = cache[repo];
  if (c && Date.now() - c.at < TTL) return c.score;
  let score: Score | null = null;
  try {
    const [r, t] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}`),
      fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`),
    ]);
    if (r.ok) {
      const info = await r.json();
      const tree = t.ok ? (await t.json()).tree ?? [] : [];
      score = computeScore(info, tree);
    }
  } catch { score = null; }
  const fresh = load<Record<string, Cached>>("pdl-cache", {});
  fresh[repo] = { at: Date.now(), score };
  save("pdl-cache", fresh);
  return score;
}

function Index() {
  const [students, setStudents] = useState<Student[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [scores, setScores] = useState<Record<string, Score | null | undefined>>({});
  const [teacher, setTeacher] = useState(false);
  const [form, setForm] = useState({ name: "", last: "", repo: "", date: DATES[0] as string });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStudents(load("pdl-students", []));
    setOverrides(load("pdl-overrides", {}));
    setTeacher(sessionStorage.getItem("pdl-teacher") === "1");
  }, []);

  useEffect(() => {
    students.forEach((s) => {
      if (scores[s.repo] !== undefined) return;
      fetchScore(s.repo).then((sc) => setScores((p) => ({ ...p, [s.repo]: sc })));
    });
  }, [students]); // eslint-disable-line react-hooks/exhaustive-deps

  const setOv = (id: string, patch: Override) => {
    const next = { ...overrides, [id]: { ...overrides[id], ...patch } };
    setOverrides(next); save("pdl-overrides", next);
  };

  const rows = useMemo(() => students.map((s) => {
    const o = overrides[s.id] ?? {};
    const sc = scores[s.repo];
    return { s, o, sc, percent: o.percent ?? sc?.percent, review: o.review ?? sc?.review, date: o.date ?? s.date };
  }).sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1)), [students, overrides, scores]);

  const updateStudent = (id: string, patch: Partial<Student>) => {
    const next = students.map((x) => (x.id === id ? { ...x, ...patch } : x));
    setStudents(next); save("pdl-students", next);
  };
  const removeStudent = (id: string) => {
    if (!window.confirm("¿Eliminar esta fila?")) return;
    const next = students.filter((x) => x.id !== id);
    setStudents(next); save("pdl-students", next);
    const ov = { ...overrides }; delete ov[id]; setOverrides(ov); save("pdl-overrides", ov);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const repo = form.repo.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    if (!form.name.trim() || !form.last.trim()) return setError("Completá nombre y apellido.");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return setError("Formato inválido. Usá usuario/repo.");
    setBusy(true);
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}`);
      if (!r.ok) { setError(r.status === 404 ? "El repositorio no existe o es privado." : `GitHub respondió ${r.status}.`); return; }
    } catch { setError("No se pudo contactar a GitHub."); return; } finally { setBusy(false); }
    const next = [...students, { id: crypto.randomUUID(), name: form.name.trim(), last: form.last.trim(), repo, date: form.date }];
    setStudents(next); save("pdl-students", next);
    setForm({ name: "", last: "", repo: "", date: DATES[0] });
  }

  function toggleLock() {
    if (teacher) { setTeacher(false); sessionStorage.removeItem("pdl-teacher"); return; }
    const pin = window.prompt("PIN docente");
    if (pin === PIN) { setTeacher(true); sessionStorage.setItem("pdl-teacher", "1"); }
    else if (pin !== null) window.alert("PIN incorrecto");
  }

  const input = "h-9 rounded-sm border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="min-h-screen">
      <header className="bg-ub text-ub-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center border-2 border-ub-foreground text-xl font-extrabold tracking-tight">PDL</span>
            <h1 className="text-xl font-bold uppercase leading-tight tracking-wide">
              Prácticas de<br />Laboratorio
            </h1>
          </div>
          <button onClick={toggleLock} aria-label={teacher ? "Salir de modo docente" : "Modo docente"}
            className="rounded-sm p-2 text-xl hover:bg-white/10">{teacher ? "🔓" : "🔒"}</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
      <form onSubmit={submit} className="mb-10 grid gap-3 rounded-sm border p-4 sm:grid-cols-[1fr_1fr_1.4fr_auto_auto]">
        <input className={input} placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={input} placeholder="Apellido" value={form.last} onChange={(e) => setForm({ ...form, last: e.target.value })} />
        <input className={input} placeholder="usuario/repo" value={form.repo} onChange={(e) => setForm({ ...form, repo: e.target.value })} />
        <select className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}>
          {DATES.map((d) => <option key={d}>{d}</option>)}
        </select>
        <button disabled={busy} className="h-9 rounded-sm bg-primary px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {busy ? "Validando…" : "Registrar"}
        </button>
        {error && <p className="text-sm text-destructive sm:col-span-5">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-sm border">
        <table className="w-full text-sm">
          <thead className="bg-ub text-left text-xs font-bold uppercase tracking-wider text-ub-foreground">
            <tr>
              <th className="p-3">#</th><th className="p-3">Alumno</th><th className="p-3">Repositorio</th>
              <th className="p-3">Fecha</th><th className="p-3">Progreso %</th><th className="p-3">Revisión</th>
              <th className="p-3">Rinde</th>{teacher && <th className="p-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Sin alumnos registrados.</td></tr>}
            {rows.map(({ s, o, sc, percent, review, date }, i) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 text-muted-foreground">{i + 1}</td>
                <td className="p-3 font-medium">
                  {teacher ? (
                    <div className="flex gap-1">
                      <input className={`${input} w-24`} value={s.name} onChange={(e) => updateStudent(s.id, { name: e.target.value })} />
                      <input className={`${input} w-24`} value={s.last} onChange={(e) => updateStudent(s.id, { last: e.target.value })} />
                    </div>
                  ) : <>{s.name} {s.last}</>}
                </td>
                <td className="p-3">{teacher ? (
                  <input className={`${input} w-44`} defaultValue={s.repo} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== s.repo) updateStudent(s.id, { repo: v }); }} />
                ) : <a className="text-primary hover:underline" href={`https://github.com/${s.repo}`} target="_blank" rel="noreferrer">{s.repo}</a>}</td>
                <td className="p-3">
                  {teacher ? (
                    <select className={input} value={date} onChange={(e) => setOv(s.id, { date: e.target.value })}>
                      {DATES.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  ) : date}
                </td>
                <td className="p-3 min-w-44">
                  {percent === undefined ? (sc === null ? <span>— ⚠️</span> : <span className="text-muted-foreground">…</span>) : (
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      {teacher ? (
                        <input type="number" min={0} max={100} className={`${input} w-16 px-1`} value={percent}
                          onChange={(e) => setOv(s.id, { percent: Math.max(0, Math.min(100, Number(e.target.value))) })} />
                      ) : <span className="w-10 text-right tabular-nums">{percent}%</span>}
                    </div>
                  )}
                  {teacher && percent === undefined && sc === null && (
                    <input type="number" placeholder="%" className={`${input} mt-1 w-16 px-1`} onChange={(e) => setOv(s.id, { percent: Number(e.target.value) })} />
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  {teacher ? (
                    <input className={`${input} w-full`} value={review ?? ""} onChange={(e) => setOv(s.id, { review: e.target.value })} />
                  ) : (review ?? (sc === null ? "— ⚠️" : "…"))}
                </td>
                <td className="p-3 text-center">
                  {teacher ? (
                    <input type="checkbox" aria-label="Rinde" className="size-4 accent-primary" checked={!!o.approved} onChange={(e) => setOv(s.id, { approved: e.target.checked })} />
                  ) : (
                    <span aria-label="Rinde" className={o.approved ? "font-bold text-primary" : "text-muted-foreground"}>{o.approved ? "✓" : "?"}</span>
                  )}
                </td>
                {teacher && (
                  <td className="p-3 text-center">
                    <button aria-label="Eliminar fila" onClick={() => removeStudent(s.id)} className="rounded-md px-2 py-1 text-destructive hover:bg-accent">✕</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </main>
  );
}

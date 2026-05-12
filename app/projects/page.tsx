'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type UnifiedProject = {
  id: string;
  type: 'vacancy' | 'project';
  title: string;
  description: string;
  company?: string;
  category: string;
  city?: string;
  budgetMin: number | null;
  budgetMax: number | null;
  requiredSkills?: string[];
  deadline?: string | null;
  experienceLevel?: string;
  employmentType?: string;
  source?: string;
  matchPercent?: number;
};

export default function ProjectsPage() {
  const [rows, setRows] = useState<UnifiedProject[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    q: '',
    category: '',
    city: '',
    experience: '',
    employment: '',
    sort: 'newest'
  });

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams(form as any).toString();
      const [projectsRes, recommendRes, favoritesRes] = await Promise.all([
        fetch(`/api/projects?${qs}`),
        fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ top_n: 200 }),
        }),
        fetch('/api/favorites').catch(() => null),
      ]);
      const payload = await projectsRes.json();
      const recommendPayload = await recommendRes.json();
      const favoritesPayload = favoritesRes ? await favoritesRes.json() : { data: [] };
      const recommendations = Array.isArray(recommendPayload?.recommendations)
        ? recommendPayload.recommendations
        : Array.isArray(recommendPayload?.data?.recommendations)
          ? recommendPayload.data.recommendations
          : [];
      const matchById = new Map(recommendations.map((x: any) => [String(x.project_id || x.id), Number(x.matchPercent || 0)]));
      const rowsWithScore = (payload.data || []).map((item: any) => ({
        ...item,
        matchPercent: matchById.get(String(item.id)) ?? null,
      }));
      setRows(rowsWithScore);
      const favoriteMap = Object.fromEntries((favoritesPayload?.data || []).map((x: any) => [String(x.itemId), true]));
      setSaved(favoriteMap);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const quickStats = useMemo(() => {
    const total = rows.length;
    const budgets = rows
      .map((r) => [Number(r.budgetMin), Number(r.budgetMax)])
      .flat()
      .filter((x) => Number.isFinite(x) && x > 0);
    const avgBudget = budgets.length ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length) : 0;
    return { total, avgBudget };
  }, [rows]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.category).filter(Boolean))).slice(0, 20);
  }, [rows]);

  const experienceOptions = ['junior', 'middle', 'senior'];
  const employmentOptions = ['full-time', 'part-time', 'contract', 'project', 'internship'];


  async function toggleFavorite(item: UnifiedProject) {
    setSaved((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        itemType: item.type,
        title: item.title,
        companyName: item.company || '',
        city: item.city || '',
        category: item.category || '',
        budgetMin: item.budgetMin ?? null,
        budgetMax: item.budgetMax ?? null,
        source: item.source || '',
      }),
    });
  }

  return (
    <div className="space-y-6 py-2">
      <section className="card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Project marketplace</p>
            <h1 className="section-title mt-1">Find verified client orders</h1>
            <p className="muted mt-2 max-w-2xl">
              Explore active opportunities with transparent budgets, deadlines, and skill requirements.
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <p className="text-sm text-slate-500">Results</p>
            <p className="text-3xl font-semibold text-slate-900">{quickStats.total}</p>
            <p className="text-xs text-slate-500">Avg budget: ${quickStats.avgBudget || 0}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <p className="mt-1 text-sm text-slate-500">Narrow results by role fit and delivery context.</p>
          <div className="mt-4 space-y-3">
            <input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder="Search by title or keyword" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">All categories</option>
              {categoryOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">Any experience</option>
              {experienceOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select value={form.employment} onChange={(e) => setForm({ ...form, employment: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">Any format</option>
              {employmentOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="newest">Newest first</option>
              <option value="budget_desc">Highest budget</option>
              <option value="budget_asc">Lowest budget</option>
            </select>
            <button onClick={load} className="btn-primary w-full">{loading ? 'Loading...' : 'Apply filters'}</button>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="pill">Unified vacancies + projects</span>
                <span className="pill">Fast response</span>
                <span className="pill">Student-friendly scope</span>
              </div>
              <p className="text-sm text-slate-500">{rows.length} opportunities found</p>
            </div>
          </div>

          {loading && (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="card animate-pulse p-5">
                  <div className="h-5 w-2/3 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && rows.map((p) => {
            return (
              <article key={p.id} className="card p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link href={`/projects/${encodeURIComponent(p.id)}`} className="text-xl font-semibold text-slate-900 hover:text-blue-700">
                      {p.title}
                    </Link>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">{p.description}</p>
                  </div>
                  {Number.isFinite(Number(p.matchPercent)) && Number(p.matchPercent) > 0 ? (
                    <div className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${Number(p.matchPercent) >= 75 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : Number(p.matchPercent) >= 50 ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {Math.round(Number(p.matchPercent))}% match
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-500">
                      {p.source === 'client_project' ? 'Client project' : p.type === 'vacancy' ? 'Vacancy' : 'Project'}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {(p.requiredSkills || []).slice(0, 6).map((skill) => (
                    <span key={`${p.id}-${skill}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <div><p className="text-xs text-slate-500">Budget</p><p className="font-semibold text-slate-900">{Number.isFinite(Number(p.budgetMin)) || Number.isFinite(Number(p.budgetMax)) ? `$${p.budgetMin ?? 0} - $${p.budgetMax ?? 0}` : 'Not specified'}</p></div>
                  <div><p className="text-xs text-slate-500">Company</p><p className="font-semibold text-slate-900">{p.company || 'Company not specified'}</p></div>
                  <div><p className="text-xs text-slate-500">City</p><p className="font-semibold text-slate-900">{p.city || 'Remote / Flexible'}</p></div>
                  <div><p className="text-xs text-slate-500">Experience</p><p className="font-semibold text-slate-900">{p.experienceLevel || 'Not specified'}</p></div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="status-pill bg-emerald-100 text-emerald-700">{p.employmentType || 'OPEN'}</span>
                    <span className="status-pill bg-blue-100 text-blue-700">{p.source || 'unified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFavorite(p)} className="btn-secondary">
                      {saved[p.id] ? '♥ Saved' : '♡ Save'}
                    </button>
                    <button type="button" className="btn-secondary">Apply</button>
                    <Link href={`/projects/${encodeURIComponent(p.id)}`} className="btn-primary">View details</Link>
                  </div>
                </div>
              </article>
            );
          })}

          {!loading && rows.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-3xl">🔎</p>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">No opportunities match your filters yet</h3>
              <p className="mt-2 text-sm text-slate-600">Try broader filters or remove strict conditions to discover more opportunities.</p>
              <button onClick={() => { setForm({ q: '', category: '', city: '', experience: '', employment: '', sort: 'newest' }); setTimeout(load, 0); }} className="btn-primary mt-4">
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

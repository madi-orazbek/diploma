'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Favorite = {
  _id: string;
  itemId: string;
  itemType: 'vacancy' | 'project';
  title: string;
  companyName?: string;
  city?: string;
  category?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  source?: string;
};

export default function FavoritesPage() {
  const [rows, setRows] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/favorites');
      const payload = await res.json();
      setRows(payload?.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(itemId: string) {
    setRows((prev) => prev.filter((x) => x.itemId !== itemId));
    await fetch(`/api/favorites/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
  }

  return (
    <div className="space-y-6 py-2">
      <section className="card p-6 md:p-8">
        <h1 className="section-title">Saved vacancies</h1>
        <p className="muted mt-2">Your shortlist of opportunities to revisit and apply quickly.</p>
      </section>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="card h-24 animate-pulse" />)}
        </div>
      ) : rows.length ? (
        <div className="grid gap-3">
          {rows.map((row) => (
            <article key={row._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-500">{row.companyName || 'Company not specified'} · {row.city || 'Remote'}</p>
                </div>
                <button type="button" className="rounded-full border px-3 py-1 text-xs" onClick={() => remove(row.itemId)}>♥ Remove</button>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                <p><span className="text-slate-500">Salary:</span> {Number.isFinite(Number(row.budgetMin)) || Number.isFinite(Number(row.budgetMax)) ? `${row.budgetMin ?? 0} - ${row.budgetMax ?? 0}` : 'Not specified'}</p>
                <p><span className="text-slate-500">Type:</span> {row.itemType}</p>
                <p><span className="text-slate-500">Category:</span> {row.category || 'General'}</p>
                <p><span className="text-slate-500">Source:</span> {row.source || 'unified'}</p>
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <Link className="btn-secondary" href={`/projects/${encodeURIComponent(row.itemId)}`}>View details</Link>
                <Link className="btn-primary" href={`/projects/${encodeURIComponent(row.itemId)}`}>Apply</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-3xl">🤍</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">No saved vacancies yet</h3>
          <p className="mt-1 text-sm text-slate-600">Use the heart button on listings to build your shortlist.</p>
          <Link href="/projects" className="btn-primary mt-4">Browse projects</Link>
        </div>
      )}
    </div>
  );
}

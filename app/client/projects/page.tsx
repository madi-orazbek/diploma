'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STATUS_OPTIONS = ['', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function ClientProjectsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/client/projects', { credentials: 'include' });
      const payload = await res.json();
      let data: any[] = payload.data || [];
      if (query) {
        const q = query.toLowerCase();
        data = data.filter((x: any) =>
          String(x.title || '').toLowerCase().includes(q) ||
          String(x.description || '').toLowerCase().includes(q)
        );
      }
      if (status) data = data.filter((x: any) => x.status === status);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, nextStatus: string) {
    setActionBusy(id);
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    setActionBusy(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setActionBusy(id);
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setActionBusy(null);
    load();
  }

  const statusColor: Record<string, string> = {
    OPEN: 'bg-emerald-100 text-emerald-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-slate-100 text-slate-600',
    CANCELLED: 'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-blue-700">Client workspace</p>
          <h1 className="section-title mt-0.5">My projects</h1>
        </div>
        <Link href="/client/projects/new" className="btn-primary">
          + Post a project
        </Link>
      </div>

      <div className="card p-4 grid md:grid-cols-3 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search by keyword..."
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
        <button onClick={load} className="btn-primary">Apply filters</button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-xl font-semibold text-slate-900">No projects found</p>
          <p className="mt-1 text-sm text-slate-600">
            {query || status ? 'Try adjusting your filters.' : 'Start by posting your first project.'}
          </p>
          {!query && !status && (
            <Link href="/client/projects/new" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Post a project
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r: any) => (
            <div key={r._id || r.id} className="card p-5">
              <div className="flex flex-wrap justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{r.title}</p>
                    <span className={`status-pill text-xs ${statusColor[r.status] || 'bg-slate-100 text-slate-600'}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{r.description || 'No description'}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Budget: ${r.budgetMin ?? 0}–${r.budgetMax ?? 0}</span>
                    {r.category && <span>Category: {r.category}</span>}
                    {r.city && <span>City: {r.city}</span>}
                    {r.experienceLevel && <span>Level: {r.experienceLevel}</span>}
                    {r.deadline && (
                      <span>Deadline: {new Date(r.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                  {Array.isArray(r.requiredSkills) && r.requiredSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.requiredSkills.slice(0, 6).map((s: string) => (
                        <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
                      ))}
                      {r.requiredSkills.length > 6 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">+{r.requiredSkills.length - 6}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-start gap-2">
                  <Link
                    href={`/client/applicants?projectId=${r._id || r.id}`}
                    className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    View applicants
                  </Link>
                  <select
                    value={r.status}
                    disabled={actionBusy === (r._id || r.id)}
                    onChange={(e) => updateStatus(r._id || r.id, e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  >
                    {STATUS_OPTIONS.filter(Boolean).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove(r._id || r.id)}
                    disabled={actionBusy === (r._id || r.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

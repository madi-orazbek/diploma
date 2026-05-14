'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';

const statusStyles: Record<string, string> = {
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  WITHDRAWN: 'bg-slate-100 text-slate-700'
};

export default function StudentApplicationsPage() {
  const { T } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [appRes, recRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ top_n: 500 }),
        }),
      ]);
      const appPayload = await appRes.json();
      const recPayload = await recRes.json();
      const recommendations = Array.isArray(recPayload?.recommendations)
        ? recPayload.recommendations
        : Array.isArray(recPayload?.data?.recommendations)
          ? recPayload.data.recommendations
          : [];
      const matchById = new Map(recommendations.map((x: any) => [String(x.project_id || x.id), Number(x.matchPercent || 0)]));
      const hydrated = (appPayload.data || []).map((row: any) => ({
        ...row,
        matchPercent: matchById.get(String(row.itemId || row.projectId || '')) ?? null,
      }));
      setRows(hydrated);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function withdraw(id: string) {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'WITHDRAW' })
    });
    load();
  }

  const filtered = useMemo(() => status === 'ALL' ? rows : rows.filter((r) => r.status === status), [rows, status]);

  return (
    <div className="space-y-6 py-2">
      <section className="card p-6 md:p-8">
        <h1 className="section-title">{T('apps_title')}</h1>
        <p className="muted mt-2">{T('apps_subtitle')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['ALL', 'SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map((x) => (
            <button
              key={x}
              onClick={() => setStatus(x)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === x ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {x}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="card h-24 animate-pulse" />)}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-3">
          {filtered.map((row: any) => {
            const match = Number(row.matchPercent);
            return (
              <article key={row._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{row.itemType === 'vacancy' ? T('apps_vacancy') : T('apps_project_type')}</p>
                    <p className="font-semibold text-slate-900">{row.title || row.itemId || row.projectId}</p>
                    <p className="text-xs text-slate-500">{row.companyName || T('apps_no_company')} {row.city ? `· ${row.city}` : ''}</p>
                  </div>
                  <span className={`status-pill ${statusStyles[row.status] || 'bg-slate-100 text-slate-700'}`}>
                    {row.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-slate-500">{T('apps_submitted')}</p><p className="font-medium text-slate-900">{new Date(row.createdAt).toLocaleDateString()}</p></div>
                  <div><p className="text-slate-500">{T('apps_match_score')}</p><p className="font-medium text-slate-900">{Number.isFinite(match) ? `${Math.round(match)}%` : 'N/A'}</p></div>
                  <div><p className="text-slate-500">{T('apps_client_label')}</p><p className="font-medium text-slate-900">{T('apps_verified_client')}</p></div>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="flex gap-2">
                    {row.conversationId && <a className="btn-secondary" href={`/student/messages?conversationId=${row.conversationId}`}>{T('apps_open_chat')}</a>}
                    {row.status === 'SENT' ? (
                      <button onClick={() => withdraw(row._id)} className="btn-secondary">{T('apps_withdraw')}</button>
                    ) : (
                      <button className="btn-secondary" disabled>{T('apps_no_actions')}</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-3xl">📭</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{T('apps_empty_title')}</h3>
          <p className="mt-1 text-sm text-slate-600">{T('apps_empty_desc')}</p>
          <a href="/projects" className="btn-primary mt-4">{T('apps_browse')}</a>
        </div>
      )}
    </div>
  );
}

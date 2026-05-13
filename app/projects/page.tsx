'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/I18nContext';
import { pushNotification } from '@/components/layout/notification-bell';

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

type ApplyState = 'idle' | 'modal' | 'submitting' | 'applied' | 'error';

type Toast = { msg: string; conversationId?: string; type?: 'success' | 'error' };

const DEFAULT_COVER = 'Hello, I am interested in this opportunity and would like to apply through UniWork.';

const POPULAR_CHIPS = ['Backend', 'Frontend', 'Python', 'React', 'Data', 'ML', 'Remote', 'Junior'];

export default function ProjectsPage() {
  const { T } = useI18n();
  const [rows, setRows] = useState<UnifiedProject[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyState, setApplyState] = useState<Record<string, ApplyState>>({});
  const [conversationIds, setConversationIds] = useState<Record<string, string>>({});
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState(DEFAULT_COVER);
  const [proposedPrice, setProposedPrice] = useState('');
  const [generatingCover, setGeneratingCover] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState({ q: '', category: '', city: '', experience: '', employment: '', sort: 'newest' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((p) => {
        setAuthRole(p?.data?.role || null);
        if (p?.data?.role === 'STUDENT') {
          fetch('/api/applications', { credentials: 'include' })
            .then((r) => r.json())
            .then((payload) => {
              const ids = new Set<string>((payload?.data || []).map((a: any) => String(a.itemId || a.projectId || '')).filter(Boolean));
              setAppliedIds(ids);
            })
            .catch(() => {});
        }
      });
  }, []);

  async function load(overrideForm?: typeof form) {
    setLoading(true);
    try {
      const f = overrideForm || form;
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v))).toString();
      const [projectsRes, favoritesRes] = await Promise.all([
        fetch(`/api/projects?${qs}`, { credentials: 'include' }),
        fetch('/api/favorites', { credentials: 'include' }).catch(() => null),
      ]);
      const payload = await projectsRes.json();
      const favoritesPayload = favoritesRes ? await favoritesRes.json().catch(() => ({ data: [] })) : { data: [] };
      const items: any[] = payload.data || [];
      setRows(items);
      const favoriteMap = Object.fromEntries((favoritesPayload?.data || []).map((x: any) => [String(x.itemId), true]));
      setSaved(favoriteMap);

      // Load match scores in background
      fetch('/api/recommend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ top_n: 200 }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((recommendPayload) => {
          if (!recommendPayload) return;
          const recommendations = Array.isArray(recommendPayload?.recommendations)
            ? recommendPayload.recommendations
            : Array.isArray(recommendPayload?.data?.recommendations)
              ? recommendPayload.data.recommendations
              : [];
          if (!recommendations.length) return;
          const matchById = new Map(recommendations.map((x: any) => [String(x.project_id || x.id), Number(x.matchPercent || 0)]));
          setRows((prev) => prev.map((item) => ({
            ...item,
            matchPercent: matchById.get(String(item.id)) ?? item.matchPercent ?? undefined,
          } as UnifiedProject)));
        })
        .catch(() => {});
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Debounced search
  function handleSearchChange(q: string) {
    const next = { ...form, q };
    setForm(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(next), 400);
  }

  function applyChip(chip: string) {
    const next = { ...form, q: chip };
    setForm(next);
    load(next);
  }

  function resetFilters() {
    const empty = { q: '', category: '', city: '', experience: '', employment: '', sort: 'newest' };
    setForm(empty);
    load(empty);
  }

  const quickStats = useMemo(() => {
    const total = rows.length;
    const budgets = rows.flatMap((r) => [Number(r.budgetMin), Number(r.budgetMax)]).filter((x) => Number.isFinite(x) && x > 0);
    const avgBudget = budgets.length ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length) : 0;
    return { total, avgBudget };
  }, [rows]);

  const categoryOptions = useMemo(() => Array.from(new Set(rows.map((r) => r.category).filter(Boolean))).slice(0, 20), [rows]);

  async function toggleFavorite(item: UnifiedProject) {
    setSaved((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id, itemType: item.type, title: item.title,
        companyName: item.company || '', city: item.city || '',
        category: item.category || '', budgetMin: item.budgetMin ?? null,
        budgetMax: item.budgetMax ?? null, source: item.source || '',
      }),
    });
  }

  function openApplyModal(id: string) {
    if (authRole !== 'STUDENT') return;
    setApplyingId(id);
    setCoverLetter(DEFAULT_COVER);
    setProposedPrice('');
    setApplyState((prev) => ({ ...prev, [id]: 'modal' }));
  }

  function closeModal() {
    if (applyingId) setApplyState((prev) => ({ ...prev, [applyingId]: 'idle' }));
    setApplyingId(null);
  }

  function showToast(t: Toast) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(t);
    toastTimerRef.current = setTimeout(() => setToast(null), 7000);
  }

  async function generateCoverLetter() {
    if (!applyingId || generatingCover) return;
    const project = rows.find((r) => r.id === applyingId);
    if (!project) return;
    setGeneratingCover(true);
    try {
      // Fetch the student's own profile to personalise the letter
      const profileRes = await fetch('/api/student/profile', { credentials: 'include' });
      const profilePayload = profileRes.ok ? await profileRes.json() : null;
      const profile = profilePayload?.data || {};

      const studentName = profile.fullName || 'a student';
      const studentSkills = Array.isArray(profile.skills) ? profile.skills.slice(0, 8).join(', ') : '';
      const studentLevel = profile.experienceLevel || '';
      const studentUniversity = profile.university || '';
      const about = profile.about ? profile.about.slice(0, 200) : '';

      const projectSkills = (project.requiredSkills || []).slice(0, 6).join(', ');
      const prompt = [
        `Write a professional cover letter for ${studentName} applying to the role "${project.title}" at ${project.company || 'the company'} (${project.city || 'remote'}).`,
        studentLevel && `The applicant's experience level is ${studentLevel}.`,
        studentUniversity && `They study at ${studentUniversity}.`,
        studentSkills && `Their key skills: ${studentSkills}.`,
        about && `Brief background: ${about}`,
        `The role requires: ${projectSkills || 'general technical skills'}.`,
        'Write 3–4 sentences. Be specific, professional, and enthusiastic. Output ONLY the cover letter text — no greeting line, no header, no signature. Start with "I am".',
      ].filter(Boolean).join(' ');

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      const reply = data?.data?.reply || data?.reply || '';
      if (reply) {
        // Strip any accidental greeting lines or headers
        const clean = reply
          .replace(/^(Cover Letter:?\s*|Dear Hiring Manager,?\s*|Hello,?\s*)/i, '')
          .trim();
        setCoverLetter(clean || reply);
      }
    } catch {
      // keep default cover letter on error
    } finally {
      setGeneratingCover(false);
    }
  }

  async function submitApply() {
    if (!applyingId) return;
    const project = rows.find((r) => r.id === applyingId);
    if (!project) return;
    const idSnapshot = applyingId;
    setApplyState((prev) => ({ ...prev, [idSnapshot]: 'submitting' }));
    setApplyingId(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: project.id, itemType: project.type, title: project.title,
          companyName: project.company || '', source: project.source || '',
          coverLetter: coverLetter.trim() || DEFAULT_COVER,
          proposedPrice: proposedPrice ? Number(proposedPrice) : null,
        }),
      });
      const payload = await res.json();
      if (res.ok) {
        const convId: string | undefined = payload?.data?.conversationId;
        setAppliedIds((prev) => new Set([...prev, project.id]));
        setApplyState((prev) => ({ ...prev, [idSnapshot]: 'applied' }));
        if (convId) {
          setConversationIds((prev) => ({ ...prev, [project.id]: convId }));
        }
        // Push notification
        pushNotification({
          type: 'application',
          title: 'Application submitted!',
          text: `You applied to "${project.title}"${project.company ? ` at ${project.company}` : ''}`,
          href: convId ? `/student/messages?conversationId=${convId}` : '/student/applications',
        });
        showToast({
          msg: `✅ Applied to "${project.title}"!`,
          conversationId: convId,
          type: 'success',
        });
      } else {
        setApplyState((prev) => ({ ...prev, [idSnapshot]: 'idle' }));
        showToast({ msg: payload?.error?.message || payload?.error || 'Failed to apply.', type: 'error' });
      }
    } catch {
      setApplyState((prev) => ({ ...prev, [idSnapshot]: 'idle' }));
    }
  }

  const experienceOptions = ['junior', 'middle', 'senior'];
  const employmentOptions = ['full-time', 'part-time', 'contract', 'project', 'internship'];

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <section className="card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Project marketplace</p>
            <h1 className="section-title mt-1">{T('proj_title')}</h1>
            <p className="muted mt-2 max-w-2xl">{T('proj_subtitle')}</p>
          </div>
          <div className="grid gap-1 text-right">
            <p className="text-sm text-slate-500">Results</p>
            <p className="text-3xl font-semibold text-slate-900">{quickStats.total}</p>
            <p className="text-xs text-slate-500">Avg: ${quickStats.avgBudget || 0}</p>
          </div>
        </div>
        {/* Quick chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {POPULAR_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => applyChip(chip)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 ${form.q === chip ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
            >
              {chip}
            </button>
          ))}
          {(form.q || form.category || form.city || form.experience || form.employment) && (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              ✕ {T('proj_reset_filters')}
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters sidebar */}
        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-slate-900">{T('proj_filters')}</h2>
          <div className="mt-4 space-y-3">
            <input
              value={form.q}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={T('proj_search_placeholder')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
            />
            <select
              value={form.category}
              onChange={(e) => { const next = { ...form, category: e.target.value }; setForm(next); load(next); }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">{T('proj_all_categories')}</option>
              {categoryOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <input
              value={form.city}
              onChange={(e) => { const next = { ...form, city: e.target.value }; setForm(next); }}
              onBlur={() => load()}
              placeholder={T('proj_city')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <select
              value={form.experience}
              onChange={(e) => { const next = { ...form, experience: e.target.value }; setForm(next); load(next); }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">{T('proj_any_experience')}</option>
              {experienceOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select
              value={form.employment}
              onChange={(e) => { const next = { ...form, employment: e.target.value }; setForm(next); load(next); }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">{T('proj_any_format')}</option>
              {employmentOptions.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
            <select
              value={form.sort}
              onChange={(e) => { const next = { ...form, sort: e.target.value }; setForm(next); load(next); }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="newest">{T('proj_newest')}</option>
              <option value="budget_desc">{T('proj_highest_budget')}</option>
              <option value="budget_asc">{T('proj_lowest_budget')}</option>
            </select>
            <button onClick={() => load()} className="btn-primary w-full">
              {loading ? T('loading') : T('proj_apply_filters')}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              {T('proj_reset_filters')}
            </button>
          </div>
        </aside>

        {/* Project list */}
        <div className="space-y-4">
          {loading && (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="card animate-pulse p-5">
                  <div className="h-5 w-2/3 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && rows.map((p) => {
            const isApplied = appliedIds.has(p.id) || applyState[p.id] === 'applied';
            const isSubmitting = applyState[p.id] === 'submitting';
            const matchPct = Number(p.matchPercent);
            const hasMatch = Number.isFinite(matchPct) && matchPct > 0;
            return (
              <article key={p.id} className="card p-5 md:p-6 transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${encodeURIComponent(p.id)}`} className="text-lg font-bold text-slate-900 hover:text-blue-700">
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.company || 'Company'} · {p.city || T('remote')}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-2">{p.description}</p>
                  </div>
                  {hasMatch ? (
                    <div className={`shrink-0 rounded-xl border px-3 py-2 text-sm font-bold ${matchPct >= 75 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : matchPct >= 50 ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {Math.round(matchPct)}% {T('proj_match')}
                    </div>
                  ) : (
                    <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                      {p.source === 'demo' ? 'Demo' : p.type === 'vacancy' ? 'Vacancy' : 'Project'}
                    </div>
                  )}
                </div>

                {/* Skills */}
                {!!(p.requiredSkills?.length) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.requiredSkills || []).slice(0, 7).map((skill) => (
                      <span key={`${p.id}-${skill}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">{skill}</span>
                    ))}
                    {(p.requiredSkills?.length || 0) > 7 && (
                      <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-400">+{(p.requiredSkills?.length || 0) - 7}</span>
                    )}
                  </div>
                )}

                {/* Metadata grid */}
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">{T('proj_budget')}</p>
                    <p className="font-semibold text-slate-900">
                      {(p.budgetMin != null || p.budgetMax != null) ? `$${p.budgetMin ?? 0} – $${p.budgetMax ?? 0}` : T('not_specified')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{T('proj_company')}</p>
                    <p className="font-semibold text-slate-900 truncate">{p.company || T('not_specified')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{T('proj_city')}</p>
                    <p className="font-semibold text-slate-900">{p.city || T('remote')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{T('proj_experience')}</p>
                    <p className="font-semibold text-slate-900">{p.experienceLevel || T('not_specified')}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.employmentType && <span className="status-pill bg-emerald-100 text-emerald-700 text-xs">{p.employmentType}</span>}
                    {p.category && <span className="status-pill bg-blue-100 text-blue-700 text-xs">{p.category}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(p)}
                      className="btn-secondary text-xs"
                    >
                      {saved[p.id] ? `♥ ${T('proj_saved')}` : `♡ ${T('proj_save')}`}
                    </button>
                    {authRole === 'STUDENT' ? (
                      isApplied ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          ✓ {T('proj_applied')}
                          {conversationIds[p.id] && (
                            <Link
                              href={`/student/messages?conversationId=${conversationIds[p.id]}`}
                              className="ml-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] text-white hover:bg-emerald-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open chat →
                            </Link>
                          )}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openApplyModal(p.id)}
                          disabled={isSubmitting}
                          className="btn-secondary text-xs disabled:opacity-50"
                        >
                          {isSubmitting ? T('loading') : T('proj_apply')}
                        </button>
                      )
                    ) : authRole === null ? (
                      <Link href="/signin" className="btn-secondary text-xs">{T('proj_sign_in_to_apply')}</Link>
                    ) : null}
                    <Link href={`/projects/${encodeURIComponent(p.id)}`} className="btn-primary text-xs">{T('proj_view_details')}</Link>
                  </div>
                </div>
              </article>
            );
          })}

          {!loading && rows.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-4xl">🔎</p>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{T('proj_no_results')}</h3>
              <p className="mt-2 text-sm text-slate-600">{T('proj_no_results_sub')}</p>
              <button onClick={resetFilters} className="btn-primary mt-4">
                {T('proj_reset_filters')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Apply Modal */}
      {applyingId && applyState[applyingId] === 'modal' && (() => {
        const applyProject = rows.find((r) => r.id === applyingId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">{T('apply_title')}</h3>
              <p className="mt-1 text-sm text-slate-500">{applyProject?.title}</p>
              {applyProject?.requiredSkills?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {applyProject.requiredSkills.slice(0, 5).map((s) => (
                    <span key={s} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">{s}</span>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">{T('apply_cover_letter')}</label>
                    <button
                      type="button"
                      onClick={generateCoverLetter}
                      disabled={generatingCover}
                      className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                    >
                      {generatingCover ? '⏳ Generating…' : '✨ AI Generate'}
                    </button>
                  </div>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none resize-none"
                    placeholder="Write your cover letter or click AI Generate..."
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    💡 Click "AI Generate" to create a tailored cover letter based on the project requirements.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{T('apply_price')}</label>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">A conversation will be created automatically after submitting.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={closeModal} className="btn-secondary">{T('apply_cancel')}</button>
                  <button type="button" onClick={submitApply} className="btn-primary">{T('apply_submit')}</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-24 right-5 z-50 max-w-sm rounded-2xl px-5 py-4 shadow-2xl transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          <p className="text-sm font-semibold">{toast.msg}</p>
          {toast.conversationId && (
            <Link
              href={`/student/messages?conversationId=${toast.conversationId}`}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30"
            >
              💬 Open chat →
            </Link>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="absolute right-3 top-3 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

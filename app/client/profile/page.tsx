'use client';

import { useEffect, useMemo, useState } from 'react';

const INDUSTRIES = ['Technology','E-commerce','Finance','Education','Healthcare','Media & Entertainment','Logistics','Real Estate','Consulting','Government','Non-profit','Other'];
const COMPANY_SIZES = ['Solo / Freelancer','2–10 employees','11–50 employees','51–200 employees','200+ employees'];
const PROJECT_TYPES = ['Web Development','Mobile Development','Data Analysis','Machine Learning / AI','Design / UI-UX','DevOps / Infrastructure','QA / Testing','Content / Copywriting','Marketing / SMM','Consulting / Research','Other'];

type FormData = {
  companyName: string;
  industry: string;
  website: string;
  companyDescription: string;
  city: string;
  companySize: string;
  contactEmail: string;
  linkedinUrl: string;
  typicalProjects: string[];
};

function completeness(f: FormData): number {
  const checks = [f.companyName, f.industry, f.website, f.companyDescription, f.city, f.companySize, f.contactEmail, f.linkedinUrl, f.typicalProjects.length > 0];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function ClientProfilePage() {
  const [form, setForm] = useState<FormData>({
    companyName: '', industry: '', website: '', companyDescription: '',
    city: '', companySize: '', contactEmail: '', linkedinUrl: '', typicalProjects: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch('/api/client/profile', { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.success && payload.data) {
          const d = payload.data;
          setForm({
            companyName: d.companyName || '',
            industry: d.industry || '',
            website: d.website || '',
            companyDescription: d.companyDescription || '',
            city: d.city || '',
            companySize: d.companySize || '',
            contactEmail: d.contactEmail || '',
            linkedinUrl: d.linkedinUrl || '',
            typicalProjects: Array.isArray(d.typicalProjects) ? d.typicalProjects : [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const score = useMemo(() => completeness(form), [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(''); setError('');
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (res.ok && payload?.success) setMsg('Profile saved successfully.');
      else setError(payload?.error?.message || 'Failed to save profile.');
    } catch {
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  function toggleProjectType(type: string) {
    setForm((f) => ({
      ...f,
      typicalProjects: f.typicalProjects.includes(type)
        ? f.typicalProjects.filter((x) => x !== type)
        : [...f.typicalProjects, type],
    }));
  }

  if (loading) return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700">Client workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Company profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Visible to students reviewing your projects. A complete profile attracts better applicants.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="btn-secondary"
        >
          {preview ? 'Edit profile' : 'Preview as student'}
        </button>
      </div>

      {/* Completeness bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Profile completeness</span>
          <span className={`font-semibold ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
            {score}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        {score < 80 && (
          <p className="mt-2 text-xs text-slate-500">
            {score < 50 ? 'Add company description, city and contact to attract students.' :
             'Almost there! Add LinkedIn and typical project types.'}
          </p>
        )}
      </div>

      {preview ? (
        /* ─── Preview mode ─── */
        <div className="card overflow-hidden p-0">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="-mt-8 px-6 pb-6">
            <div className="flex items-end gap-4">
              <div className="h-16 w-16 rounded-2xl border-4 border-white bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 shadow">
                {(form.companyName || 'C')[0]}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-semibold text-slate-900">{form.companyName || 'Your Company Name'}</h2>
                <p className="text-sm text-slate-500">{form.industry || 'Industry'} {form.city ? `· ${form.city}` : ''}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_240px]">
              <div>
                <h3 className="font-semibold text-slate-900">About</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{form.companyDescription || 'No description yet.'}</p>
                {form.typicalProjects.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-slate-900">Typical projects</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.typicalProjects.map((t) => (
                        <span key={t} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {form.companySize && <div className="flex gap-2 text-slate-600"><span>👥</span><span>{form.companySize}</span></div>}
                {form.website && <div className="flex gap-2"><span>🌐</span><a href={form.website} className="text-blue-600 hover:underline truncate" target="_blank" rel="noopener noreferrer">{form.website.replace(/^https?:\/\//, '')}</a></div>}
                {form.contactEmail && <div className="flex gap-2 text-slate-600"><span>✉️</span><span>{form.contactEmail}</span></div>}
                {form.linkedinUrl && <div className="flex gap-2"><span>💼</span><a href={form.linkedinUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">LinkedIn</a></div>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Edit mode ─── */
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {/* Basic info */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-slate-900">Basic information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Company name <span className="text-red-500">*</span></label>
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    placeholder="e.g. Acme Studio"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Almaty"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Company size</label>
                  <select
                    value={form.companySize}
                    onChange={(e) => setForm((f) => ({ ...f, companySize: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  >
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://yourcompany.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Contact email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="hr@yourcompany.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">LinkedIn URL</label>
                  <input
                    value={form.linkedinUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card p-6 space-y-3">
              <h2 className="font-semibold text-slate-900">About the company</h2>
              <textarea
                value={form.companyDescription}
                onChange={(e) => setForm((f) => ({ ...f, companyDescription: e.target.value }))}
                placeholder="Describe your company, its mission, culture, and the kind of projects you work on. Students will read this when deciding whether to apply."
                rows={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-300 focus:outline-none resize-none"
              />
              <p className="text-xs text-slate-400">{form.companyDescription.length}/1000 characters</p>
            </div>

            {/* Typical projects */}
            <div className="card p-6 space-y-3">
              <h2 className="font-semibold text-slate-900">Typical project types</h2>
              <p className="text-sm text-slate-500">Select the types of projects you usually post — helps students understand what to expect.</p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleProjectType(type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      form.typicalProjects.includes(type)
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-slate-900">Profile tips</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {[
                  !form.companyDescription && 'Add a company description to build trust',
                  !form.city && 'Add your city — students prefer local companies',
                  !form.contactEmail && 'Add contact email for direct communication',
                  form.typicalProjects.length === 0 && 'Select typical project types',
                  !form.linkedinUrl && 'Add LinkedIn to verify your company',
                ].filter(Boolean).map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-100 text-amber-600 text-xs flex items-center justify-center">!</span>
                    {tip}
                  </li>
                ))}
                {score >= 80 && (
                  <li className="flex gap-2 text-emerald-600">
                    <span>✓</span> Profile looks great!
                  </li>
                )}
              </ul>
            </div>

            <div className="card p-5">
              <p className="text-xs text-slate-500 mb-3">Students see your profile when reviewing your projects. A complete profile increases applications by up to 3×.</p>
              <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              {msg && <p className="mt-2 text-sm text-emerald-700 text-center">{msg}</p>}
              {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

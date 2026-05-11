'use client';

import { useEffect, useState } from 'react';

export default function ClientProfilePage() {
  const [form, setForm] = useState({
    companyName: '',
    companyDescription: '',
    website: '',
    industry: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/client/profile')
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.success && payload.data) {
          const d = payload.data;
          setForm({
            companyName: d.companyName || '',
            companyDescription: d.companyDescription || '',
            website: d.website || '',
            industry: d.industry || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (res.ok && payload?.success) {
        setMsg('Profile saved successfully.');
      } else {
        setError(payload?.error?.message || 'Failed to save profile.');
      }
    } catch {
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-700">Client workspace</p>
        <h1 className="section-title mt-1">Company profile</h1>
        <p className="muted mt-2">
          Your company profile is visible to students reviewing your projects. A complete profile builds trust and attracts better applicants.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company name</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            placeholder="e.g. Acme Studio"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
          <select
            value={form.industry}
            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="">Select industry</option>
            <option value="Technology">Technology</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Finance">Finance</option>
            <option value="Education">Education</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Media & Entertainment">Media & Entertainment</option>
            <option value="Logistics">Logistics</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Consulting">Consulting</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
          <input
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://yourcompany.com"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">About the company</label>
          <textarea
            value={form.companyDescription}
            onChange={(e) => setForm((f) => ({ ...f, companyDescription: e.target.value }))}
            placeholder="Describe your company, its mission, and the type of projects you typically work on..."
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm resize-none"
          />
          <p className="mt-1 text-xs text-slate-500">
            A strong description helps students understand your culture and expectations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          {msg && <p className="text-sm text-emerald-700">{msg}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </form>
    </div>
  );
}

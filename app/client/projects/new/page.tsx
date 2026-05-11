'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EXPERIENCE_LEVELS = ['JUNIOR', 'MIDDLE', 'SENIOR'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Remote', 'Contract', 'Freelance'];
const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Backend Development', 'Frontend Development',
  'Full-Stack Development', 'Data Science', 'Machine Learning', 'UI/UX Design',
  'DevOps', 'QA & Testing', 'Content Writing', 'Digital Marketing', 'Other',
];

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErrors({});

    const data = new FormData(e.currentTarget);
    const payload = {
      title: data.get('title'),
      description: data.get('description'),
      category: data.get('category'),
      requiredSkills: data.get('requiredSkills'),
      budgetMin: data.get('budgetMin'),
      budgetMax: data.get('budgetMax'),
      deadline: data.get('deadline') || undefined,
      city: data.get('city') || undefined,
      employmentType: data.get('employmentType') || undefined,
      experienceLevel: data.get('experienceLevel') || undefined,
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json?.success) {
        router.push('/client/projects');
      } else {
        setError(json?.error?.message || json?.error || 'Failed to create project.');
      }
    } catch {
      setError('Unexpected error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-700">Client workspace</p>
        <h1 className="section-title mt-1">Post a new project</h1>
        <p className="muted mt-2">
          A well-written project attracts more qualified students. Fill in as many fields as possible.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            required
            placeholder="e.g. Build a landing page for SaaS product"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">Min 5 characters, max 120.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            required
            rows={5}
            placeholder="Describe what needs to be built, deliverables, any technical constraints, and how success is measured..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm resize-none"
          />
          <p className="mt-1 text-xs text-slate-500">Min 20 characters. Be specific — students use this to assess fit.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employment type</label>
            <select
              name="employmentType"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              defaultValue=""
            >
              <option value="">Any</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Required skills <span className="text-red-500">*</span>
          </label>
          <input
            name="requiredSkills"
            required
            placeholder="React, TypeScript, Node.js, MongoDB"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">Comma-separated. These skills are used by ML to rank matching students.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Experience level</label>
            <select
              name="experienceLevel"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              defaultValue=""
            >
              <option value="">Any level</option>
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City (optional)</label>
            <input
              name="city"
              placeholder="Astana, Almaty, Remote..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Budget min ($) <span className="text-red-500">*</span>
            </label>
            <input
              name="budgetMin"
              type="number"
              min="0"
              required
              placeholder="100"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Budget max ($) <span className="text-red-500">*</span>
            </label>
            <input
              name="budgetMax"
              type="number"
              min="0"
              required
              placeholder="500"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
            <input
              name="deadline"
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Publish project'}
          </button>
          <Link href="/client/projects" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>

      <div className="card p-5 border-blue-100 bg-blue-50">
        <p className="text-sm font-semibold text-slate-900">Tips for a great project post</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc pl-4">
          <li>List at least 3–5 specific required skills — they drive ML student matching</li>
          <li>Set a realistic budget range based on the scope</li>
          <li>Describe the expected deliverable format, not just the task</li>
          <li>Mention your preferred communication style and response time</li>
        </ul>
      </div>
    </div>
  );
}

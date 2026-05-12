'use client';

import { useEffect, useState } from 'react';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

type Student = {
  _id: string;
  fullName: string;
  university?: string;
  city?: string;
  skills?: string[];
  experienceLevel?: string;
  about?: string;
  githubUrl?: string;
  portfolioLinks?: string[];
  availabilityStatus?: string;
};

export default function ClientStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ university: '', skill: '', city: '', level: '' });

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(form).filter(([, v]) => v)));
      const res = await fetch(`/api/client/students?${qs}`, { credentials: 'include' });
      const payload = await res.json();
      setStudents(payload?.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const experienceLevels = ['JUNIOR', 'MIDDLE', 'SENIOR'];

  return (
    <div className="space-y-6 py-2">
      <div>
        <p className="text-sm font-medium text-blue-700">Talent search</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Find AITU students</h1>
        <p className="mt-1 text-sm text-slate-500">Browse verified students by university, skills, and experience level.</p>
      </div>

      <div className="card p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">All universities</option>
            {KAZAKHSTAN_UNIVERSITIES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <input
            value={form.skill}
            onChange={(e) => setForm({ ...form, skill: e.target.value })}
            placeholder="Skill (e.g. React, Python)"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="City"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Any level</option>
            {experienceLevels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <button onClick={load} className="btn-primary mt-3 w-full sm:w-auto">
          {loading ? 'Searching...' : 'Search students'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card animate-pulse p-5">
            <div className="h-5 w-1/2 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100" />
            <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />
          </div>
        ))}

        {!loading && students.map((s) => (
          <div key={s._id} className="card p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{s.fullName}</p>
                {s.university && <p className="mt-0.5 text-xs text-slate-500">{s.university}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {s.experienceLevel && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    s.experienceLevel === 'SENIOR' ? 'bg-purple-100 text-purple-700' :
                    s.experienceLevel === 'MIDDLE' ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {s.experienceLevel}
                  </span>
                )}
                {s.availabilityStatus === 'AVAILABLE' && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Available</span>
                )}
              </div>
            </div>

            {s.about && (
              <p className="text-sm text-slate-600 line-clamp-2">{s.about}</p>
            )}

            {s.skills && s.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {s.skills.slice(0, 6).map((skill) => (
                  <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {skill}
                  </span>
                ))}
                {s.skills.length > 6 && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
                    +{s.skills.length - 6}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-auto pt-1 text-xs text-slate-500">
              {s.city && <span>📍 {s.city}</span>}
              {s.githubUrl && (
                <a href={s.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>
              )}
              {s.portfolioLinks && s.portfolioLinks.length > 0 && (
                <a href={s.portfolioLinks[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Portfolio</a>
              )}
            </div>
          </div>
        ))}

        {!loading && students.length === 0 && (
          <div className="col-span-full card p-10 text-center">
            <p className="text-3xl">🔎</p>
            <p className="mt-3 font-semibold text-slate-700">No students found</p>
            <p className="mt-1 text-sm text-slate-500">Try different filters or clear the search.</p>
            <button onClick={() => { setForm({ university: '', skill: '', city: '', level: '' }); setTimeout(load, 0); }} className="btn-primary mt-4">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

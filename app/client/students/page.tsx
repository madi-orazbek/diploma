'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

type Project = { _id: string; title: string };

export default function ClientStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ university: '', skill: '', city: '', level: '' });

  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [inviteState, setInviteState] = useState<Record<string, { open: boolean; busy: boolean; done: string }>>({});
  const [msgBusy, setMsgBusy] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    load();
    fetch('/api/client/projects', { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => setClientProjects((payload?.data || []).map((p: any) => ({ _id: String(p._id), title: p.title }))));
  }, []);

  const experienceLevels = ['JUNIOR', 'MIDDLE', 'SENIOR'];

  async function sendMessage(studentId: string) {
    if (msgBusy[studentId]) return;
    setMsgBusy((prev) => ({ ...prev, [studentId]: true }));
    try {
      const res = await fetch('/api/client/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, projectId: clientProjects[0]?._id || '' }),
      });
      const payload = await res.json();
      if (res.ok && payload?.data?.conversationId) {
        router.push('/client/messages');
      }
    } finally {
      setMsgBusy((prev) => ({ ...prev, [studentId]: false }));
    }
  }

  async function invite(studentId: string, projectId: string) {
    setInviteState((prev) => ({ ...prev, [studentId]: { ...prev[studentId], busy: true, done: '' } }));
    try {
      const res = await fetch('/api/client/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, projectId }),
      });
      const payload = await res.json();
      if (res.ok) {
        setInviteState((prev) => ({ ...prev, [studentId]: { open: false, busy: false, done: 'Invitation sent!' } }));
      } else {
        setInviteState((prev) => ({ ...prev, [studentId]: { ...prev[studentId], busy: false, done: payload?.error || 'Failed to send.' } }));
      }
    } catch {
      setInviteState((prev) => ({ ...prev, [studentId]: { ...prev[studentId], busy: false, done: 'Failed to send.' } }));
    }
  }

  function toggleInviteMenu(studentId: string) {
    setInviteState((prev) => ({
      ...prev,
      [studentId]: { open: !prev[studentId]?.open, busy: false, done: prev[studentId]?.done || '' },
    }));
  }

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

        {!loading && students.map((s) => {
          const ist = inviteState[s._id];
          return (
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

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {s.city && <span>📍 {s.city}</span>}
                {s.githubUrl && (
                  <a href={s.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>
                )}
                {s.portfolioLinks && s.portfolioLinks.length > 0 && (
                  <a href={s.portfolioLinks[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Portfolio</a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-auto pt-2 border-t border-slate-100 relative">
                <a
                  href={`/students/${s._id}`}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  View profile
                </a>
                <button
                  type="button"
                  disabled={msgBusy[s._id]}
                  onClick={() => sendMessage(s._id)}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
                >
                  {msgBusy[s._id] ? 'Opening...' : '✉ Message'}
                </button>

                {clientProjects.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleInviteMenu(s._id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Invite to project ▾
                    </button>
                    {ist?.open && (
                      <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-lg">
                        <p className="px-3 pt-2 text-xs font-semibold text-slate-500">Select a project</p>
                        {clientProjects.map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            disabled={ist.busy}
                            onClick={() => invite(s._id, p._id)}
                            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {p.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {ist?.done && (
                  <span className={`text-xs ${ist.done.includes('sent') ? 'text-emerald-600' : 'text-red-500'}`}>
                    {ist.done}
                  </span>
                )}
              </div>
            </div>
          );
        })}

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

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Stats = {
  activeProjects: number;
  completedProjects: number;
  totalProjects: number;
  totalApplications: number;
  recentProjects: any[];
  recentApplications: any[];
};

type RecommendedStudent = {
  userId: string;
  fullName: string;
  skills: string[];
  experienceLevel: string;
  city: string;
  matchScore: number;
  matchedSkills: string[];
  applicationStatus: string;
};

export default function ClientDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [topProjectId, setTopProjectId] = useState<string | null>(null);
  const [topProjectTitle, setTopProjectTitle] = useState('');
  const [recommended, setRecommended] = useState<RecommendedStudent[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/client/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.success) setStats(payload.data);
      })
      .finally(() => setLoading(false));

    // Load latest project and its recommended students
    fetch('/api/client/projects', { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => {
        const projects: any[] = payload?.data || [];
        const openProject = projects.find((p) => p.status === 'OPEN') || projects[0];
        if (openProject) {
          setTopProjectId(String(openProject._id));
          setTopProjectTitle(openProject.title || '');
          setRecLoading(true);
          fetch(`/api/projects/${openProject._id}/recommend-students`, { credentials: 'include' })
            .then((r) => r.json())
            .then((recPayload) => {
              setRecommended(recPayload?.data || []);
            })
            .finally(() => setRecLoading(false));
        }
      });
  }, []);

  async function inviteStudent(studentId: string) {
    if (!topProjectId) return;
    setInviteStatus((prev) => ({ ...prev, [studentId]: 'Sending...' }));
    try {
      const res = await fetch('/api/client/invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, projectId: topProjectId }),
      });
      const payload = await res.json();
      if (res.ok) {
        setInviteStatus((prev) => ({ ...prev, [studentId]: 'Invited!' }));
      } else {
        setInviteStatus((prev) => ({ ...prev, [studentId]: payload?.error || 'Failed' }));
      }
    } catch {
      setInviteStatus((prev) => ({ ...prev, [studentId]: 'Failed' }));
    }
  }

  const statCards = [
    { label: 'Active projects', value: stats?.activeProjects ?? '—', hint: 'Currently open' },
    { label: 'Received applications', value: stats?.totalApplications ?? '—', hint: 'Total from all projects' },
    { label: 'Completed projects', value: stats?.completedProjects ?? '—', hint: 'Successfully finished' },
    { label: 'Total projects', value: stats?.totalProjects ?? '—', hint: 'All time' },
  ];

  function matchColor(score: number) {
    if (score >= 85) return 'bg-emerald-100 text-emerald-700';
    if (score >= 70) return 'bg-blue-100 text-blue-700';
    if (score >= 50) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  }

  return (
    <div className="space-y-6 py-2">
      <section className="card p-7 md:p-10">
        <p className="text-sm font-medium text-blue-700">Client workspace</p>
        <h1 className="section-title mt-1">Manage your projects and find the best students</h1>
        <p className="muted mt-2 max-w-2xl">
          Post freelance projects, review applicants with ML match scores, and build your team from verified student talent.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/client/projects/new" className="btn-primary">Post a project</Link>
          <Link href="/client/projects" className="btn-secondary">My projects</Link>
          <Link href="/client/students" className="btn-secondary">Find students</Link>
          <Link href="/client/profile" className="btn-secondary">Company profile</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, hint }) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            {loading ? (
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-100" />
            ) : (
              <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent projects</h2>
            <Link href="/client/projects" className="text-sm font-semibold text-blue-700">View all</Link>
          </div>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : stats?.recentProjects?.length ? (
            <div className="mt-4 space-y-3">
              {stats.recentProjects.map((p: any) => (
                <div key={p._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex justify-between items-center gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`status-pill text-xs ${
                      p.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                      'bg-red-100 text-red-600'
                    }`}>{p.status}</span>
                    <Link href={`/client/applicants?projectId=${p._id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                      Applicants
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="font-semibold text-slate-900">No projects yet</p>
              <p className="mt-1 text-sm text-slate-600">Post your first project to start receiving applications.</p>
              <Link href="/client/projects/new" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Post a project</Link>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent applications</h2>
          </div>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : stats?.recentApplications?.length ? (
            <div className="mt-4 space-y-3">
              {stats.recentApplications.map((a: any) => (
                <div key={a._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{a.title || 'Application'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(a.createdAt).toLocaleDateString()} · {a.proposedPrice ? `$${a.proposedPrice}` : 'Price not specified'}
                      </p>
                    </div>
                    <span className={`status-pill text-xs ${
                      a.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                      a.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="font-semibold text-slate-900">No applications yet</p>
              <p className="mt-1 text-sm text-slate-600">Applications will appear here when students apply to your projects.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recommended students for top project */}
      {topProjectId && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recommended students</h2>
              <p className="mt-1 text-sm text-slate-500">
                ML-ranked applicants for <span className="font-medium text-blue-700">{topProjectTitle}</span>
              </p>
            </div>
            <Link href={`/client/applicants?projectId=${topProjectId}`} className="text-sm font-semibold text-blue-700">
              View all applicants
            </Link>
          </div>
          {recLoading ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : recommended.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-lg font-semibold text-slate-900">No applicants yet</p>
              <p className="mt-1 text-sm text-slate-600">Students who apply will be ranked by ML match score here.</p>
              <Link href="/client/students" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Find students
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recommended.slice(0, 6).map((s) => (
                <div key={s.userId} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{s.fullName}</p>
                      {s.city && <p className="text-xs text-slate-500">📍 {s.city}</p>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${matchColor(s.matchScore)}`}>
                      {s.matchScore}%
                    </span>
                  </div>
                  {s.matchedSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.matchedSkills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{skill}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => inviteStudent(s.userId)}
                      disabled={!!inviteStatus[s.userId]}
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {inviteStatus[s.userId] || 'Invite'}
                    </button>
                    <Link
                      href={`/client/messages`}
                      className="flex-1 rounded-lg bg-blue-600 px-2 py-1.5 text-center text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

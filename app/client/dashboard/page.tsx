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

export default function ClientDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/client/stats')
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.success) setStats(payload.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Active projects', value: stats?.activeProjects ?? '—', hint: 'Currently open' },
    { label: 'Received applications', value: stats?.totalApplications ?? '—', hint: 'Total from all projects' },
    { label: 'Completed projects', value: stats?.completedProjects ?? '—', hint: 'Successfully finished' },
    { label: 'Total projects', value: stats?.totalProjects ?? '—', hint: 'All time' },
  ];

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
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : stats?.recentProjects?.length ? (
            <div className="mt-4 space-y-3">
              {stats.recentProjects.map((p: any) => (
                <div key={p._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex justify-between items-center gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`status-pill text-xs ${
                      p.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {p.status}
                    </span>
                    <Link
                      href={`/client/applicants?projectId=${p._id}`}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      View applicants
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="font-semibold text-slate-900">No projects yet</p>
              <p className="mt-1 text-sm text-slate-600">Post your first project to start receiving applications.</p>
              <Link href="/client/projects/new" className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Post a project
              </Link>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent applications</h2>
          </div>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : stats?.recentApplications?.length ? (
            <div className="mt-4 space-y-3">
              {stats.recentApplications.map((a: any) => (
                <div key={a._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{a.title || 'Application'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(a.createdAt).toLocaleDateString()} ·{' '}
                        {a.proposedPrice ? `$${a.proposedPrice}` : 'Price not specified'}
                      </p>
                    </div>
                    <span className={`status-pill text-xs ${
                      a.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                      a.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {a.status}
                    </span>
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

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-slate-900">How ML matching works</p>
            <p className="mt-1 text-xs text-slate-600">
              When you view applicants for a project, students are automatically ranked by an ML-based match score based on skill overlap, experience level, city, and portfolio quality.
            </p>
            <Link href="/about" className="mt-2 inline-block text-xs font-semibold text-blue-700">
              Learn more →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  extractRecommendations,
  JobRecommendation,
  trimDescription,
} from '@/lib/jobRecommendations';
import { ProfileReadiness } from '@/lib/profileReadiness';

const STATUS_META: Record<string, { label: string; color: string }> = {
  SENT:       { label: 'Pending',     color: 'bg-amber-100 text-amber-700' },
  REVIEW:     { label: 'In review',   color: 'bg-blue-100 text-blue-700' },
  ACCEPTED:   { label: 'Accepted ✓',  color: 'bg-emerald-100 text-emerald-700' },
  REJECTED:   { label: 'Rejected',    color: 'bg-red-100 text-red-600' },
  WITHDRAWN:  { label: 'Withdrawn',   color: 'bg-slate-100 text-slate-500' },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, color: 'bg-slate-100 text-slate-600' };
}

function CompletenessBar({ pct }: { pct: number }) {
  const pctClamped = Math.min(100, Math.max(0, pct));
  const color =
    pctClamped >= 80 ? 'bg-emerald-500' :
    pctClamped >= 50 ? 'bg-blue-500' :
    pctClamped >= 30 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Profile completeness</span>
        <span className="font-semibold text-slate-700">{pctClamped}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pctClamped}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500">
        {pctClamped < 40 && 'Add skills, bio, and city to get recommendations'}
        {pctClamped >= 40 && pctClamped < 70 && 'Good start! Add experience and portfolio to stand out'}
        {pctClamped >= 70 && pctClamped < 90 && 'Looking great — add certificates to reach 90%+'}
        {pctClamped >= 90 && 'Excellent profile! You rank in the top applicants'}
      </p>
    </div>
  );
}

export default function StudentDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileReadiness, setProfileReadiness] = useState<ProfileReadiness>({
    completenessPercent: 0,
    missingFields: [],
    recommendationMode: 'ready',
  });
  const [applyStatus, setApplyStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [appRes, recRes, profileRes, msgRes] = await Promise.all([
          fetch('/api/applications', { credentials: 'include' }),
          fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ top_n: 50 }),
            credentials: 'include',
          }),
          fetch('/api/student/profile', { credentials: 'include' }),
          fetch('/api/messages/conversations', { credentials: 'include' }).catch(() => null),
        ]);
        const appData = await appRes.json();
        const recData = await recRes.json();
        const pData = await profileRes.json();
        setApplications(appData?.data || []);
        setRecommendations(extractRecommendations(recData));
        if (recData?.profileReadiness) setProfileReadiness(recData.profileReadiness);
        const pd = pData?.data || {};
        setProfileData(pd);
        // Compute completeness locally if API doesn't return it
        const checks = [
          !!pd.name, !!pd.headline, !!pd.university, !!pd.city,
          !!pd.about, (pd.skills?.length ?? 0) >= 3,
          (pd.languages?.length ?? 0) >= 1, !!pd.github,
          (pd.experience?.length ?? 0) >= 1 || (pd.skills?.length ?? 0) >= 5,
          !!pd.availability,
        ];
        const computed = Math.round((checks.filter(Boolean).length / checks.length) * 100);
        setProfileCompletion(Number(pd.completion || computed));
        if (msgRes) {
          const msgData = await msgRes.json().catch(() => null);
          setRecentMessages((msgData?.data || []).slice(0, 3));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyToProject = async (projectId?: string) => {
    if (!projectId) return;
    setApplyStatus((prev) => ({ ...prev, [projectId]: 'submitting' }));
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId,
          coverLetter: 'I am interested in this project and can deliver quality results on time.',
          proposedPrice: 300,
          estimatedDuration: '14 days',
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setApplyStatus((prev) => ({ ...prev, [projectId]: 'error' }));
        return;
      }
      setApplyStatus((prev) => ({ ...prev, [projectId]: 'applied' }));
    } catch {
      setApplyStatus((prev) => ({ ...prev, [projectId]: 'error' }));
    }
  };

  const sent = applications.length;
  const accepted = applications.filter((x) => x.status === 'ACCEPTED').length;
  const inProgress = applications.filter((x) => x.status === 'SENT' || x.status === 'REVIEW').length;
  const firstName = profileData?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6 py-2">

      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-sm font-medium text-blue-200">Student workspace</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">
            Hey, {firstName}! 👋
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-blue-100">
            Track your applications, explore ML-matched projects, and keep your profile market-ready.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow hover:bg-blue-50"
            >
              🔍 Browse projects
            </Link>
            <Link
              href="/student/profile"
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
            >
              ✏️ Edit profile
            </Link>
            <Link
              href="/student/recommendations"
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
            >
              ⭐ My matches
            </Link>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Applications sent', value: sent, icon: '📤', hint: 'Total submitted' },
          { label: 'Accepted', value: accepted, icon: '✅', hint: 'Confirmed offers' },
          { label: 'In review', value: inProgress, icon: '⏳', hint: 'Active discussions' },
          { label: 'Match score', value: recommendations[0] ? `${Math.round(Number(recommendations[0].matchPercent) || 0)}%` : '—', icon: '🎯', hint: 'Top recommendation' },
        ].map(({ label, value, icon, hint }) => (
          <div key={label} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <span className="text-xl">{icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
          </div>
        ))}
      </section>

      {/* Main content grid */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">

        {/* LEFT: Recommendations */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recommended for you</h2>
            <Link href="/student/recommendations" className="text-sm font-semibold text-blue-600 hover:underline">
              See all →
            </Link>
          </div>
          {profileReadiness.recommendationMode === 'preliminary' && (
            <p className="mt-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              💡 Strengthen your profile to unlock even better matches.
            </p>
          )}
          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : profileReadiness.recommendationMode === 'blocked' ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-lg font-semibold text-slate-900">Profile incomplete</p>
              <p className="mt-1 text-sm text-slate-700">
                Add skills, interests, city, and experience level to unlock ML recommendations.
              </p>
              <Link
                href="/student/profile"
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Complete profile
              </Link>
            </div>
          ) : recommendations.length ? (
            <div className="mt-4 space-y-3">
              {recommendations.slice(0, 4).map((rec: any, idx: number) => {
                const matchPct = Math.round(Number(rec.matchPercent) || 0);
                const matchColor =
                  matchPct >= 80 ? 'bg-emerald-100 text-emerald-700' :
                  matchPct >= 60 ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-500';
                const applied = applyStatus[rec.project_id];
                return (
                  <div key={rec.project_id || `${rec.title}-${idx}`} className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {rec.title || rec.job_title || `Recommendation #${idx + 1}`}
                        </p>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {trimDescription(rec.description || rec.match_reason || 'See details for more information.', 120)}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-400">
                          {[rec.company, rec.city, rec.experience_level].filter(Boolean).join(' · ')}
                        </p>
                        {rec.budgetLabel && (
                          <p className="mt-1 text-xs font-semibold text-slate-700">💰 {rec.budgetLabel}</p>
                        )}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          {rec.project_id ? (
                            <Link
                              href={`/projects/${encodeURIComponent(rec.project_id)}`}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
                            >
                              View details
                            </Link>
                          ) : (
                            <button type="button" disabled className="rounded-lg border px-2.5 py-1 text-xs text-slate-300">
                              View details
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => applyToProject(rec.project_id)}
                            disabled={!rec.project_id || applied === 'applied'}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                              applied === 'applied'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400'
                            }`}
                          >
                            {applied === 'applied' ? '✓ Applied' : applied === 'submitting' ? 'Sending…' : 'Apply now'}
                          </button>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${matchColor}`}>
                        {matchPct > 0 ? `${matchPct}%` : 'New'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-3xl">✨</p>
              <p className="mt-2 font-semibold text-slate-900">No recommendations yet</p>
              <p className="mt-1 text-sm text-slate-500">Add skills, interests, and experience to unlock AI-powered matches.</p>
              <Link href="/student/profile" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Complete my profile
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: Profile + Applications + Quick actions */}
        <div className="space-y-5">

          {/* Profile completeness card */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Profile strength</h3>
              <Link href="/student/profile" className="text-xs font-semibold text-blue-600 hover:underline">
                Edit →
              </Link>
            </div>
            {loading ? (
              <div className="mt-3 h-12 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <CompletenessBar pct={profileCompletion} />
            )}
            {profileData && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  { label: 'Name', done: !!profileData.name },
                  { label: 'Bio', done: !!profileData.about },
                  { label: 'Skills', done: (profileData.skills?.length ?? 0) >= 3 },
                  { label: 'City', done: !!profileData.city },
                  { label: 'University', done: !!profileData.university },
                  { label: 'GitHub', done: !!profileData.github },
                  { label: 'Experience', done: (profileData.experience?.length ?? 0) >= 1 },
                  { label: 'Languages', done: (profileData.languages?.length ?? 0) >= 1 },
                ].map(({ label, done }) => (
                  <span
                    key={label}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? '✓' : '+'} {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '🔍 Find projects', href: '/projects' },
                { label: '✏️ Edit profile', href: '/student/profile' },
                { label: '📬 Messages', href: '/student/messages' },
                { label: '📋 Applications', href: '/student/applications' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent applications */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent applications</h3>
              <Link href="/student/applications" className="text-xs font-semibold text-blue-600 hover:underline">
                All →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                ))
              ) : applications.length ? (
                applications.slice(0, 4).map((app: any) => {
                  const sm = statusMeta(app.status);
                  return (
                    <div key={app._id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {app.projectTitle || 'Project application'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${sm.color}`}>
                        {sm.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="py-2 text-center text-xs text-slate-400">No applications yet</p>
              )}
            </div>
          </div>

          {/* Recent messages */}
          {recentMessages.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Recent messages</h3>
                <Link href="/student/messages" className="text-xs font-semibold text-blue-600 hover:underline">
                  All →
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {recentMessages.map((conv: any) => (
                  <Link
                    key={conv._id}
                    href="/student/messages"
                    className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 hover:bg-blue-50 hover:border-blue-100"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {(conv.employerName || conv.projectTitle || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {conv.employerName || conv.projectTitle || 'Chat'}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {conv.lastMessageText || 'New conversation'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AI insights */}
          <div className="card p-5">
            <h3 className="mb-3 font-semibold text-slate-900">💡 AI insights</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {[
                '📁 Add 2 portfolio cases to increase profile conversion by ~24%.',
                '🔥 React + API projects are in high demand right now.',
                '⚡ Replying within 12 hours improves acceptance rate significantly.',
                '🎯 Students with GitHub profiles get 3× more matches.',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

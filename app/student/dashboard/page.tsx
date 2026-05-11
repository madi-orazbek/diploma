'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  extractRecommendations,
  JobRecommendation,
  trimDescription,
} from '@/lib/jobRecommendations';
import { ProfileReadiness } from '@/lib/profileReadiness';

export default function StudentDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profileReadiness, setProfileReadiness] = useState<ProfileReadiness>({
    completenessPercent: 0,
    missingFields: [],
    recommendationMode: 'ready',
  });
  const [applyStatus, setApplyStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [appRes, recRes, profileRes] = await Promise.all([
          fetch('/api/applications'),
          fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ top_n: 50 })
          }),
          fetch('/api/student/profile')
        ]);
        const appData = await appRes.json();
        const recData = await recRes.json();
        const profileData = await profileRes.json();
        setApplications(appData?.data || []);
        setRecommendations(extractRecommendations(recData));
        if (recData?.profileReadiness) {
          setProfileReadiness(recData.profileReadiness);
        }
        setProfileCompletion(Number(profileData?.data?.completion || 0));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sent = applications.length;
  const accepted = applications.filter((x) => x.status === 'ACCEPTED').length;
  const inProgress = applications.filter((x) => x.status === 'SENT').length;

  const applyToProject = async (projectId?: string) => {
    if (!projectId) return;
    setApplyStatus((prev) => ({ ...prev, [projectId]: 'Submitting...' }));
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          coverLetter:
            'I am interested in this project and can deliver quality results on time.',
          proposedPrice: 300,
          estimatedDuration: '14 days',
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setApplyStatus((prev) => ({
          ...prev,
          [projectId]: payload?.error?.message || payload?.error || 'Failed to apply.',
        }));
        return;
      }
      setApplyStatus((prev) => ({ ...prev, [projectId]: 'Application sent successfully.' }));
    } catch (error: any) {
      setApplyStatus((prev) => ({
        ...prev,
        [projectId]: error?.message || 'Failed to apply.',
      }));
    }
  };
  return (
    <div className="space-y-6 py-2">
      <section className="card p-7 md:p-10">
        <p className="text-sm font-medium text-blue-700">Student workspace</p>
        <h1 className="section-title mt-1">Welcome back, build your next project milestone</h1>
        <p className="muted mt-2 max-w-2xl">
          Track applications, explore recommendation matches, and keep your profile market-ready.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/projects" className="btn-primary">Browse projects</Link>
          <Link href="/student/profile" className="btn-secondary">Update profile</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Applications sent', sent, 'Total submitted'],
          ['Accepted', accepted, 'Confirmed opportunities'],
          ['In progress', inProgress, 'Active discussions'],
          ['Profile completion', `${profileCompletion}%`, 'Improve visibility']
        ].map(([title, value, hint]) => (
          <div key={title} className="card p-5">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recommended for you</h2>
            <Link href="/student/recommendations" className="text-sm font-semibold text-blue-700">See all</Link>
          </div>
          {profileReadiness.recommendationMode === 'preliminary' && (
            <p className="mt-1 text-xs text-blue-700">
              Your recommendations are ready. Strengthening your profile can unlock even better matches.
            </p>
          )}
          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => <div key={idx} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : profileReadiness.recommendationMode === 'blocked' ? (
            <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-6">
              <p className="text-lg font-semibold text-slate-900">Your profile is incomplete</p>
              <p className="mt-1 text-sm text-slate-700">
                Add skills, interests, city and experience level to unlock personalized ML recommendations.
              </p>
              <p className="mt-2 text-xs text-slate-600">Use the AI assistant to get a personalized profile improvement plan.</p>
              <Link href="/student/profile" className="mt-4 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Complete profile
              </Link>
            </div>
          ) : recommendations.length ? (
            <div className="mt-4 space-y-3">
              {recommendations.slice(0, 4).map((rec: any, idx: number) => (
                <div key={rec.project_id || `${rec.title || 'project'}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{rec.title || rec.job_title || `Recommendation #${idx + 1}`}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {trimDescription(rec.description || rec.match_reason || 'Match explanation is not available yet.', 120)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {rec.company || 'Company not specified'} · {rec.city || 'Remote/Not specified'} · {rec.experience_level || 'Experience n/a'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {rec.project_id ? (
                          <Link
                            href={`/projects/${encodeURIComponent(rec.project_id)}`}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            View details
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-400"
                            title="Project ID is not available for this recommendation."
                          >
                            View details
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => applyToProject(rec.project_id)}
                          disabled={!rec.project_id}
                          className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white disabled:bg-slate-300"
                          title={!rec.project_id ? 'Project ID is not available for this recommendation.' : 'Apply now'}
                        >
                          Apply now
                        </button>
                      </div>
                      {rec.project_id && applyStatus[rec.project_id] && (
                        <p className="mt-1 text-xs text-slate-500">{applyStatus[rec.project_id]}</p>
                      )}
                    </div>
                    <span className="status-pill bg-blue-100 text-blue-700">
                      {Number.isFinite(Number(rec.matchPercent))
                        ? `${Math.round(Number(rec.matchPercent))}% match`
                        : 'Low-confidence match'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-2xl">✨</p>
              <p className="mt-2 font-semibold text-slate-900">No recommendations yet</p>
              <p className="mt-1 text-sm text-slate-600">Complete your profile and add skills to unlock better matches.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900">AI insights</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="rounded-xl bg-slate-50 p-3">Add 2 portfolio cases to increase profile conversion by ~24%.</li>
              <li className="rounded-xl bg-slate-50 p-3">Projects with React + API integration currently have strong demand.</li>
              <li className="rounded-xl bg-slate-50 p-3">Reply within 12 hours to improve acceptance probability.</li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {applications.slice(0, 3).map((x: any) => (
                <div key={x._id} className="rounded-xl border border-slate-200 p-3">
                  Application <span className="font-semibold text-slate-900">{x.status}</span> · {new Date(x.createdAt).toLocaleDateString()}
                </div>
              ))}
              {!applications.length && <p className="text-slate-500">No activity yet. Start from project catalog.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

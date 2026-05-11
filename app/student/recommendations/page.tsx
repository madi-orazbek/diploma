'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  extractRecommendations,
  JobRecommendation,
  trimDescription,
} from '@/lib/jobRecommendations';
import { ProfileReadiness } from '@/lib/profileReadiness';

export default function RecommendationsPage() {
  const [items, setItems] = useState<JobRecommendation[]>([]);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<'match' | 'title'>('match');
  const [profileReadiness, setProfileReadiness] = useState<ProfileReadiness>({
    completenessPercent: 0,
    missingFields: [],
    recommendationMode: 'ready',
  });
  const [applyStatus, setApplyStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ top_n: 50 })
    })
      .then((r) => r.json())
      .then((payload) => {
        if (payload?.error) throw new Error(payload.error);
        setItems(extractRecommendations(payload));
        if (payload?.profileReadiness) {
          setProfileReadiness(payload.profileReadiness);
        }
      })
      .catch((err: any) => {
        console.error('RECOMMENDATIONS PAGE ERROR:', err);
        setError(err?.message || 'Could not load recommendations');
      });
  }, []);

  const rendered = useMemo(() => {
    const arr = [...items];
    if (sort === 'title') {
      arr.sort((a, b) =>
        String(a.title || a.job_title || '').localeCompare(
          String(b.title || b.job_title || '')
        )
      );
    } else {
      arr.sort((a, b) => Number(b.matchPercent || b.final_score || 0) - Number(a.matchPercent || a.final_score || 0));
    }
    return arr;
  }, [items, sort]);

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Recommended Projects</h1>
        <select className="rounded px-3 py-1 border" value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="match">Sort by match score</option>
          <option value="title">Sort by title</option>
        </select>
      </div>

      {profileReadiness.recommendationMode === 'preliminary' && (
        <div className="card p-3 text-sm text-blue-700">
          These recommendations are available now, and your results can improve further with a stronger profile.
        </div>
      )}
      {error && <div className="card p-3 text-sm text-red-600">{error}</div>}

      {!error && profileReadiness.recommendationMode === 'blocked' && (
        <div className="card p-6 text-center">
          <p className="text-xl font-semibold text-slate-900">Complete your profile to get personalized recommendations</p>
          <p className="mt-2 text-sm text-slate-600">
            I can help you strengthen your profile with targeted improvements for better matches.
          </p>
          <Link
            href="/student/profile"
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Complete profile
          </Link>
        </div>
      )}

      {!error && profileReadiness.recommendationMode !== 'blocked' && rendered.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-2xl">🧭</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">No matching recommendations found</h2>
          <p className="mt-1 text-sm text-slate-600">Try adding more skills or broadening your city filter in profile settings.</p>
        </div>
      )}

      {profileReadiness.recommendationMode !== 'blocked' && rendered.map((i, idx) => (
        <div key={i.project_id || `${i.title || 'project'}-${idx}`} className="card p-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-semibold">{i.title || i.job_title || `Recommendation #${idx + 1}`}</h3>
            {Number.isFinite(Number(i.matchPercent)) ? (
              <span className="text-brand font-semibold">
                {Math.round(Number(i.matchPercent))}% match
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {profileReadiness.recommendationMode === 'preliminary'
                  ? 'Preliminary'
                  : profileReadiness.recommendationMode === 'blocked'
                    ? 'Profile incomplete'
                    : 'Low-confidence match'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {trimDescription(i.description || i.text || 'No description provided.', 160)}
          </p>
          <div className="mt-2 grid gap-1 text-xs text-slate-500 md:grid-cols-4">
            <p>City: {i.city || 'Not specified'}</p>
            <p>Employment: {i.employment_type || 'Not specified'}</p>
            <p>Experience: {i.experience_level || 'Not specified'}</p>
            <p>Company: {i.company || 'Not specified'}</p>
          </div>
          <div className="mt-1 grid gap-1 text-xs text-slate-500 md:grid-cols-2">
            <p>Category: {i.category || 'Not specified'}</p>
            <p>
              Budget: {Number.isFinite(Number(i.budget_min)) || Number.isFinite(Number(i.budget_max))
                ? `${i.budget_min ?? 0} - ${i.budget_max ?? 0}`
                : 'Not specified'}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Family: <span className="font-medium text-slate-700">{i.predicted_family || 'Not specified'}</span>
          </p>
          <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600">
            {trimDescription(i.match_reason || 'Match explanation is not available yet.', 180)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {i.project_id ? (
              <Link
                href={`/projects/${encodeURIComponent(i.project_id)}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                View details
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400"
                title="Project ID is not available for this recommendation."
              >
                View details
              </button>
            )}
            <button
              type="button"
              onClick={() => applyToProject(i.project_id)}
              disabled={!i.project_id}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-slate-300"
              title={!i.project_id ? 'Project ID is not available for this recommendation.' : 'Apply now'}
            >
              Apply now
            </button>
          </div>
          {i.project_id && applyStatus[i.project_id] && (
            <p className="mt-2 text-xs text-slate-500">{applyStatus[i.project_id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

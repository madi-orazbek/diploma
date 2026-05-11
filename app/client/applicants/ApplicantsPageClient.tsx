'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Applicant = {
  userId: string;
  applicationId: string;
  applicationStatus: string;
  coverLetter: string;
  proposedPrice: number | null;
  estimatedDuration: string;
  appliedAt: string | null;
  fullName: string;
  email: string;
  skills: string[];
  experienceLevel: string;
  city: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioLinks: string[];
  about: string;
  matchScore: number;
  matchedSkills: string[];
};

function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-emerald-100 text-emerald-700' :
    score >= 55 ? 'bg-blue-100 text-blue-700' :
    'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {score}% match
    </span>
  );
}

export default function ApplicantsPageClient() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId') ?? '';

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/recommend-students`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || 'Failed to load applicants');
      setApplicants(payload.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load applicants');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function setStatus(applicationId: string, action: 'ACCEPT' | 'REJECT') {
    setActionBusy(applicationId);
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await load();
    } finally {
      setActionBusy(null);
    }
  }

  const statusColor: Record<string, string> = {
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-600',
    WITHDRAWN: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-blue-700">Client workspace</p>
        <h1 className="section-title mt-0.5">Applicants</h1>
        {projectId && (
          <p className="muted mt-1">
            Students are ranked by ML match score based on skill overlap, experience, city, and portfolio signals.
          </p>
        )}
      </div>

      {!projectId && (
        <div className="card p-8 text-center">
          <p className="font-semibold text-slate-900">No project selected</p>
          <p className="mt-1 text-sm text-slate-600">
            Open this page from a specific project to see its applicants.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {!loading && projectId && !error && applicants.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-xl font-semibold text-slate-900">No applicants yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Once students apply to your project, they will appear here ranked by ML match score.
          </p>
        </div>
      )}

      {!loading && applicants.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} · sorted by ML match score
          </p>

          {applicants.map((a, idx) => (
            <div key={a.userId} className="card p-5">
              <div className="flex flex-wrap justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{a.fullName}</p>
                      <MatchBadge score={a.matchScore} />
                      <span className={`status-pill text-xs ${statusColor[a.applicationStatus] || 'bg-slate-100 text-slate-500'}`}>
                        {a.applicationStatus}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      {a.experienceLevel && <span>Level: {a.experienceLevel}</span>}
                      {a.city && <span>City: {a.city}</span>}
                      {a.proposedPrice != null && <span>Proposed: ${a.proposedPrice}</span>}
                      {a.estimatedDuration && <span>Duration: {a.estimatedDuration}</span>}
                      {a.appliedAt && <span>Applied: {new Date(a.appliedAt).toLocaleDateString()}</span>}
                    </div>

                    {a.matchedSkills.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 mb-1">Matched skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {a.matchedSkills.map((s) => (
                            <span key={s} className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {a.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {a.skills.filter((s) => !a.matchedSkills.includes(s)).slice(0, 5).map((s) => (
                          <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-2">
                  {a.applicationStatus === 'SENT' && (
                    <>
                      <button
                        onClick={() => setStatus(a.applicationId, 'ACCEPT')}
                        disabled={actionBusy === a.applicationId}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setStatus(a.applicationId, 'REJECT')}
                        disabled={actionBusy === a.applicationId}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setExpanded(expanded === a.userId ? null : a.userId)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {expanded === a.userId ? 'Collapse' : 'View details'}
                  </button>
                </div>
              </div>

              {expanded === a.userId && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  {a.coverLetter && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Cover letter</p>
                      <p className="text-sm text-slate-600 rounded-xl bg-slate-50 p-3">{a.coverLetter}</p>
                    </div>
                  )}

                  {a.about && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">About</p>
                      <p className="text-sm text-slate-600">{a.about}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs">
                    {a.email && (
                      <span className="text-slate-600">Email: <span className="font-medium">{a.email}</span></span>
                    )}
                    {a.githubUrl && (
                      <a
                        href={a.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-700 hover:underline"
                      >
                        GitHub
                      </a>
                    )}
                    {a.linkedinUrl && (
                      <a
                        href={a.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-700 hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                    {a.portfolioLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-700 hover:underline"
                      >
                        Portfolio {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

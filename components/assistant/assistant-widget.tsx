'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

type Role = 'STUDENT' | 'CLIENT' | 'ADMIN' | null;

type JobCard = {
  projectId: string;
  title: string;
  city: string;
  employmentType: string;
  experienceLevel: string;
  category: string;
  budgetLabel: string;
  matchScore: number;
  explanationSummary: string;
  matchedSignals: string[];
  missingSignals: string[];
};

type ProfilePatch = {
  about?: string;
  skills?: string[];
};

type ChatItem = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  jobs?: JobCard[];
  tips?: string[];
  profilePatch?: ProfilePatch;
};

const STUDENT_QUICK_ACTIONS = [
  'Find best projects for me',
  'Why is this project recommended?',
  'Improve my profile',
  'Help me write a cover letter',
  'What skills should I learn next?',
  'Show high-match projects',
  'Show backend projects',
  'Show frontend projects',
];

const CLIENT_QUICK_ACTIONS = [
  'Find best students for my project',
  'Explain why this student matches',
  'Improve my project description',
  'Write an invitation message',
  'Compare applicants',
  'How to attract better candidates?',
  'What budget should I set?',
  'How does ML matching work?',
];

const STUDENT_EMPTY = 'Hi! I\'m your AI Career Assistant. I can help you find matching projects, explain recommendations, improve your profile, and write cover letters. What would you like to do?';
const CLIENT_EMPTY = 'Hi! I\'m your Project Assistant. I can help you find the best student candidates, improve your project posts, write invitation messages, and understand ML matching scores. How can I help?';

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [applyStatus, setApplyStatus] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<ChatItem[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.resolve(null)))
      .then((payload) => {
        const r: Role = payload?.data?.role ?? null;
        setRole(r);
        const emptyText = r === 'CLIENT' ? CLIENT_EMPTY : STUDENT_EMPTY;
        setHistory([{ id: uid(), role: 'assistant', text: emptyText }]);
        setRoleLoaded(true);
      })
      .catch(() => {
        // Network error — show student view, do not block the widget
        setHistory([{ id: uid(), role: 'assistant', text: STUDENT_EMPTY }]);
        setRoleLoaded(true);
      });
  }, []);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, busy]);

  const apiEndpoint = role === 'CLIENT' ? '/api/assistant/client' : '/api/assistant/chat';
  const quickActions = role === 'CLIENT' ? CLIENT_QUICK_ACTIONS : STUDENT_QUICK_ACTIONS;
  const title = role === 'CLIENT' ? 'Project Assistant' : 'AI Career Assistant';
  const subtitle = role === 'CLIENT'
    ? 'Project posting, student matching, and applicant evaluation'
    : 'Job discovery, recommendation explanations, and profile improvement';

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || busy) return;

    // Still loading auth status — wait silently
    if (!roleLoaded) return;

    if (!role) {
      setHistory((prev) => [
        ...prev,
        { id: uid(), role: 'user', text: trimmed },
        { id: uid(), role: 'assistant', text: 'Please sign in to use the full assistant. You can browse open projects without an account.' },
      ]);
      return;
    }

    setBusy(true);
    setError('');
    setHistory((prev) => [...prev, { id: uid(), role: 'user', text: trimmed }]);
    setPrompt('');

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Assistant request failed.');
      }
      const data = payload.data;
      setHistory((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          text: data.reply || 'I could not generate a response right now.',
          jobs: data.jobs || [],
          tips: data.tips || data.profileTips || [],
          profilePatch: data.profilePatch,
        },
      ]);
    } catch (e: any) {
      setError(e?.message || 'Assistant request failed.');
      setHistory((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', text: 'I could not complete that request. Please try again.' },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const applyToProject = async (projectId?: string) => {
    if (!projectId) return;
    setApplyStatus((prev) => ({ ...prev, [projectId]: 'Submitting application...' }));
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          coverLetter: 'I am excited about this opportunity and can deliver high-quality work aligned with your project goals.',
          proposedPrice: 300,
          estimatedDuration: '14 days',
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setApplyStatus((prev) => ({ ...prev, [projectId]: payload?.error?.message || payload?.error || 'Failed to apply.' }));
        return;
      }
      setApplyStatus((prev) => ({ ...prev, [projectId]: 'Application sent successfully.' }));
    } catch (e: any) {
      setApplyStatus((prev) => ({ ...prev, [projectId]: e?.message || 'Failed to apply.' }));
    }
  };

  const applyProfilePatch = async (patch?: ProfilePatch) => {
    if (!patch) return;
    try {
      setBusy(true);
      setError('');
      const currentRes = await fetch('/api/student/profile');
      const currentPayload = await currentRes.json();
      if (!currentRes.ok || !currentPayload?.success) throw new Error('Could not load current profile.');
      const current = currentPayload.data || {};
      const mergedSkills = Array.from(new Set([...(current.skills || []), ...(patch.skills || [])]));
      const saveRes = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, about: patch.about ?? current.about ?? '', skills: mergedSkills }),
      });
      const savePayload = await saveRes.json();
      if (!saveRes.ok || !savePayload?.success) throw new Error(savePayload?.error || 'Failed to save profile suggestions.');
      setHistory((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', text: 'Done — I applied the suggested profile updates. You can review them on your profile page.' },
      ]);
    } catch (e: any) {
      setError(e?.message || 'Failed to apply profile suggestions.');
    } finally {
      setBusy(false);
    }
  };

  const renderedQuickActions = useMemo(() => quickActions, [role]);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="card mb-3 w-[420px] max-w-[calc(100vw-24px)] overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const emptyText = role === 'CLIENT' ? CLIENT_EMPTY : STUDENT_EMPTY;
                  setHistory([{ id: uid(), role: 'assistant', text: emptyText }]);
                }}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-white"
                title="Clear chat"
              >
                Clear
              </button>
            </div>
          </div>

          <div ref={viewportRef} className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-3">
            {history.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className={`max-w-[95%] rounded-2xl px-3 py-2 text-sm ${item.role === 'assistant' ? 'bg-slate-100 text-slate-700' : 'ml-auto bg-blue-600 text-white'}`}>
                  {item.text}
                </div>

                {item.role === 'assistant' && !!item.tips?.length && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-slate-700">
                    <p className="mb-1 font-semibold">Tips</p>
                    <ul className="list-disc space-y-1 pl-5">
                      {item.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.role === 'assistant' && item.profilePatch && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border px-2 py-1 text-xs font-semibold"
                      onClick={() => applyProfilePatch(item.profilePatch)}
                    >
                      Apply suggested profile updates
                    </button>
                  </div>
                )}

                {item.role === 'assistant' && !!item.jobs?.length && (
                  <div className="space-y-2">
                    {item.jobs.map((job) => (
                      <div key={job.projectId || `${job.title}-${job.city}`} className="rounded-xl border p-3">
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {job.city} · {job.employmentType} · {job.experienceLevel} · {job.category}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Budget: {job.budgetLabel}</p>
                        <p className="mt-1 text-xs font-semibold text-blue-700">Match score: {job.matchScore}</p>
                        <p className="mt-2 text-xs text-slate-700">{job.explanationSummary}</p>
                        {!!job.matchedSignals.length && (
                          <p className="mt-1 text-xs text-emerald-700">Strong signals: {job.matchedSignals.join(' · ')}</p>
                        )}
                        {!!job.missingSignals.length && (
                          <p className="mt-1 text-xs text-amber-700">Improve match: {job.missingSignals.join(' · ')}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.projectId ? (
                            <Link href={`/projects/${encodeURIComponent(job.projectId)}`} className="rounded-md border px-2 py-1 text-xs font-semibold">
                              View details
                            </Link>
                          ) : (
                            <button type="button" disabled className="rounded-md border px-2 py-1 text-xs text-slate-400">
                              View details
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => applyToProject(job.projectId)}
                            disabled={!job.projectId}
                            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white disabled:bg-slate-300"
                          >
                            Apply now
                          </button>
                          <button
                            type="button"
                            className="rounded-md border px-2 py-1 text-xs"
                            onClick={() => ask(`Why was ${job.title} recommended to me?`)}
                          >
                            Why recommended?
                          </button>
                        </div>
                        {job.projectId && applyStatus[job.projectId] && (
                          <p className="mt-1 text-xs text-slate-500">{applyStatus[job.projectId]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {busy && <div className="text-xs text-slate-500">Assistant is thinking...</div>}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            {!!error && <p className="mb-2 text-xs text-red-600">{error}</p>}

            {!role && roleLoaded && (
              <p className="mb-2 text-xs text-slate-500">
                <Link href="/signin" className="font-semibold text-blue-700 hover:underline">Sign in</Link>{' '}
                to unlock personalized assistant features.
              </p>
            )}

            <div className="mb-2 flex flex-wrap gap-2">
              {renderedQuickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => ask(action)}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  {action}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    ask(prompt);
                  }
                }}
                placeholder={role === 'CLIENT' ? 'Ask about posting projects or evaluating applicants...' : 'Ask for jobs, recommendations, or profile improvements...'}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none"
              />
              <button type="button" onClick={() => ask(prompt)} disabled={busy} className="btn-primary disabled:opacity-50">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((x) => !x)}
        className="btn-primary rounded-full px-5 py-3 shadow-lg"
      >
        {open ? 'Close assistant' : role === 'CLIENT' ? 'Project assistant' : 'AI career assistant'}
      </button>
    </div>
  );
}

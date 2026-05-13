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
  { label: '🎯 Best projects for me', prompt: 'Find best projects for me' },
  { label: '✍️ Write cover letter', prompt: 'Help me write a cover letter' },
  { label: '📈 Improve my profile', prompt: 'Improve my profile' },
  { label: '🔍 Why recommended?', prompt: 'Why is this project recommended?' },
  { label: '🚀 Skills to learn', prompt: 'What skills should I learn next?' },
  { label: '⚡ High-match projects', prompt: 'Show high-match projects' },
  { label: '🖥️ Backend projects', prompt: 'Show backend projects' },
  { label: '🎨 Frontend projects', prompt: 'Show frontend projects' },
];

const CLIENT_QUICK_ACTIONS = [
  { label: '🎯 Best students', prompt: 'Find best students for my project' },
  { label: '✍️ Write invitation', prompt: 'Write an invitation message' },
  { label: '📋 Improve post', prompt: 'Improve my project description' },
  { label: '🔍 Why this student?', prompt: 'Explain why this student matches' },
  { label: '⚖️ Compare applicants', prompt: 'Compare applicants' },
  { label: '💰 Set right budget', prompt: 'What budget should I set?' },
  { label: '🧲 Attract candidates', prompt: 'How to attract better candidates?' },
  { label: '🤖 How ML works?', prompt: 'How does ML matching work?' },
];

const STUDENT_EMPTY = "Hi! I'm your AI Career Assistant 🎓\n\nI can help you:\n• Find matching projects\n• Write cover letters\n• Improve your profile\n• Explain recommendations\n\nWhat would you like to do?";
const CLIENT_EMPTY = "Hi! I'm your Project Assistant 🏢\n\nI can help you:\n• Find the best student candidates\n• Write invitation messages\n• Improve project descriptions\n• Explain ML matching scores\n\nHow can I help?";

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function TypingIndicator() {
  return (
    <div className="flex max-w-[80%] items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
      <span className="inline-flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
      </span>
    </div>
  );
}

function MessageBubble({ item, onApply, onWhyRecommended, onApplyProfile, applyStatus }: {
  item: ChatItem;
  onApply: (id?: string) => void;
  onWhyRecommended: (title: string) => void;
  onApplyProfile: (patch?: ProfilePatch) => void;
  applyStatus: Record<string, string>;
}) {
  const isUser = item.role === 'user';
  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-blue-600 text-white shadow-sm'
            : 'rounded-bl-sm bg-slate-100 text-slate-800'
        }`}
      >
        {item.text}
      </div>

      {!isUser && !!item.tips?.length && (
        <div className="w-full max-w-[88%] rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-slate-700">
          <p className="mb-1.5 font-semibold text-blue-800">💡 Tips</p>
          <ul className="list-disc space-y-1 pl-4">
            {item.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {!isUser && item.profilePatch && (
        <button
          type="button"
          className="max-w-[88%] rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          onClick={() => onApplyProfile(item.profilePatch)}
        >
          ✅ Apply suggested profile updates
        </button>
      )}

      {!isUser && !!item.jobs?.length && (
        <div className="w-full max-w-[88%] space-y-2">
          {item.jobs.map((job) => (
            <div key={job.projectId || `${job.title}-${job.city}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  {job.matchScore}% match
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {[job.city, job.employmentType, job.experienceLevel, job.category].filter(Boolean).join(' · ')}
              </p>
              {job.budgetLabel && (
                <p className="mt-0.5 text-xs font-semibold text-slate-700">💰 {job.budgetLabel}</p>
              )}
              {job.explanationSummary && (
                <p className="mt-1.5 text-xs text-slate-600">{job.explanationSummary}</p>
              )}
              {!!job.matchedSignals?.length && (
                <p className="mt-1 text-[11px] text-emerald-700">✅ {job.matchedSignals.join(' · ')}</p>
              )}
              {!!job.missingSignals?.length && (
                <p className="mt-0.5 text-[11px] text-amber-700">⚠️ {job.missingSignals.join(' · ')}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.projectId ? (
                  <Link
                    href={`/projects/${encodeURIComponent(job.projectId)}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </Link>
                ) : (
                  <button type="button" disabled className="rounded-lg border px-2.5 py-1 text-[11px] text-slate-300">
                    View
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onApply(job.projectId)}
                  disabled={!job.projectId || !!applyStatus[job.projectId]}
                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {applyStatus[job.projectId] ? '✓ Applied' : 'Apply'}
                </button>
                <button
                  type="button"
                  onClick={() => onWhyRecommended(job.title)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                >
                  Why?
                </button>
              </div>
              {job.projectId && applyStatus[job.projectId] && (
                <p className="mt-1 text-[11px] text-slate-500">{applyStatus[job.projectId]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [applyStatus, setApplyStatus] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<ChatItem[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
        setHistory([{ id: uid(), role: 'assistant', text: STUDENT_EMPTY }]);
        setRoleLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!busy) {
      viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [history]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [busy]);

  // Focus input when opening
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const apiEndpoint = role === 'CLIENT' ? '/api/assistant/client' : '/api/assistant/chat';
  const quickActions = role === 'CLIENT' ? CLIENT_QUICK_ACTIONS : STUDENT_QUICK_ACTIONS;
  const title = role === 'CLIENT' ? '🏢 Project Assistant' : '🎓 AI Career Assistant';

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    if (!roleLoaded) return;

    setMinimized(false);

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
    setApplyStatus((prev) => ({ ...prev, [projectId]: 'submitting' }));
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
        setApplyStatus((prev) => ({ ...prev, [projectId]: 'error' }));
        return;
      }
      setApplyStatus((prev) => ({ ...prev, [projectId]: 'applied' }));
    } catch {
      setApplyStatus((prev) => ({ ...prev, [projectId]: 'error' }));
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
        { id: uid(), role: 'assistant', text: '✅ Done — profile updates applied. Review them on your profile page.' },
      ]);
    } catch (e: any) {
      setError(e?.message || 'Failed to apply profile suggestions.');
    } finally {
      setBusy(false);
    }
  };

  const clearChat = () => {
    const emptyText = role === 'CLIENT' ? CLIENT_EMPTY : STUDENT_EMPTY;
    setHistory([{ id: uid(), role: 'assistant', text: emptyText }]);
    setError('');
  };

  if (!open) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span className="text-base">🤖</span>
          {role === 'CLIENT' ? 'Project assistant' : 'AI assistant'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Main chat window */}
      <div
        className="card flex flex-col overflow-hidden shadow-2xl transition-all duration-200"
        style={{
          width: 'min(420px, calc(100vw - 24px))',
          maxHeight: minimized ? 0 : 'min(600px, calc(100vh - 100px))',
          opacity: minimized ? 0 : 1,
          pointerEvents: minimized ? 'none' : 'auto',
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{title}</p>
            <p className="text-[11px] text-blue-200">Powered by AI · always available</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={clearChat}
              className="rounded px-2 py-1 text-[11px] font-medium text-blue-200 hover:bg-blue-500 hover:text-white"
              title="Clear chat"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setMinimized((x) => !x)}
              className="flex h-7 w-7 items-center justify-center rounded text-blue-200 hover:bg-blue-500 hover:text-white"
              title="Minimize"
            >
              —
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={viewportRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          style={{ minHeight: 200, maxHeight: 'calc(min(600px, calc(100vh - 100px)) - 160px)' }}
        >
          {history.map((item) => (
            <MessageBubble
              key={item.id}
              item={item}
              onApply={applyToProject}
              onWhyRecommended={(title) => ask(`Why was "${title}" recommended to me?`)}
              onApplyProfile={applyProfilePatch}
              applyStatus={applyStatus}
            />
          ))}
          {busy && <TypingIndicator />}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          {!!error && (
            <p className="mb-2 flex items-start gap-1 text-xs text-red-600">
              <span>⚠️</span> {error}
            </p>
          )}

          {!role && roleLoaded && (
            <p className="mb-2 text-xs text-slate-500">
              <Link href="/signin" className="font-semibold text-blue-600 hover:underline">Sign in</Link>{' '}
              to unlock personalized features.
            </p>
          )}

          {/* Quick actions — horizontally scrollable */}
          <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quickActions.map((action) => (
              <button
                key={action.prompt}
                type="button"
                onClick={() => ask(action.prompt)}
                disabled={busy}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask(prompt);
                }
              }}
              placeholder={role === 'CLIENT' ? 'Ask about candidates or project posting…' : 'Ask for jobs, tips, or profile help…'}
              disabled={busy}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={() => ask(prompt)}
              disabled={busy || !prompt.trim()}
              className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {busy ? '…' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* FAB row — toggle + minimize restore */}
      <div className="flex items-center gap-2">
        {minimized && (
          <button
            onClick={() => setMinimized(false)}
            className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-lg hover:bg-blue-50"
          >
            <span>🤖</span> Open chat
          </button>
        )}
        <button
          onClick={() => {
            if (open && !minimized) {
              setOpen(false);
            } else {
              setOpen(true);
              setMinimized(false);
            }
          }}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span className="text-base">🤖</span>
          {open && !minimized ? 'Close' : role === 'CLIENT' ? 'Project assistant' : 'AI assistant'}
        </button>
      </div>
    </div>
  );
}

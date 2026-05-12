'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type StudentInfo = { fullName?: string; email?: string; university?: string };
type ApplicationInfo = { title?: string; coverLetter?: string; status?: string };

type Conversation = {
  _id: string;
  applicationId?: string;
  itemId?: string;
  itemType?: string;
  updatedAt?: string;
  student?: StudentInfo;
  application?: ApplicationInfo;
};

type ChatMessage = {
  _id: string;
  senderId?: string;
  senderRole?: string;
  text: string;
  createdAt: string;
};

export default function ClientMessagesClient() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams?.get('conversationId') || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [convLoading, setConvLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadConversations() {
    setConvLoading(true);
    try {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      const payload = await res.json();
      const rows: Conversation[] = payload?.data || [];
      setConversations(rows);
      const nextId = requestedConversationId || rows[0]?._id || '';
      setActiveId(nextId);
    } finally {
      setConvLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    if (!conversationId) { setMessages([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, { credentials: 'include' });
      const payload = await res.json();
      setMessages(payload?.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { if (activeId) loadMessages(activeId); }, [activeId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!activeId || !text.trim()) return;
    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, text: text.trim() }),
      });
      setText('');
      await loadMessages(activeId);
    } finally {
      setSending(false);
    }
  }

  const activeConversation = useMemo(
    () => conversations.find((x) => x._id === activeId) || null,
    [conversations, activeId]
  );

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500">Conversations with student applicants</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid h-[calc(100vh-200px)] min-h-[580px] gap-4 lg:grid-cols-[340px_1fr]">
        {/* Sidebar */}
        <aside className="card flex flex-col overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="font-semibold text-slate-900">Applicant conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {convLoading && (
              <div className="space-y-2 p-2">
                {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            )}
            {!convLoading && conversations.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                <p className="text-2xl">💬</p>
                <p className="mt-2 font-medium text-slate-700">No conversations yet</p>
                <p className="mt-1">Conversations appear when students apply to your projects.</p>
              </div>
            )}
            {conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`mb-1.5 w-full rounded-2xl border p-3 text-left transition ${activeId === c._id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900 text-sm leading-tight">
                    {c.student?.fullName || 'Student'}
                  </p>
                  {c.application?.status && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${
                      c.application.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                      c.application.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {c.application.status}
                    </span>
                  )}
                </div>
                {c.student?.university && (
                  <p className="mt-0.5 text-xs text-slate-500 truncate">{c.student.university}</p>
                )}
                {c.application?.title && (
                  <p className="mt-1 text-xs text-blue-600 truncate">📁 {c.application.title}</p>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <section className="card flex flex-col overflow-hidden">
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center text-center p-8">
              <div>
                <p className="text-4xl">👈</p>
                <p className="mt-3 font-semibold text-slate-700">Select a conversation</p>
                <p className="mt-1 text-sm text-slate-500">Choose an applicant on the left to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="font-semibold text-slate-900">
                  {activeConversation.student?.fullName || 'Student'}
                </p>
                <p className="text-sm text-slate-500">
                  {activeConversation.student?.university || activeConversation.student?.email || 'Applicant'}
                  {activeConversation.application?.title && ` · ${activeConversation.application.title}`}
                </p>
              </div>

              {/* Cover letter as first context */}
              {activeConversation.application?.coverLetter && messages.length === 0 && (
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-3">
                  <p className="text-xs font-semibold text-amber-700">Application cover letter</p>
                  <p className="mt-1 text-sm text-slate-700">{activeConversation.application.coverLetter}</p>
                </div>
              )}

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-5">
                {loading && <p className="text-sm text-slate-500">Loading...</p>}
                {!loading && messages.map((msg) => (
                  <div key={msg._id} className={msg.senderRole === 'CLIENT' ? 'ml-auto max-w-[80%]' : 'max-w-[80%]'}>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                      msg.senderRole === 'CLIENT'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`mt-1 text-xs text-slate-400 ${msg.senderRole === 'CLIENT' ? 'text-right' : ''}`}>
                      {msg.senderRole === 'CLIENT' ? 'You' : activeConversation.student?.fullName?.split(' ')[0] || 'Student'} · {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                {!loading && !messages.length && (
                  <div className="text-center py-8 text-sm text-slate-500">
                    <p>No messages yet. Send the first message to this applicant.</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-4">
                <div className="flex items-center gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Write a message to the applicant..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={!text.trim() || sending}
                    className="btn-primary disabled:opacity-50 shrink-0"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

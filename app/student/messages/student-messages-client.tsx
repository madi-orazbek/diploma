'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n/I18nContext';

type ConvEmployer = { fullName?: string; companyName?: string };
type ConvApplication = { title?: string; status?: string; coverLetter?: string };
type ConvProject = { title?: string };

type Conversation = {
  _id: string;
  applicationId?: string;
  itemId?: string;
  itemType?: string;
  updatedAt?: string;
  lastMessageAt?: string;
  lastMessageText?: string;
  employer?: ConvEmployer | null;
  application?: ConvApplication | null;
  project?: ConvProject | null;
};

type ChatMessage = {
  _id: string;
  senderId?: string;
  senderRole?: string;
  text: string;
  createdAt: string;
};

function fmt(date?: string) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function StudentMessagesClient() {
  const { T } = useI18n();
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  async function send() {
    if (!activeId || !text.trim()) return;
    setSending(true);
    const optimistic: ChatMessage = { _id: `opt-${Date.now()}`, senderRole: 'STUDENT', text: text.trim(), createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    const sent = text.trim();
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, text: sent }),
      });
      await loadMessages(activeId);
    } finally {
      setSending(false);
    }
  }

  const activeConv = useMemo(() => conversations.find((x) => x._id === activeId) || null, [conversations, activeId]);

  const displayName = (c: Conversation) =>
    c.employer?.companyName ||
    c.employer?.fullName ||
    c.application?.title ||
    c.project?.title ||
    (c.itemId ? `Project (${c.itemId})` : 'Company');

  const displayTitle = (c: Conversation) =>
    c.project?.title || c.application?.title || '';

  return (
    <div className="flex flex-col py-2">
      <div className="mb-4">
        <p className="text-sm font-medium text-blue-700">{T('msg_student_workspace')}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{T('msg_messages')}</h1>
        <p className="text-sm text-slate-500">{T('msg_subtitle')}</p>
      </div>

      <div className="grid h-[calc(100vh-220px)] min-h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="flex flex-col border-r border-slate-200">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-700">{T('msg_conversations')}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convLoading && (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            )}
            {!convLoading && conversations.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-2xl">💬</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{T('msg_no_convs')}</p>
                <p className="mt-1 text-xs text-slate-500">{T('msg_no_convs_hint')}</p>
              </div>
            )}
            {conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 ${activeId === c._id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className={`truncate text-sm font-semibold ${activeId === c._id ? 'text-blue-700' : 'text-slate-900'}`}>
                    {displayName(c)}
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">{fmt(c.lastMessageAt || c.updatedAt)}</span>
                </div>
                {displayTitle(c) && (
                  <p className="mt-0.5 truncate text-xs text-blue-600">📁 {displayTitle(c)}</p>
                )}
                {c.lastMessageText && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{c.lastMessageText}</p>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <section className="flex flex-col overflow-hidden">
          {!activeConv ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <p className="text-4xl">👈</p>
                <p className="mt-3 font-semibold text-slate-700">{T('msg_select_conv')}</p>
                <p className="mt-1 text-sm text-slate-500">{T('msg_select_hint')}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{displayName(activeConv)}</p>
                    <p className="text-sm text-slate-500">
                      {displayTitle(activeConv) || T('msg_direct')}
                      {activeConv.application?.status && (
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          activeConv.application.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                          activeConv.application.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {activeConv.application.status}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {(activeConv as any).employerId && (
                      <a
                        href={`/companies/${(activeConv as any).employerId}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {T('msg_view_company')}
                      </a>
                    )}
                    {activeConv.itemId && (
                      <a
                        href={`/projects/${activeConv.itemId}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {T('msg_view_project')}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-5">
                {loading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className={`h-10 animate-pulse rounded-2xl bg-slate-200 ${i % 2 === 0 ? 'ml-auto w-2/3' : 'w-2/3'}`} />)}
                  </div>
                )}
                {!loading && messages.map((msg) => {
                  const isMe = msg.senderRole === 'STUDENT';
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMe ? '' : ''}`}>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isMe
                            ? 'rounded-br-sm bg-blue-600 text-white'
                            : 'rounded-bl-sm bg-white border border-slate-200 text-slate-700 shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <p className={`mt-1 text-xs text-slate-400 ${isMe ? 'text-right' : ''}`}>
                          {fmt(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!loading && messages.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-3xl">💬</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{T('msg_start_conv')}</p>
                    <p className="mt-1 text-xs text-slate-500">{T('msg_cover_sent')}</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-4">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder={T('msg_placeholder')}
                    rows={1}
                    className="max-h-28 w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={!text.trim() || sending}
                    className="btn-primary shrink-0 disabled:opacity-50"
                  >
                    {sending ? '...' : T('msg_send')}
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

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Conversation = {
  _id: string;
  applicationId?: string;
  itemId?: string;
  itemType?: string;
  updatedAt?: string;
};

type ChatMessage = {
  _id: string;
  senderRole?: string;
  text: string;
  createdAt: string;
};

export default function StudentMessagesClient() {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams?.get('conversationId') || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    const res = await fetch('/api/conversations', { credentials: 'include' });
    const payload = await res.json();
    const rows = payload?.data || [];
    setConversations(rows);
    const nextId = requestedConversationId || rows[0]?._id || '';
    setActiveId(nextId);
  }

  async function loadMessages(conversationId: string) {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, { credentials: 'include' });
      const payload = await res.json();
      setMessages(payload?.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
  }, [activeId]);

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
    <div className="grid h-[calc(100vh-160px)] min-h-[620px] gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="card flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500">Conversations linked to your applications</p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {conversations.map((c) => (
            <button
              key={c._id}
              onClick={() => setActiveId(c._id)}
              className={`w-full rounded-2xl border p-3 text-left transition ${activeId === c._id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <p className="font-semibold text-slate-900">Application {c.applicationId?.slice(-6)}</p>
              <p className="mt-1 text-xs text-slate-600">{c.itemType || 'item'} · {c.itemId || 'n/a'}</p>
            </button>
          ))}
          {!conversations.length && <p className="px-2 text-sm text-slate-500">No conversations yet.</p>}
        </div>
      </aside>

      <section className="card flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="font-semibold text-slate-900">{activeConversation ? `Conversation ${activeConversation._id.slice(-6)}` : 'Select conversation'}</p>
          {activeConversation && <p className="text-sm text-slate-500">{activeConversation.itemType} · {activeConversation.itemId}</p>}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-5">
          {loading ? <p className="text-sm text-slate-500">Loading messages...</p> : messages.map((msg) => (
            <div key={msg._id} className={msg.senderRole === 'STUDENT' ? 'ml-auto max-w-[80%]' : 'max-w-[80%]'}>
              <div className={`rounded-2xl px-3 py-2 text-sm ${msg.senderRole === 'STUDENT' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>
                {msg.text}
              </div>
              <p className={`mt-1 text-xs text-slate-400 ${msg.senderRole === 'STUDENT' ? 'text-right' : ''}`}>{new Date(msg.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {!loading && !messages.length && <p className="text-center py-8 text-sm text-slate-500">No messages yet. Start the conversation!</p>}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Write a message..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
            />
            <button type="button" onClick={send} disabled={!activeId || sending} className="btn-primary disabled:opacity-50">Send</button>
          </div>
        </div>
      </section>
    </div>
  );
}

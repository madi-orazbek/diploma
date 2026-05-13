'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type AppNotification = {
  id: string;
  type: 'message' | 'application' | 'match' | 'invite' | 'reminder' | 'system';
  title: string;
  text: string;
  href: string;
  read: boolean;
  createdAt: string;
};

const LS_KEY = 'uniwork_notifications';

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'seed-1',
    type: 'match',
    title: 'New high-match project',
    text: 'React Frontend Developer — 87% match with your profile!',
    href: '/projects',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'seed-2',
    type: 'reminder',
    title: 'Complete your profile',
    text: 'Add GitHub and experience to boost your match score by 30%.',
    href: '/student/profile',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'seed-3',
    type: 'system',
    title: 'Welcome to UniWork!',
    text: 'Explore AI-powered project matching and build your portfolio.',
    href: '/projects',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export function loadNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(SEED_NOTIFICATIONS));
      return SEED_NOTIFICATIONS;
    }
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return SEED_NOTIFICATIONS;
  }
}

export function saveNotifications(items: AppNotification[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function pushNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
  const items = loadNotifications();
  const next: AppNotification = {
    ...n,
    id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const updated = [next, ...items].slice(0, 30);
  saveNotifications(updated);
  window.dispatchEvent(new CustomEvent('notifications_update'));
  return next;
}

const TYPE_ICON: Record<AppNotification['type'], string> = {
  message:     '💬',
  application: '📤',
  match:       '🎯',
  invite:      '✉️',
  reminder:    '💡',
  system:      '🔔',
};

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const refresh = () => setItems(loadNotifications());

  useEffect(() => {
    refresh();
    window.addEventListener('notifications_update', refresh);
    return () => window.removeEventListener('notifications_update', refresh);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = items.filter((x) => !x.read).length;

  function markAllRead() {
    const updated = items.map((x) => ({ ...x, read: true }));
    saveNotifications(updated);
    setItems(updated);
  }

  function handleClick(item: AppNotification) {
    const updated = items.map((x) => x.id === item.id ? { ...x, read: true } : x);
    saveNotifications(updated);
    setItems(updated);
    setOpen(false);
    router.push(item.href);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        title="Notifications"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
      >
        <span className="text-base">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Notifications {unread > 0 && <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600">{unread}</span>}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl">🔔</p>
                <p className="mt-2 text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              items.slice(0, 15).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClick(item)}
                  className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 ${!item.read ? 'bg-blue-50/50' : ''}`}
                >
                  <span className="mt-0.5 shrink-0 text-lg">{TYPE_ICON[item.type]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`truncate text-xs font-semibold ${!item.read ? 'text-slate-900' : 'text-slate-600'}`}>
                        {item.title}
                      </p>
                      {!item.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{item.text}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{fmt(item.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2.5 text-center">
            <button
              type="button"
              onClick={() => { setOpen(false); router.push('/student/messages'); }}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View all messages →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

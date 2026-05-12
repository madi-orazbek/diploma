import { Suspense } from 'react';
import ClientMessagesClient from './client-messages-client';

export const dynamic = 'force-dynamic';

export default function ClientMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading messages...</div>}>
      <ClientMessagesClient />
    </Suspense>
  );
}

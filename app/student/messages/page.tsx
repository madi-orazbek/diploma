import { Suspense } from 'react';
import StudentMessagesClient from './student-messages-client';

export const dynamic = 'force-dynamic';

export default function StudentMessagesPage() {
  return (
    <Suspense fallback={<div className="card p-6 text-sm text-slate-500">Loading messages...</div>}>
      <StudentMessagesClient />
    </Suspense>
  );
}

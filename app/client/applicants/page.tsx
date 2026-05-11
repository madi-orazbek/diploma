import { Suspense } from 'react';
import ApplicantsPageClient from './ApplicantsPageClient';

export const dynamic = 'force-dynamic';

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<div className="card p-6">Loading applicants...</div>}>
      <ApplicantsPageClient />
    </Suspense>
  );
}

'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card p-8 text-center">
      <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
      <p className="text-slate-600 mb-4">{error.message || 'Unexpected application error.'}</p>
      <button onClick={() => reset()} className="px-4 py-2 bg-brand text-white rounded">Try again</button>
    </div>
  );
}

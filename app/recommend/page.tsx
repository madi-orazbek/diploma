'use client';

import { useState } from 'react';

export default function RecommendPage() {
  const [topN, setTopN] = useState(10);
  const [strictCity, setStrictCity] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ top_n: topN, strict_city: strictCity })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch recommendations');

      const rows = data?.data?.recommendations || data?.recommendations || [];
      setResults(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-5">
      <h1 className="text-3xl font-bold">Recommended Projects</h1>
      <p className="text-sm text-slate-600">Recommendations are generated automatically from your saved student profile.</p>

      <div className="card p-5 grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Top N recommendations</label>
          <input className="w-full rounded-lg border p-3" type="number" value={topN} onChange={(e) => setTopN(Number(e.target.value || 10))} />
        </div>
        <label className="flex items-center gap-2 text-sm md:pt-8">
          <input type="checkbox" checked={strictCity} onChange={(e) => setStrictCity(e.target.checked)} />
          Strict city match
        </label>
        <button onClick={handleSubmit} className="btn-primary md:self-end">
          {loading ? 'Loading...' : 'Get Recommendations'}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-2xl">📌</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">No matching recommendations found</h2>
          <p className="mt-1 text-sm text-slate-600">Try adding more skills in your profile or broadening city constraints.</p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((item: any, idx: number) => (
          <article key={item.id || item.projectId || idx} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title || item.position || `Recommendation #${idx + 1}`}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.short_description || item.description || item.explanation || 'No description provided.'}</p>
              </div>
              <span className="status-pill bg-blue-100 text-blue-700">
                {item.matchScorePercent || (item.score ? `${Math.round(Number(item.score) * 100)}% match` : 'ML match')}
              </span>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
              <p><span className="text-slate-500">City:</span> {item.city || 'Not specified'}</p>
              <p><span className="text-slate-500">Employment:</span> {item.employmentType || item.employment || 'Not specified'}</p>
              <p><span className="text-slate-500">Experience:</span> {item.experienceLevel || item.experience || 'Not specified'}</p>
              <p><span className="text-slate-500">Salary:</span> {item.salary || item.budget || item.budgetRange || 'Not specified'}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(item.skills || item.requiredSkills || []).map((skill: string) => (
                <span key={`${idx}-${skill}`} className="pill">{skill}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

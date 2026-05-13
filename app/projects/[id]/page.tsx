'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type VacancySection = {
  requirements_items?: string[];
  responsibilities_items?: string[];
  conditions_items?: string[];
};

const DEFAULT_COVER_LETTER = 'Hello, I am interested in this opportunity and would like to apply through UniWork.';

function toSkills(doc: any): string[] {
  if (Array.isArray(doc?.key_skills)) {
    return doc.key_skills
      .map((x: any) => (typeof x === 'string' ? x : x?.name))
      .map((x: unknown) => String(x || '').trim())
      .filter(Boolean);
  }
  if (Array.isArray(doc?.requiredSkills)) return doc.requiredSkills.map((x: unknown) => String(x)).filter(Boolean);
  if (Array.isArray(doc?.required_skills)) return doc.required_skills.map((x: unknown) => String(x)).filter(Boolean);
  return [];
}

function salaryLabel(doc: any) {
  const from = doc?.salary?.from ?? doc?.budgetMin ?? null;
  const to = doc?.salary?.to ?? doc?.budgetMax ?? null;
  const currency = doc?.salary?.currency || 'KZT';
  if (from == null && to == null) return '';
  if (from != null && to != null) return `${from.toLocaleString()} - ${to.toLocaleString()} ${currency}`;
  if (from != null) return `From ${Number(from).toLocaleString()} ${currency}`;
  return `Up to ${Number(to).toLocaleString()} ${currency}`;
}

function asList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => String(x || '').trim()).filter(Boolean);
}

export default function ProjectDetails() {
  const [item, setItem] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((p) => {
        const role = p?.data?.role || null;
        setAuthRole(role);
        if (role === 'STUDENT' && id) {
          fetch('/api/applications', { credentials: 'include' })
            .then((r) => r.json())
            .then((payload) => {
              const apps: any[] = payload?.data || [];
              const applied = apps.some((a) => String(a.itemId) === id || String(a.projectId) === id);
              setAlreadyApplied(applied);
            })
            .catch(() => {});
        }
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setError('');
    fetch(`/api/projects/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => {
        if (!payload?.success) {
          const errMsg =
            typeof payload?.error === 'string'
              ? payload.error
              : payload?.error?.message || 'Project not found';
          throw new Error(errMsg);
        }
        setItem(payload.data);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load details'));
  }, [id]);

  const skills = useMemo(() => toSkills(item), [item]);
  const salary = useMemo(() => salaryLabel(item), [item]);
  const sections: VacancySection = item?.sections || {};

  async function submitApplication() {
    if (!item) return;
    const itemType = String(item?.entity_type || '').toLowerCase() === 'vacancy' ? 'vacancy' : 'project';
    const itemId = String(item?.id || id);
    const normalizedCoverLetter = coverLetter.trim() || DEFAULT_COVER_LETTER;
    setSaving(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          itemType,
          title: item?.title,
          companyName: item?.company?.name || '',
          source: item?.source || '',
          coverLetter: normalizedCoverLetter,
          proposedPrice: proposedPrice ? Number(proposedPrice) : null,
          expectedSalary: expectedSalary ? Number(expectedSalary) : null,
          estimatedDuration: estimatedDuration || null,
        }),
      });
      const payload = await res.json();
      setMessage(res.ok ? 'Application sent successfully.' : payload?.error?.message || payload?.error || 'Failed to apply.');
      if (res.ok) {
        setAlreadyApplied(true);
        setShowApplyModal(false);
        setCoverLetter('');
        setProposedPrice('');
        setExpectedSalary('');
        setEstimatedDuration('');
      }
    } finally {
      setSaving(false);
    }
  }

  function contact() {
    const email = item?.contacts?.email || item?.company?.email;
    const phone = item?.contacts?.phone;
    if (email) {
      window.location.href = `mailto:${email}`;
      return;
    }
    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }
    setMessage('No direct contact details available for this role.');
  }

  async function saveFavorite() {
    if (!item) return;
    const itemType = String(item?.entity_type || '').toLowerCase() === 'vacancy' ? 'vacancy' : 'project';
    const itemId = String(item?.id || id);
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId,
        itemType,
        title: item?.title || '',
        companyName: item?.company?.name || '',
        city: item?.location?.city || item?.city || '',
        category: item?.category || '',
        budgetMin: item?.budgetMin ?? item?.salary?.from ?? null,
        budgetMax: item?.budgetMax ?? item?.salary?.to ?? null,
        source: item?.source || '',
      }),
    });
    setMessage('Favorites updated.');
  }

  if (error) return <div className="card p-6 text-red-600">{error}</div>;
  if (!item) return <div className="card p-6">Loading details...</div>;

  const requirements = asList(sections.requirements_items);
  const responsibilities = asList(sections.responsibilities_items);
  const conditions = asList(sections.conditions_items);

  const title = item?.title || 'Role details';
  const description = item?.description_text || item?.description || item?.summary || '';
  const experience = item?.experience_level || item?.experienceLevel || 'Not specified';
  const employmentType = item?.employment_type || item?.employmentType || 'Not specified';
  const workFormat = item?.work_format || item?.workplaceType;
  const schedule = item?.schedule || item?.work_schedule;
  const city = item?.location?.city || item?.city || 'Remote';
  const address = item?.location?.address_line || item?.address;
  const companyName = item?.company?.name || 'Company not specified';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {!!salary && <p className="mt-2 text-2xl font-semibold text-emerald-700">{salary}</p>}
            <p className="mt-2 text-sm text-slate-600">{companyName} · {city}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {authRole === 'STUDENT' ? (
              alreadyApplied ? (
                <span className="inline-flex items-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Applied
                </span>
              ) : (
                <button type="button" onClick={() => setShowApplyModal(true)} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Apply on UniWork</button>
              )
            ) : authRole === null ? (
              <Link href="/signin" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Sign in to apply</Link>
            ) : null}
            <button type="button" onClick={contact} className="rounded-lg border px-4 py-2 text-sm font-semibold">Contact</button>
            <button type="button" onClick={saveFavorite} className="rounded-lg border px-4 py-2 text-sm font-semibold">Save</button>
            {item?.alternate_url && <a href={item.alternate_url} target="_blank" rel="noreferrer" className="rounded-lg border px-4 py-2 text-sm font-semibold">Open original vacancy</a>}
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-semibold">Experience:</span> {experience}</p>
          <p><span className="font-semibold">Employment type:</span> {employmentType}</p>
          {workFormat && <p><span className="font-semibold">Work format:</span> {workFormat}</p>}
          {schedule && <p><span className="font-semibold">Schedule:</span> {schedule}</p>}
          {address && <p className="md:col-span-2"><span className="font-semibold">Address:</span> {address}</p>}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold text-slate-900">About the role</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{description || 'Description is not available.'}</p>
      </section>

      {!!responsibilities.length && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900">Responsibilities</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {responsibilities.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      )}

      <section className="card p-6">
        <h2 className="text-xl font-semibold text-slate-900">Requirements</h2>
        {requirements.length ? (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {requirements.map((line) => <li key={line}>{line}</li>)}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-700">{description || 'No separate requirements listed.'}</p>
        )}
      </section>

      {!!conditions.length && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900">What we offer</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {conditions.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      )}

      {!!skills.length && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900">Key skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{skill}</span>
            ))}
          </div>
        </section>
      )}

      {(item?.contacts?.email || item?.contacts?.phone || item?.contacts?.name) && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900">Contacts</h2>
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            {item?.contacts?.name && <p><span className="font-semibold">Name:</span> {item.contacts.name}</p>}
            {item?.contacts?.email && <p><span className="font-semibold">Email:</span> {item.contacts.email}</p>}
            {item?.contacts?.phone && <p><span className="font-semibold">Phone:</span> {item.contacts.phone}</p>}
          </div>
        </section>
      )}

      {message && <div className="card p-4 text-sm text-blue-700">{message}</div>}

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Apply on UniWork</h3>
            <p className="mt-1 text-sm text-slate-600">Send your cover letter (optional) and compensation expectations if you want.</p>
            <div className="mt-4 space-y-3">
              <textarea className="min-h-36 w-full rounded-xl border px-3 py-2 text-sm" value={coverLetter} onChange={(e)=>setCoverLetter(e.target.value)} placeholder="Cover letter / message to employer (optional)" />
              <div className="grid gap-3 md:grid-cols-2">
                <input className="rounded-xl border px-3 py-2 text-sm" value={proposedPrice} onChange={(e)=>setProposedPrice(e.target.value.replace(/[^0-9]/g,''))} placeholder="Proposed price (optional)" />
                <input className="rounded-xl border px-3 py-2 text-sm" value={expectedSalary} onChange={(e)=>setExpectedSalary(e.target.value.replace(/[^0-9]/g,''))} placeholder="Expected salary (optional)" />
              </div>
              <input className="w-full rounded-xl border px-3 py-2 text-sm" value={estimatedDuration} onChange={(e)=>setEstimatedDuration(e.target.value)} placeholder="Estimated duration (optional)" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-lg border px-4 py-2 text-sm font-semibold" onClick={()=>setShowApplyModal(false)}>Cancel</button>
              <button type="button" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={submitApplication}>Submit application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

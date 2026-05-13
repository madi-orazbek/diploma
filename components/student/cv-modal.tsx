'use client';

import { useEffect, useRef } from 'react';

type CvProfile = {
  name?: string;
  headline?: string;
  phone?: string;
  city?: string;
  university?: string;
  about?: string;
  skills?: string[];
  interests?: string[];
  experienceLevel?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioLinks?: string[];
  languages?: string | string[];
  availabilityStatus?: string;
  experienceEntries?: {
    jobTitle?: string;
    company?: string;
    startMonth?: string;
    startYear?: string;
    endMonth?: string;
    endYear?: string;
    currentlyWorking?: boolean;
    description?: string;
    employmentType?: string;
  }[];
  certificateDocuments?: {
    name?: string;
    issuer?: string;
    issueDate?: string;
  }[];
  diplomaDocuments?: {
    university?: string;
    degree?: string;
    fieldOfStudy?: string;
    startYear?: string;
    graduationYear?: string;
    gpa?: string;
  }[];
};

interface CvModalProps {
  profile: CvProfile | null;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cv-section" style={{ marginBottom: '18px' }}>
      <div style={{
        borderBottom: '2px solid #1d4ed8',
        paddingBottom: '4px',
        marginBottom: '10px',
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: '#1d4ed8',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function CvContent({ profile }: { profile: CvProfile }) {
  const p = profile;
  const langList = Array.isArray(p.languages)
    ? p.languages
    : typeof p.languages === 'string'
      ? p.languages.split(',').map((x) => x.trim()).filter(Boolean)
      : [];

  const missing: string[] = [];
  if (!p.name) missing.push('name');
  if (!p.about) missing.push('bio/about');
  if (!p.skills?.length) missing.push('skills');
  if (!p.university) missing.push('university');
  if (!p.experienceEntries?.length && !p.experienceLevel) missing.push('work experience');

  return (
    <div
      id="cv-print-area"
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#1e293b',
        background: '#fff',
        padding: '32px 36px',
        maxWidth: '760px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '3px solid #1d4ed8', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {p.name || 'Your Name'}
            </h1>
            {p.headline && (
              <p style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: 600, marginTop: '4px' }}>
                {p.headline}
              </p>
            )}
            {p.experienceLevel && (
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {p.experienceLevel} level
              </p>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#475569', textAlign: 'right', lineHeight: '1.8' }}>
            {p.city && <div>📍 {p.city}</div>}
            {p.phone && <div>📞 {p.phone}</div>}
            {p.githubUrl && <div>GitHub: {p.githubUrl.replace('https://', '')}</div>}
            {p.linkedinUrl && <div>LinkedIn: {p.linkedinUrl.replace('https://', '')}</div>}
            {p.availabilityStatus && (
              <div style={{ marginTop: '4px', color: '#16a34a', fontWeight: 600 }}>
                ✓ {p.availabilityStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      {p.about && (
        <Section title="Professional Summary">
          <p style={{ color: '#374151', lineHeight: '1.6' }}>{p.about}</p>
        </Section>
      )}

      {/* Skills */}
      {!!p.skills?.length && (
        <Section title="Technical Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {p.skills.map((s) => (
              <span key={s} style={{
                display: 'inline-block',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '2px 10px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#1d4ed8',
              }}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {(!!p.diplomaDocuments?.length || p.university) && (
        <Section title="Education">
          {p.diplomaDocuments?.map((d, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {d.degree}{d.fieldOfStudy ? `, ${d.fieldOfStudy}` : ''}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {d.startYear && d.graduationYear ? `${d.startYear} – ${d.graduationYear}` : d.graduationYear || ''}
                </span>
              </div>
              <div style={{ color: '#475569', fontSize: '12px' }}>
                {d.university}
                {d.gpa && ` · GPA: ${d.gpa}`}
              </div>
            </div>
          ))}
          {!p.diplomaDocuments?.length && p.university && (
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.university}</div>
          )}
        </Section>
      )}

      {/* Experience */}
      {!!p.experienceEntries?.length && (
        <Section title="Work Experience">
          {p.experienceEntries.map((e, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                  {e.jobTitle}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {e.startMonth} {e.startYear} –{' '}
                  {e.currentlyWorking ? 'Present' : `${e.endMonth || ''} ${e.endYear || ''}`}
                </span>
              </div>
              <div style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>
                {e.company}
                {e.employmentType && ` · ${e.employmentType}`}
              </div>
              {e.description && (
                <p style={{ color: '#374151', fontSize: '12px', marginTop: '4px', lineHeight: '1.5' }}>
                  {e.description}
                </p>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Certificates */}
      {!!p.certificateDocuments?.length && (
        <Section title="Certificates">
          {p.certificateDocuments.map((c, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
              {c.issuer && <span style={{ color: '#64748b', fontSize: '12px' }}> · {c.issuer}</span>}
              {c.issueDate && <span style={{ color: '#64748b', fontSize: '12px' }}> ({c.issueDate})</span>}
            </div>
          ))}
        </Section>
      )}

      {/* Portfolio */}
      {!!p.portfolioLinks?.length && (
        <Section title="Portfolio">
          {p.portfolioLinks.filter(Boolean).map((link, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#1d4ed8' }}>{link}</div>
          ))}
        </Section>
      )}

      {/* Languages & Interests */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {!!langList.length && (
          <Section title="Languages">
            <div style={{ color: '#374151', fontSize: '12px' }}>
              {langList.join(' · ')}
            </div>
          </Section>
        )}
        {!!p.interests?.length && (
          <Section title="Interests">
            <div style={{ color: '#374151', fontSize: '12px' }}>
              {p.interests.slice(0, 8).join(' · ')}
            </div>
          </Section>
        )}
      </div>

      {/* Missing fields hint (print hidden) */}
      {missing.length > 0 && (
        <div className="no-print" style={{
          marginTop: '20px',
          padding: '12px 16px',
          background: '#fef9c3',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#713f12',
          border: '1px solid #fde68a',
        }}>
          💡 <strong>To strengthen your CV:</strong> Add {missing.join(', ')} to your profile.
        </div>
      )}
    </div>
  );
}

export function CvModal({ profile, onClose }: CvModalProps) {
  const printRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function handlePrint() {
    const content = document.getElementById('cv-print-area');
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CV — ${profile?.name || 'UniWork'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
${content.outerHTML}
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  }

  if (!profile) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">📄 CV Preview</h2>
            <p className="text-xs text-slate-500">Review and print or download your resume</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              🖨️ Print / Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* CV Content */}
        <div ref={printRef} className="overflow-hidden rounded-b-2xl bg-white">
          <CvContent profile={profile} />
        </div>
      </div>
    </div>
  );
}

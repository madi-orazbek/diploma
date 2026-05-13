'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

/* ── Types ──────────────────────────────────────────────── */
type CertificateDoc = {
  name: string; issuer?: string; issueDate?: string; expirationDate?: string;
  doesNotExpire?: boolean; skillsCovered?: string[]; description?: string;
  fileName: string; fileSize?: number; fileDataUrl?: string;
};
type DiplomaDoc = {
  university: string; degree?: string; fieldOfStudy?: string; gpa?: string;
  startYear?: string; graduationYear?: string; graduated?: boolean;
  expectedGraduationYear?: string; notes?: string;
  fileName: string; fileSize?: number; fileDataUrl?: string;
};
type ExperienceEntry = {
  jobTitle: string; employmentType?: string; company?: string;
  currentlyWorking?: boolean; startMonth?: string; startYear?: string;
  endMonth?: string; endYear?: string; location?: string;
  workplaceType?: string; description?: string;
};

/* ── Constants ───────────────────────────────────────────── */
const CITIES = ['Almaty','Astana','Shymkent','Karaganda','Aktobe','Taraz','Pavlodar',
  'Ust-Kamenogorsk','Semey','Atyrau','Kostanay','Kyzylorda','Uralsk',
  'Petropavlovsk','Aktau','Temirtau','Turkistan','Kokshetau','Taldykorgan','Remote'];
const SKILLS = ['Python','JavaScript','TypeScript','React','Next.js','Node.js','SQL',
  'PostgreSQL','MongoDB','Django','FastAPI','Flask','Docker','Git','REST API',
  'Figma','UI/UX','Data Analysis','Machine Learning','QA Testing','HTML','CSS',
  'Tailwind','Java','C++','Flutter','Firebase','Redis'];
const INTERESTS = ['Backend','Frontend','Mobile','Data Science','AI/ML',
  'Product Management','DevOps','UI/UX Design','Cybersecurity','Open Source'];
const LANGUAGE_OPTIONS = ['Kazakh','Russian','English','Turkish','German','French','Chinese','Korean','Other'];
const DEGREE_OPTIONS = ["Bachelor's","Master's","PhD","Associate","Diploma","Foundation","Certificate Program","Other"];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', color: 'bg-slate-100 text-slate-700' },
  { value: 'JUNIOR',   label: 'Junior',   color: 'bg-emerald-100 text-emerald-700' },
  { value: 'MIDDLE',   label: 'Middle',   color: 'bg-blue-100 text-blue-700' },
];
const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE',      label: 'Available',        color: 'bg-emerald-100 text-emerald-700' },
  { value: 'BUSY',           label: 'Busy',             color: 'bg-red-100 text-red-700' },
  { value: 'OPEN_TO_OFFERS', label: 'Open to offers',   color: 'bg-amber-100 text-amber-700' },
];
const FORMAT_OPTIONS = ['Remote','Hybrid','Office','Part-time','Full-time','Internship'];

/* ── Helpers ─────────────────────────────────────────────── */
function fromCsv(v: string) { return v.split(',').map((x)=>x.trim()).filter(Boolean); }
function toCsv(a: string[]=[]) { return a.join(', '); }
function normalizeUrl(v: string) {
  const t=v.trim(); if(!t) return ''; return /^https?:\/\//i.test(t)?t:`https://${t}`;
}
function fmtDate(v?: string) {
  if(!v) return 'Not set';
  const d=new Date(v); if(Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
async function toDataUrl(file: File): Promise<string> {
  return new Promise((res,rej)=>{
    const r=new FileReader(); r.onload=()=>res(String(r.result||'')); r.onerror=rej; r.readAsDataURL(file);
  });
}

function LF({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

function Pill({ text, color='bg-slate-100 text-slate-700', onRemove }: { text: string; color?: string; onRemove?: ()=>void }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
      {text}
      {onRemove && <button type="button" onClick={onRemove} className="ml-0.5 leading-none opacity-60 hover:opacity-100">×</button>}
    </span>
  );
}

function SectionHeader({ title, icon, complete }: { title: string; icon: string; complete?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
      <span className="text-xl">{icon}</span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {complete && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">✓ Saved</span>}
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────── */
export default function StudentProfilePage() {
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState<'preview'|'edit'>('preview');
  const [error, setError]       = useState('');
  const [saved, setSaved]       = useState<Record<string,boolean>>({});

  /* form state */
  const [form, setForm] = useState({
    firstName:'', lastName:'', birthDate:'', phone:'', email:'',
    university:'', city:'', workplaceType:'Remote',
    headline:'', preferredRoles:'', about:'',
    experienceLevel:'JUNIOR', availabilityStatus:'AVAILABLE',
    skills:[] as string[], interests:[] as string[],
    languageSelections:[] as string[],
    githubUrl:'', linkedinUrl:'', portfolioLinks:[] as string[],
    avatarDataUrl:'',
    certificateDocuments:[] as CertificateDoc[],
    diplomaDocuments:[] as DiplomaDoc[],
    experienceEntries:[] as ExperienceEntry[],
    languages:'',
  });

  /* draft states for sub-forms */
  const [certDraft, setCertDraft] = useState<CertificateDoc>({ name:'', fileName:'' });
  const [dipDraft,  setDipDraft]  = useState<DiplomaDoc>({ university:'', fileName:'', graduated:true });
  const [expDraft,  setExpDraft]  = useState<ExperienceEntry>({ jobTitle:'', currentlyWorking:true, workplaceType:'Remote' });
  const [editCertIdx, setEditCertIdx] = useState<number|null>(null);
  const [editDipIdx,  setEditDipIdx]  = useState<number|null>(null);
  const [editExpIdx,  setEditExpIdx]  = useState<number|null>(null);
  const [portDraft, setPortDraft] = useState('');
  const [editPortIdx, setEditPortIdx] = useState<number|null>(null);
  const [langQ, setLangQ] = useState('');
  const [skillQ, setSkillQ] = useState('');

  /* load profile */
  useEffect(() => {
    fetch('/api/student/profile', { credentials: 'include' })
      .then((r)=>r.json())
      .then((payload)=>{
        if(!payload?.success) return;
        const p = payload.data;
        setForm({
          firstName:  p.firstName || p.fullName?.split(' ')[0] || '',
          lastName:   p.lastName  || p.fullName?.split(' ').slice(1).join(' ') || '',
          birthDate:  p.birthDate || '',
          phone:      p.phone || '',
          email:      p.email || '',
          university: p.university || '',
          city:       p.city || '',
          workplaceType: p.workplaceType || 'Remote',
          headline:   p.headline || '',
          preferredRoles: p.preferredRoles || '',
          about:      p.about || '',
          experienceLevel: p.experienceLevel || 'JUNIOR',
          availabilityStatus: p.availabilityStatus || 'AVAILABLE',
          skills:       p.skills || [],
          interests:    p.interests || [],
          languageSelections: fromCsv(p.languages||''),
          languages:    p.languages || '',
          githubUrl:    p.githubUrl || '',
          linkedinUrl:  p.linkedinUrl || '',
          portfolioLinks: p.portfolioLinks || [],
          avatarDataUrl:  p.avatarDataUrl || p.avatar || '',
          certificateDocuments: p.certificateDocuments || [],
          diplomaDocuments: p.diplomaDocuments || [],
          experienceEntries: p.experienceEntries || [],
        });
        setMode('preview');
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  /* completeness */
  const completeness = useMemo(() => {
    const checks: [string, boolean][] = [
      ['Name',         !!(form.firstName && form.lastName)],
      ['Headline',     !!form.headline],
      ['University',   !!form.university],
      ['City',         !!form.city],
      ['About',        !!form.about],
      ['Skills',       form.skills.length >= 3],
      ['Languages',    form.languageSelections.length >= 1],
      ['GitHub',       !!form.githubUrl],
      ['Experience',   form.experienceEntries.length >= 1 || form.skills.length >= 5],
      ['Availability', !!form.availabilityStatus],
    ];
    const pct = Math.round(checks.filter(([,v])=>v).length / checks.length * 100);
    return { pct, checks };
  }, [form]);

  /* save helpers */
  async function saveSection(sectionKey: string) {
    setError('');
    try {
      const githubUrl = normalizeUrl(form.githubUrl);
      const linkedinUrl = normalizeUrl(form.linkedinUrl);
      const body = {
        firstName: form.firstName, lastName: form.lastName,
        birthDate: form.birthDate, phone: form.phone,
        workplaceType: form.workplaceType,
        university: form.university, city: form.city,
        headline: form.headline, preferredRoles: form.preferredRoles,
        about: form.about,
        experienceLevel: form.experienceLevel, availabilityStatus: form.availabilityStatus,
        skills: form.skills, interests: form.interests,
        languages: form.languageSelections.join(', '),
        githubUrl, linkedinUrl,
        portfolioLinks: form.portfolioLinks,
        avatarDataUrl: form.avatarDataUrl, avatar: form.avatarDataUrl,
        certificateDocuments: form.certificateDocuments,
        diplomaDocuments: form.diplomaDocuments,
        experienceEntries: form.experienceEntries,
        certificates: form.certificateDocuments.map((x)=>x.name),
        diplomas: form.diplomaDocuments.map((x)=>`${x.university} ${x.degree||''}`.trim()),
      };
      const res = await fetch('/api/student/profile', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if(!res.ok || !data?.success) throw new Error(data?.error||'Save failed');
      setSaved((prev)=>({...prev, [sectionKey]:true}));
      setTimeout(()=>setSaved((prev)=>({...prev,[sectionKey]:false})), 3000);
    } catch(e:any) { setError(e?.message||'Failed to save'); }
  }

  function addTag(val: string, key: 'skills'|'interests') {
    const n=val.trim(); if(!n) return;
    if(form[key].some((x)=>x.toLowerCase()===n.toLowerCase())) return;
    setForm({...form, [key]:[...form[key], n]});
  }
  function removeTag(val: string, key: 'skills'|'interests') {
    setForm({...form, [key]: form[key].filter((x)=>x!==val)});
  }

  async function uploadAvatar(e: ChangeEvent<HTMLInputElement>) {
    const f=e.target.files?.[0]; if(!f) return;
    if(!f.type.startsWith('image/')) return setError('Avatar must be an image.');
    setForm({...form, avatarDataUrl: await toDataUrl(f)});
  }

  if(loading) return (
    <div className="space-y-4 py-2">
      {[1,2,3].map((i)=><div key={i} className="card animate-pulse p-6 h-24"/>)}
    </div>
  );

  const initials = `${(form.firstName||'U')[0]}${(form.lastName||'')[0]||''}`.toUpperCase();
  const levelInfo = LEVEL_OPTIONS.find((x)=>x.value===form.experienceLevel)||LEVEL_OPTIONS[1];
  const availInfo = AVAILABILITY_OPTIONS.find((x)=>x.value===form.availabilityStatus)||AVAILABILITY_OPTIONS[0];

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="mx-auto max-w-5xl space-y-5 py-2">

      {error && <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={()=>setError('')} className="ml-3 text-red-500">×</button></div>}

      {/* ── HERO CARD ── */}
      <section className="card overflow-hidden p-0">
        <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 px-6 pb-5">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
              {form.avatarDataUrl
                ? <img src={form.avatarDataUrl} alt="avatar" className="h-full w-full object-cover"/>
                : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-bold text-blue-600">{initials}</div>}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {`${form.firstName} ${form.lastName}`.trim() || 'Your Name'}
              </h1>
              <p className="text-sm text-slate-500">{form.headline || 'Add a professional headline'}</p>
              {form.university && <p className="mt-0.5 text-xs text-slate-400">{form.university}{form.city && ` · 📍 ${form.city}`}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3 pb-1">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelInfo.color}`}>{levelInfo.label}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${availInfo.color}`}>{availInfo.label}</span>
            <button onClick={()=>setMode(mode==='edit'?'preview':'edit')} className="btn-primary text-xs px-4 py-2">
              {mode==='edit'?'Preview profile':'Edit profile'}
            </button>
          </div>
        </div>
      </section>

      {/* ── COMPLETENESS BAR ── */}
      <section className="card p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Profile completeness</p>
            <p className="text-xs text-slate-500">Complete your profile to get better job matches</p>
          </div>
          <span className={`text-2xl font-bold ${completeness.pct>=80?'text-emerald-600':completeness.pct>=50?'text-amber-600':'text-red-600'}`}>
            {completeness.pct}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${completeness.pct>=80?'bg-emerald-500':completeness.pct>=50?'bg-amber-500':'bg-red-500'}`}
            style={{ width:`${completeness.pct}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {completeness.checks.map(([label,done])=>(
            <span key={label} className={`rounded-full px-2 py-0.5 text-xs font-medium ${done?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>
              {done?'✓':'+' } {label}
            </span>
          ))}
        </div>
      </section>

      {/* ════════════ PREVIEW MODE ════════════ */}
      {mode === 'preview' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            {/* About */}
            <section className="card p-6">
              <h2 className="mb-3 text-base font-semibold text-slate-900">About</h2>
              {form.about
                ? <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{form.about}</p>
                : <p className="text-sm text-slate-400 italic">No about section yet. <button onClick={()=>setMode('edit')} className="text-blue-600 hover:underline">Add one →</button></p>}
            </section>

            {/* Skills */}
            <section className="card p-6">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Skills</h2>
              {form.skills.length
                ? <div className="flex flex-wrap gap-2">{form.skills.map((s)=><Pill key={s} text={s} color="bg-blue-50 text-blue-700"/>)}</div>
                : <p className="text-sm text-slate-400 italic">No skills added. <button onClick={()=>setMode('edit')} className="text-blue-600 hover:underline">Add skills →</button></p>}
              {form.interests.length>0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.interests.map((i)=><Pill key={i} text={i} color="bg-indigo-50 text-indigo-700"/>)}
                </div>
              )}
            </section>

            {/* Education */}
            <section className="card p-6">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Education</h2>
              {form.diplomaDocuments.length ? (
                form.diplomaDocuments.map((d,i)=>(
                  <div key={i} className="flex gap-4 py-2 border-b border-slate-100 last:border-0">
                    <div className="mt-1 h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                      {(d.university||'U')[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{d.university}</p>
                      <p className="text-xs text-slate-500">{d.degree} {d.fieldOfStudy && `· ${d.fieldOfStudy}`} {d.gpa && `· GPA ${d.gpa}`}</p>
                      <p className="text-xs text-slate-400">{d.startYear||''} – {d.graduated?d.graduationYear||'n/a':`Expected ${d.expectedGraduationYear||'n/a'}`}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">{form.university || 'University not set'}</p>
              )}
            </section>

            {/* Experience */}
            <section className="card p-6">
              <h2 className="mb-3 text-base font-semibold text-slate-900">Experience</h2>
              {form.experienceEntries.length ? (
                form.experienceEntries.map((x,i)=>(
                  <div key={i} className="flex gap-4 py-3 border-b border-slate-100 last:border-0">
                    <div className="mt-1 h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                      {(x.company||'C')[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{x.jobTitle}</p>
                      <p className="text-xs text-slate-500">{x.company} · {x.employmentType} · {x.workplaceType}</p>
                      <p className="text-xs text-slate-400">{x.startMonth} {x.startYear} – {x.currentlyWorking?'Present':`${x.endMonth||''} ${x.endYear||''}`}</p>
                      {x.description && <p className="mt-1 text-xs text-slate-600">{x.description}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No experience yet. <button onClick={()=>setMode('edit')} className="text-blue-600 hover:underline">Add experience →</button></p>
              )}
            </section>

            {/* Certificates */}
            {form.certificateDocuments.length>0 && (
              <section className="card p-6">
                <h2 className="mb-3 text-base font-semibold text-slate-900">Certificates</h2>
                <div className="space-y-3">
                  {form.certificateDocuments.map((c,i)=>(
                    <div key={i} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{c.issuer} {c.issueDate && `· ${fmtDate(c.issueDate)}`}</p>
                      {c.skillsCovered?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.skillsCovered.map((s)=><span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>)}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <section className="card p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Preferences</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">Format</span><span className="font-medium text-slate-900">{form.workplaceType}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Level</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${levelInfo.color}`}>{levelInfo.label}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${availInfo.color}`}>{availInfo.label}</span></div>
                {form.preferredRoles && <div className="flex items-start justify-between gap-2"><span className="text-slate-500 shrink-0">Role</span><span className="font-medium text-slate-900 text-right text-xs">{form.preferredRoles}</span></div>}
              </div>
            </section>

            {form.languageSelections.length>0 && (
              <section className="card p-5">
                <h2 className="mb-3 text-sm font-semibold text-slate-700">Languages</h2>
                <div className="flex flex-wrap gap-1.5">
                  {form.languageSelections.map((l)=><span key={l} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{l}</span>)}
                </div>
              </section>
            )}

            {(form.githubUrl||form.linkedinUrl||form.portfolioLinks.length>0) && (
              <section className="card p-5">
                <h2 className="mb-3 text-sm font-semibold text-slate-700">Links</h2>
                <div className="space-y-2">
                  {form.githubUrl && <a href={normalizeUrl(form.githubUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline">⌂ GitHub</a>}
                  {form.linkedinUrl && <a href={normalizeUrl(form.linkedinUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline">💼 LinkedIn</a>}
                  {form.portfolioLinks.map((link)=>(
                    <a key={link} href={link} target="_blank" rel="noreferrer" className="block truncate text-sm text-blue-700 hover:underline">🔗 {link}</a>
                  ))}
                </div>
              </section>
            )}

            <section className="card p-5">
              <button onClick={()=>setMode('edit')} className="btn-primary w-full text-sm">Edit profile</button>
            </section>
          </aside>
        </div>
      )}

      {/* ════════════ EDIT MODE (sections) ════════════ */}
      {mode === 'edit' && (
        <div className="space-y-5">

          {/* ① Basic info */}
          <section className="card p-6">
            <SectionHeader title="Basic Information" icon="👤" complete={saved.basic}/>
            <div className="grid gap-4 md:grid-cols-2">
              <LF label="First Name" hint="As on your ID">
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.firstName} onChange={(e)=>setForm({...form,firstName:e.target.value})} placeholder="Aibek"/>
              </LF>
              <LF label="Last Name">
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.lastName} onChange={(e)=>setForm({...form,lastName:e.target.value})} placeholder="Nurlanов"/>
              </LF>
              <LF label="Professional Headline" hint="e.g. 'React Developer · AITU 2025'">
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.headline} onChange={(e)=>setForm({...form,headline:e.target.value})} placeholder="Backend Developer · Python enthusiast"/>
              </LF>
              <LF label="Preferred Roles" hint="e.g. 'Backend Developer, ML Engineer'">
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.preferredRoles} onChange={(e)=>setForm({...form,preferredRoles:e.target.value})} placeholder="Backend Developer, Data Analyst"/>
              </LF>
              <LF label="Phone Number">
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value.replace(/[^\d+()\-\s]/g,'')})} placeholder="+7 777 123 4567"/>
              </LF>
              <LF label="Date of Birth">
                <input type="date" lang="en" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.birthDate} onChange={(e)=>setForm({...form,birthDate:e.target.value})}/>
              </LF>
              <LF label="Avatar photo" hint="JPG, PNG, max 5 MB">
                <div className="flex items-center gap-3">
                  {form.avatarDataUrl && <img src={form.avatarDataUrl} alt="preview" className="h-10 w-10 rounded-xl object-cover border"/>}
                  <input type="file" accept="image/*" onChange={uploadAvatar} className="text-sm"/>
                  {form.avatarDataUrl && <button type="button" className="text-xs text-red-500 hover:underline" onClick={()=>setForm({...form,avatarDataUrl:''})}>Remove</button>}
                </div>
              </LF>
              <LF label="About you" hint="2–4 sentences about yourself and your goals">
                <textarea className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none md:col-span-2" rows={4} value={form.about} onChange={(e)=>setForm({...form,about:e.target.value})} placeholder="I'm a junior backend developer passionate about Python and scalable systems. I enjoy building REST APIs and working with teams on real product challenges..."/>
              </LF>
            </div>
            <SaveBtn onClick={()=>saveSection('basic')} saved={saved.basic}/>
          </section>

          {/* ② Education */}
          <section className="card p-6">
            <SectionHeader title="Education" icon="🎓" complete={saved.education}/>
            <div className="grid gap-4 md:grid-cols-2">
              <LF label="University" hint="Start typing to search">
                <div>
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.university} onChange={(e)=>setForm({...form,university:e.target.value})} placeholder="Astana IT University"/>
                  {form.university && (
                    <div className="mt-1 max-h-36 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      {KAZAKHSTAN_UNIVERSITIES.filter((u)=>u.toLowerCase().includes(form.university.toLowerCase())).slice(0,6).map((u)=>(
                        <button key={u} type="button" className="block w-full px-3 py-2 text-left text-xs hover:bg-blue-50" onClick={()=>setForm({...form,university:u})}>{u}</button>
                      ))}
                    </div>
                  )}
                </div>
              </LF>
              <LF label="City">
                <div>
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} placeholder="Astana"/>
                  {form.city && (
                    <div className="mt-1 max-h-36 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      {CITIES.filter((c)=>c.toLowerCase().includes(form.city.toLowerCase())).map((c)=>(
                        <button key={c} type="button" className="block w-full px-3 py-2 text-left text-xs hover:bg-blue-50" onClick={()=>setForm({...form,city:c})}>{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              </LF>
            </div>

            {/* Diploma sub-form */}
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Add diploma / degree</p>
              <div className="grid gap-3 md:grid-cols-3">
                <LF label="University"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={dipDraft.university} onChange={(e)=>setDipDraft({...dipDraft,university:e.target.value})} placeholder="AITU"/></LF>
                <LF label="Degree"><select className="w-full rounded-xl border px-3 py-2 text-sm" value={dipDraft.degree||''} onChange={(e)=>setDipDraft({...dipDraft,degree:e.target.value})}><option value="">Select degree</option>{DEGREE_OPTIONS.map((d)=><option key={d}>{d}</option>)}</select></LF>
                <LF label="Field of Study"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={dipDraft.fieldOfStudy||''} onChange={(e)=>setDipDraft({...dipDraft,fieldOfStudy:e.target.value})} placeholder="Computer Science"/></LF>
                <LF label="GPA"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={dipDraft.gpa||''} onChange={(e)=>setDipDraft({...dipDraft,gpa:e.target.value})} placeholder="3.8"/></LF>
                <LF label="Start Year"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={dipDraft.startYear||''} onChange={(e)=>setDipDraft({...dipDraft,startYear:e.target.value})} placeholder="2021"/></LF>
                <LF label="Graduation Year"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={dipDraft.graduationYear||''} onChange={(e)=>setDipDraft({...dipDraft,graduationYear:e.target.value})} placeholder="2025"/></LF>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!dipDraft.graduated} onChange={(e)=>setDipDraft({...dipDraft,graduated:e.target.checked})}/> Graduated</label>
                <button type="button" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                  onClick={()=>{
                    if(!dipDraft.university) return setError('Diploma university is required.');
                    const list=[...form.diplomaDocuments];
                    if(editDipIdx===null) list.push(dipDraft); else list[editDipIdx]=dipDraft;
                    setForm({...form,diplomaDocuments:list}); setDipDraft({university:'',fileName:'',graduated:true}); setEditDipIdx(null);
                  }}>
                  {editDipIdx===null?'Add diploma':'Save changes'}
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {form.diplomaDocuments.map((d,i)=>(
                <div key={i} className="flex items-center justify-between rounded-xl border p-3">
                  <div><p className="text-sm font-semibold text-slate-900">{d.university}</p><p className="text-xs text-slate-500">{d.degree} · {d.graduated?`Graduated ${d.graduationYear}`:`Expected ${d.expectedGraduationYear}`}</p></div>
                  <div className="flex gap-2"><button type="button" className="text-xs text-blue-600 hover:underline" onClick={()=>{setDipDraft(d);setEditDipIdx(i);}}>Edit</button><button type="button" className="text-xs text-red-500 hover:underline" onClick={()=>setForm({...form,diplomaDocuments:form.diplomaDocuments.filter((_,j)=>j!==i)})}>Delete</button></div>
                </div>
              ))}
            </div>
            <SaveBtn onClick={()=>saveSection('education')} saved={saved.education}/>
          </section>

          {/* ③ Skills */}
          <section className="card p-6">
            <SectionHeader title="Skills & Interests" icon="⚡" complete={saved.skills}/>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <LF label="Skills" hint="Type + Enter or click to add">
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={skillQ} onChange={(e)=>setSkillQ(e.target.value)}
                    onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();addTag(skillQ,'skills');setSkillQ('');}}} placeholder="e.g. Python, React"/>
                </LF>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.skills.map((s)=><Pill key={s} text={s} color="bg-blue-50 text-blue-700" onRemove={()=>removeTag(s,'skills')}/>)}
                </div>
                <p className="mt-2 text-xs text-slate-400">Quick add:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {SKILLS.filter((s)=>!form.skills.includes(s)).slice(0,12).map((s)=>(
                    <button key={s} type="button" onClick={()=>addTag(s,'skills')} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700">{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <LF label="Interests" hint="Areas you want to work in">
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none"
                    onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();addTag((e.target as HTMLInputElement).value,'interests');(e.target as HTMLInputElement).value='';}}} placeholder="e.g. Backend, AI/ML"/>
                </LF>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.interests.map((i)=><Pill key={i} text={i} color="bg-indigo-50 text-indigo-700" onRemove={()=>removeTag(i,'interests')}/>)}
                </div>
                <p className="mt-2 text-xs text-slate-400">Quick add:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {INTERESTS.filter((s)=>!form.interests.includes(s)).map((s)=>(
                    <button key={s} type="button" onClick={()=>addTag(s,'interests')} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700">{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <SaveBtn onClick={()=>saveSection('skills')} saved={saved.skills}/>
          </section>

          {/* ④ Experience */}
          <section className="card p-6">
            <SectionHeader title="Work Experience" icon="💼" complete={saved.experience}/>
            <div className="rounded-xl border border-dashed border-slate-300 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Add experience</p>
              <div className="grid gap-3 md:grid-cols-2">
                <LF label="Job Title"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={expDraft.jobTitle} onChange={(e)=>setExpDraft({...expDraft,jobTitle:e.target.value})} placeholder="Backend Developer"/></LF>
                <LF label="Company"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={expDraft.company||''} onChange={(e)=>setExpDraft({...expDraft,company:e.target.value})} placeholder="TechHub KZ"/></LF>
                <LF label="Employment Type">
                  <select className="w-full rounded-xl border px-3 py-2 text-sm" value={expDraft.employmentType||''} onChange={(e)=>setExpDraft({...expDraft,employmentType:e.target.value})}>
                    <option value="">Select type</option>
                    <option>Full-time</option><option>Part-time</option><option>Freelance</option><option>Internship</option><option>Contract</option>
                  </select>
                </LF>
                <LF label="Workplace Type">
                  <select className="w-full rounded-xl border px-3 py-2 text-sm" value={expDraft.workplaceType||'Remote'} onChange={(e)=>setExpDraft({...expDraft,workplaceType:e.target.value})}>
                    <option>Remote</option><option>On-site</option><option>Hybrid</option>
                  </select>
                </LF>
                <LF label="Start">
                  <div className="grid grid-cols-2 gap-2">
                    <select className="rounded-xl border px-3 py-2 text-sm" value={expDraft.startMonth||''} onChange={(e)=>setExpDraft({...expDraft,startMonth:e.target.value})}><option value="">Month</option>{MONTHS.map((m)=><option key={m}>{m}</option>)}</select>
                    <input className="rounded-xl border px-3 py-2 text-sm" value={expDraft.startYear||''} onChange={(e)=>setExpDraft({...expDraft,startYear:e.target.value})} placeholder="2024"/>
                  </div>
                </LF>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!expDraft.currentlyWorking} onChange={(e)=>setExpDraft({...expDraft,currentlyWorking:e.target.checked})}/> Currently working here</label>
                </div>
                {!expDraft.currentlyWorking && (
                  <LF label="End">
                    <div className="grid grid-cols-2 gap-2">
                      <select className="rounded-xl border px-3 py-2 text-sm" value={expDraft.endMonth||''} onChange={(e)=>setExpDraft({...expDraft,endMonth:e.target.value})}><option value="">Month</option>{MONTHS.map((m)=><option key={m}>{m}</option>)}</select>
                      <input className="rounded-xl border px-3 py-2 text-sm" value={expDraft.endYear||''} onChange={(e)=>setExpDraft({...expDraft,endYear:e.target.value})} placeholder="2025"/>
                    </div>
                  </LF>
                )}
                <LF label="Description" hint="What did you build / achieve?">
                  <textarea className="w-full resize-none rounded-xl border px-3 py-2 text-sm" rows={3} value={expDraft.description||''} onChange={(e)=>setExpDraft({...expDraft,description:e.target.value})} placeholder="Built REST API for logistics platform using Python and FastAPI..."/>
                </LF>
              </div>
              <button type="button" className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                onClick={()=>{
                  if(!expDraft.jobTitle) return setError('Job title is required.');
                  const list=[...form.experienceEntries];
                  if(editExpIdx===null) list.push(expDraft); else list[editExpIdx]=expDraft;
                  setForm({...form,experienceEntries:list}); setExpDraft({jobTitle:'',currentlyWorking:true,workplaceType:'Remote'}); setEditExpIdx(null);
                }}>
                {editExpIdx===null?'Add experience':'Save changes'}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {form.experienceEntries.map((x,i)=>(
                <div key={i} className="flex items-start justify-between rounded-xl border p-3 gap-3">
                  <div><p className="text-sm font-semibold">{x.jobTitle}</p><p className="text-xs text-slate-500">{x.company} · {x.employmentType}</p><p className="text-xs text-slate-400">{x.startMonth} {x.startYear} – {x.currentlyWorking?'Present':`${x.endMonth||''} ${x.endYear||''}`}</p></div>
                  <div className="flex gap-2 shrink-0"><button type="button" className="text-xs text-blue-600 hover:underline" onClick={()=>{setExpDraft(x);setEditExpIdx(i);}}>Edit</button><button type="button" className="text-xs text-red-500 hover:underline" onClick={()=>setForm({...form,experienceEntries:form.experienceEntries.filter((_,j)=>j!==i)})}>Delete</button></div>
                </div>
              ))}
            </div>
            <SaveBtn onClick={()=>saveSection('experience')} saved={saved.experience}/>
          </section>

          {/* ⑤ Portfolio & Certificates */}
          <section className="card p-6">
            <SectionHeader title="Portfolio & Certificates" icon="📁" complete={saved.portfolio}/>
            <LF label="Portfolio link" hint="GitHub project, website, Behance, etc.">
              <div className="flex gap-2">
                <input className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={portDraft} onChange={(e)=>setPortDraft(e.target.value)} placeholder="https://github.com/username/project"/>
                <button type="button" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                  onClick={()=>{
                    const u=normalizeUrl(portDraft); if(!u) return;
                    try { new URL(u); } catch { return setError('Enter a valid URL.'); }
                    const list=[...form.portfolioLinks];
                    if(editPortIdx===null) { if(list.includes(u)) return setError('Link already exists.'); list.push(u); }
                    else list[editPortIdx]=u;
                    setForm({...form,portfolioLinks:list}); setPortDraft(''); setEditPortIdx(null);
                  }}>
                  {editPortIdx===null?'Add':'Save'}
                </button>
              </div>
            </LF>
            <div className="mt-2 space-y-2">
              {form.portfolioLinks.map((link,i)=>(
                <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
                  <a href={link} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm text-blue-700 hover:underline">{link}</a>
                  <button type="button" className="text-xs text-blue-600 hover:underline" onClick={()=>{setPortDraft(link);setEditPortIdx(i);}}>Edit</button>
                  <button type="button" className="text-xs text-red-500 hover:underline" onClick={()=>setForm({...form,portfolioLinks:form.portfolioLinks.filter((_,j)=>j!==i)})}>Remove</button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <LF label="GitHub URL"><input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.githubUrl} onChange={(e)=>setForm({...form,githubUrl:e.target.value})} placeholder="https://github.com/username"/></LF>
            </div>
            <div className="mt-3">
              <LF label="LinkedIn URL"><input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={form.linkedinUrl} onChange={(e)=>setForm({...form,linkedinUrl:e.target.value})} placeholder="https://linkedin.com/in/username"/></LF>
            </div>

            {/* Certificate sub-form */}
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Add certificate</p>
              <div className="grid gap-3 md:grid-cols-2">
                <LF label="Certificate name"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={certDraft.name} onChange={(e)=>setCertDraft({...certDraft,name:e.target.value})} placeholder="AWS Cloud Practitioner"/></LF>
                <LF label="Issued by"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={certDraft.issuer||''} onChange={(e)=>setCertDraft({...certDraft,issuer:e.target.value})} placeholder="Amazon Web Services"/></LF>
                <LF label="Issue date"><input type="date" lang="en" className="w-full rounded-xl border px-3 py-2 text-sm" value={certDraft.issueDate||''} onChange={(e)=>setCertDraft({...certDraft,issueDate:e.target.value})}/></LF>
                <LF label="Skills covered" hint="Comma separated"><input className="w-full rounded-xl border px-3 py-2 text-sm" value={toCsv(certDraft.skillsCovered||[])} onChange={(e)=>setCertDraft({...certDraft,skillsCovered:fromCsv(e.target.value)})} placeholder="AWS, Cloud, Linux"/></LF>
              </div>
              <button type="button" className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                onClick={()=>{
                  if(!certDraft.name) return setError('Certificate name is required.');
                  const list=[...form.certificateDocuments];
                  if(editCertIdx===null) list.push({...certDraft,fileName:certDraft.fileName||certDraft.name}); else list[editCertIdx]=certDraft;
                  setForm({...form,certificateDocuments:list}); setCertDraft({name:'',fileName:''}); setEditCertIdx(null);
                }}>
                {editCertIdx===null?'Add certificate':'Save changes'}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {form.certificateDocuments.map((c,i)=>(
                <div key={i} className="flex items-center justify-between rounded-xl border p-3 gap-3">
                  <div><p className="text-sm font-semibold">{c.name}</p><p className="text-xs text-slate-500">{c.issuer}</p></div>
                  <div className="flex gap-2 shrink-0"><button type="button" className="text-xs text-blue-600 hover:underline" onClick={()=>{setCertDraft(c);setEditCertIdx(i);}}>Edit</button><button type="button" className="text-xs text-red-500 hover:underline" onClick={()=>setForm({...form,certificateDocuments:form.certificateDocuments.filter((_,j)=>j!==i)})}>Delete</button></div>
                </div>
              ))}
            </div>
            <SaveBtn onClick={()=>saveSection('portfolio')} saved={saved.portfolio}/>
          </section>

          {/* ⑥ Languages & Preferences */}
          <section className="card p-6">
            <SectionHeader title="Languages & Preferences" icon="🌐" complete={saved.preferences}/>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <LF label="Languages you speak">
                  <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-300 focus:outline-none" value={langQ} onChange={(e)=>setLangQ(e.target.value)} placeholder="Search language..."/>
                </LF>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.languageSelections.map((l)=>(
                    <Pill key={l} text={l} color="bg-slate-100 text-slate-700" onRemove={()=>setForm({...form,languageSelections:form.languageSelections.filter((x)=>x!==l)})}/>
                  ))}
                </div>
                <div className="mt-2 max-h-28 overflow-auto rounded-xl border border-slate-200">
                  {LANGUAGE_OPTIONS.filter((l)=>l.toLowerCase().includes(langQ.toLowerCase())&&!form.languageSelections.includes(l)).map((l)=>(
                    <button key={l} type="button" className="block w-full px-3 py-2 text-left text-xs hover:bg-blue-50" onClick={()=>setForm({...form,languageSelections:[...form.languageSelections,l]})}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <LF label="Experience level">
                  <div className="flex gap-2">
                    {LEVEL_OPTIONS.map((opt)=>(
                      <button key={opt.value} type="button" onClick={()=>setForm({...form,experienceLevel:opt.value})}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${form.experienceLevel===opt.value?`${opt.color} border-transparent`:'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </LF>
                <LF label="Availability">
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABILITY_OPTIONS.map((opt)=>(
                      <button key={opt.value} type="button" onClick={()=>setForm({...form,availabilityStatus:opt.value})}
                        className={`rounded-xl border py-2 text-xs font-semibold transition ${form.availabilityStatus===opt.value?`${opt.color} border-transparent`:'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </LF>
                <LF label="Work format">
                  <div className="flex flex-wrap gap-2">
                    {FORMAT_OPTIONS.map((f)=>(
                      <button key={f} type="button" onClick={()=>setForm({...form,workplaceType:f})}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${form.workplaceType===f?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </LF>
              </div>
            </div>
            <SaveBtn onClick={()=>saveSection('preferences')} saved={saved.preferences}/>
          </section>

          <div className="flex justify-center">
            <button onClick={()=>setMode('preview')} className="btn-secondary">Back to preview</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveBtn({ onClick, saved }: { onClick: ()=>void; saved?: boolean }) {
  return (
    <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
      <button type="button" onClick={onClick} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
        Save
      </button>
      {saved && <span className="text-sm font-medium text-emerald-600">✓ Saved successfully</span>}
    </div>
  );
}

'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

type CertificateDoc = {
  name: string;
  issuer?: string;
  issueDate?: string;
  expirationDate?: string;
  doesNotExpire?: boolean;
  skillsCovered?: string[];
  description?: string;
  fileName: string;
  fileSize?: number;
  fileDataUrl?: string;
};

type DiplomaDoc = {
  university: string;
  degree?: string;
  fieldOfStudy?: string;
  gpa?: string;
  startYear?: string;
  graduationYear?: string;
  graduated?: boolean;
  expectedGraduationYear?: string;
  notes?: string;
  fileName: string;
  fileSize?: number;
  fileDataUrl?: string;
};

type ExperienceEntry = {
  jobTitle: string;
  employmentType?: string;
  company?: string;
  currentlyWorking?: boolean;
  startMonth?: string;
  startYear?: string;
  endMonth?: string;
  endYear?: string;
  location?: string;
  workplaceType?: string;
  description?: string;
};

type ProfileData = {
  fullName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  workplaceType?: string;
  university: string;
  city: string;
  bio: string;
  about: string;
  headline?: string;
  experience?: string;
  projects?: string;
  experienceEntries?: ExperienceEntry[];
  languages?: string;
  achievements?: string;
  volunteering?: string;
  preferredRoles?: string;
  skills: string[];
  interests: string[];
  certificates: string[];
  diplomas?: string[];
  certificateDocuments?: CertificateDoc[];
  diplomaDocuments?: DiplomaDoc[];
  portfolioLinks: string[];
  githubUrl: string;
  linkedinUrl: string;
  avatar?: string;
  avatarDataUrl?: string;
  experienceLevel: string;
  availabilityStatus: string;
  completion: number;
  updatedAt?: string;
};

const CITIES = ['Almaty','Astana','Shymkent','Karaganda','Aktobe','Taraz','Pavlodar','Ust-Kamenogorsk','Semey','Atyrau','Kostanay','Kyzylorda','Uralsk','Petropavlovsk','Aktau','Temirtau','Turkistan','Kokshetau','Taldykorgan','Ekibastuz','Rudny','Zhezkazgan'];
const SKILLS = ['Python','JavaScript','TypeScript','SQL','PostgreSQL','React','Next.js','Node.js','Flask','Django','FastAPI','Docker','Git','REST API','Telegram Bot API','Figma','UI/UX','Product Management','Data Analysis','Machine Learning','QA Testing','HTML','CSS','Tailwind','Java','C++','C#','PHP'];
const INTERESTS = ['Data Science','Analytics','Recommendation Systems','Backend','Frontend','Mobile Development','Product Management','Research','Open Source'];
const LANGUAGE_OPTIONS = ['English','Russian','Kazakh','Turkish','German','French','Chinese','Spanish','Korean','Arabic'];
const DEGREE_OPTIONS = ['Bachelor’s','Master’s','PhD','Associate','Diploma','Foundation','Certificate Program','Other'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fromCsv(value: string) {
  return value.split(',').map((x) => x.trim()).filter(Boolean);
}

function toCsv(arr: string[] = []) {
  return arr.join(', ');
}

function normalizeUrlInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatEnglishDate(value?: string) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function toDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">{text}</div>;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [edit, setEdit] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [editingCertificateIndex, setEditingCertificateIndex] = useState<number | null>(null);
  const [editingDiplomaIndex, setEditingDiplomaIndex] = useState<number | null>(null);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);
  const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<number | null>(null);
  const [languageQuery, setLanguageQuery] = useState('');
  const [portfolioLinkDraft, setPortfolioLinkDraft] = useState('');

  const [form, setForm] = useState<any>({
    firstName: '', lastName: '', birthDate: '', phone: '', email: '',
    university: '', city: '', workplaceType: 'REMOTE',
    headline: '', preferredRoles: '', about: '', bio: '', experience: '', projects: '', languages: '', achievements: '', volunteering: '',
    languageSelections: [] as string[],
    skills: [] as string[], interests: [] as string[],
    githubUrl: '', linkedinUrl: '', portfolioLinks: [] as string[],
    experienceLevel: 'JUNIOR', availabilityStatus: 'AVAILABLE',
    avatarDataUrl: '',
    certificateDocuments: [] as CertificateDoc[],
    diplomaDocuments: [] as DiplomaDoc[],
    experienceEntries: [] as ExperienceEntry[]
  });

  const [certificateDraft, setCertificateDraft] = useState<CertificateDoc>({ name: '', fileName: '' });
  const [diplomaDraft, setDiplomaDraft] = useState<DiplomaDoc>({ university: '', fileName: '', graduated: true });
  const [experienceDraft, setExperienceDraft] = useState<ExperienceEntry>({ jobTitle: '', currentlyWorking: true, workplaceType: 'Remote' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/student/profile');
        const payload = await res.json();
        if (!res.ok || !payload?.success) throw new Error(payload?.error || 'Failed to load profile');
        const p: ProfileData = payload.data;
        setProfile(p);
        setForm((prev: any) => ({
          ...prev,
          firstName: p.firstName || p.fullName?.split(' ')[0] || '',
          lastName: p.lastName || p.fullName?.split(' ').slice(1).join(' ') || '',
          email: p.email || '',
          birthDate: p.birthDate || '',
          phone: p.phone || '',
          university: p.university || '',
          city: p.city || '',
          workplaceType: p.workplaceType || 'REMOTE',
          headline: p.headline || '',
          preferredRoles: p.preferredRoles || '',
          about: p.about || '',
          bio: p.bio || '',
          experience: p.experience || '',
          projects: p.projects || '',
          experienceEntries: p.experienceEntries || [],
          languages: p.languages || '',
          languageSelections: fromCsv(p.languages || ''),
          achievements: p.achievements || '',
          volunteering: p.volunteering || '',
          skills: p.skills || [],
          interests: p.interests || [],
          githubUrl: p.githubUrl || '',
          linkedinUrl: p.linkedinUrl || '',
          portfolioLinks: p.portfolioLinks || [],
          experienceLevel: p.experienceLevel || 'JUNIOR',
          availabilityStatus: p.availabilityStatus || 'AVAILABLE',
          avatarDataUrl: p.avatarDataUrl || p.avatar || '',
          certificateDocuments: p.certificateDocuments || [],
          diplomaDocuments: p.diplomaDocuments || []
        }));
        setEdit(false);
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completion = useMemo(() => {
    const checks = [form.firstName, form.lastName, form.university, form.city, form.headline, form.about, form.skills.length, form.interests.length, form.languageSelections.length, form.githubUrl, form.linkedinUrl, form.experienceLevel, form.availabilityStatus];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const addTag = (value: string, key: 'skills' | 'interests') => {
    const normalized = value.trim();
    if (!normalized) return;
    if (form[key].some((x: string) => x.toLowerCase() === normalized.toLowerCase())) return;
    setForm({ ...form, [key]: [...form[key], normalized] });
  };

  const uploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Avatar must be an image file.');
    setForm({ ...form, avatarDataUrl: await toDataUrl(file) });
  };

  const uploadCertificatePdf = async (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return setError('Certificate file must be PDF.');
    if (file.size > 10 * 1024 * 1024) return setError('Certificate PDF must be <= 10 MB.');
    setCertificateDraft({ ...certificateDraft, fileName: file.name, fileSize: file.size, fileDataUrl: await toDataUrl(file) });
  };

  const uploadDiplomaPdf = async (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return setError('Diploma file must be PDF.');
    if (file.size > 10 * 1024 * 1024) return setError('Diploma PDF must be <= 10 MB.');
    setDiplomaDraft({ ...diplomaDraft, fileName: file.name, fileSize: file.size, fileDataUrl: await toDataUrl(file) });
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const githubUrl = normalizeUrlInput(form.githubUrl || '');
      const linkedinUrl = normalizeUrlInput(form.linkedinUrl || '');

      if (githubUrl) new URL(githubUrl);
      if (linkedinUrl) new URL(linkedinUrl);

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: form.birthDate,
        phone: form.phone,
        workplaceType: form.workplaceType,
        university: form.university,
        city: form.city,
        bio: form.bio,
        about: form.about,
        headline: form.headline,
        experience: form.experience,
        projects: form.projects,
        experienceEntries: form.experienceEntries,
        languages: (form.languageSelections || []).join(', '),
        achievements: form.achievements,
        volunteering: form.volunteering,
        preferredRoles: form.preferredRoles,
        skills: form.skills,
        interests: form.interests,
        certificates: form.certificateDocuments.map((x: CertificateDoc) => x.name),
        diplomas: form.diplomaDocuments.map((x: DiplomaDoc) => `${x.university} ${x.degree || ''}`.trim()),
        certificateDocuments: form.certificateDocuments,
        diplomaDocuments: form.diplomaDocuments,
        portfolioLinks: form.portfolioLinks,
        githubUrl,
        linkedinUrl,
        avatarDataUrl: form.avatarDataUrl,
        avatar: form.avatarDataUrl,
        experienceLevel: form.experienceLevel,
        availabilityStatus: form.availabilityStatus
      };
      const res = await fetch('/api/student/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to save profile');
      setProfile(data.data);
      setMessage('Profile saved successfully.');
      setEdit(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card p-8">Loading profile...</div>;

  return (
    <div className="space-y-6 py-2">
      {(error || message) && <div className={`card p-4 text-sm ${error ? 'text-red-600' : 'text-emerald-700'}`}>{error || message}</div>}

      <section className="card overflow-hidden p-0">
        <div className="h-28 bg-gradient-to-r from-indigo-600 to-cyan-500" />
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow">
              {form.avatarDataUrl ? <img src={form.avatarDataUrl} alt="avatar" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-600">{(form.firstName || 'U')[0]}</div>}
            </div>
            <div>
              <h1 className="section-title">{`${form.firstName || ''} ${form.lastName || ''}`.trim() || 'Profile'}</h1>
              <p className="muted">{form.headline || 'Add a professional headline.'}</p>
              <p className="text-xs text-slate-500">Last updated: {formatEnglishDate(profile?.updatedAt)}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3 text-right">
            <p className="text-xs uppercase text-slate-500">Profile completeness</p>
            <p className="text-xl font-semibold">{completion}%</p>
            <button type="button" onClick={() => setEdit(!edit)} className="mt-2 rounded-md border px-3 py-1 text-xs">{edit ? 'Preview profile' : 'Edit profile'}</button>
          </div>
        </div>
      </section>

      {edit ? (
        <form onSubmit={saveProfile} className="space-y-6">
          <section className="card p-6"><h2 className="mb-4 text-lg font-semibold">Personal Information</h2><div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="First Name"><input className="rounded-xl border px-3 py-2 text-sm" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} /></LabeledField>
            <LabeledField label="Last Name"><input className="rounded-xl border px-3 py-2 text-sm" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} /></LabeledField>
            <LabeledField label="Date of Birth"><input type="date" lang="en" className="rounded-xl border px-3 py-2 text-sm" value={form.birthDate} onChange={(e)=>setForm({...form, birthDate:e.target.value})} /></LabeledField>
            <LabeledField label="Phone Number"><input className="rounded-xl border px-3 py-2 text-sm" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value.replace(/[^\d+()\-\s]/g,'')})} /></LabeledField>
            <LabeledField label="Email"><input readOnly className="rounded-xl border bg-slate-50 px-3 py-2 text-sm" value={form.email} /></LabeledField>
            <LabeledField label="Avatar"><div className="flex items-center gap-2"><input type="file" accept="image/*" onChange={uploadAvatar} />{form.avatarDataUrl && <button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>setForm({...form, avatarDataUrl:''})}>Remove</button>}</div></LabeledField>
          </div></section>

          <section className="card p-6"><h2 className="mb-4 text-lg font-semibold">Education</h2><div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="University"><input className="rounded-xl border px-3 py-2 text-sm" value={form.university} onChange={(e)=>setForm({...form, university:e.target.value})} placeholder="Search university" /><div className="mt-2 max-h-32 overflow-auto rounded-xl border p-2">{KAZAKHSTAN_UNIVERSITIES.filter((u)=>u.toLowerCase().includes(form.university.toLowerCase())).slice(0,8).map((u)=><button key={u} type="button" className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-50" onClick={()=>setForm({...form, university:u})}>{u}</button>)}</div></LabeledField>
            <LabeledField label="City"><input className="rounded-xl border px-3 py-2 text-sm" value={form.city} onChange={(e)=>setForm({...form, city:e.target.value})} placeholder="Search city" /><div className="mt-2 max-h-32 overflow-auto rounded-xl border p-2">{CITIES.filter((c)=>c.toLowerCase().includes(form.city.toLowerCase())).map((c)=><button key={c} type="button" className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-50" onClick={()=>setForm({...form, city:c})}>{c}</button>)}</div></LabeledField>
          </div></section>

          <section className="card p-6"><h2 className="mb-4 text-lg font-semibold">Skills</h2><div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Skills"><input className="rounded-xl border px-3 py-2 text-sm" placeholder="Type and press Enter" onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();addTag((e.target as HTMLInputElement).value,'skills');(e.target as HTMLInputElement).value='';}}} /><div className="mt-2 flex flex-wrap gap-2">{form.skills.map((x:string)=><span key={x} className="rounded-full bg-blue-50 px-2 py-1 text-xs">{x}</span>)}</div><div className="mt-2 flex flex-wrap gap-1">{SKILLS.slice(0,10).map((s)=><button type="button" key={s} onClick={()=>addTag(s,'skills')} className="rounded-full border px-2 py-0.5 text-xs">{s}</button>)}</div></LabeledField>
            <LabeledField label="Interests"><input className="rounded-xl border px-3 py-2 text-sm" placeholder="Type and press Enter" onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();addTag((e.target as HTMLInputElement).value,'interests');(e.target as HTMLInputElement).value='';}}} /><div className="mt-2 flex flex-wrap gap-2">{form.interests.map((x:string)=><span key={x} className="rounded-full bg-indigo-50 px-2 py-1 text-xs">{x}</span>)}</div><div className="mt-2 flex flex-wrap gap-1">{INTERESTS.map((s)=><button type="button" key={s} onClick={()=>addTag(s,'interests')} className="rounded-full border px-2 py-0.5 text-xs">{s}</button>)}</div></LabeledField>
          </div></section>

          <section className="card p-6"><h2 className="mb-4 text-lg font-semibold">Certificates</h2><div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Certificate Name"><input className="rounded-xl border px-3 py-2 text-sm" value={certificateDraft.name} onChange={(e)=>setCertificateDraft({...certificateDraft, name:e.target.value})} /></LabeledField>
            <LabeledField label="Issued By"><input className="rounded-xl border px-3 py-2 text-sm" value={certificateDraft.issuer||''} onChange={(e)=>setCertificateDraft({...certificateDraft, issuer:e.target.value})} /></LabeledField>
            <LabeledField label="Issue Date"><input type="date" lang="en" className="rounded-xl border px-3 py-2 text-sm" value={certificateDraft.issueDate||''} onChange={(e)=>setCertificateDraft({...certificateDraft, issueDate:e.target.value})} /></LabeledField>
            <LabeledField label="Expiration Date"><input type="date" lang="en" disabled={certificateDraft.doesNotExpire} className="rounded-xl border px-3 py-2 text-sm" value={certificateDraft.expirationDate||''} onChange={(e)=>setCertificateDraft({...certificateDraft, expirationDate:e.target.value})} /></LabeledField>
            <LabeledField label="Does Not Expire"><input type="checkbox" checked={!!certificateDraft.doesNotExpire} onChange={(e)=>setCertificateDraft({...certificateDraft, doesNotExpire:e.target.checked})} /></LabeledField>
            <LabeledField label="Skills / Topics Covered"><input className="rounded-xl border px-3 py-2 text-sm" value={toCsv(certificateDraft.skillsCovered||[])} onChange={(e)=>setCertificateDraft({...certificateDraft, skillsCovered:fromCsv(e.target.value)})} /></LabeledField>
            <LabeledField label="Description"><textarea className="min-h-28 rounded-xl border px-3 py-2 text-sm" value={certificateDraft.description||''} onChange={(e)=>setCertificateDraft({...certificateDraft, description:e.target.value})} /></LabeledField>
            <LabeledField label="Certificate PDF"><input type="file" accept="application/pdf" onChange={(e)=>uploadCertificatePdf(e.target.files?.[0])} /></LabeledField>
          </div>
          <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={()=>{ if(!certificateDraft.name || !certificateDraft.fileName) return setError('Certificate name and PDF are required.'); const list=[...form.certificateDocuments]; if(editingCertificateIndex===null) list.push(certificateDraft); else list[editingCertificateIndex]=certificateDraft; setForm({...form, certificateDocuments:list}); setCertificateDraft({name:'', fileName:''}); setEditingCertificateIndex(null); }}>{editingCertificateIndex===null?'Add certificate':'Save certificate changes'}</button>
          <div className="mt-3 space-y-2">{form.certificateDocuments.length?form.certificateDocuments.map((c:CertificateDoc,i:number)=><div key={`${c.name}-${i}`} className="rounded-xl border p-3"><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-slate-500">{c.issuer || 'Issuer n/a'} · Issue: {formatEnglishDate(c.issueDate)} · Expiration: {c.doesNotExpire?'Does not expire':formatEnglishDate(c.expirationDate)}</p><p className="mt-1 text-xs text-slate-600">{c.description || 'No description'}</p><p className="mt-1 text-xs text-slate-500">PDF: {c.fileName}</p><div className="mt-2 flex gap-2"><button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>{setCertificateDraft(c);setEditingCertificateIndex(i);}}>✏️ Edit</button><button type="button" className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600" onClick={()=>{if(window.confirm('Delete this certificate?')) setForm({...form, certificateDocuments:form.certificateDocuments.filter((_:unknown,idx:number)=>idx!==i)});}}>🗑 Delete</button>{c.fileDataUrl && <><button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>window.open(c.fileDataUrl,'_blank')}>View PDF</button><a className="rounded-md border px-2 py-1 text-xs" href={c.fileDataUrl} download={c.fileName}>Download PDF</a></>}</div></div>):<EmptyState text="No certificates added yet." />}</div>
          </section>

          <section className="card p-6"><h2 className="mb-4 text-lg font-semibold">Diplomas</h2><div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="University"><input className="rounded-xl border px-3 py-2 text-sm" value={diplomaDraft.university} onChange={(e)=>setDiplomaDraft({...diplomaDraft, university:e.target.value})} /></LabeledField>
            <LabeledField label="Degree"><select className="rounded-xl border px-3 py-2 text-sm" value={diplomaDraft.degree||''} onChange={(e)=>setDiplomaDraft({...diplomaDraft, degree:e.target.value})}><option value="">Select degree</option>{DEGREE_OPTIONS.map((d)=><option key={d} value={d}>{d}</option>)}</select></LabeledField>
            <LabeledField label="Field of Study"><input className="rounded-xl border px-3 py-2 text-sm" value={diplomaDraft.fieldOfStudy||''} onChange={(e)=>setDiplomaDraft({...diplomaDraft, fieldOfStudy:e.target.value})} /></LabeledField>
            <LabeledField label="GPA"><input className="rounded-xl border px-3 py-2 text-sm" value={diplomaDraft.gpa||''} onChange={(e)=>setDiplomaDraft({...diplomaDraft, gpa:e.target.value})} /></LabeledField>
            <LabeledField label="Start Year"><input className="rounded-xl border px-3 py-2 text-sm" value={diplomaDraft.startYear||''} onChange={(e)=>setDiplomaDraft({...diplomaDraft, startYear:e.target.value})} /></LabeledField>
            <LabeledField label="Graduation Year"><input className="rounded-xl border px-3 py-2 text-sm" value={diplomaDraft.graduationYear||''} onChange={(e)=>setDiplomaDraft({...diplomaDraft, graduationYear:e.target.value})} /></LabeledField>
            <LabeledField label="Graduated"><input type="checkbox" checked={!!diplomaDraft.graduated} onChange={(e)=>setDiplomaDraft({...diplomaDraft, graduated:e.target.checked})} /></LabeledField>
            {!diplomaDraft.graduated && <LabeledField label="Expected Graduation Year"><input className="rounded-xl border px-3 py-2 text-sm" value={diplomaDraft.expectedGraduationYear||''} onChange={(e)=>setDiplomaDraft({...diplomaDraft, expectedGraduationYear:e.target.value})} /></LabeledField>}
            <LabeledField label="Notes"><textarea className="min-h-40 rounded-xl border px-3 py-2 text-sm" value={diplomaDraft.notes||''} onChange={(e)=>setDiplomaDraft({...diplomaDraft, notes:e.target.value})} /></LabeledField>
            <LabeledField label="Diploma PDF"><input type="file" accept="application/pdf" onChange={(e)=>uploadDiplomaPdf(e.target.files?.[0])} /></LabeledField>
          </div>
          <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={()=>{ if(!diplomaDraft.university || !diplomaDraft.fileName) return setError('Diploma university and PDF are required.'); const list=[...form.diplomaDocuments]; if(editingDiplomaIndex===null) list.push(diplomaDraft); else list[editingDiplomaIndex]=diplomaDraft; setForm({...form, diplomaDocuments:list}); setDiplomaDraft({university:'', fileName:'', graduated:true}); setEditingDiplomaIndex(null); }}>{editingDiplomaIndex===null?'Add diploma':'Save diploma changes'}</button>
          <div className="mt-3 space-y-2">{form.diplomaDocuments.length?form.diplomaDocuments.map((d:DiplomaDoc,i:number)=><div key={`${d.university}-${i}`} className="rounded-xl border p-3"><p className="font-medium text-sm">{d.university}</p><p className="text-xs text-slate-500">{d.degree || 'Degree n/a'} · {d.graduated ? `Graduated: ${d.graduationYear || 'n/a'}` : `Expected: ${d.expectedGraduationYear || 'n/a'}`}</p><div className="mt-2 flex gap-2"><button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>{setDiplomaDraft(d);setEditingDiplomaIndex(i);}}>✏️ Edit</button><button type="button" className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600" onClick={()=>{if(window.confirm('Delete this diploma?')) setForm({...form, diplomaDocuments:form.diplomaDocuments.filter((_:unknown,idx:number)=>idx!==i)});}}>🗑 Delete</button>{d.fileDataUrl && <><button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>window.open(d.fileDataUrl,'_blank')}>View PDF</button><a className="rounded-md border px-2 py-1 text-xs" href={d.fileDataUrl} download={d.fileName}>Download PDF</a></>}</div></div>):<EmptyState text="No diplomas added yet." />}</div>
          </section>

          <section className="card p-6"><h2 className="mb-4 text-lg font-semibold">Experience</h2><div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Job Title"><input className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.jobTitle||''} onChange={(e)=>setExperienceDraft({...experienceDraft, jobTitle:e.target.value})} /></LabeledField>
            <LabeledField label="Employment Type"><input className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.employmentType||''} onChange={(e)=>setExperienceDraft({...experienceDraft, employmentType:e.target.value})} /></LabeledField>
            <LabeledField label="Company / Organization"><input className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.company||''} onChange={(e)=>setExperienceDraft({...experienceDraft, company:e.target.value})} /></LabeledField>
            <LabeledField label="Location / Region"><input className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.location||''} onChange={(e)=>setExperienceDraft({...experienceDraft, location:e.target.value})} /></LabeledField>
            <LabeledField label="Workplace Type"><select className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.workplaceType||'Remote'} onChange={(e)=>setExperienceDraft({...experienceDraft, workplaceType:e.target.value})}><option>On-site</option><option>Hybrid</option><option>Remote</option></select></LabeledField>
            <LabeledField label="Currently Working Here"><input type="checkbox" checked={!!experienceDraft.currentlyWorking} onChange={(e)=>setExperienceDraft({...experienceDraft, currentlyWorking:e.target.checked})} /></LabeledField>
            <LabeledField label="Start Month"><select className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.startMonth||''} onChange={(e)=>setExperienceDraft({...experienceDraft, startMonth:e.target.value})}><option value="">Month</option>{MONTHS.map((m)=><option key={m}>{m}</option>)}</select></LabeledField>
            <LabeledField label="Start Year"><input className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.startYear||''} onChange={(e)=>setExperienceDraft({...experienceDraft, startYear:e.target.value})} placeholder="YYYY" /></LabeledField>
            {!experienceDraft.currentlyWorking && <><LabeledField label="End Month"><select className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.endMonth||''} onChange={(e)=>setExperienceDraft({...experienceDraft, endMonth:e.target.value})}><option value="">Month</option>{MONTHS.map((m)=><option key={m}>{m}</option>)}</select></LabeledField><LabeledField label="End Year"><input className="rounded-xl border px-3 py-2 text-sm" value={experienceDraft.endYear||''} onChange={(e)=>setExperienceDraft({...experienceDraft, endYear:e.target.value})} placeholder="YYYY" /></LabeledField></>}
            <LabeledField label="Description"><textarea className="min-h-32 rounded-xl border px-3 py-2 text-sm" value={experienceDraft.description||''} onChange={(e)=>setExperienceDraft({...experienceDraft, description:e.target.value})} /></LabeledField>
          </div>
          <button type="button" className="mt-3 rounded-lg border px-3 py-2 text-sm" onClick={()=>{ if(!experienceDraft.jobTitle) return setError('Job title is required.'); const list=[...form.experienceEntries]; if(editingExperienceIndex===null) list.push(experienceDraft); else list[editingExperienceIndex]=experienceDraft; setForm({...form, experienceEntries:list}); setExperienceDraft({jobTitle:'', currentlyWorking:true, workplaceType:'Remote'}); setEditingExperienceIndex(null); }}>{editingExperienceIndex===null?'Add experience':'Save experience changes'}</button>
          <div className="mt-3 space-y-2">{form.experienceEntries.length?form.experienceEntries.map((x:ExperienceEntry,i:number)=><div key={`${x.jobTitle}-${i}`} className="rounded-xl border p-3"><p className="font-medium text-sm">{x.jobTitle}</p><p className="text-xs text-slate-500">{x.company || 'Company n/a'} · {x.employmentType || 'Employment n/a'} · {x.workplaceType || 'Remote'}</p><p className="text-xs text-slate-500">{x.startMonth || ''} {x.startYear || ''} - {x.currentlyWorking ? 'Present' : `${x.endMonth || ''} ${x.endYear || ''}`}</p><p className="mt-1 text-xs text-slate-600">{x.description || 'No description'}</p><div className="mt-2 flex gap-2"><button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>{setExperienceDraft(x);setEditingExperienceIndex(i);}}>✏️ Edit</button><button type="button" className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600" onClick={()=>{if(window.confirm('Delete this experience entry?')) setForm({...form, experienceEntries:form.experienceEntries.filter((_:unknown,idx:number)=>idx!==i)});}}>🗑 Delete</button></div></div>):<EmptyState text="No experience entries yet." />}</div>
          </section>

          <section className="card p-6"><h2 className="mb-4 text-lg font-semibold">Additional Information</h2><div className="grid gap-4 md:grid-cols-2">
            <LabeledField label="Professional Headline"><input className="rounded-xl border px-3 py-2 text-sm" value={form.headline} onChange={(e)=>setForm({...form, headline:e.target.value})} /></LabeledField>
            <LabeledField label="Preferred Roles"><input className="rounded-xl border px-3 py-2 text-sm" value={form.preferredRoles} onChange={(e)=>setForm({...form, preferredRoles:e.target.value})} /></LabeledField>
            <LabeledField label="About"><textarea className="min-h-28 rounded-xl border px-3 py-2 text-sm" value={form.about} onChange={(e)=>setForm({...form, about:e.target.value})} /></LabeledField>
            <LabeledField label="GitHub URL"><input className="rounded-xl border px-3 py-2 text-sm" value={form.githubUrl} onChange={(e)=>setForm({...form, githubUrl:e.target.value})} placeholder="https://github.com/username" /></LabeledField>
            <LabeledField label="LinkedIn URL"><input className="rounded-xl border px-3 py-2 text-sm" value={form.linkedinUrl} onChange={(e)=>setForm({...form, linkedinUrl:e.target.value})} placeholder="https://www.linkedin.com/in/username" /></LabeledField>
            <LabeledField label="Experience"><textarea className="min-h-28 rounded-xl border px-3 py-2 text-sm" value={form.experience} onChange={(e)=>setForm({...form, experience:e.target.value})} /></LabeledField>
            <LabeledField label="Projects"><textarea className="min-h-28 rounded-xl border px-3 py-2 text-sm" value={form.projects} onChange={(e)=>setForm({...form, projects:e.target.value})} /></LabeledField>
            <LabeledField label="Languages">
              <div className="rounded-xl border p-3">
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Search languages"
                  value={languageQuery}
                  onChange={(e) => setLanguageQuery(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {(form.languageSelections || []).map((lang: string) => (
                    <span key={lang} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs">
                      {lang}
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            languageSelections: (form.languageSelections || []).filter((x: string) => x !== lang)
                          })
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 max-h-28 space-y-1 overflow-auto">
                  {LANGUAGE_OPTIONS.filter((lang) => lang.toLowerCase().includes(languageQuery.toLowerCase())).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-50"
                      onClick={() => {
                        if ((form.languageSelections || []).includes(lang)) return;
                        setForm({ ...form, languageSelections: [...(form.languageSelections || []), lang] });
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </LabeledField>
            <LabeledField label="Achievements"><textarea className="min-h-28 rounded-xl border px-3 py-2 text-sm" value={form.achievements} onChange={(e)=>setForm({...form, achievements:e.target.value})} /></LabeledField>
            <LabeledField label="Volunteering"><textarea className="min-h-28 rounded-xl border px-3 py-2 text-sm" value={form.volunteering} onChange={(e)=>setForm({...form, volunteering:e.target.value})} /></LabeledField>
          </div></section>
          <section className="card p-6"><h2 className="mb-4 text-lg font-semibold">Portfolio Links</h2>
            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-[260px] flex-1 rounded-xl border px-3 py-2 text-sm"
                value={portfolioLinkDraft}
                onChange={(e)=>setPortfolioLinkDraft(e.target.value)}
                placeholder="https://your-portfolio-link.com"
              />
              <button
                type="button"
                className="rounded-lg border px-3 py-2 text-sm"
                onClick={() => {
                  const next = normalizeUrlInput(portfolioLinkDraft);
                  if (!next) return setError('Portfolio link is required.');
                  try { new URL(next); } catch { return setError('Enter a valid portfolio URL.'); }
                  const list = [...form.portfolioLinks];
                  if (editingPortfolioIndex === null) {
                    if (list.includes(next)) return setError('This portfolio link already exists.');
                    list.push(next);
                  } else {
                    list[editingPortfolioIndex] = next;
                  }
                  setForm({ ...form, portfolioLinks: list });
                  setPortfolioLinkDraft('');
                  setEditingPortfolioIndex(null);
                }}
              >
                {editingPortfolioIndex === null ? 'Add portfolio link' : 'Save portfolio link'}
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {form.portfolioLinks.length ? form.portfolioLinks.map((link: string, index: number) => (
                <div key={`${link}-${index}`} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
                  <a href={link} target="_blank" rel="noreferrer" className="min-w-[220px] flex-1 text-sm text-blue-700 underline">{link}</a>
                  <button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>{ setPortfolioLinkDraft(link); setEditingPortfolioIndex(index); }}>Edit</button>
                  <button type="button" className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600" onClick={()=>setForm({ ...form, portfolioLinks: form.portfolioLinks.filter((_: string, idx: number)=>idx !== index) })}>Remove</button>
                </div>
              )) : <EmptyState text="No portfolio links yet." />}
            </div>
          </section>

          <div className="flex justify-end"><button disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving profile...' : 'Save profile'}</button></div>
        </form>
      ) : (
        <div className="space-y-6">
          <section className="card p-6"><h2 className="text-lg font-semibold">About</h2><p className="mt-2 text-sm text-slate-600">{form.about || 'No about information yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Skills</h2><div className="mt-2 flex flex-wrap gap-2">{form.skills.length ? form.skills.map((x:string)=><span key={x} className="pill">{x}</span>) : <EmptyState text="No skills yet." />}</div></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Education</h2><p className="mt-2 text-sm">{form.university || 'University not set'} · {form.city || 'City not set'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Certificates</h2>{form.certificateDocuments.length ? form.certificateDocuments.map((x:CertificateDoc,i:number)=><div key={i} className="mt-3 rounded-xl border p-3"><p className="font-medium text-sm">{x.name}</p><p className="text-xs text-slate-500">{x.issuer || 'Issuer n/a'} · Issue: {formatEnglishDate(x.issueDate)} · Expiration: {x.doesNotExpire ? 'Does not expire' : formatEnglishDate(x.expirationDate)}</p><p className="mt-1 text-xs text-slate-600">{x.description || 'No description'}</p><p className="mt-1 text-xs">PDF: {x.fileName}</p>{x.fileDataUrl && <div className="mt-2 flex gap-2"><button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>window.open(x.fileDataUrl, '_blank')}>View PDF</button><a className="rounded-md border px-2 py-1 text-xs" href={x.fileDataUrl} download={x.fileName}>Download PDF</a></div>}</div>) : <EmptyState text="No certificates yet." />}</section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Diplomas</h2>{form.diplomaDocuments.length ? form.diplomaDocuments.map((x:DiplomaDoc,i:number)=><div key={i} className="mt-3 rounded-xl border p-3"><p className="font-medium text-sm">{x.university}</p><p className="text-xs text-slate-500">{x.degree || 'Degree n/a'} · {x.graduated ? `Graduated: ${x.graduationYear || 'n/a'}` : `Expected: ${x.expectedGraduationYear || 'n/a'}`}</p>{x.fileDataUrl && <div className="mt-2 flex gap-2"><button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={()=>window.open(x.fileDataUrl, '_blank')}>View PDF</button><a className="rounded-md border px-2 py-1 text-xs" href={x.fileDataUrl} download={x.fileName}>Download PDF</a></div>}</div>) : <EmptyState text="No diplomas yet." />}</section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Projects</h2><p className="mt-2 text-sm text-slate-600">{form.projects || 'No projects information yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Experience</h2>{form.experienceEntries.length ? form.experienceEntries.map((x:ExperienceEntry,i:number)=><div key={i} className="mt-3 rounded-xl border p-3"><p className="font-medium text-sm">{x.jobTitle}</p><p className="text-xs text-slate-500">{x.company || 'Company n/a'} · {x.employmentType || 'Employment n/a'} · {x.workplaceType || 'Remote'}</p><p className="text-xs text-slate-500">{x.startMonth || ''} {x.startYear || ''} - {x.currentlyWorking ? 'Present' : `${x.endMonth || ''} ${x.endYear || ''}`}</p><p className="mt-1 text-xs text-slate-600">{x.description || 'No description'}</p></div>) : <EmptyState text="No experience entries yet." />}</section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Languages</h2><div className="mt-2 flex flex-wrap gap-2">{(form.languageSelections||[]).length ? form.languageSelections.map((x:string)=><span key={x} className="rounded-full bg-slate-100 px-2 py-1 text-xs">{x}</span>) : <EmptyState text="No languages yet." />}</div></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Achievements</h2><p className="mt-2 text-sm text-slate-600">{form.achievements || 'No achievements yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Volunteering</h2><p className="mt-2 text-sm text-slate-600">{form.volunteering || 'No volunteering details yet.'}</p></section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Portfolio</h2>{form.portfolioLinks.length ? form.portfolioLinks.map((x:string)=><a key={x} href={x} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-blue-700 underline">{x}</a>) : <EmptyState text="No portfolio links yet." />}</section>
          <section className="card p-6"><h2 className="text-lg font-semibold">Career Preferences</h2><p className="mt-2 text-sm">{form.workplaceType} · {form.experienceLevel} · {form.availabilityStatus}</p></section>
        </div>
      )}

      <section className="card border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
        <p className="mt-2 text-sm text-red-600">Deleting your account is permanent and cannot be undone.</p>
        <button type="button" className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={() => {
          if (!window.confirm('Are you sure you want to permanently delete your account?')) return;
          setError('Delete account endpoint is not connected yet.');
        }}>
          Delete Account
        </button>
      </section>
    </div>
  );
}

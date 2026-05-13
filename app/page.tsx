'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';

const CATEGORIES = [
  { icon: '⚙️', label: 'Backend Dev', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { icon: '🎨', label: 'Frontend / UI', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { icon: '📊', label: 'Data Analytics', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { icon: '🤖', label: 'AI / ML', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { icon: '📱', label: 'Mobile Apps', color: 'bg-red-50 border-red-200 text-red-700' },
  { icon: '🔧', label: 'Automation', color: 'bg-slate-50 border-slate-200 text-slate-700' },
  { icon: '🔒', label: 'Cybersecurity', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { icon: '🎯', label: 'Product Design', color: 'bg-pink-50 border-pink-200 text-pink-700' },
];

const TESTIMONIALS = [
  {
    name: 'Aibek Nurlanov',
    role: 'Backend Developer · AITU 2024',
    text: 'Found my first real freelance project on UniWork. The ML match was accurate — they matched me with a Django project, and my skills were perfect for it.',
    avatar: 'AN',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'TechHub Kazakhstan',
    role: 'IT Company · Almaty',
    text: 'UniWork saved us weeks of hiring. We posted a project, got 12 ranked candidates in 24 hours, and hired a React developer who delivered everything on time.',
    avatar: 'TH',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Dinara Seitkali',
    role: 'Data Analyst · SDU University',
    text: 'The AI assistant helped me improve my profile and suggested projects matching my SQL skills. Got hired for a Power BI dashboard project — all through UniWork.',
    avatar: 'DS',
    color: 'bg-purple-100 text-purple-700',
  },
];

const COMPLETED_PROJECTS = [
  { title: 'E-commerce MVP', company: 'RetailKZ', budget: '$800', tech: ['React', 'Node.js', 'MongoDB'], student: 'Arman B.' },
  { title: 'Sales Analytics Dashboard', company: 'Finance Pro', budget: '$600', tech: ['Python', 'Power BI', 'SQL'], student: 'Aigerim K.' },
  { title: 'Telegram Bot for CRM', company: 'AgriTech', budget: '$350', tech: ['Python', 'Telegram API'], student: 'Nursultan M.' },
  { title: 'Mobile App Design', company: 'StartupHub', budget: '$500', tech: ['Figma', 'UI/UX'], student: 'Zarina T.' },
];

export default function HomePage() {
  const { T } = useI18n();
  const [scenario, setScenario] = useState<'student' | 'company'>('student');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: T('faq_q1'), a: T('faq_a1') },
    { q: T('faq_q2'), a: T('faq_a2') },
    { q: T('faq_q3'), a: T('faq_a3') },
    { q: T('faq_q4'), a: T('faq_a4') },
  ];

  return (
    <div className="space-y-0 -mt-6">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-16 md:px-12 md:py-24 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {[T('home_badge_verified'), T('home_badge_payments'), T('home_badge_messaging'), T('home_badge_matching')].map((b) => (
              <span key={b} className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                {b}
              </span>
            ))}
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {T('home_hero_title')}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-blue-100 md:text-xl">
            {T('home_hero_sub')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/projects" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 hover:shadow-xl">
              {T('home_cta_find_projects')}
            </Link>
            <Link href="/signin?tab=signup&role=client" className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
              {T('home_cta_hire_students')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="pt-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Trusted by students from leading universities</p>
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
          {['AITU', 'SDU', 'Narxoz', 'KBTU', 'Kimep', 'Al-Farabi KazNU', 'Satbayev Univ'].map((uni) => (
            <span key={uni} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              {uni}
            </span>
          ))}
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="grid gap-4 md:grid-cols-4 pt-6">
        {[
          { value: '2,300+', key: 'home_stats_students' as const, icon: '🎓' },
          { value: '91%', key: 'home_stats_match' as const, icon: '🎯' },
          { value: '540+', key: 'home_stats_projects' as const, icon: '✅' },
          { value: '85+', key: 'home_stats_companies' as const, icon: '🏢' },
        ].map(({ value, key, icon }) => (
          <div key={key} className="card p-6 text-center">
            <p className="text-2xl">{icon}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{T(key)}</p>
          </div>
        ))}
      </section>

      {/* ─── SCENARIO SWITCHER ─── */}
      <section className="card mt-6 overflow-hidden p-0">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setScenario('student')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition ${scenario === 'student' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            🎓 {T('home_for_students_title')}
          </button>
          <button
            onClick={() => setScenario('company')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition ${scenario === 'company' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            🏢 {T('home_for_companies_title')}
          </button>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="p-8 md:p-10">
            {scenario === 'student' ? (
              <>
                <p className="text-sm font-semibold text-blue-700">{T('home_for_students_title')}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{T('home_for_students_sub')}</h2>
                <ul className="mt-6 space-y-3">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <li key={n} className="flex items-center gap-3 text-sm text-slate-700">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{n}</span>
                      {T(`home_for_students_${n}` as any)}
                    </li>
                  ))}
                </ul>
                <Link href="/signin?tab=signup" className="mt-8 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  {T('home_final_cta_student')} →
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-indigo-700">{T('home_for_companies_title')}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{T('home_for_companies_sub')}</h2>
                <ul className="mt-6 space-y-3">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <li key={n} className="flex items-center gap-3 text-sm text-slate-700">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{n}</span>
                      {T(`home_for_companies_${n}` as any)}
                    </li>
                  ))}
                </ul>
                <Link href="/signin?tab=signup&role=client" className="mt-8 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
                  {T('home_final_cta_company')} →
                </Link>
              </>
            )}
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-8 md:border-l md:border-t-0 md:p-10">
            <p className="text-sm font-semibold text-slate-500">{T('home_how_title')}</p>
            <div className="mt-4 space-y-4">
              {([
                { step: '1', title: T('home_step1_title'), desc: T('home_step1_desc') },
                { step: '2', title: T('home_step2_title'), desc: T('home_step2_desc') },
                { step: '3', title: T('home_step3_title'), desc: T('home_step3_desc') },
              ]).map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{step}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="mt-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">{T('home_categories_title')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map(({ icon, label, color }) => (
            <Link
              key={label}
              href={`/projects?category=${encodeURIComponent(label)}`}
              className={`rounded-2xl border p-4 text-center text-sm font-semibold transition hover:shadow-md ${color}`}
            >
              <p className="text-2xl">{icon}</p>
              <p className="mt-2">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── COMPLETED PROJECTS ─── */}
      <section className="mt-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">🏆 Recent completed projects</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPLETED_PROJECTS.map((p) => (
            <div key={p.title} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{p.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.company}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{p.budget}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">{t}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">Completed by <span className="font-medium text-slate-700">{p.student}</span></p>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">✓ Delivered</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="mt-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">{T('home_testimonials_title')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((tm) => (
            <div key={tm.name} className="card p-6">
              <p className="text-sm leading-relaxed text-slate-700">"{tm.text}"</p>
              <div className="mt-4 flex items-center gap-3">
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tm.color}`}>
                  {tm.avatar}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{tm.name}</p>
                  <p className="text-xs text-slate-500">{tm.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PLATFORM FEATURES ─── */}
      <section className="mt-6">
        <h2 className="mb-1 text-xl font-bold text-slate-900">Everything you need in one platform</h2>
        <p className="mb-5 text-sm text-slate-500">Built specifically for Kazakhstani universities and companies, powered by AI.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: '🤖', title: 'AI-Powered Matching', desc: 'Our recommendation engine scores each student–project pair by skill overlap, experience level, and availability. No more manual searching.' },
            { icon: '✉️', title: 'Built-in Messaging', desc: 'Students and clients communicate directly on the platform. Every application thread is preserved, searchable, and linked to the project.' },
            { icon: '📄', title: 'CV Generator', desc: 'Students generate a polished PDF CV instantly from their profile — skills, experience, certificates, and portfolio all in one click.' },
            { icon: '✅', title: 'Verified Profiles', desc: 'Students with 5+ skills, a university, and an About section earn a Verified badge, giving companies extra confidence when hiring.' },
            { icon: '🌐', title: 'EN / RU Interface', desc: 'Full bilingual support across all pages. Students and companies switch languages with one click — no page reload needed.' },
            { icon: '🔔', title: 'Notifications', desc: 'Real-time bell notifications for new messages, application status changes, and project invitations. Never miss an update.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                {icon}
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="card mt-6 p-6 md:p-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900">{T('home_faq_title')}</h2>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-900"
              >
                <span>{faq.q}</span>
                <span className={`ml-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openFaq === idx && (
                <p className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-12 text-center text-white md:px-12 md:py-16">
        <h2 className="text-3xl font-bold">{T('home_final_cta_title')}</h2>
        <p className="mt-3 text-lg text-blue-100">{T('home_final_cta_sub')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/signin?tab=signup" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
            {T('home_final_cta_student')}
          </Link>
          <Link href="/signin?tab=signup&role=client" className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
            {T('home_final_cta_company')}
          </Link>
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}

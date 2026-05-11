import Link from 'next/link';

const trustBadges = ['Verified students', 'Secure milestone payments', 'Built-in messaging', 'Smart matching'];
const categories = ['Web Development', 'UI/UX Design', 'Data Analytics', 'Mobile Apps', 'Automation', 'AI Prototyping'];

export default function HomePage() {
  return (
    <div className="space-y-14 py-6 md:py-10">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-8 md:p-12">
          <div className="mb-6 flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {badge}
              </span>
            ))}
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
            Hire top university talent for real product work.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            UniWork connects companies with vetted student specialists for fast, reliable project delivery — with clear milestones,
            protected payments, and role-based collaboration from day one.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signin?tab=signup" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              Start hiring now
            </Link>
            <Link href="/projects" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Explore projects
            </Link>
          </div>
        </div>

        <aside className="card p-8 md:p-10">
          <p className="text-sm font-semibold text-slate-500">Platform confidence</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Built for trusted student-client collaboration</h2>
          <ul className="mt-6 space-y-4 text-sm text-slate-600">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Identity and education checks</p>
              <p className="mt-1">Students are linked to university profiles for stronger credibility.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Milestone-based payouts</p>
              <p className="mt-1">Payments are protected and released only when work is approved.</p>
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Smart recommendations</p>
              <p className="mt-1">Recommendation engine surfaces better project-fit talent faster.</p>
            </li>
          </ul>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['2,300+', 'Active student specialists'],
          ['91%', 'Projects matched in under 48h'],
          ['$1.8M+', 'Milestone payments processed securely']
        ].map(([value, label]) => (
          <div key={label} className="card p-6">
            <p className="text-3xl font-semibold text-slate-900">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{label}</p>
          </div>
        ))}
      </section>

      <section className="card p-8 md:p-12">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">How UniWork works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['1. Define project', 'Clients publish goals, budget, timeline, and required skills.'],
            ['2. Match verified talent', 'Students apply and recommendations highlight the strongest fit.'],
            ['3. Deliver with confidence', 'Use built-in chat, milestones, and transparent progress updates.']
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card p-8 md:p-10">
          <h3 className="text-2xl font-semibold text-slate-900">Popular project types</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                {item}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-600">
            From MVP builds to data dashboards, teams can launch faster with university talent that is ready for real product outcomes.
          </p>
        </div>

        <div className="card p-8 md:p-10">
          <h3 className="text-2xl font-semibold text-slate-900">Platform protection</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Every workspace includes controlled messaging, role-based access, and payment checkpoints to keep collaborations secure and predictable.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Ready to build with student talent?</p>
            <p className="mt-2 text-sm text-slate-600">Create your account in minutes and post your first project today.</p>
            <Link href="/signin?tab=signup" className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

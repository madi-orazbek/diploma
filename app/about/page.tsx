export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="card p-8">
        <h1 className="text-3xl font-bold text-slate-900">About UniWork</h1>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          UniWork is a student-focused opportunity marketplace that connects university talent with real companies,
          real projects, and internship-style vacancies. The platform helps students build practical experience while
          helping employers discover motivated early-career professionals.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Our mission</h2>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            We make career entry simpler by matching students to relevant opportunities, supporting profile growth,
            and turning academic potential into measurable work experience.
          </p>
        </article>

        <article className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">What UniWork provides</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Unified marketplace for projects and vacancies.</li>
            <li>Match scoring based on skills, profile signals, and opportunity data.</li>
            <li>In-platform applications and conversation threads.</li>
            <li>Profile building tools and AI-assisted career guidance.</li>
          </ul>
        </article>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Students create a profile with skills, interests, and career preferences.</li>
          <li>UniWork ranks opportunities and highlights the strongest matches.</li>
          <li>Students apply directly and continue communication through built-in messaging.</li>
          <li>Companies review applicants and identify promising early talent faster.</li>
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Why students use UniWork</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Discover relevant, practical opportunities in one place.</li>
            <li>Build a stronger career profile and portfolio over time.</li>
            <li>Gain real-world experience before graduation.</li>
            <li>Receive AI-assisted suggestions for faster career growth.</li>
          </ul>
        </article>

        <article className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Why companies use UniWork</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Access a focused pipeline of motivated student talent.</li>
            <li>Fill project and junior-role needs with better fit signals.</li>
            <li>Reduce sourcing time with structured applicant profiles.</li>
            <li>Build long-term talent relationships earlier.</li>
          </ul>
        </article>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Who UniWork is for</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          UniWork is designed for students, recent graduates, startup teams, and companies that value practical
          skills, growth potential, and efficient early-career hiring.
        </p>
      </section>
    </div>
  );
}

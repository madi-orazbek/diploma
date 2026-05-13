'use client';

type SkillCategory = {
  label: string;
  icon: string;
  keywords: string[];
  color: string;
  bgColor: string;
};

const CATEGORIES: SkillCategory[] = [
  {
    label: 'Backend',
    icon: '⚙️',
    keywords: ['python', 'django', 'fastapi', 'flask', 'node', 'nodejs', 'express', 'java', 'spring', 'go', 'rust', 'php', 'laravel', 'rest api', 'graphql', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes'],
    color: 'text-purple-700',
    bgColor: 'bg-purple-500',
  },
  {
    label: 'Frontend',
    icon: '🎨',
    keywords: ['react', 'vue', 'angular', 'nextjs', 'next.js', 'typescript', 'javascript', 'html', 'css', 'tailwind', 'sass', 'figma', 'ui', 'ux', 'webpack', 'vite'],
    color: 'text-blue-700',
    bgColor: 'bg-blue-500',
  },
  {
    label: 'Data / Analytics',
    icon: '📊',
    keywords: ['sql', 'pandas', 'excel', 'power bi', 'tableau', 'analytics', 'data analysis', 'etl', 'airflow', 'spark', 'hadoop', 'bi', 'powerbi'],
    color: 'text-amber-700',
    bgColor: 'bg-amber-500',
  },
  {
    label: 'AI / ML',
    icon: '🤖',
    keywords: ['machine learning', 'ml', 'ai', 'tensorflow', 'pytorch', 'scikit-learn', 'sklearn', 'nlp', 'deep learning', 'neural', 'pandas', 'numpy', 'computer vision', 'bert', 'llm'],
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-500',
  },
  {
    label: 'Mobile',
    icon: '📱',
    keywords: ['flutter', 'dart', 'react native', 'swift', 'kotlin', 'android', 'ios', 'mobile', 'firebase'],
    color: 'text-pink-700',
    bgColor: 'bg-pink-500',
  },
  {
    label: 'DevOps / Cloud',
    icon: '☁️',
    keywords: ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'devops', 'linux', 'nginx', 'terraform', 'ansible', 'jenkins', 'github actions'],
    color: 'text-slate-700',
    bgColor: 'bg-slate-500',
  },
  {
    label: 'QA / Testing',
    icon: '🔍',
    keywords: ['qa', 'testing', 'selenium', 'playwright', 'jest', 'pytest', 'junit', 'cypress', 'postman', 'jira', 'bug'],
    color: 'text-orange-700',
    bgColor: 'bg-orange-500',
  },
  {
    label: 'Design',
    icon: '✏️',
    keywords: ['figma', 'design', 'ui/ux', 'photoshop', 'illustrator', 'sketch', 'prototyping', 'wireframe', 'user research', 'typography'],
    color: 'text-rose-700',
    bgColor: 'bg-rose-500',
  },
];

function computeScore(skills: string[], category: SkillCategory): number {
  const lower = skills.map((s) => s.toLowerCase());
  const matched = category.keywords.filter((kw) => lower.some((s) => s.includes(kw) || kw.includes(s)));
  const raw = Math.min(matched.length / Math.max(1, Math.min(category.keywords.length, 6)), 1);
  return Math.round(raw * 100);
}

interface SkillsRadarProps {
  skills: string[];
  compact?: boolean;
}

export function SkillsRadar({ skills, compact = false }: SkillsRadarProps) {
  const scored = CATEGORIES.map((cat) => ({
    ...cat,
    score: computeScore(skills, cat),
  })).sort((a, b) => b.score - a.score);

  const topCategory = scored[0];
  const nonZero = scored.filter((x) => x.score > 0);

  if (!skills.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
        Add skills to see your strength profile
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {scored.slice(0, 4).map((cat) => (
          <div key={cat.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <span>{cat.icon}</span> {cat.label}
              </span>
              <span className="font-semibold text-slate-500">{cat.score}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${cat.bgColor}`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {topCategory.score > 0 && (
        <p className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">
          💡 <strong>Strongest for:</strong> {topCategory.label} roles
          {nonZero.length > 1 && (
            <> · Also good for: {nonZero.slice(1, 3).map(c => c.label).join(', ')}</>
          )}
        </p>
      )}
      <div className="space-y-2.5">
        {scored.map((cat) => (
          <div key={cat.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span>{cat.icon}</span> {cat.label}
              </span>
              <span className={`font-bold text-xs ${cat.score > 0 ? cat.color : 'text-slate-300'}`}>
                {cat.score > 0 ? `${cat.score}%` : '—'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${cat.score > 0 ? cat.bgColor : 'bg-transparent'}`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

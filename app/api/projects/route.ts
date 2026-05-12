import { z } from 'zod';
import { NextResponse } from 'next/server';
import Project from '@/models/Project';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { loadUnifiedDataset } from '@/lib/recommendation/unified-dataset';

const createSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(4000),
  category: z.string().min(2).max(80),
  requiredSkills: z.union([z.string(), z.array(z.string())]),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().min(0),
  deadline: z.string().optional(),
  city: z.string().min(2).max(80).optional(),
  employmentType: z.string().min(2).max(40).optional(),
  experienceLevel: z.string().min(2).max(40).optional()
}).refine((v) => v.budgetMax >= v.budgetMin, 'budgetMax must be ≥ budgetMin');

// Synonym map for fuzzy search
const SYNONYMS: Record<string, string[]> = {
  backend: ['backend', 'back-end', 'бэкенд', 'server', 'node', 'django', 'fastapi', 'flask', 'express', 'api'],
  frontend: ['frontend', 'front-end', 'фронтенд', 'react', 'vue', 'angular', 'nextjs', 'next.js', 'ui', 'ux'],
  python: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
  data: ['analyst', 'analytics', 'data', 'sql', 'power bi', 'аналитик', 'powerbi', 'tableau', 'excel'],
  ml: ['machine learning', 'ml', 'ai', 'ии', 'машинное обучение', 'tensorflow', 'pytorch', 'sklearn'],
  mobile: ['mobile', 'flutter', 'react native', 'android', 'ios', 'kotlin', 'swift'],
  design: ['figma', 'design', 'ui/ux', 'ux', 'ui', 'дизайн', 'designer', 'wireframe'],
  devops: ['docker', 'kubernetes', 'ci/cd', 'devops', 'nginx', 'linux', 'aws', 'cloud'],
  bot: ['telegram', 'bot', 'бот', 'chatbot', 'automation', 'автоматизация'],
};

function expandQuery(q: string): string[] {
  const lower = q.toLowerCase().trim();
  const tokens = [lower];
  for (const [, synonymList] of Object.entries(SYNONYMS)) {
    if (synonymList.some((s) => lower.includes(s))) {
      tokens.push(...synonymList);
    }
  }
  return [...new Set(tokens)];
}

function fuzzyMatch(haystack: string, tokens: string[]): boolean {
  const lower = haystack.toLowerCase();
  return tokens.some((t) => lower.includes(t));
}

const DEMO_PROJECTS = [
  {
    id: 'demo-1',
    type: 'project' as const,
    title: 'Backend Python/Django Developer',
    description: 'We need a backend developer to build REST API for our e-commerce platform. Experience with Django, PostgreSQL, and Docker required. Remote work possible.',
    company: 'TechHub KZ',
    category: 'Backend Dev',
    city: 'Almaty',
    budgetMin: 500,
    budgetMax: 1200,
    requiredSkills: ['Python', 'Django', 'PostgreSQL', 'REST API', 'Docker'],
    experienceLevel: 'JUNIOR',
    employmentType: 'part-time',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    type: 'project' as const,
    title: 'React Frontend Developer',
    description: 'Looking for a React developer to build a modern dashboard for our analytics platform. TypeScript, Tailwind CSS, and REST API integration experience required.',
    company: 'StartupKZ',
    category: 'Frontend / UI',
    city: 'Astana',
    budgetMin: 400,
    budgetMax: 900,
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'REST API', 'Figma'],
    experienceLevel: 'JUNIOR',
    employmentType: 'project',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    type: 'project' as const,
    title: 'Data Analyst — SQL & Power BI',
    description: 'We need a data analyst to build reporting dashboards in Power BI and write complex SQL queries for our CRM database. Experience with Excel and data visualization required.',
    company: 'Finance Pro',
    category: 'Data Analytics',
    city: 'Almaty',
    budgetMin: 350,
    budgetMax: 700,
    requiredSkills: ['SQL', 'Power BI', 'Excel', 'Data Analysis', 'Python'],
    experienceLevel: 'JUNIOR',
    employmentType: 'part-time',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    type: 'project' as const,
    title: 'ML Engineer — Recommendation System',
    description: 'Build a content-based recommendation system for our e-learning platform using Python, scikit-learn, and FastAPI. Remote.',
    company: 'EduTech',
    category: 'AI / ML',
    city: 'Remote',
    budgetMin: 600,
    budgetMax: 1500,
    requiredSkills: ['Python', 'Machine Learning', 'scikit-learn', 'FastAPI', 'SQL'],
    experienceLevel: 'MIDDLE',
    employmentType: 'project',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    type: 'project' as const,
    title: 'Telegram Bot Developer',
    description: 'Create a Telegram bot for order management: notifications, admin panel, integration with our CRM via REST API. Python + aiogram or python-telegram-bot.',
    company: 'AgriTech',
    category: 'Backend Dev',
    city: 'Astana',
    budgetMin: 200,
    budgetMax: 500,
    requiredSkills: ['Python', 'Telegram Bot API', 'REST API', 'aiogram'],
    experienceLevel: 'JUNIOR',
    employmentType: 'project',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-6',
    type: 'project' as const,
    title: 'UI/UX Designer — Mobile App',
    description: 'Design the full UX flow and high-fidelity mockups for a fitness tracking mobile app. Figma, user research, prototyping required.',
    company: 'FitKZ',
    category: 'Product Design',
    city: 'Almaty',
    budgetMin: 300,
    budgetMax: 700,
    requiredSkills: ['Figma', 'UI/UX', 'Prototyping', 'User Research'],
    experienceLevel: 'JUNIOR',
    employmentType: 'project',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-7',
    type: 'project' as const,
    title: 'QA Engineer — Web Application Testing',
    description: 'Manual and automated testing for our web platform. Experience with Playwright or Selenium, test plan writing, bug reporting in Jira.',
    company: 'QualityFirst',
    category: 'QA Testing',
    city: 'Remote',
    budgetMin: 300,
    budgetMax: 600,
    requiredSkills: ['QA Testing', 'Selenium', 'Playwright', 'Jira', 'Test Planning'],
    experienceLevel: 'JUNIOR',
    employmentType: 'part-time',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-8',
    type: 'project' as const,
    title: 'Node.js Backend Developer',
    description: 'Build scalable REST API for our logistics platform. Node.js, Express, MongoDB, JWT authentication, and Docker deployment.',
    company: 'LogisticsPro',
    category: 'Backend Dev',
    city: 'Astana',
    budgetMin: 450,
    budgetMax: 1000,
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Docker'],
    experienceLevel: 'JUNIOR',
    employmentType: 'part-time',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-9',
    type: 'project' as const,
    title: 'Flutter Mobile App Developer',
    description: 'Develop cross-platform mobile application for event management. Flutter, Dart, Firebase, push notifications.',
    company: 'EventHub',
    category: 'Mobile Apps',
    city: 'Almaty',
    budgetMin: 500,
    budgetMax: 1200,
    requiredSkills: ['Flutter', 'Dart', 'Firebase', 'Mobile Development'],
    experienceLevel: 'MIDDLE',
    employmentType: 'project',
    source: 'demo',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
];

function includesText(value: unknown, query: string) {
  return String(value || '').toLowerCase().includes(query.toLowerCase());
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const city = (searchParams.get('city') || '').trim();
    const experienceLevel = (searchParams.get('experience') || '').trim();
    const employmentType = (searchParams.get('employment') || '').trim();
    const sort = (searchParams.get('sort') || 'newest').trim();

    const unified = await loadUnifiedDataset();
    const openItems = unified.filter((item) => item.status === 'OPEN');

    // Merge real items with demo items (demo items only if id doesn't conflict)
    const realIds = new Set(openItems.map((x) => String(x.id)));
    const demoItems = DEMO_PROJECTS.filter((d) => !realIds.has(d.id)) as any[];
    const allItems = [...openItems, ...demoItems];

    const queryTokens = q ? expandQuery(q) : [];

    let filtered = allItems.filter((item) => {
      if (q) {
        const haystack = [
          item.title,
          item.description,
          item.category,
          item.city,
          item.company,
          ...(item.requiredSkills || []),
        ].join(' ');
        if (!fuzzyMatch(haystack, queryTokens)) return false;
      }
      if (category && !includesText(item.category, category)) return false;
      if (city && !includesText(item.city, city)) return false;
      if (experienceLevel && !includesText(item.experienceLevel, experienceLevel)) return false;
      if (employmentType && !includesText(item.employmentType, employmentType)) return false;
      return true;
    });

    filtered = filtered.sort((a, b) => {
      if (sort === 'budget_asc') {
        return Number(a.budgetMin ?? Number.MAX_SAFE_INTEGER) - Number(b.budgetMin ?? Number.MAX_SAFE_INTEGER);
      }
      if (sort === 'budget_desc') {
        return Number(b.budgetMax ?? -1) - Number(a.budgetMax ?? -1);
      }
      return Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0));
    });

    return NextResponse.json({ success: true, data: filtered.slice(0, 200) });
  } catch (error: any) {
    console.error('PROJECTS ERROR:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = requireAuth(['CLIENT', 'ADMIN']);
    const body = createSchema.parse(await req.json());

    const requiredSkills = Array.isArray(body.requiredSkills)
      ? body.requiredSkills
      : body.requiredSkills.split(',').map((x) => x.trim()).filter(Boolean);

    const project = await Project.create({
      clientId: user.userId,
      ...body,
      requiredSkills,
      deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 14 * 86400000)
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    console.error('PROJECTS CREATE ERROR:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

import StudentProfile from '@/models/StudentProfile';
import { getProfileReadiness } from '@/lib/profileReadiness';
import { loadUnifiedDataset } from '@/lib/recommendation/unified-dataset';

export type AssistantJobCard = {
  projectId: string;
  title: string;
  city: string;
  employmentType: string;
  experienceLevel: string;
  category: string;
  budgetLabel: string;
  matchScore: number;
  explanationSummary: string;
  matchedSignals: string[];
  missingSignals: string[];
};

export type AssistantReply = {
  reply: string;
  jobs: AssistantJobCard[];
  quickActions: string[];
  profileTips: string[];
  profilePatch?: {
    about?: string;
    skills?: string[];
  };
};

type AssistantIntent =
  | 'find_jobs'
  | 'why_recommended'
  | 'improve_profile'
  | 'skills_gap'
  | 'show_backend'
  | 'show_frontend'
  | 'jobs_in_city'
  | 'help_apply'
  | 'learn_next'
  | 'general';

const DEFAULT_QUICK_ACTIONS = [
  'Find jobs for me',
  'Explain my top match',
  'Improve my profile',
  'Suggest skills to learn',
  'Show backend jobs',
  'Show frontend jobs',
  'Help me apply',
  'What should I learn next?'
];

const KNOWN_SKILLS = [
  'Node.js',
  'TypeScript',
  'React',
  'Next.js',
  'PostgreSQL',
  'MongoDB',
  'REST API',
  'Docker',
  'Testing',
  'Python',
  'FastAPI',
  'Django',
  'SQL'
];

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => String(x || '').trim()).filter(Boolean);
}

function parseIntent(input: string): AssistantIntent {
  const text = input.toLowerCase();
  if (text.includes('why') && (text.includes('recommend') || text.includes('match'))) return 'why_recommended';
  if (text.includes('improve') && text.includes('profile')) return 'improve_profile';
  if (text.includes('make my profile stronger') || text.includes('update my profile')) return 'improve_profile';
  if ((text.includes('skill') || text.includes('skills')) && (text.includes('missing') || text.includes('add') || text.includes('learn') || text.includes('gap') || text.includes('suggest'))) return 'skills_gap';
  if (text.includes('what should i learn') || text.includes('learn next') || text.includes('roadmap')) return 'learn_next';
  if (text.includes('backend')) return 'show_backend';
  if (text.includes('frontend')) return 'show_frontend';
  if (text.includes('astana') || text.includes('almaty') || text.includes('shymkent') || (text.includes('city') && (text.includes('job') || text.includes('work')))) return 'jobs_in_city';
  if ((text.includes('apply') || text.includes('cover letter') || text.includes('application')) && (text.includes('help') || text.includes('how') || text.includes('write'))) return 'help_apply';
  if ((text.includes('find') || text.includes('show') || text.includes('get')) && (text.includes('job') || text.includes('project') || text.includes('work') || text.includes('vacancy'))) return 'find_jobs';
  if (text.includes('recommend') && !text.includes('why')) return 'find_jobs';
  if (text.includes('job') || text.includes('vacancy') || text.includes('project')) return 'find_jobs';
  return 'general';
}

function parseCityFromMessage(message: string, profileCity: string) {
  const lowered = message.toLowerCase();
  const cities = ['astana', 'almaty', 'shymkent', 'karaganda', 'atyrau', 'aktobe'];
  const hit = cities.find((city) => lowered.includes(city));
  return hit ? `${hit.charAt(0).toUpperCase()}${hit.slice(1)}` : profileCity;
}

function toProjectText(project: any) {
  return {
    project_id: String(project?.id || ''),
    title: String(project?.title || ''),
    skills: Array.isArray(project?.requiredSkills)
      ? project.requiredSkills.join(', ')
      : '',
    text: String(project?.description || ''),
    experience_level: String(project?.experienceLevel || ''),
    employment_type: String(project?.employmentType || ''),
    city: String(project?.city || ''),
    category: String(project?.category || ''),
    budget_min: Number(project?.budgetMin ?? 0),
    budget_max: Number(project?.budgetMax ?? 0),
  };
}

function overlapCount(profileSkills: string[], jobSkills: string[]) {
  const profileSet = new Set(profileSkills.map((x) => x.toLowerCase()));
  return jobSkills.filter((s) => profileSet.has(s.toLowerCase())).length;
}

function toSkillList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

function toBudgetLabel(min?: number, max?: number) {
  const minNum = Number(min ?? 0);
  const maxNum = Number(max ?? 0);
  if (Number.isFinite(minNum) || Number.isFinite(maxNum)) {
    return `${minNum || 0} - ${maxNum || 0}`;
  }
  return 'Not specified';
}

function buildExplanation(profile: any, row: any) {
  const profileSkills = normalizeList(profile?.skills);
  const jobSkills = toSkillList(row?.skills || row?.requiredSkills);
  const matchedSkills = jobSkills.filter((s) =>
    profileSkills.map((k) => k.toLowerCase()).includes(s.toLowerCase())
  );
  const missingSkills = jobSkills.filter(
    (s) => !profileSkills.map((k) => k.toLowerCase()).includes(s.toLowerCase())
  );

  const matchedSignals: string[] = [];
  const missingSignals: string[] = [];

  if (matchedSkills.length) {
    matchedSignals.push(`Skill overlap: ${matchedSkills.slice(0, 4).join(', ')}`);
  }
  if (String(profile?.city || '').toLowerCase() === String(row?.city || '').toLowerCase() && row?.city) {
    matchedSignals.push(`Location match: ${row.city}`);
  }
  if (
    profile?.experienceLevel &&
    row?.experience_level &&
    String(profile.experienceLevel).toLowerCase() === String(row.experience_level).toLowerCase()
  ) {
    matchedSignals.push(`Experience level match: ${row.experience_level}`);
  }
  if (profile?.portfolioLinks?.length) matchedSignals.push('Portfolio links present');
  if (profile?.githubUrl) matchedSignals.push('GitHub profile linked');

  if (missingSkills.length) missingSignals.push(`Consider adding: ${missingSkills.slice(0, 4).join(', ')}`);
  if (!profile?.about && !profile?.bio) missingSignals.push('Profile summary can be stronger with an About section');
  if (!profile?.githubUrl) missingSignals.push('Add GitHub to strengthen technical trust');
  if (!profile?.linkedinUrl) missingSignals.push('Add LinkedIn for recruiter confidence');
  if (!profile?.portfolioLinks?.length) missingSignals.push('Add portfolio links to demonstrate real projects');

  const summary = matchedSignals.length
    ? `This role aligns with your profile through ${matchedSignals.slice(0, 2).join(' and ').toLowerCase()}.`
    : 'This role is a potential fit based on your current profile signals.';

  return { matchedSignals, missingSignals, summary };
}

async function fetchRecommendations(profile: any, message: string) {
  const openProjects = (await loadUnifiedDataset()).filter((item) => item.status === 'OPEN');

  const cityFilter = parseCityFromMessage(message, String(profile?.city || ''));
  const mlPayload = {
    skills: normalizeList(profile?.skills).join(', '),
    interests: normalizeList(profile?.interests).join(', '),
    experience: String(profile?.experienceLevel || 'JUNIOR'),
    employment: String(profile?.workplaceType || ''),
    city: cityFilter,
    top_n: 8,
    projects: openProjects.map(toProjectText),
  };

  const ML_API_URL = process.env.ML_API_URL;
  let recommendations: any[] = [];

  if (ML_API_URL) {
    try {
      const res = await fetch(`${ML_API_URL}/recommend-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlPayload),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        recommendations = Array.isArray(data?.recommendations)
          ? data.recommendations
          : Array.isArray(data?.data?.recommendations)
            ? data.data.recommendations
            : Array.isArray(data?.data)
              ? data.data
              : [];
      }
    } catch {
      // graceful fallback to deterministic scoring below
    }
  }

  if (!recommendations.length) {
    const profileSkills = normalizeList(profile?.skills);
    recommendations = openProjects
      .map((project: any) => {
        const jobSkills = normalizeList(project.requiredSkills);
        const overlap = overlapCount(profileSkills, jobSkills);
        const score = overlap * 12 + (project.city && project.city === profile?.city ? 10 : 0);
        return {
          project_id: String(project._id),
          title: project.title,
          text: project.description,
          city: project.city,
          skills: jobSkills.join(', '),
          employment_type: project.employmentType,
          experience_level: project.experienceLevel,
          category: project.category,
          budget_min: project.budgetMin,
          budget_max: project.budgetMax,
          final_score: score,
        };
      })
      .sort((a: { final_score?: number }, b: { final_score?: number }) => Number(b.final_score || 0) - Number(a.final_score || 0));
  }

  return recommendations;
}

function filterByIntent(rows: any[], intent: AssistantIntent, message: string, profileCity: string) {
  const text = message.toLowerCase();
  if (intent === 'show_backend') {
    return rows.filter((r) => `${r.title || ''} ${r.category || ''} ${r.skills || ''}`.toLowerCase().includes('backend'));
  }
  if (intent === 'show_frontend') {
    return rows.filter((r) => `${r.title || ''} ${r.category || ''} ${r.skills || ''}`.toLowerCase().includes('frontend'));
  }
  if (intent === 'jobs_in_city') {
    const city = parseCityFromMessage(message, profileCity).toLowerCase();
    return rows.filter((r) => String(r.city || '').toLowerCase().includes(city));
  }
  if (text.includes('best job') || intent === 'why_recommended') {
    return rows.slice(0, 1);
  }
  return rows;
}

function buildProfileTips(profile: any) {
  const readiness = getProfileReadiness(profile);
  const tips: string[] = [];
  if (readiness.missingFields.includes('about')) tips.push('Add a concise About section with your strengths, target role, and recent project outcomes.');
  if (readiness.missingFields.includes('githubUrl')) tips.push('Link your GitHub and pin 2-3 relevant repositories with clear READMEs.');
  if (readiness.missingFields.includes('linkedinUrl')) tips.push('Add your LinkedIn URL and align your headline with your target role.');
  if (readiness.missingFields.includes('portfolioLinks')) tips.push('Add portfolio links with project context: problem, stack, and measurable result.');
  if (!normalizeList(profile?.skills).length) tips.push('Add at least 8 role-relevant skills so matching can rank you accurately.');
  return tips;
}

function buildSuggestedAbout(profile: any) {
  const skills = normalizeList(profile?.skills).slice(0, 5).join(', ');
  const city = profile?.city ? `based in ${profile.city}` : 'open to remote opportunities';
  const level = String(profile?.experienceLevel || 'junior').toLowerCase();
  return `I am a ${level} candidate ${city}, focused on delivering reliable products with ${skills || 'modern web technologies'}. I enjoy solving real business problems, collaborating with teams, and continuously improving through practical project work.`;
}

const JOB_INTENTS: AssistantIntent[] = ['find_jobs', 'why_recommended', 'show_backend', 'show_frontend', 'jobs_in_city', 'help_apply', 'skills_gap', 'learn_next', 'improve_profile'];

export async function runCareerAssistant(message: string, userId: string): Promise<AssistantReply> {
  const profileRaw = await StudentProfile.findOne({ userId }).lean();
  const profileDoc = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as Record<string, unknown> | null;
  const profile = profileDoc || {};
  const intent = parseIntent(message);

  // Only fetch recommendations when the intent actually needs jobs
  const needsJobs = JOB_INTENTS.includes(intent);
  const recommendations = needsJobs ? await fetchRecommendations(profile, message) : [];
  const filtered = needsJobs ? filterByIntent(recommendations, intent, message, String(profile.city || '')).slice(0, 4) : [];

  const jobs = filtered.map((row: any) => {
    const explanation = buildExplanation(profile, row);
    return {
      projectId: String(row.project_id || row._id || ''),
      title: String(row.title || row.job_title || 'Recommended role'),
      city: String(row.city || 'Not specified'),
      employmentType: String(row.employment_type || 'Not specified'),
      experienceLevel: String(row.experience_level || 'Not specified'),
      category: String(row.category || 'Not specified'),
      budgetLabel: toBudgetLabel(row.budget_min, row.budget_max),
      matchScore: Number.isFinite(Number(row.final_score)) ? Math.round(Number(row.final_score)) : 70,
      explanationSummary: explanation.summary,
      matchedSignals: explanation.matchedSignals,
      missingSignals: explanation.missingSignals,
    };
  });

  const profileTips = buildProfileTips(profile);
  const suggestions = KNOWN_SKILLS.filter(
    (skill) => !normalizeList(profile.skills).map((s) => s.toLowerCase()).includes(skill.toLowerCase())
  ).slice(0, 5);

  if (intent === 'improve_profile') {
    return {
      reply: 'Great idea. I reviewed your profile and prepared practical improvements you can apply right away.',
      jobs,
      quickActions: DEFAULT_QUICK_ACTIONS,
      profileTips,
      profilePatch: {
        about: buildSuggestedAbout(profile),
        skills: suggestions,
      },
    };
  }

  if (intent === 'skills_gap') {
    return {
      reply: `To increase your match quality, focus next on: ${suggestions.join(', ')}. I also added your top-fit jobs below.`,
      jobs,
      quickActions: DEFAULT_QUICK_ACTIONS,
      profileTips,
    };
  }

  if (intent === 'why_recommended') {
    const top = jobs[0];
    return {
      reply: top
        ? `Your top recommendation is ${top.title}. It matches your profile because ${top.matchedSignals.slice(0, 2).join(' and ').toLowerCase() || 'several of your profile signals align with this role'}.`
        : 'I could not find a strong match yet. I can help you strengthen your profile and skills first.',
      jobs,
      quickActions: DEFAULT_QUICK_ACTIONS,
      profileTips,
    };
  }

  if (intent === 'help_apply') {
    return {
      reply: 'I can help you apply. Start with your top match card below, then click Apply now. Before applying, tailor your cover letter to the project goal and required skills.',
      jobs,
      quickActions: DEFAULT_QUICK_ACTIONS,
      profileTips,
    };
  }

  if (intent === 'learn_next') {
    return {
      reply: `A strong next-learning roadmap for you is: 1) ${suggestions[0] || 'REST API design'}, 2) ${suggestions[1] || 'Testing'}, 3) build one portfolio project that proves these skills end-to-end.`,
      jobs,
      quickActions: DEFAULT_QUICK_ACTIONS,
      profileTips,
    };
  }

  // General intent: answer conversationally without dumping job listings
  if (intent === 'general') {
    const text = message.toLowerCase().trim();

    // Greetings
    if (/^(hi|hello|hey|sup|hiya|greetings|good morning|good afternoon|good evening)[!.?\s]*$/.test(text)) {
      return {
        reply: "Hi! I'm your AI career assistant on UniWork. I can help you find matched projects, explain why something was recommended, improve your profile, or suggest what to learn next. What would you like to do?",
        jobs: [],
        quickActions: DEFAULT_QUICK_ACTIONS,
        profileTips: [],
      };
    }

    // Thank you / acknowledgements
    if (/^(thanks|thank you|thx|ty|great|awesome|perfect|got it|ok|okay|cool|nice|sounds good)[!.?\s]*$/.test(text)) {
      return {
        reply: "You're welcome! Let me know if you need anything else — finding jobs, improving your profile, or learning advice.",
        jobs: [],
        quickActions: DEFAULT_QUICK_ACTIONS,
        profileTips: [],
      };
    }

    // Platform / how it works questions
    if ((text.includes('how') || text.includes('what')) && (text.includes('work') || text.includes('platform') || text.includes('site') || text.includes('this') || text.includes('uniwork'))) {
      return {
        reply: "UniWork connects AITU students with real freelance projects using ML matching. Here's how it works:\n\n1. Fill in your profile — skills, experience level, and interests\n2. Our ML model ranks available projects by how well they fit you\n3. Apply to projects that interest you with a cover letter\n4. Clients review applications and select the best match\n\nThe more complete your profile, the more accurate your matches. Want me to check your profile now?",
        jobs: [],
        quickActions: DEFAULT_QUICK_ACTIONS,
        profileTips: [],
      };
    }

    // Career / general advice
    if (text.includes('advice') || text.includes('tip') || text.includes('how to') || text.includes('help me')) {
      return {
        reply: "Here are some tips to succeed on UniWork:\n\n• Keep your skills list current — ML matching depends on it\n• Add your GitHub and portfolio to build client trust\n• Write a clear About section highlighting what you've built\n• Apply to projects that match your current level first\n• Smaller first projects help you build reputation fast\n\nWant me to find matched projects for you or review your profile?",
        jobs: [],
        quickActions: DEFAULT_QUICK_ACTIONS,
        profileTips,
      };
    }

    // Fallback general: helpful menu without job dump
    return {
      reply: "I'm your AI career assistant. Here's what I can do:\n\n• Find freelance projects matched to your skills\n• Explain why a project was recommended to you\n• Help improve your profile for better matches\n• Suggest skills and a learning roadmap\n• Walk you through writing an application\n\nWhat would you like help with?",
      jobs: [],
      quickActions: DEFAULT_QUICK_ACTIONS,
      profileTips: [],
    };
  }

  return {
    reply: jobs.length
      ? 'I analyzed your profile and found your best-matched opportunities below.'
      : 'I reviewed your profile. Complete it with skills, experience level, and a GitHub link to unlock stronger matches.',
    jobs,
    quickActions: DEFAULT_QUICK_ACTIONS,
    profileTips,
  };
}

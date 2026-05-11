export type ClientAssistantReply = {
  reply: string;
  tips: string[];
  quickActions: string[];
};

const DEFAULT_QUICK_ACTIONS = [
  'How to write a good project post',
  'What skills should I list?',
  'How does student matching work?',
  'How to attract quality applicants',
  'What budget should I set?',
  'How to evaluate applications',
];

type Intent =
  | 'write_post'
  | 'skills_advice'
  | 'how_matching'
  | 'attract_applicants'
  | 'budget_advice'
  | 'evaluate_apps'
  | 'general';

function parseIntent(input: string): Intent {
  const t = input.toLowerCase();
  if (t.includes('write') || t.includes('post') || t.includes('description') || t.includes('project post')) return 'write_post';
  if (t.includes('skill') || t.includes('tech') || t.includes('requirement')) return 'skills_advice';
  if (t.includes('match') || t.includes('ml') || t.includes('how') && t.includes('work')) return 'how_matching';
  if (t.includes('attract') || t.includes('quality') || t.includes('good applicant')) return 'attract_applicants';
  if (t.includes('budget') || t.includes('price') || t.includes('rate') || t.includes('pay')) return 'budget_advice';
  if (t.includes('evaluat') || t.includes('review') || t.includes('choose') || t.includes('select')) return 'evaluate_apps';
  return 'general';
}

export function runClientAssistant(message: string): ClientAssistantReply {
  const intent = parseIntent(message);

  if (intent === 'write_post') {
    return {
      reply: 'A strong project post has 5 elements: (1) a clear one-line title, (2) a description of what you need built and why, (3) a specific list of required skills, (4) a realistic budget range, and (5) the expected timeline and deliverables. Students read the description carefully — the more specific you are, the better the match quality.',
      tips: [
        'Start with the business problem, not the technical task.',
        'List 4–8 specific skills so the ML ranker can score applicants accurately.',
        'Describe the expected output format: e.g. "deployed Next.js app with admin panel".',
        'Add a deadline so students can plan their availability.',
      ],
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  if (intent === 'skills_advice') {
    return {
      reply: 'List only skills that are genuinely required — not nice-to-have. The ML system uses your required skills list to rank applicants. If you list too many, you may filter out good candidates. For a typical web project: list the frontend framework, backend language, database, and one testing or DevOps skill.',
      tips: [
        'Separate required from preferred skills in your description.',
        'Use standard names: "React" not "ReactJS", "Node.js" not "NodeJS".',
        'If you need a full-stack developer, list both frontend and backend skills.',
      ],
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  if (intent === 'how_matching') {
    return {
      reply: 'When students apply to your project, they are ranked by a heuristic ML match score (0–100%). The score considers: skill overlap between the student profile and your required skills list, experience level match, city match (if you set a city), and portfolio/GitHub signals. Students ranked at the top are your best-fit candidates.',
      tips: [
        'The more skills you list, the more precise the ranking becomes.',
        'Setting an experience level (JUNIOR/MIDDLE/SENIOR) helps filter candidates.',
        'Students with portfolios and GitHub links score higher.',
      ],
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  if (intent === 'attract_applicants') {
    return {
      reply: 'To attract quality applicants: (1) post clear, specific project requirements, (2) set a fair budget range — unrealistically low budgets deter good students, (3) respond to applications within 48 hours to build trust, (4) describe your working style and communication expectations.',
      tips: [
        'Projects with a description over 100 words receive 40% more applications on average.',
        'Mentioning mentorship or learning opportunities attracts motivated students.',
        'A realistic deadline (2+ weeks) signals respect for the student\'s time.',
      ],
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  if (intent === 'budget_advice') {
    return {
      reply: 'Budget ranges for student freelance projects vary by scope: a simple landing page is typically $100–300, a full-stack CRUD app $300–800, an ML integration project $500–1500. Setting min and max gives students flexibility to propose rates. Underpaying leads to lower quality work; fair rates attract serious candidates.',
      tips: [
        'Research market rates for Kazakhstan student freelance work.',
        'A budget range (min–max) is better than a fixed price.',
        'Mention if there is potential for follow-up work — students value continuity.',
      ],
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  if (intent === 'evaluate_apps') {
    return {
      reply: 'To evaluate applications effectively: (1) check the ML match score as a first-pass signal, (2) read the cover letter for motivation and communication quality, (3) review the student\'s GitHub and portfolio links, (4) look at the proposed price and timeline — very low bids may indicate underestimated scope. Accept the strongest match and send a message to align on scope before starting.',
      tips: [
        'A high match score + strong portfolio is your best signal.',
        'Ask one technical question before accepting to verify skill claims.',
        'Reject politely — students appreciate honest feedback.',
      ],
      quickActions: DEFAULT_QUICK_ACTIONS,
    };
  }

  return {
    reply: 'I can help you post better projects, understand how ML student matching works, set fair budgets, and evaluate applicants. What would you like to know?',
    tips: [],
    quickActions: DEFAULT_QUICK_ACTIONS,
  };
}

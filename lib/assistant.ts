const canned: Record<string, string> = {
  profile: 'Start with a complete headline, add 8-12 hard skills, and paste 2 portfolio links. Profiles with full data receive more client views.',
  skills: 'For web freelance roles, focus on TypeScript, Next.js, REST API design, Prisma/MongoDB, testing, and communication.',
  project: 'A strong project post includes business goal, scope, deliverables, timeline, budget range, and required skill checklist.',
  match: 'This project matches your skill overlap, experience level alignment, and optionally location preference.'
};

export function assistantReply(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes('profile')) return canned.profile;
  if (lower.includes('skill')) return canned.skills;
  if (lower.includes('description')) return canned.project;
  if (lower.includes('match')) return canned.match;
  return 'I can help with profile completion, skills planning, project writing, and match explanations.';
}

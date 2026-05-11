import { loadUnifiedDataset } from '@/lib/recommendation/unified-dataset';

export type RecommendInput = {
  skills: string[];
  experience: string;
  city?: string;
  interests?: string[];
  top_n?: number;
  strict_city?: boolean;
};

export async function getRecommendations(input: RecommendInput) {
  const url = process.env.PYTHON_RECOMMENDER_URL;
  if (url) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (response.ok) return { source: 'ML API', recommendations: await response.json() };
  }

  const projects = (await loadUnifiedDataset()).filter((item) => item.status === 'OPEN').slice(0, 200);
  const normalizedSkills = input.skills.map((s) => s.toLowerCase());
  const scored = projects.map((p: any) => {
    const matchedSkills = (p.requiredSkills || []).filter((skill: string) => normalizedSkills.includes(skill.toLowerCase()));
    const skillScore = matchedSkills.length / Math.max((p.requiredSkills || []).length, 1);
    const expScore = p.experienceLevel === input.experience ? 0.2 : 0;
    const cityScore = input.city && p.city === input.city ? 0.1 : 0;
    const score = Math.min(1, skillScore * 0.7 + expScore + cityScore);
    return {
      projectId: String(p.id),
      title: p.title,
      matchScore: score,
      matchScorePercent: Math.round(score * 100),
      explanation: `Matched ${matchedSkills.length} required skills${cityScore ? ', same city bonus applied' : ''}`
    };
  }).filter((x) => x.matchScore > 0.05).sort((a, b) => b.matchScore - a.matchScore).slice(0, input.top_n || 10);

  return { source: 'fallback demo engine', recommendations: scored };
}

export type JobRecommendation = {
  project_id?: string;
  job_title?: string;
  title?: string;
  text?: string;
  description?: string;
  company?: string;
  skills?: string[];
  experience_level?: string;
  employment_type?: string;
  city?: string;
  category?: string;
  budget_min?: number;
  budget_max?: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salary?: string;
  job_family?: string;
  candidate_similarity?: number;
  rank_score?: number;
  final_score?: number;
  final_score_percent?: number;
  id?: string;
  type?: 'vacancy' | 'project';
  source?: string;
  matchScore?: number;
  matchPercent?: number;
  match_reason?: string;
  predicted_family?: string;
};

export function extractRecommendations(payload: any): JobRecommendation[] {
  const rows =
    payload?.data?.recommendations ??
    payload?.recommendations ??
    payload?.data ??
    [];
  return Array.isArray(rows) ? rows : [];
}

export function getScoreRange(items: JobRecommendation[]) {
  const scores = items
    .map((item) => Number(item.final_score))
    .filter((value) => Number.isFinite(value));

  if (!scores.length) {
    return { minScore: NaN, maxScore: NaN };
  }

  return {
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
  };
}

export function scoreToPercent(
  score: number,
  minScore: number,
  maxScore: number
): number {
  if (!Number.isFinite(score)) return 70;
  if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) return 70;
  if (maxScore <= minScore) return 70;

  const normalized = (score - minScore) / (maxScore - minScore);
  return Math.round(65 + normalized * 30);
}

export function canRenderMatchPercent(minScore: number, maxScore: number) {
  return Number.isFinite(minScore) && Number.isFinite(maxScore) && maxScore > minScore;
}

export function trimDescription(text: string, maxLength = 240) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

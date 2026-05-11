import type { UnifiedItem } from '@/lib/recommendation/unified-dataset';

export type ProfileSignals = {
  skills: string[];
  interests: string[];
  city: string;
  experience: string;
  employment: string;
};

function normalize(text: unknown) {
  return String(text || '').trim().toLowerCase();
}

function tokenize(values: string[]) {
  return new Set(
    values
      .flatMap((v) => normalize(v).split(/[\s,;/|]+/g))
      .map((x) => x.trim())
      .filter((x) => x.length >= 2)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeMlPercent(rawScore: unknown) {
  const score = Number(rawScore);
  if (!Number.isFinite(score)) return null;
  if (score <= 1) return clamp(Math.round(score * 100), 0, 100);
  return clamp(Math.round(score), 0, 100);
}

export function heuristicMatchPercent(profile: ProfileSignals, item: UnifiedItem) {
  const profileTokens = tokenize([...profile.skills, ...profile.interests]);
  const itemTokens = tokenize([...(item.requiredSkills || []), item.title, item.description, item.category]);

  let overlap = 0;
  for (const token of profileTokens) {
    if (itemTokens.has(token)) overlap += 1;
  }

  const overlapRatio = profileTokens.size ? overlap / profileTokens.size : 0.25;
  let percent = 35 + overlapRatio * 45;

  if (profile.city && normalize(item.city).includes(normalize(profile.city))) percent += 6;
  if (profile.experience && normalize(item.experienceLevel).includes(normalize(profile.experience))) percent += 5;
  if (profile.employment && normalize(item.employmentType).includes(normalize(profile.employment))) percent += 4;

  return clamp(Math.round(percent), 30, 95);
}

export function combineMatchPercent(profile: ProfileSignals, item: UnifiedItem, mlScore: unknown) {
  const mlPercent = normalizeMlPercent(mlScore);
  const heuristic = heuristicMatchPercent(profile, item);

  if (mlPercent == null) {
    return { matchPercent: heuristic, matchScore: heuristic / 100 };
  }

  const combined = clamp(Math.round(mlPercent * 0.7 + heuristic * 0.3), 30, 98);
  return { matchPercent: combined, matchScore: combined / 100 };
}

export function summarizeDistribution(rows: Array<{ matchPercent?: number }>) {
  const values = rows.map((x) => Number(x.matchPercent)).filter((x) => Number.isFinite(x));
  if (!values.length) return { count: 0, min: 0, max: 0, avg: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return { count: values.length, min, max, avg };
}

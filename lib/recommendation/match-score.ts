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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeMlPercent(rawScore: unknown) {
  const score = Number(rawScore);
  if (!Number.isFinite(score)) return null;
  if (score <= 1) return clamp(Math.round(score * 100), 0, 100);
  return clamp(Math.round(score), 0, 100);
}

export function heuristicMatchPercent(profile: ProfileSignals, item: UnifiedItem): number {
  const profileSkills = profile.skills.map((s) => normalize(s)).filter(Boolean);
  const projectSkills = (item.requiredSkills || []).map((s) => normalize(s)).filter(Boolean);

  let percent = 20;

  // Skill overlap — primary driver (up to 65 points)
  if (profileSkills.length > 0 && projectSkills.length > 0) {
    const profileSet = new Set(profileSkills);
    // Also match on sub-tokens (e.g. "node" matches "node.js")
    const profileTokens = new Set(
      profileSkills.flatMap((s) => s.split(/[\s.,\-/]+/).filter((t) => t.length >= 3))
    );

    let matched = 0;
    for (const ps of projectSkills) {
      if (profileSet.has(ps)) {
        matched += 1;
      } else {
        // partial token match
        const psTokens = ps.split(/[\s.,\-/]+/).filter((t) => t.length >= 3);
        if (psTokens.some((t) => profileSet.has(t) || profileTokens.has(t))) {
          matched += 0.7;
        }
      }
    }

    const coverageRatio = matched / projectSkills.length;
    percent += coverageRatio * 65;
  } else if (profileSkills.length === 0) {
    // No skills → low but not zero
    percent = 20;
  }

  // Interest overlap with project title/category/skills (up to 5 points)
  if (profile.interests.length > 0) {
    const interestSet = new Set(profile.interests.map(normalize));
    const projectText = normalize([item.title, item.category, ...(item.requiredSkills || [])].join(' '));
    const interestHits = [...interestSet].filter((i) => projectText.includes(i)).length;
    percent += Math.min(interestHits * 2, 5);
  }

  // City match (5 points)
  if (profile.city && item.city) {
    const pc = normalize(profile.city);
    const ic = normalize(item.city);
    if (ic.includes(pc) || pc.includes(ic)) percent += 5;
  }

  // Experience level match (5 points)
  if (profile.experience && item.experienceLevel) {
    if (normalize(item.experienceLevel).includes(normalize(profile.experience))) {
      percent += 5;
    }
  }

  // Employment type match (3 points)
  if (profile.employment && item.employmentType) {
    if (normalize(item.employmentType).includes(normalize(profile.employment))) {
      percent += 3;
    }
  }

  return clamp(Math.round(percent), 15, 97);
}

export function combineMatchPercent(profile: ProfileSignals, item: UnifiedItem, mlScore: unknown) {
  const mlPercent = normalizeMlPercent(mlScore);
  const heuristic = heuristicMatchPercent(profile, item);

  if (mlPercent == null) {
    return { matchPercent: heuristic, matchScore: heuristic / 100 };
  }

  // Weight ML more heavily when it returns a score, but keep heuristic grounding
  const combined = clamp(Math.round(mlPercent * 0.65 + heuristic * 0.35), 15, 98);
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

export function matchLabel(percent: number): string {
  if (percent >= 85) return 'Strong match';
  if (percent >= 70) return 'Good match';
  if (percent >= 50) return 'Partial match';
  return 'Low match';
}

export function buildMatchReasons(
  profileSkills: string[],
  projectSkills: string[],
  options: {
    city?: string;
    projectCity?: string;
    experience?: string;
    projectExperience?: string;
    hasPortfolio?: boolean;
    hasGithub?: boolean;
  }
): string[] {
  const reasons: string[] = [];
  const profileSet = new Set(profileSkills.map((s) => s.toLowerCase()));
  const matched = projectSkills.filter((s) => profileSet.has(s.toLowerCase()));

  if (matched.length > 0) {
    reasons.push(`Matches ${matched.length} of ${projectSkills.length} required skill${projectSkills.length !== 1 ? 's' : ''}: ${matched.slice(0, 3).join(', ')}`);
  }
  if (options.city && options.projectCity && options.city.toLowerCase() === options.projectCity.toLowerCase()) {
    reasons.push(`Same city: ${options.city}`);
  }
  if (options.experience && options.projectExperience &&
    options.projectExperience.toLowerCase().includes(options.experience.toLowerCase())) {
    reasons.push(`Experience level fits: ${options.projectExperience}`);
  }
  if (options.hasPortfolio) reasons.push('Has portfolio projects');
  if (options.hasGithub) reasons.push('GitHub profile linked');

  return reasons;
}

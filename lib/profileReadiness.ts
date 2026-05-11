export type RecommendationMode = 'blocked' | 'preliminary' | 'ready';

export type ProfileReadiness = {
  completenessPercent: number;
  missingFields: string[];
  recommendationMode: RecommendationMode;
};

type ProfileInput = {
  university?: string;
  city?: string;
  bio?: string;
  about?: string;
  skills?: string[];
  interests?: string[];
  certificates?: string[];
  portfolioLinks?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  experienceLevel?: string;
  availabilityStatus?: string;
};

function normalizeArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function hasText(value: unknown) {
  return String(value || '').trim().length > 0;
}

export function calculateProfileCompleteness(profile: ProfileInput | null | undefined) {
  const checks = [
    hasText(profile?.university),
    hasText(profile?.city),
    normalizeArray(profile?.skills).length > 0,
    normalizeArray(profile?.interests).length > 0,
    hasText(profile?.experienceLevel),
    hasText(profile?.availabilityStatus),
    hasText(profile?.about) || hasText(profile?.bio),
    hasText(profile?.githubUrl),
    hasText(profile?.linkedinUrl),
    normalizeArray(profile?.portfolioLinks).length > 0,
    normalizeArray(profile?.certificates).length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export function getProfileReadiness(
  profile: ProfileInput | null | undefined
): ProfileReadiness {
  const skills = normalizeArray(profile?.skills);
  const interests = normalizeArray(profile?.interests);
  const city = hasText(profile?.city);
  const experience = hasText(profile?.experienceLevel);

  const missingFields: string[] = [];
  if (!skills.length) missingFields.push('skills');
  if (!interests.length) missingFields.push('interests');
  if (!city) missingFields.push('city');
  if (!experience) missingFields.push('experienceLevel');
  if (!hasText(profile?.availabilityStatus)) missingFields.push('availabilityStatus');
  if (!(hasText(profile?.about) || hasText(profile?.bio))) missingFields.push('about');
  if (!hasText(profile?.university)) missingFields.push('university');
  if (!hasText(profile?.githubUrl)) missingFields.push('githubUrl');
  if (!hasText(profile?.linkedinUrl)) missingFields.push('linkedinUrl');
  if (!normalizeArray(profile?.portfolioLinks).length) missingFields.push('portfolioLinks');

  let recommendationMode: RecommendationMode = 'preliminary';

  const blockedByCoreData =
    !city &&
    !experience &&
    skills.length === 0 &&
    interests.length === 0;

  if (blockedByCoreData) {
    recommendationMode = 'blocked';
  } else if (skills.length >= 3 && interests.length >= 2 && city && experience) {
    recommendationMode = 'ready';
  }

  return {
    completenessPercent: calculateProfileCompleteness(profile),
    missingFields,
    recommendationMode,
  };
}

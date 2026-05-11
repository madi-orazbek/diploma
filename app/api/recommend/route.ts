import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import StudentProfile from '@/models/StudentProfile';
import { getProfileReadiness } from '@/lib/profileReadiness';
import { loadUnifiedDataset } from '@/lib/recommendation/unified-dataset';
import { combineMatchPercent, ProfileSignals, summarizeDistribution } from '@/lib/recommendation/match-score';

export const dynamic = 'force-dynamic';

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function getProfileCompletionHints(profile: any) {
  return getProfileReadiness(profile).missingFields;
}

function extractRecommendations(raw: any): any[] {
  if (Array.isArray(raw?.recommendations)) return raw.recommendations;
  if (Array.isArray(raw?.data?.recommendations)) return raw.data.recommendations;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  return [];
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ML_API_URL = process.env.ML_API_URL;

    const authUser = getUserFromCookie();
    let profile: any = null;

    await dbConnect();

    if (authUser?.role === 'STUDENT') {
      profile = await StudentProfile.findOne({ userId: authUser.userId }).lean();
    }

    const profileSignals: ProfileSignals = {
      skills: toStringList(body.skills || profile?.skills),
      interests: toStringList(body.interests || profile?.interests),
      city: String(body.city || profile?.city || ''),
      experience: String(body.experience || profile?.experienceLevel || 'JUNIOR'),
      employment: String(body.employment || ''),
    };

    const unifiedDataset = await loadUnifiedDataset();
    const openProjects = unifiedDataset.filter((item) => item.status === 'OPEN');
    const byId = new Map(openProjects.map((item) => [String(item.id), item]));

    console.log('[recommend] dataset summary', {
      unifiedItems: unifiedDataset.length,
      openItems: openProjects.length,
      profileSkills: profileSignals.skills.length,
      profileInterests: profileSignals.interests.length,
    });

    const requestedTopN = Number(body.top_n || 20);
    const profileReadiness = getProfileReadiness(profile);
    const missing = getProfileCompletionHints(profile);

    if (authUser?.role === 'STUDENT' && profileReadiness.recommendationMode === 'blocked') {
      return NextResponse.json({
        success: true,
        source: 'ML API',
        warnings: ['Complete your profile to get personalized recommendations.'],
        profileReadiness,
        data: { recommendations: [] },
        recommendations: [],
      });
    }

    if (!openProjects.length) {
      return NextResponse.json({
        success: true,
        source: 'ML API',
        warnings: ['No open projects available for recommendations yet.'],
        profileReadiness,
        data: { recommendations: [] },
        recommendations: [],
      });
    }

    const payload = {
      skills: profileSignals.skills.join(', '),
      interests: profileSignals.interests.join(', '),
      experience: profileSignals.experience,
      employment: profileSignals.employment,
      city: profileSignals.city,
      top_n: Math.max(requestedTopN, 150),
      projects: openProjects.map(toProjectText),
    };

    let recommendationsRaw: any[] = [];

    if (ML_API_URL) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const mlRes = await fetch(`${ML_API_URL}/recommend-projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store',
          signal: controller.signal,
        });
        const mlData = await mlRes.json().catch(() => null);
        if (!mlRes.ok) {
          console.error('ML service returned error:', mlData);
        } else {
          recommendationsRaw = extractRecommendations(mlData);
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!recommendationsRaw.length) {
      recommendationsRaw = openProjects.slice(0, 300).map((item) => ({
        project_id: item.id,
        title: item.title,
        text: item.description,
        city: item.city,
        employment_type: item.employmentType,
        experience_level: item.experienceLevel,
        category: item.category,
        budget_min: item.budgetMin,
        budget_max: item.budgetMax,
        final_score: null,
        match_reason: 'Matched by profile signals and skill overlap.',
      }));
    }

    const normalized = recommendationsRaw
      .map((row) => {
        const id = String(row?.project_id || row?.id || '');
        const unified = byId.get(id);
        if (!id || !unified) return null;

        const combined = combineMatchPercent(profileSignals, unified, row?.final_score ?? row?.score ?? row?.match_score);

        return {
          project_id: id,
          id,
          type: unified.type,
          title: row?.title || row?.job_title || unified.title,
          description: unified.description,
          text: row?.text || unified.description,
          company: unified.company || 'Company not specified',
          city: row?.city || unified.city,
          category: row?.category || unified.category,
          skills: unified.skills || unified.requiredSkills || [],
          requiredSkills: unified.requiredSkills || [],
          experienceLevel: unified.experienceLevel,
          employmentType: unified.employmentType,
          experience_level: row?.experience_level || unified.experienceLevel,
          employment_type: row?.employment_type || unified.employmentType,
          salaryMin: unified.budgetMin,
          salaryMax: unified.budgetMax,
          budget_min: Number.isFinite(Number(row?.budget_min)) ? Number(row?.budget_min) : unified.budgetMin,
          budget_max: Number.isFinite(Number(row?.budget_max)) ? Number(row?.budget_max) : unified.budgetMax,
          source: unified.source,
          final_score: combined.matchScore,
          matchScore: combined.matchScore,
          matchPercent: combined.matchPercent,
          match_reason: row?.match_reason || 'Matched by profile signals and skill overlap.',
          predicted_family: row?.predicted_family || null,
        };
      })
      .filter(Boolean) as any[];

    normalized.sort((a, b) => Number(b.matchPercent || 0) - Number(a.matchPercent || 0));

    const finalRows = normalized.slice(0, requestedTopN);

    console.log('[recommend] ml vector sample', {
      payloadSkills: payload.skills,
      payloadInterests: payload.interests,
      sampleProject: payload.projects[0] || null,
    });
    console.log('[recommend] score distribution', summarizeDistribution(finalRows));
    console.log('[recommend] returned summary', {
      rawRecommendations: recommendationsRaw.length,
      normalizedRecommendations: normalized.length,
      returned: finalRows.length,
      topN: requestedTopN,
    });

    return NextResponse.json({
      success: true,
      source: ML_API_URL ? 'ML API' : 'heuristic',
      warnings: missing.length
        ? ['Your profile can be strengthened for better recommendation quality.']
        : [],
      data: { recommendations: finalRows },
      recommendations: finalRows,
      profileReadiness,
    });
  } catch (error: any) {
    console.error('Recommend route error:', error);

    if (error?.name === 'AbortError') {
      return NextResponse.json({ error: 'ML request timed out' }, { status: 504 });
    }

    return NextResponse.json({ error: 'ML request failed', details: String(error) }, { status: 500 });
  }
}

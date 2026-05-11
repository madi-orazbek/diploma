import { z } from 'zod';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { calculateProfileCompleteness, getProfileReadiness } from '@/lib/profileReadiness';

export const dynamic = 'force-dynamic';

const optionalString = (max: number) => z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().max(max).optional()
);

const optionalUrl = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  },
  z.string().url('Please enter a valid URL').optional()
);

const normalizeArray = z.preprocess(
  (value) => {
    if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map((x) => x.trim()).filter(Boolean);
    return [];
  },
  z.array(z.string())
);

const schema = z.object({
  firstName: optionalString(80),
  lastName: optionalString(80),
  birthDate: optionalString(40),
  phone: optionalString(40),
  workplaceType: optionalString(40),
  university: optionalString(120),
  city: optionalString(80),
  bio: optionalString(500),
  about: optionalString(2000),
  headline: optionalString(120),
  experience: optionalString(4000),
  projects: optionalString(4000),
  experienceEntries: z.array(z.object({
    jobTitle: z.string().max(120),
    employmentType: z.string().max(80).optional(),
    company: z.string().max(120).optional(),
    currentlyWorking: z.boolean().optional(),
    startMonth: z.string().max(20).optional(),
    startYear: z.string().max(10).optional(),
    endMonth: z.string().max(20).optional(),
    endYear: z.string().max(10).optional(),
    location: z.string().max(120).optional(),
    workplaceType: z.string().max(40).optional(),
    description: z.string().max(3000).optional()
  })).optional(),
  languages: optionalString(1000),
  achievements: optionalString(2000),
  volunteering: optionalString(2000),
  preferredRoles: optionalString(400),
  skills: normalizeArray,
  interests: normalizeArray,
  certificates: normalizeArray,
  diplomas: normalizeArray,
  portfolioLinks: normalizeArray,
  certificateDocuments: z.array(z.object({
    name: z.string().max(160),
    issuer: z.string().max(160).optional(),
    issueDate: z.string().max(40).optional(),
    expirationDate: z.string().max(40).optional(),
    doesNotExpire: z.boolean().optional(),
    skillsCovered: z.array(z.string()).optional(),
    description: z.string().max(2000).optional(),
    fileName: z.string().max(200),
    fileSize: z.number().max(10 * 1024 * 1024).optional(),
    fileDataUrl: z.string().max(6_000_000).optional()
  })).optional(),
  diplomaDocuments: z.array(z.object({
    university: z.string().max(160),
    degree: z.string().max(120).optional(),
    fieldOfStudy: z.string().max(120).optional(),
    gpa: z.string().max(40).optional(),
    startYear: z.string().max(10).optional(),
    graduationYear: z.string().max(10).optional(),
    graduated: z.boolean().optional(),
    expectedGraduationYear: z.string().max(10).optional(),
    notes: z.string().max(2000).optional(),
    fileName: z.string().max(200),
    fileSize: z.number().max(10 * 1024 * 1024).optional(),
    fileDataUrl: z.string().max(6_000_000).optional()
  })).optional(),
  avatarDataUrl: optionalString(6_000_000),
  avatar: optionalString(6_000_000),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  experienceLevel: optionalString(40),
  availabilityStatus: optionalString(40)
});

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();

    const [profileRaw, userRaw] = await Promise.all([
      StudentProfile.findOne({ userId: user.userId }).lean(),
      User.findOne({ _id: user.userId }).lean()
    ]);

    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    const userDoc = Array.isArray(userRaw) ? userRaw[0] : userRaw;
    if (!userDoc) throw new ApiError('User not found', 404);

    const mergedProfile = {
      userId: user.userId,
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      birthDate: profile?.birthDate || '',
      phone: profile?.phone || '',
      workplaceType: profile?.workplaceType || 'REMOTE',
      university: profile?.university || userDoc?.university || '',
      city: profile?.city || userDoc?.city || '',
      bio: profile?.bio || userDoc?.bio || '',
      about: profile?.about || '',
      headline: profile?.headline || '',
      experience: profile?.experience || '',
      projects: profile?.projects || '',
      experienceEntries: profile?.experienceEntries || [],
      languages: profile?.languages || '',
      achievements: profile?.achievements || '',
      volunteering: profile?.volunteering || '',
      preferredRoles: profile?.preferredRoles || '',
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      certificates: profile?.certificates || [],
      diplomas: profile?.diplomas || [],
      certificateDocuments: profile?.certificateDocuments || [],
      diplomaDocuments: profile?.diplomaDocuments || [],
      portfolioLinks: profile?.portfolioLinks || [],
      githubUrl: profile?.githubUrl || '',
      linkedinUrl: profile?.linkedinUrl || '',
      avatarDataUrl: profile?.avatarDataUrl || '',
      avatar: profile?.avatar || '',
      experienceLevel: profile?.experienceLevel || 'JUNIOR',
      availabilityStatus: profile?.availabilityStatus || 'AVAILABLE',
      fullName: userDoc?.fullName || '',
      email: userDoc?.email || ''
    };

    const readiness = getProfileReadiness(mergedProfile);
    return ok({
      ...mergedProfile,
      completion: calculateProfileCompleteness(mergedProfile),
      profileReadiness: readiness,
    });
  });
}

export async function PUT(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    await dbConnect();
    const payload = schema.parse(await req.json());

    const [userRaw, profileRaw] = await Promise.all([
      User.findOneAndUpdate(
        { _id: user.userId },
        { university: payload.university || '', city: payload.city || '', bio: payload.bio || '' },
        { new: true }
      ),
      StudentProfile.findOneAndUpdate(
        { userId: user.userId },
        {
          $set: {
            university: payload.university || '',
            city: payload.city || '',
            bio: payload.bio || '',
            firstName: payload.firstName || '',
            lastName: payload.lastName || '',
            birthDate: payload.birthDate || '',
            phone: payload.phone || '',
            workplaceType: payload.workplaceType || 'REMOTE',
            about: payload.about || '',
            headline: payload.headline || '',
            experience: payload.experience || '',
            projects: payload.projects || '',
            experienceEntries: payload.experienceEntries || [],
            languages: payload.languages || '',
            achievements: payload.achievements || '',
            volunteering: payload.volunteering || '',
            preferredRoles: payload.preferredRoles || '',
            skills: payload.skills,
            interests: payload.interests,
            certificates: payload.certificates,
            diplomas: payload.diplomas,
            certificateDocuments: payload.certificateDocuments || [],
            diplomaDocuments: payload.diplomaDocuments || [],
            portfolioLinks: payload.portfolioLinks,
            githubUrl: payload.githubUrl || '',
            linkedinUrl: payload.linkedinUrl || '',
            avatarDataUrl: payload.avatarDataUrl || '',
            avatar: payload.avatar || payload.avatarDataUrl || '',
            experienceLevel: payload.experienceLevel || 'JUNIOR',
            availabilityStatus: payload.availabilityStatus || 'AVAILABLE'
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    ]);

    const userDoc = Array.isArray(userRaw) ? userRaw[0] : userRaw;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    if (!profile || !userDoc) {
      console.error('PROFILE SAVE ERROR: profile or user missing after update', { userId: user.userId });
      throw new ApiError('Failed to persist student profile', 500);
    }

    const mergedProfile = {
      ...profile.toObject(),
      fullName: userDoc.fullName || '',
      completion: calculateProfileCompleteness(profile),
      profileReadiness: getProfileReadiness(profile),
    };

    return ok(mergedProfile);
  });
}

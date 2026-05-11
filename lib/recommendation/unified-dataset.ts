import { promises as fs } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

export type UnifiedItem = {
  id: string;
  type: 'vacancy' | 'project';
  clientId: string | null;
  company: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  skills: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: string | null;
  city: string;
  employmentType: string;
  experienceLevel: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string | null;
  source: string;
  raw?: any;
  matchScore?: number;
  matchPercent?: number;
};

const EMPLOYMENT_MAP: Record<string, string> = {
  'Полная занятость': 'full-time',
  'Частичная занятость': 'part-time',
  'Проектная работа': 'project',
  'Стажировка': 'internship',
};

const EXPERIENCE_MAP: Record<string, string> = {
  'Нет опыта': 'junior',
  'От 1 года до 3 лет': 'middle',
  'От 3 до 6 лет': 'senior',
  'Более 6 лет': 'senior',
};

export function normalizeEmploymentType(value?: string | null): string {
  if (!value) return 'full-time';
  return EMPLOYMENT_MAP[value] || value.toLowerCase();
}

export function normalizeExperienceLevel(value?: string | null): string {
  if (!value) return 'middle';
  return EXPERIENCE_MAP[value] || value.toLowerCase();
}

export function extractSkillNames(skills: unknown[] = []): string[] {
  return skills
    .map((skill) => {
      if (typeof skill === 'string') return skill;
      if (skill && typeof skill === 'object' && 'name' in skill) {
        return String((skill as { name?: unknown }).name || '');
      }
      return '';
    })
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function inferCategoryFromText(title: string, description: string, skills: string[]): string {
  const text = `${title} ${description} ${skills.join(' ')}`.toLowerCase();

  if (/(telegram bot|bot\b)/i.test(text)) return 'Bot Development';
  if (/(react|vue|javascript|html|css|frontend)/i.test(text)) return 'Frontend';
  if (/(python|django|fastapi|flask|api|backend|node\.js|nodejs|express)/i.test(text)) return 'Backend';
  if (/(sql|analyst|analytics|power bi|excel|pandas)/i.test(text)) return 'Data Analytics';
  if (/(airflow|etl|data engineer)/i.test(text)) return 'Data Engineering';
  if (/(docker|kubernetes|devops|ci\/cd|ansible)/i.test(text)) return 'DevOps';
  if (/(qa|test|testing|selenium)/i.test(text)) return 'QA';
  if (/(ml|machine learning|ai|llm|nlp|rag|transformers)/i.test(text)) return 'Machine Learning';

  return 'Other';
}

export function mapVacancyToUnifiedItem(vacancy: Record<string, any>): UnifiedItem {
  const requiredSkills = extractSkillNames(Array.isArray(vacancy?.key_skills) ? vacancy.key_skills : []);
  const title = String(vacancy?.title || '');
  const description = String(vacancy?.description_text || '');

  return {
    id: String(vacancy?.id || ''),
    type: 'vacancy',
    clientId: vacancy?.company?.id ? String(vacancy.company.id) : null,
    company: String(vacancy?.company?.name || vacancy?.employer?.name || 'Company not specified'),
    title,
    description,
    category: inferCategoryFromText(title, description, requiredSkills),
    requiredSkills,
    skills: requiredSkills,
    budgetMin: Number.isFinite(Number(vacancy?.salary?.from)) ? Number(vacancy.salary.from) : null,
    budgetMax: Number.isFinite(Number(vacancy?.salary?.to)) ? Number(vacancy.salary.to) : null,
    deadline: null,
    city: String(vacancy?.location?.city || 'Remote'),
    employmentType: normalizeEmploymentType(vacancy?.employment_type || null),
    experienceLevel: normalizeExperienceLevel(vacancy?.experience_level || null),
    status: vacancy?.closed_for_applicants ? 'CLOSED' : 'OPEN',
    createdAt: vacancy?.created_at || vacancy?.published_at || null,
    source: String(vacancy?.source || 'hh.kz'),
    raw: vacancy,
  };
}

export function mapProjectToUnifiedItem(project: Record<string, any>): UnifiedItem {
  const requiredSkills = Array.isArray(project?.required_skills)
    ? project.required_skills.map((x: unknown) => String(x)).filter(Boolean)
    : [];

  const difficulty = String(project?.difficulty || '').toLowerCase();
  const level = difficulty === 'easy' ? 'junior' : difficulty === 'medium' ? 'middle' : difficulty === 'hard' ? 'senior' : 'middle';
  const title = String(project?.title || '');
  const description = String(project?.summary || '');

  return {
    id: String(project?.id || ''),
    type: 'project',
    clientId: project?.related_vacancy_id ? String(project.related_vacancy_id) : null,
    company: String(project?.company?.name || project?.clientName || 'Project owner'),
    title,
    description,
    category: String(project?.category || inferCategoryFromText(title, description, requiredSkills)),
    requiredSkills,
    skills: requiredSkills,
    budgetMin: null,
    budgetMax: null,
    deadline: null,
    city: 'Remote',
    employmentType: 'project',
    experienceLevel: level,
    status: 'OPEN',
    createdAt: null,
    source: String(project?.source || 'generated_from_vacancy'),
    raw: project,
  };
}

export function mapVacancyCardToUnifiedItem(card: Record<string, any>): UnifiedItem {
  const requiredSkills = extractSkillNames(Array.isArray(card?.key_skills) ? card.key_skills : []);
  const title = String(card?.title || card?.name || 'Vacancy card');
  const description = String(card?.description_text || card?.description || '');
  const fallbackId = card?.vacancy_id || card?.alternate_url || title;

  return {
    id: String(card?.id || fallbackId),
    type: 'vacancy',
    clientId: card?.company?.id ? String(card.company.id) : null,
    company: String(card?.company?.name || card?.employer?.name || 'Company not specified'),
    title,
    description,
    category: inferCategoryFromText(title, description, requiredSkills),
    requiredSkills,
    skills: requiredSkills,
    budgetMin: Number.isFinite(Number(card?.salary?.from)) ? Number(card.salary.from) : null,
    budgetMax: Number.isFinite(Number(card?.salary?.to)) ? Number(card.salary.to) : null,
    deadline: null,
    city: String(card?.location?.city || card?.city || 'Remote'),
    employmentType: normalizeEmploymentType(card?.employment_type || null),
    experienceLevel: normalizeExperienceLevel(card?.experience_level || null),
    status: card?.closed_for_applicants ? 'CLOSED' : 'OPEN',
    createdAt: card?.created_at || card?.published_at || null,
    source: String(card?.source || 'vacancy_card'),
    raw: card,
  };
}

export function buildUnifiedDataset(input: {
  vacancies?: Record<string, any>[];
  projects?: Record<string, any>[];
  vacancyCards?: Record<string, any>[];
}): UnifiedItem[] {
  const vacancies = Array.isArray(input.vacancies) ? input.vacancies.map(mapVacancyToUnifiedItem) : [];
  const projects = Array.isArray(input.projects) ? input.projects.map(mapProjectToUnifiedItem) : [];
  const cards = Array.isArray(input.vacancyCards) ? input.vacancyCards.map(mapVacancyCardToUnifiedItem) : [];

  const seen = new Set<string>();
  const merged: UnifiedItem[] = [];

  for (const item of [...vacancies, ...projects]) {
    seen.add(item.id);
    merged.push(item);
  }

  for (const card of cards) {
    if (seen.has(card.id)) continue;
    merged.push(card);
  }

  return merged;
}

function dedupeKeyByContent(item: UnifiedItem) {
  return `${String(item.title || '').trim().toLowerCase()}|${String(item.company || '').trim().toLowerCase()}|${String(item.city || '').trim().toLowerCase()}`;
}

function dedupeUnifiedItems(items: UnifiedItem[]): UnifiedItem[] {
  const byId = new Set<string>();
  const byContent = new Set<string>();
  const deduped: UnifiedItem[] = [];

  for (const item of items) {
    const idKey = String(item.id || '').trim().toLowerCase();
    const contentKey = dedupeKeyByContent(item);
    if (idKey && byId.has(idKey)) continue;
    if (byContent.has(contentKey)) continue;
    if (idKey) byId.add(idKey);
    byContent.add(contentKey);
    deduped.push(item);
  }

  return deduped;
}

function looksLikeVacancy(doc: Record<string, any>) {
  if (String(doc?.entity_type || '').toLowerCase() === 'vacancy') return true;
  return Boolean(doc?.description_text || doc?.employment_type || doc?.experience_level || doc?.location?.city);
}

function looksLikeProject(doc: Record<string, any>) {
  if (String(doc?.entity_type || '').toLowerCase() === 'project') return true;
  return Boolean(doc?.summary || doc?.required_skills || doc?.difficulty || doc?.related_vacancy_id);
}

async function readJsonArray(filePath: string): Promise<Record<string, any>[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function loadUnifiedDatasetFromJson(): Promise<UnifiedItem[]> {
  const candidateDirs = [
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'public', 'data'),
    process.cwd(),
  ];

  for (const dir of candidateDirs) {
    const vacancies = await readJsonArray(path.join(dir, 'vacancies.json'));
    const projects = await readJsonArray(path.join(dir, 'projects.json'));
    const vacancyCards = await readJsonArray(path.join(dir, 'vacancy_cards.json'));

    if (vacancies.length || projects.length || vacancyCards.length) {
      const merged = buildUnifiedDataset({ vacancies, projects, vacancyCards });
      const deduped = dedupeUnifiedItems(merged);
      console.log('[unified-dataset] json dedup summary', { merged: merged.length, deduped: deduped.length });
      return deduped;
    }
  }

  return [];
}

async function readCollectionSafe(db: mongoose.mongo.Db, names: string[]): Promise<Record<string, any>[]> {
  for (const name of names) {
    const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
    if (!exists) continue;
    const docs = await db.collection(name).find({}).toArray();
    if (Array.isArray(docs)) return docs as Record<string, any>[];
  }
  return [];
}

export async function loadUnifiedDatasetFromMongo(): Promise<UnifiedItem[]> {
  await dbConnect();
  const db = mongoose.connection.db;
  if (!db) return [];

  const vacanciesDocs = await readCollectionSafe(db, ['vacancies']);
  const projectsDocs = await readCollectionSafe(db, ['projects']);
  const vacancyCardsDocs = await readCollectionSafe(db, ['vacancyCards', 'vacancy_cards']);

  const normalizedVacancies = [
    ...vacanciesDocs.map(mapVacancyToUnifiedItem),
    ...projectsDocs.filter(looksLikeVacancy).map(mapVacancyToUnifiedItem),
  ];
  const normalizedProjects = projectsDocs.filter((doc) => looksLikeProject(doc) && !looksLikeVacancy(doc)).map(mapProjectToUnifiedItem);
  const normalizedCards = vacancyCardsDocs.map(mapVacancyCardToUnifiedItem);

  const seen = new Set<string>();
  const unified: UnifiedItem[] = [];
  for (const item of [...normalizedVacancies, ...normalizedProjects]) {
    seen.add(item.id);
    unified.push(item);
  }
  for (const item of normalizedCards) {
    if (seen.has(item.id)) continue;
    unified.push(item);
  }

  const dedupedUnified = dedupeUnifiedItems(unified);

  console.log('[unified-dataset] mongo counts', {
    vacanciesCollection: vacanciesDocs.length,
    projectsCollection: projectsDocs.length,
    vacancyCardsCollection: vacancyCardsDocs.length,
    normalizedVacancies: normalizedVacancies.length,
    normalizedProjects: normalizedProjects.length,
    normalizedCards: normalizedCards.length,
    unifiedItems: unified.length,
    dedupedUnifiedItems: dedupedUnified.length,
  });

  return dedupedUnified;
}

export async function loadUnifiedDataset(): Promise<UnifiedItem[]> {
  const useLocalJsonOnly = process.env.USE_LOCAL_JSON_DATA === 'true';
  const allowJsonFallback = process.env.ALLOW_JSON_FALLBACK === 'true';

  if (useLocalJsonOnly) {
    return loadUnifiedDatasetFromJson();
  }

  const mongoItems = await loadUnifiedDatasetFromMongo();
  if (mongoItems.length > 0) return mongoItems;

  if (allowJsonFallback) {
    const jsonItems = await loadUnifiedDatasetFromJson();
    console.log('[unified-dataset] using JSON fallback', { jsonItems: jsonItems.length });
    return jsonItems;
  }

  return [];
}

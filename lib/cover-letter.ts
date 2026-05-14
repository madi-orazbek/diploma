/**
 * generateCoverLetter — client-side helper.
 * Calls the secure /api/ai/assistant backend; the OpenAI key never leaves the server.
 *
 * @param project        The project/vacancy object from the unified dataset
 * @param studentProfile The student's profile object
 * @param language       'en' or 'ru'
 * @returns              The cover letter text, or null on error
 */
export async function generateCoverLetter(
  project: {
    title?: string;
    company?: string;
    city?: string;
    requiredSkills?: string[];
    description?: string;
    category?: string;
  },
  studentProfile: {
    fullName?: string;
    skills?: string[];
    experienceLevel?: string;
    university?: string;
    about?: string;
  },
  language: 'en' | 'ru' = 'en',
): Promise<string | null> {
  const studentName = studentProfile.fullName || 'a student';
  const studentSkills = (studentProfile.skills || []).slice(0, 8).join(', ');
  const studentLevel = studentProfile.experienceLevel || '';
  const studentUniversity = studentProfile.university || '';
  const about = studentProfile.about ? studentProfile.about.slice(0, 200) : '';
  const projectSkills = (project.requiredSkills || []).slice(0, 6).join(', ');

  const parts = [
    language === 'ru'
      ? `Напиши профессиональное сопроводительное письмо для ${studentName}, который подаёт заявку на роль "${project.title}" в компании ${project.company || 'компании'} (${project.city || 'удалённо'}).`
      : `Write a professional cover letter for ${studentName} applying to the role "${project.title}" at ${project.company || 'the company'} (${project.city || 'remote'}).`,
    studentLevel &&
      (language === 'ru'
        ? `Уровень опыта кандидата: ${studentLevel}.`
        : `The applicant's experience level is ${studentLevel}.`),
    studentUniversity &&
      (language === 'ru'
        ? `Учится в ${studentUniversity}.`
        : `They study at ${studentUniversity}.`),
    studentSkills &&
      (language === 'ru'
        ? `Ключевые навыки: ${studentSkills}.`
        : `Their key skills: ${studentSkills}.`),
    about &&
      (language === 'ru'
        ? `Краткое описание: ${about}`
        : `Brief background: ${about}`),
    projectSkills &&
      (language === 'ru'
        ? `Проект требует: ${projectSkills}.`
        : `The role requires: ${projectSkills || 'general technical skills'}.`),
    language === 'ru'
      ? 'Напиши 3–4 предложения. Будь профессиональным и конкретным. Выведи ТОЛЬКО текст письма — без приветствия, без подписи. Начни с "Я".'
      : 'Write 3–4 sentences. Be specific, professional, and enthusiastic. Output ONLY the cover letter text — no greeting line, no header, no signature. Start with "I am".',
  ]
    .filter(Boolean)
    .join(' ');

  try {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: parts, language }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const reply: string = payload?.data?.reply ?? '';
    if (!reply) return null;

    // Strip accidental headers the model might add
    return reply
      .replace(/^(Cover Letter:?\s*|Сопроводительное письмо:?\s*|Dear Hiring Manager,?\s*|Уважаемый[^,]*,?\s*|Hello,?\s*)/i, '')
      .trim();
  } catch {
    return null;
  }
}

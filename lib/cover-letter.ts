/**
 * generateCoverLetter — client-side helper.
 *
 * Builds a context-rich prompt and sends it to the secure /api/ai/assistant
 * backend route. The OpenAI key never leaves the server.
 *
 * @param project        Project/vacancy object from the unified dataset
 * @param studentProfile Student's profile object
 * @param language       'en' or 'ru' (defaults to 'en')
 * @returns              Cover letter text, or null on error
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
  const studentName = studentProfile.fullName || 'the applicant';
  const studentSkills = (studentProfile.skills || []).slice(0, 8).join(', ');
  const studentLevel = studentProfile.experienceLevel || '';
  const studentUniversity = studentProfile.university || '';
  const about = studentProfile.about ? studentProfile.about.slice(0, 200) : '';
  const projectSkills = (project.requiredSkills || []).slice(0, 6).join(', ');

  // Build the cover-letter-specific prompt in the selected language
  const parts =
    language === 'ru'
      ? [
          `Напиши профессиональное сопроводительное письмо для ${studentName}, который подаёт заявку на позицию "${project.title}" в компании ${project.company || 'компании'} (${project.city || 'удалённо'}).`,
          studentLevel && `Уровень опыта кандидата: ${studentLevel}.`,
          studentUniversity && `Учится в ${studentUniversity}.`,
          studentSkills && `Ключевые навыки: ${studentSkills}.`,
          about && `О себе: ${about}`,
          projectSkills && `Проект требует: ${projectSkills}.`,
          'Напиши 3–4 предложения. Будь конкретным и профессиональным. Выведи ТОЛЬКО текст письма — без заголовка, без подписи. Начни с "Я".',
        ]
      : [
          `Write a professional cover letter for ${studentName} applying to "${project.title}" at ${project.company || 'the company'} (${project.city || 'remote'}).`,
          studentLevel && `Experience level: ${studentLevel}.`,
          studentUniversity && `Studies at ${studentUniversity}.`,
          studentSkills && `Key skills: ${studentSkills}.`,
          about && `Background: ${about}`,
          projectSkills && `Role requires: ${projectSkills}.`,
          'Write 3–4 sentences. Be specific, professional, and enthusiastic. Output ONLY the cover letter text — no greeting, no header, no signature. Start with "I am".',
        ];

  const message = parts.filter(Boolean).join(' ');

  try {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        language,
        page: '/projects',
        history: [],
      }),
    });

    if (!res.ok) return null;
    const payload = await res.json();
    const reply: string = payload?.data?.reply ?? '';
    if (!reply) return null;

    // Strip accidental headers the model might prepend
    return reply
      .replace(
        /^(Cover Letter:?\s*|Сопроводительное письмо:?\s*|Dear Hiring Manager,?\s*|Уважаемый[^,\n]*,?\s*|Hello,?\s*|Здравствуйте,?\s*)/i,
        '',
      )
      .trim();
  } catch {
    return null;
  }
}

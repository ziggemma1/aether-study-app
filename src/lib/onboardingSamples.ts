import curriculumData from '../data/curriculum.json';

/**
 * Subject choices and starter materials for first-run onboarding.
 *
 * Everything here is derived from `src/data/curriculum.json`, which already
 * ships with the app and backs the Curriculum Library page. Nothing is
 * invented: a starter pack is real chapter text the user could have reached
 * through /curriculum anyway, just placed in their library on day one so the
 * dashboard is not empty.
 */

interface Chapter {
  id: string;
  chapter: string;
  content: string;
}

type Curriculum = Record<string, Record<string, Record<string, Chapter[]>>>;

const data = curriculumData as unknown as Curriculum;

export interface SubjectOption {
  country: string;
  exam: string;
  subject: string;
  chapters: Chapter[];
}

/** Every subject in the bundled curriculum, flattened to a pickable list. */
export function allSubjects(): SubjectOption[] {
  const out: SubjectOption[] = [];
  for (const country of Object.keys(data)) {
    for (const exam of Object.keys(data[country])) {
      for (const subject of Object.keys(data[country][exam])) {
        out.push({ country, exam, subject, chapters: data[country][exam][subject] || [] });
      }
    }
  }
  return out;
}

/**
 * Subjects for one country, falling back to the full list. A user whose
 * country we don't carry curriculum for still gets something to pick from
 * rather than an empty step.
 */
export function subjectsForCountry(country?: string): SubjectOption[] {
  const all = allSubjects();
  if (!country) return all;
  const matches = all.filter(s => s.country.toLowerCase() === country.toLowerCase());
  return matches.length ? matches : all;
}

/** The starter pack for a subject, or null when it has no chapters. */
export function findSubject(subject: string): SubjectOption | null {
  return allSubjects().find(s => s.subject === subject) || null;
}

export interface StarterMaterial {
  title: string;
  type: 'note';
  summary: string;
  content: string;
  keyTopics: string[];
}

/**
 * Turns a subject's chapters into a single material payload for POST
 * /materials. One material rather than one per chapter keeps the new user's
 * library legible — a wall of six cards on day one reads as clutter.
 */
export function buildStarterMaterial(option: SubjectOption): StarterMaterial {
  const chapterTitles = option.chapters.map(c => c.chapter);
  const content = option.chapters
    .map(c => `## ${c.chapter}\n\n${c.content}`)
    .join('\n\n');

  return {
    title: `${option.subject} Starter Pack (${option.exam})`,
    type: 'note',
    summary:
      `${chapterTitles.length} core ${option.subject} ${chapterTitles.length === 1 ? 'topic' : 'topics'} ` +
      `from the ${option.exam} syllabus, added when you joined so you have something to study straight away.`,
    content,
    keyTopics: chapterTitles
  };
}

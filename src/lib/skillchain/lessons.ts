import { useMemo } from "react";
import enRaw from "@/content/lessons.en.json";
import ptRaw from "@/content/lessons.pt.json";
import { useLang } from "@/i18n/use-t";
import type { Lang } from "@/i18n/translate";
import { LEVEL_POINTS } from "./constants";

export interface LessonStep {
  type: "text";
  title: string;
  body: string;
  /** Optional "In practice" box. */
  term?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export type TaskType = "init_profile" | "complete_level_2" | "complete_level_3";

export interface Lesson {
  level: number;
  title: string;
  topics: string;
  steps: LessonStep[];
  quiz: QuizQuestion[];
  task: { type: TaskType; title: string; description: string; button: string };
}

const LESSONS_BY_LANG: Record<Lang, Lesson[]> = {
  en: enRaw as Lesson[],
  pt: ptRaw as Lesson[],
};

export function getLessons(lang: Lang): Lesson[] {
  return LESSONS_BY_LANG[lang];
}

export function getLesson(level: number, lang: Lang): Lesson | undefined {
  return getLessons(lang).find((lesson) => lesson.level === level);
}

/** Lessons in the current language. */
export function useLessons(): Lesson[] {
  const lang = useLang();
  return useMemo(() => getLessons(lang), [lang]);
}

export function getLevelPoints(level: number): number {
  return LEVEL_POINTS[level - 1] ?? 0;
}

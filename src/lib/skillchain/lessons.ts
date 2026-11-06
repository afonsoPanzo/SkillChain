import raw from "@/content/lessons.json";
import { LEVEL_POINTS } from "./constants";

export interface LessonStep {
  type: "text";
  title: string;
  body: string;
  /** Optional "Na prática" code box. */
  code?: string;
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

export const LESSONS = raw as Lesson[];

export function getLesson(level: number): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.level === level);
}

export function getLevelPoints(level: number): number {
  return LEVEL_POINTS[level - 1] ?? 0;
}

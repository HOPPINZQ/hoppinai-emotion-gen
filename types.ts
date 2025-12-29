
export enum AppState {
  LANDING = 'LANDING',
  RANTING = 'RANTING',
  QUIZ_GENERATING = 'QUIZ_GENERATING',
  QUIZ_TAKING = 'QUIZ_TAKING',
  ANALYZING = 'ANALYZING',
  REPORT = 'REPORT',
  HISTORY = 'HISTORY'
}

export interface QuizOption {
  id: string;
  text: string;
  weight: number; // 0-10 scale for sentiment or intensity
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

export interface Quiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface AssessmentResult {
  emotionalState: string;
  copingStyle: string;
  potentialNeeds: string;
  psychologicalInsight: string;
  suggestions: string[];
  crisisWarning?: boolean;
}

export interface MoodHistoryEntry {
  id: string;
  date: string;
  rantSnippet: string;
  fullResult: AssessmentResult;
}

export interface UserInput {
  text: string;
  theme: string;
}

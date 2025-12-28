export type UserMode = 'TEACHER' | 'STUDENT';
export type VisualLanguage = 'Chinese' | 'English';

export enum AppStep {
  MODE_SELECTION = 0,
  BASIC_INFO = 1,
  GOALS = 2,
  MODULE_SELECTION = 3,
  STUDENT_TRAITS = 4,
  RESULT = 5
}

export interface BasicInfo {
  age: string;
  subject: string;
  topic: string;
}

export interface Goals {
  learningGoal: string; // understanding, memory, application, creation, etc.
  timing: string; // intro, review, assessment, etc.
}

export interface StudentTraits {
  interests: string;
  differentiation: boolean;
}

export interface ModuleOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string | null;
  status: 'pending' | 'generating' | 'completed' | 'error';
  error?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9';
}

export interface EduState {
  step: AppStep;
  mode: UserMode | null;
  basicInfo: BasicInfo;
  goals: Goals;
  selectedModules: string[];
  studentTraits: StudentTraits;
  visualLanguage: VisualLanguage;
  aiSuggestion: string | null;
  finalResult: string | null;
  isGenerating: boolean;
  isSuggesting: boolean;
  generatedImages: GeneratedImage[];
}

// Add global definition for AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

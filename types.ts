export type VisualLanguage = 'Chinese' | 'English';
export type InformationDensity = 'Standard' | 'Detailed' | 'Professional';

export enum AppStep {
  BASIC_INFO = 0,
  MODULE_SELECTION = 1,
  STUDENT_TRAITS = 2,
  RESULT = 3
}

export interface BasicInfo {
  age: string;
  subject: string;
  topic: string;
  density: InformationDensity;
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
  editedPrompt?: string;
  url: string | null;
  status: 'pending' | 'generating' | 'completed' | 'error';
  error?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9';
}

export interface EduState {
  step: AppStep;
  basicInfo: BasicInfo;
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

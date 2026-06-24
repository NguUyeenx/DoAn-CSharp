export interface AnalyticsSummary {
  totalVisits: number;
  totalQrScans: number;
  totalAudioPlays: number;
  activeVisitors: number;
  visitsOverTime: { date: string; count: number }[];
  popularPOIs: { poiId: number; poiName: string; count: number }[];
  languageBreakdown: { languageCode: string; count: number }[];
}

export interface VisitCreateRequest {
  poiId: number;
  userId?: number;
  sessionId?: string;
  triggerType: 'geofence' | 'qr' | 'manual' | 'search';
  languageCode: string;
}

export interface UpdateLanguageRequest {
  poiId: number;
  sessionId: string;
  languageCode: string;
}

export interface UploadResult {
  url: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
}

export interface Tour {
  id: number;
  name: string;
  description: string;
  estimatedMinutes: number;
  distanceKm: number;
  isActive: boolean;
  stops: TourStop[];
}

export interface TourStop {
  id: number;
  poiId: number;
  poiName: string;
  poiCategory: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  transitionNote?: string;
  poiShortDescription: string;
}

export interface TourListItem {
  id: number;
  name: string;
  description: string;
  estimatedMinutes: number;
  distanceKm: number;
  stopCount: number;
}

export interface AudioFile {
  id: number;
  poiId: number;
  languageCode: string;
  filePath: string;
  durationSeconds: number;
  audioType: string;
  ttsProvider?: string;
  voiceName?: string;
  generatedAt?: string;
  isDefault: boolean;
}

export interface Translation {
  id: number;
  poiId: number;
  languageCode: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  audioText: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface QuizQuestion {
  id: number;
  poiId: number;
  poiName?: string;
  questionText: string;
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  correctOption?: string;
  explanationText?: string;
}

export interface QuizSubmission {
  quizQuestionId: number;
  selectedOption: string;
}

export interface QuizResult {
  isCorrect: boolean;
  correctOption: string;
  explanationText: string;
}


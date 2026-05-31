export interface NarrationItem {
  poiId: number;
  poiName: string;
  source: 'audio' | 'tts';
  audioUrl?: string;
  text?: string;
  language: string;
  priority: number;
}

export interface NarrationState {
  isPlaying: boolean;
  currentItem: NarrationItem | null;
  queue: NarrationItem[];
  cooldownMap: Record<number, number>; // POI ID -> timestamp
}

export interface AudioQueueConfig {
  maxQueueSize: number;
  interruptOnHigherPriority: boolean;
  fadeOutDurationMs: number;
  gapBetweenItemsMs: number;
}

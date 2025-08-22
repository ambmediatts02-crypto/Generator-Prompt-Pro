export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum AspectRatio {
  SIXTEEN_NINE = '16:9',
  NINE_SIXTEEN = '9:16',
  SQUARE = '1:1',
}

export enum GenerationMode {
  SINGLE = 'SINGLE',
  STORYBOARD = 'STORYBOARD',
  ADAPT_FROM_TEXT = 'ADAPT_FROM_TEXT', // For future feature
}

export enum DirectorStyle {
  NONE = 'NONE',
  CINEMATIC_NOIR = 'CINEMATIC_NOIR',
  VIBRANT_ENERGETIC = 'VIBRANT_ENERGETIC',
  DREAMY_ETHEREAL = 'DREAMY_ETHEREAL',
  GRITTY_REALISTIC = 'GRITTY_REALISTIC',
  EPIC_SWEEPING = 'EPIC_SWEEPING',
}

export interface VideoOptions {
  aspectRatio: AspectRatio;
}

export interface BaseImage {
  id: string;
  file: File;
  base64: string;
  mimeType: string;
}

export enum ObjectRole {
  PERSON = 'PERSON',
  PROP = 'PROP',
}

export interface StoryboardImage extends BaseImage {
  role: ObjectRole;
  isLocked?: boolean; // For future Visual Consistency feature
  visualPassportId?: string; // For future Visual Consistency feature
}

export interface Soundscape {
  music: string;
  sfx: string[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  history: ChatMessage[];
  isPinned: boolean;
  createdAt: number;
}

// New structure for individual scenes
export interface Scene {
  id:string;
  english: string;
  indonesian: string;
  voiceOver_Indonesian?: string; // For optional AI-generated narration
  videoUrl?: string;
  videoGenerationStatus?: GenerationStatus;
  audioUrl?: string;
  audioGenerationStatus?: GenerationStatus;
  mediaAssetId?: string; // Link to MediaAsset in the hub
}

// Overhauled GeneratedPrompts for interactive editing
export interface GeneratedPrompts {
  overture: {
    english: string;
    indonesian: string;
  };
  scenes: Scene[];
  soundscape?: Soundscape;
}

export enum AppView {
  GENERATOR = 'GENERATOR',
  EDITOR = 'EDITOR',
}

export interface MediaAsset {
  id: string;
  type: 'VIDEO' | 'AUDIO' | 'IMAGE';
  source: 'AI' | 'UPLOAD' | 'STOCK';
  name: string;
  thumbnailUrl: string; // Data URL for preview
  url: string; // Object URL for playback
  createdAt: number;
  duration: number; 
  isObjectURL?: boolean; // To track and manage memory for blob URLs
  aiAnalysis?: string | null; // AI-generated description of the content
  isAnalyzing?: boolean; // To show analysis status in UI
}

// --- Editor Specific Types ---

export enum TransitionType {
    CROSS_DISSOLVE = 'CROSS_DISSOLVE',
}

export interface StockTransition {
    type: TransitionType;
    name: string;
}

export interface TimelineTransition {
    id: string;
    fromClipId: string;
    toClipId: string;
    type: TransitionType;
    duration: number; // in seconds
}

// Define the structure for a clip on the timeline
export interface TimelineClip {
  id: string; // Unique instance ID for this clip on the timeline
  mediaAssetId: string; // ID of the asset from MediaHub
  layer: number; // Layer index. 0 is main video track. >0 are video overlays. <0 are audio tracks.
  
  // Timing in seconds
  timelineStart: number; // Start time on the main timeline
  duration: number; // Duration on the timeline (can be trimmed)
  assetStart: number; // Start time within the source media asset
  volume: number; // 0 to 1
  opacity: number; // 0 to 1
  transform: {
    scale: number;
    rotation: number;
    position: { x: number; y: number };
    flip: { horizontal: boolean; vertical: boolean };
  };
}


export enum EditorLayout {
    TIMELINE = 'TIMELINE',
    SPLIT_VIEW = 'SPLIT_VIEW',
}
export type SplitViewSlot = 'top' | 'middle' | 'bottom';


// --- Service-related types ---
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  // Common
  mode: GenerationMode;
  // Single Scene State
  singlePrompt: string;
  singleReferenceImage: BaseImage | null;
  generatedVideoUrl: string | null;
  singleSceneOptions: VideoOptions;
  // Storyboard State
  mainBrief: string;
  backgroundImage: BaseImage | null;
  objectImages: StoryboardImage[];
  directorStyle: DirectorStyle;
  generatedPrompts: GeneratedPrompts | null;
  // Editor State
  mediaAssets: MediaAsset[];
  editorTimeline: TimelineClip[]; // Array of unique clips on the timeline
  editorTransitions: TimelineTransition[];
  editorAspectRatio: AspectRatio;
  editorChatHistory: ChatMessage[];
  editorLayout: EditorLayout;
  editorSplitViewLanes: Record<SplitViewSlot, { clips: TimelineClip[], zoom: number }>;
}
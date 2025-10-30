export interface Character {
  id: string;
  name: string;
  appearance: string;
  backstory: string;
  relationships: string;
}

export interface PlotPoint {
  id: string;
  title: string;
  setting: string;
  characters: string[]; // Array of character IDs
  summary: string;
  mood: string;
  script: string;
}

export type GameEngine = 'unity' | 'unreal' | 'godot';

export interface SavedProject {
  version: number;
  projectName: string;
  characters: Character[];
  plotPoints: PlotPoint[];
  gameEngine: GameEngine;
  language: 'en' | 'zh';
  apiKey?: string;
}

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

// FIX: Add missing type definitions.
export interface OutlineItem {
  id: number;
  description: string;
}

export interface FrameworkInputs {
  theme: string;
  narrative: string;
  art: string;
  interaction: string;
  systems: string;
  audio: string;
  experience: string;
}

export interface GeneratorInputs {
  characterPrompts: string[];
  scenePrompts: string[];
  fullScriptOutline: OutlineItem[];
}
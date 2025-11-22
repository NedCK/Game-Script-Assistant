
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

export type WorldConceptCategory = 'Location' | 'Faction' | 'Item' | 'Lore' | 'History' | 'Other';

export interface WorldConcept {
  id: string;
  name: string;
  category: WorldConceptCategory;
  description: string;
}

export interface SavedProject {
  version: number;
  projectName: string;
  characters: Character[];
  worldConcepts: WorldConcept[];
  plotPoints: PlotPoint[];
  gameEngine: GameEngine;
  language: 'en' | 'zh';
  apiKey?: string;
}

export type SaveStatus = 'saved' | 'unsaved' | 'saving';

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

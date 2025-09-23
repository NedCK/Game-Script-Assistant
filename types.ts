export interface Character {
  name: string;
  appearance: string;
  backstory: string;
  relationships: string;
}

export interface ScriptPiece {
  id: number;
  type: 'scene' | 'dialogue' | 'action' | 'full';
  content: string;
}

export type GameEngine = 'unity' | 'unreal' | 'godot';

export interface FrameworkInputs {
  theme: string;
  narrative: string;
  art: string;
  interaction: string;
  systems: string;
  audio: string;
  experience: string;
}

export interface SavedProject {
  version: number;
  projectName: string;
  frameworkInputs: FrameworkInputs;
  characters: Character[];
  scriptPieces: ScriptPiece[];
  gameEngine: GameEngine;
  language: 'en' | 'zh';
}

export type SaveStatus = 'saved' | 'unsaved' | 'saving';
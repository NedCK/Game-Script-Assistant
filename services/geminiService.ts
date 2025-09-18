import { GoogleGenAI, Type } from "@google/genai";
import { Character, GameEngine, FrameworkInputs } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const characterSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The character\'s full name.' },
    backstory: { type: Type.STRING, description: 'A detailed backstory for the character.' },
    personality: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: 'A list of key personality traits (e.g., "Brave", "Cynical").'
    },
    appearance: { type: Type.STRING, description: 'A physical description of the character.' },
    key_motivation: { type: Type.STRING, description: 'The character\'s primary goal or motivation.' }
  },
  required: ['name', 'backstory', 'personality', 'appearance', 'key_motivation']
};

export const generateCharacter = async (prompt: string, gameEngine: GameEngine): Promise<Character> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a detailed character profile for a game being developed in the ${gameEngine} engine. The user wants: ${prompt}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: characterSchema,
      },
    });

    const jsonString = response.text;
    if (!jsonString) {
        throw new Error('API returned an empty response.');
    }
    return JSON.parse(jsonString) as Character;

  } catch (error) {
    console.error("Error generating character:", error);
    throw new Error("Failed to generate character profile. Please check the console for details.");
  }
};

export const generateScene = async (prompt: string, gameEngine: GameEngine): Promise<string> => {
  try {
     const engineSpecifics = {
        unity: "Include notes on potential particle effects or shaders that could be used in Unity.",
        unreal: "Focus on details that would leverage Unreal Engine's lighting and material systems, like Lumen and Nanite. Mention potential assets or visual effects.",
        godot: "Keep in mind Godot's node-based structure, mentioning potential nodes (e.g., WorldEnvironment, Light3D) or scene setups that would achieve the described effect."
    };

    const fullPrompt = `You are a world-class game script writer. Describe a scene for a video game being built with the ${gameEngine} engine. Focus on atmosphere, lighting, and key environmental details a player might interact with. ${engineSpecifics[gameEngine]} Format the output as a scene description in a screenplay.

Prompt: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating scene:", error);
    throw new Error("Failed to generate scene description.");
  }
};

export const generateFullScript = async (prompt: string, characters: Character[], gameEngine: GameEngine): Promise<string> => {
    try {
        const characterProfiles = characters.map(c => 
            `Name: ${c.name}\nPersonality: ${c.personality.join(', ')}\nMotivation: ${c.key_motivation}\nBackstory: ${c.backstory}`
        ).join('\n\n');

        const engineSpecificCues = {
            unity: "e.g., [UNITY_EVENT: PlaySound('footsteps_metal')], [ANIMATION: Player.Trigger('sigh')]",
            unreal: "e.g., [UNREAL_CINEMATIC: TriggerSequence('Explosion_SEQ')], [SOUND: PlaySoundCue('Ambient_CaveDrips')]",
            godot: "e.g., [GODOT_SIGNAL: emit_signal('player_spoke')], [ANIMATION_PLAYER: play('character_wave')]"
        }

        const fullPrompt = `You are a professional game scriptwriter. Create a complete game script scene for a game made in the ${gameEngine} engine. The scene should include scene descriptions, character actions, and dialogue. Format it like a professional screenplay. Where appropriate, include engine-specific cues for implementation (${engineSpecificCues[gameEngine]}).

Here is the context:

---
CHARACTERS INVOLVED:
${characterProfiles.length > 0 ? characterProfiles : 'No specific characters provided. Create new ones as needed.'}
---
PLOT & SCENE SUMMARY:
"${prompt}"
---

Generate the screenplay scene now.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });
        return response.text;

    } catch(error) {
        console.error("Error generating full script:", error);
        throw new Error("Failed to generate the full script.");
    }
}

export const brainstormFrameworkIdea = async (
  section: keyof FrameworkInputs,
  currentText: string,
  fullContext: FrameworkInputs
): Promise<string> => {
  try {
    // Build a string of the context from other fields
    const contextString = (Object.keys(fullContext) as Array<keyof FrameworkInputs>)
      .filter(key => key !== section && fullContext[key].trim() !== '')
      .map(key => `--- ${key.toUpperCase()} ---\n${fullContext[key]}`)
      .join('\n\n');

    const prompt = `You are a senior game design consultant and creative partner. A designer is working on a new game concept and needs help brainstorming for the "${section}" section of their design document.

Here is the context from the rest of their design document:
${contextString.length > 0 ? contextString : "No other context provided yet."}

Here are their current notes for the "${section}" section they are working on:
--- CURRENT "${section.toUpperCase()}" NOTES ---
${currentText.trim().length > 0 ? currentText : "No notes yet."}

Based on all of this, provide a few creative, inspiring, and actionable ideas to help them expand on the "${section}" of their game. Frame your response as a helpful brainstorming partner. Append your ideas to their existing notes. Do not repeat their existing notes in your response.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;

  } catch (error) {
    console.error(`Error brainstorming for ${section}:`, error);
    throw new Error(`Failed to brainstorm ideas for ${section}.`);
  }
};

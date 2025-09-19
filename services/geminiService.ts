import { GoogleGenAI, Type } from "@google/genai";
import { Character, GameEngine, FrameworkInputs } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A utility function to retry an async operation with exponential backoff.
 * @param apiCall The async function to call.
 * @param maxRetries The maximum number of retries.
 * @param delay The initial delay in milliseconds.
 * @returns The result of the successful API call.
 */
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> => {
    let lastError: Error | undefined;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            console.warn(`API call failed (attempt ${i + 1}/${maxRetries}). Retrying in ${delay * Math.pow(2, i)}ms...`, error);
            lastError = error as Error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }
    console.error("API call failed after all retries.", lastError);
    throw lastError;
};


const characterSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The character\'s full name.' },
    backstory: { type: Type.STRING, description: 'A detailed backstory for the character that aligns with the provided game design framework.' },
    personality: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: 'A list of key personality traits (e.g., "Brave", "Cynical").'
    },
    appearance: { type: Type.STRING, description: 'A physical description of the character, fitting the game\'s art style.' },
    key_motivation: { type: Type.STRING, description: 'The character\'s primary goal or motivation, rooted in the game\'s narrative.' }
  },
  required: ['name', 'backstory', 'personality', 'appearance', 'key_motivation']
};

const outlineSchema = {
  type: Type.OBJECT,
  properties: {
    outline: {
      type: Type.ARRAY,
      description: "A list of strings, where each string is a concise summary of a scene, chapter, or key plot point in the game script.",
      items: { type: Type.STRING }
    }
  },
  required: ['outline']
};


const buildFrameworkContext = (frameworkInputs: FrameworkInputs): string => {
  const context = (Object.keys(frameworkInputs) as Array<keyof FrameworkInputs>)
    .filter(key => frameworkInputs[key].trim() !== '')
    .map(key => `--- ${key.toUpperCase()} ---\n${frameworkInputs[key]}`)
    .join('\n\n');
  
  return context.length > 0 ? `Here is the core Game Design Framework for context:\n${context}\n---` : 'No game design framework context was provided.';
};

export const generateCharacter = async (prompt: string, gameEngine: GameEngine, frameworkInputs: FrameworkInputs): Promise<Character> => {
  try {
    const frameworkContext = buildFrameworkContext(frameworkInputs);
    const fullPrompt = `You are an expert character designer for video games.
Generate a detailed character profile for a game being developed in the ${gameEngine} engine.
The character must align with the provided game design framework.

${frameworkContext}

The user's specific request for this character is: "${prompt}".`;
    
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: characterSchema,
      },
    }));

    const textResponse = response.text.trim();
    if (!textResponse) {
        throw new Error('API returned an empty response.');
    }
    
    return JSON.parse(textResponse) as Character;

  } catch (error) {
    console.error("Error generating character:", error);
     if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON response from AI:", error);
      throw new Error("Failed to generate character profile. The AI returned an invalid format.");
    }
    throw new Error("Failed to generate character profile. Please check the console for details.");
  }
};

export const generateScene = async (prompt: string, gameEngine: GameEngine, frameworkInputs: FrameworkInputs): Promise<string> => {
  try {
     const engineSpecifics = {
        unity: "Include notes on potential particle effects or shaders that could be used in Unity.",
        unreal: "Focus on details that would leverage Unreal Engine's lighting and material systems, like Lumen and Nanite. Mention potential assets or visual effects.",
        godot: "Keep in mind Godot's node-based structure, mentioning potential nodes (e.g., WorldEnvironment, Light3D) or scene setups that would achieve the described effect."
    };

    const frameworkContext = buildFrameworkContext(frameworkInputs);

    const fullPrompt = `You are a world-class game script writer. Describe a scene for a video game being built with the ${gameEngine} engine.
The scene must be consistent with the provided game design framework. Focus on atmosphere, lighting, and key environmental details a player might interact with.
${engineSpecifics[gameEngine]}
Format the output as a scene description in a screenplay.

${frameworkContext}

Prompt: "${prompt}"`;

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    }));
    return response.text;
  } catch (error) {
    console.error("Error generating scene:", error);
    throw new Error("Failed to generate scene description.");
  }
};

export const generateScriptOutline = async (prompt: string, characters: Character[], frameworkInputs: FrameworkInputs): Promise<string[]> => {
    try {
        const characterProfiles = characters.map(c => 
            `Name: ${c.name}\nPersonality: ${c.personality.join(', ')}\nMotivation: ${c.key_motivation}`
        ).join('\n\n');

        const frameworkContext = buildFrameworkContext(frameworkInputs);

        const fullPrompt = `You are a professional game narrative designer. Based on the provided game design framework, character profiles, and plot summary, create a structured script outline. The outline should be a list of key scenes or chapters that logically follow the plot.

Here is the context:

${frameworkContext}

---
CHARACTERS INVOLVED:
${characterProfiles.length > 0 ? characterProfiles : 'No specific characters provided.'}
---
PLOT SUMMARY:
"${prompt}"
---

Generate a script outline as a JSON object with an "outline" key containing an array of strings.`;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: outlineSchema,
            },
        }));
        
        const textResponse = response.text.trim();
        if (!textResponse) {
            throw new Error('API returned an empty response for the outline.');
        }

        const parsed = JSON.parse(textResponse);
        if (!parsed.outline || !Array.isArray(parsed.outline)) {
             throw new Error("API returned an invalid format for the outline.");
        }
        return parsed.outline as string[];

    } catch(error) {
        console.error("Error generating script outline:", error);
        if (error instanceof SyntaxError) {
          console.error("Failed to parse JSON response from AI:", error);
          throw new Error("Failed to generate script outline. The AI returned an invalid format.");
        }
        throw new Error("Failed to generate the script outline.");
    }
}

export const generateScriptSection = async (
    sectionPrompt: string, 
    fullOutline: string[],
    characters: Character[], 
    gameEngine: GameEngine, 
    frameworkInputs: FrameworkInputs
): Promise<string> => {
    try {
        const characterProfiles = characters.map(c => 
            `Name: ${c.name}\nPersonality: ${c.personality.join(', ')}\nMotivation: ${c.key_motivation}\nBackstory: ${c.backstory}`
        ).join('\n\n');

        const engineSpecificCues = {
            unity: "e.g., [UNITY_EVENT: PlaySound('footsteps_metal')], [ANIMATION: Player.Trigger('sigh')]",
            unreal: "e.g., [UNREAL_CINEMATIC: TriggerSequence('Explosion_SEQ')], [SOUND: PlaySoundCue('Ambient_CaveDrips')]",
            godot: "e.g., [GODOT_SIGNAL: emit_signal('player_spoke')], [ANIMATION_PLAYER: play('character_wave')]"
        }
        
        const frameworkContext = buildFrameworkContext(frameworkInputs);
        const outlineContext = fullOutline.map((item, index) => `${index + 1}. ${item}`).join('\n');

        const fullPrompt = `You are a professional game scriptwriter creating a script for a game made in the ${gameEngine} engine.
The script must adhere to the provided game design framework and character profiles.
The full story outline is provided below for context. Your task is to write ONLY the script for the requested section. Do not write the entire script.

Format the output like a professional screenplay. Include scene descriptions, character actions, and dialogue. Where appropriate, include engine-specific cues for implementation (${engineSpecificCues[gameEngine]}).

---
FULL SCRIPT OUTLINE (FOR CONTEXT):
${outlineContext}
---
CHARACTERS INVOLVED:
${characterProfiles.length > 0 ? characterProfiles : 'No specific characters provided. Use characters appropriate for the story.'}
---
GAME DESIGN FRAMEWORK:
${frameworkContext}
---
NOW, WRITE THE SCRIPT FOR THE FOLLOWING SECTION ONLY:
"${sectionPrompt}"
---

Generate the screenplay for this specific section now.`;

        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        }));
        return response.text;

    } catch(error) {
        console.error("Error generating script section:", error);
        throw new Error("Failed to generate the script section.");
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

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    }));
    return response.text;

  } catch (error) {
    console.error(`Error brainstorming for ${section}:`, error);
    throw new Error(`Failed to brainstorm ideas for ${section}.`);
  }
};
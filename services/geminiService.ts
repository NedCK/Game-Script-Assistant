import { GoogleGenAI, Type, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
// FIX: Add FrameworkInputs to imports.
import { Character, GameEngine, PlotPoint, FrameworkInputs } from '../types';

let ai: GoogleGenAI | null = null;

export const initializeAi = (apiKey?: string) => {
  const finalApiKey = apiKey || process.env.API_KEY;
  if (!finalApiKey || finalApiKey.trim() === '') {
    console.warn("API key is not set. AI features will not work.");
    ai = null;
    return;
  }
  ai = new GoogleGenAI({ apiKey: finalApiKey });
  console.log("Gemini AI client initialized.");
};

// Initialize with default on module load
initializeAi(process.env.API_KEY);


const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 4, initialDelay = 1500): Promise<T> => {
    if (!ai) {
      throw new Error("AI Client not initialized. Please set an API key in the settings.");
    }
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            console.warn(`API call failed on attempt ${i + 1} of ${maxRetries}.`, error);
            
            if (i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i) + (Math.random() * 1000);
                console.log(`Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error("API call failed after all retries.", lastError);
    throw lastError;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const characterSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "角色的基本信息，主要是姓名。(Basic info, mainly the character's name.)" },
    appearance: { type: Type.STRING, description: "角色的基本外貌形象描述。(A basic description of the character's appearance.)" },
    backstory: { type: Type.STRING, description: "角色的背景故事。(The character's background story.)" },
    relationships: { type: Type.STRING, description: "描述该角色与其他被创造角色之间的关系。(A description of this character's relationship with the other characters being generated.)" }
  },
  required: ['name', 'appearance', 'backstory', 'relationships']
};

const characterListSchema = {
  type: Type.OBJECT,
  properties: {
    characters: {
      type: Type.ARRAY,
      description: "A list of refined character profiles.",
      items: characterSchema
    }
  },
  required: ['characters']
};

export const generateCharacters = async (prompts: string[], existingCharacters: Character[]): Promise<Omit<Character, 'id'>[]> => {
  if (!ai) throw new Error("AI Client not initialized. Please set an API key in the settings.");
  if (prompts.length === 0) return [];
  try {
    const characterConcepts = prompts.map((p, i) => `Concept ${i + 1}: ${p}`).join('\n');
    const existingNames = existingCharacters.map(c => c.name).join(', ') || 'None so far.';

    const fullPrompt = `You are an expert narrative designer for video games.
Based on a list of raw character concepts, your task is to refine them into CONCISE character profiles suitable for script generation.
For each character, you MUST ONLY provide these four things:
1. name: Their name.
2. appearance: A brief description of their physical appearance.
3. backstory: A brief background story.
4. relationships: A description of their relationships with the OTHER characters being generated in this batch, and optionally with existing characters.

Do NOT include personality traits or motivations as separate fields.

--- EXISTING CHARACTERS IN THE STORY (for context) ---
${existingNames}

--- RAW CHARACTER CONCEPTS TO GENERATE ---
${characterConcepts}
---

Generate a single JSON object. This object must contain a single key, "characters", which is an array of character profile objects. Each character object must strictly follow the provided schema.
`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: characterListSchema,
        safetySettings,
      },
    }));

    const textResponse = response.text.trim();
    if (!textResponse) throw new Error('API returned an empty response.');
    
    const jsonString = textResponse.replace(/^```json\s*/, '').replace(/```$/, '');
    const parsedData = JSON.parse(jsonString);

    if (!parsedData.characters || !Array.isArray(parsedData.characters)) {
      throw new Error("API returned an invalid format. Expected an object with a 'characters' array.");
    }
    return parsedData.characters;

  } catch (error) {
    console.error("Error generating character:", error);
     if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON response from AI:", error);
      throw new Error("Failed to generate character profile. The AI returned an invalid format.");
    }
    throw new Error("Failed to generate character profile. Please check the console for details.");
  }
};

export const generateScriptForPlotPoint = async (
    plotPoint: Omit<PlotPoint, 'script' | 'id'>,
    charactersInScene: Character[], 
    gameEngine: GameEngine
): Promise<string> => {
    if (!ai) throw new Error("AI Client not initialized. Please set an API key in the settings.");
    try {
        const characterProfiles = charactersInScene.map(c => 
            `Name: ${c.name}\nAppearance: ${c.appearance}\nBackstory: ${c.backstory}\nRelationships: ${c.relationships}`
        ).join('\n\n');

        const engineSpecificCues = {
            unity: "e.g., [UNITY_EVENT: PlaySound('footsteps_metal')], [ANIMATION: Player.Trigger('sigh')]",
            unreal: "e.g., [UNREAL_CINEMATIC: TriggerSequence('Explosion_SEQ')], [SOUND: PlaySoundCue('Ambient_CaveDrips')]",
            godot: "e.g., [GODOT_SIGNAL: emit_signal('player_spoke')], [ANIMATION_PLAYER: play('character_wave')]"
        }

        const fullPrompt = `You are a professional game scriptwriter creating a script for a game made in the ${gameEngine} engine.
Your task is to write a script for a single scene based on the details provided. Format the output like a professional screenplay. Include scene descriptions, character actions, and dialogue. Where appropriate, include engine-specific cues for implementation (${engineSpecificCues[gameEngine]}).

--- SCENE DETAILS ---
Title: ${plotPoint.title}
Setting: ${plotPoint.setting}
Mood: ${plotPoint.mood}
Scene Summary / Key Events: ${plotPoint.summary}
---
CHARACTERS IN THIS SCENE:
${characterProfiles.length > 0 ? characterProfiles : 'No specific characters provided for this scene.'}
---

NOW, WRITE THE SCRIPT FOR THIS SCENE ONLY. Do not add introductory or concluding remarks.
`;

        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                safetySettings,
            },
        }));
        return response.text;

    } catch(error) {
        console.error("Error generating script section:", error);
        throw new Error("Failed to generate the script section.");
    }
}

export const translateToChinese = async (textToTranslate: string): Promise<string> => {
  if (!ai) throw new Error("AI Client not initialized. Please set an API key in the settings.");
  if (!textToTranslate?.trim()) {
    return '';
  }
  try {
    const prompt = `You are an expert translator. Your task is to translate the following English text into Simplified Chinese.
- Preserve the original formatting (e.g., markdown, screenplay format, JSON structure).
- Do not add any extra commentary, explanations, or introductory phrases like "Here is the translation:".
- Provide only the direct translation.

--- TEXT TO TRANSLATE ---
${textToTranslate}
--- END OF TEXT ---`;

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        safetySettings,
      },
    }));
    return response.text;
  } catch (error) {
    console.error("Error translating to Chinese:", error);
    throw new Error("Failed to translate the text to Chinese.");
  }
};

// FIX: Add missing function definitions.
export const brainstormFrameworkIdea = async (
    section: keyof FrameworkInputs,
    currentValue: string,
    allInputs: FrameworkInputs
): Promise<string> => {
    if (!ai) throw new Error("AI Client not initialized. Please set an API key in the settings.");
    try {
        const context = (Object.entries(allInputs) as [keyof FrameworkInputs, string][])
            .filter(([key, value]) => key !== section && value.trim())
            .map(([key, value]) => `--- ${key.toUpperCase()} ---\n${value}`)
            .join('\n\n');

        const prompt = `You are a creative game design consultant.
A user is working on a game design document and needs help brainstorming ideas for the "${section}" section.

--- CURRENT IDEAS FOR "${section.toUpperCase()}" ---
${currentValue || 'No ideas yet.'}

--- OTHER DESIGN DOCUMENT SECTIONS (for context) ---
${context || 'No other context provided.'}

Your task is to provide 2-3 CONCISE and CREATIVE new ideas to expand upon the "${section}" section.
The ideas should be complementary to the existing design document.
Do not repeat existing ideas. Format your response as a bulleted list. Do not add any introductory or concluding remarks.
`;

        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                safetySettings,
            },
        }));

        return response.text;
    } catch (error) {
        console.error(`Error brainstorming for ${section}:`, error);
        throw new Error(`Failed to brainstorm ideas for ${section}.`);
    }
};

export const generateScene = async (
    prompts: string[],
    gameEngine: GameEngine,
    frameworkInputs: FrameworkInputs
): Promise<string> => {
    if (!ai) throw new Error("AI Client not initialized. Please set an API key in the settings.");
    try {
        const sceneConcepts = prompts.map((p, i) => `Concept ${i + 1}: ${p}`).join('\n');
        
        const frameworkContext = (Object.entries(frameworkInputs) as [keyof FrameworkInputs, string][])
            .filter(([, value]) => value.trim())
            .map(([key, value]) => `--- ${key.toUpperCase()} ---\n${value}`)
            .join('\n\n');

        const engineSpecificCues = {
            unity: "e.g., [UNITY_EVENT: PlaySound('footsteps_metal')], [ANIMATION: Player.Trigger('sigh')]",
            unreal: "e.g., [UNREAL_CINEMATIC: TriggerSequence('Explosion_SEQ')], [SOUND: PlaySoundCue('Ambient_CaveDrips')]",
            godot: "e.g., [GODOT_SIGNAL: emit_signal('player_spoke')], [ANIMATION_PLAYER: play('character_wave')]"
        };

        const fullPrompt = `You are a professional game scriptwriter creating a script for a game made in the ${gameEngine} engine.
Your task is to write a script for a single scene based on the concepts provided. Format the output like a professional screenplay. Include scene descriptions, character actions, and dialogue. Where appropriate, include engine-specific cues for implementation (${engineSpecificCues[gameEngine]}).

--- GAME DESIGN FRAMEWORK (for context) ---
${frameworkContext || 'No design framework provided.'}

--- SCENE CONCEPTS ---
${sceneConcepts}
---

NOW, WRITE THE SCRIPT FOR THIS SCENE ONLY. Do not add introductory or concluding remarks.
`;
        
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                safetySettings,
            },
        }));

        return response.text;
    } catch (error) {
        console.error("Error generating scene:", error);
        throw new Error("Failed to generate the scene.");
    }
};

export const generateScriptSection = async (
    sectionDescription: string,
    fullOutline: string[],
    characters: Character[],
    gameEngine: GameEngine,
    frameworkInputs: FrameworkInputs
): Promise<string> => {
    if (!ai) throw new Error("AI Client not initialized. Please set an API key in the settings.");
    try {
        const characterProfiles = characters.map(c => 
            `Name: ${c.name}\nAppearance: ${c.appearance}\nBackstory: ${c.backstory}\nRelationships: ${c.relationships}`
        ).join('\n\n');

        const fullOutlineText = fullOutline.map((item, index) => `${index + 1}. ${item}`).join('\n');
        const currentSectionIndex = fullOutline.findIndex(item => item === sectionDescription);

        const frameworkContext = (Object.entries(frameworkInputs) as [keyof FrameworkInputs, string][])
            .filter(([, value]) => value.trim())
            .map(([key, value]) => `--- ${key.toUpperCase()} ---\n${value}`)
            .join('\n\n');

        const engineSpecificCues = {
            unity: "e.g., [UNITY_EVENT: PlaySound('footsteps_metal')], [ANIMATION: Player.Trigger('sigh')]",
            unreal: "e.g., [UNREAL_CINEMATIC: TriggerSequence('Explosion_SEQ')], [SOUND: PlaySoundCue('Ambient_CaveDrips')]",
            godot: "e.g., [GODOT_SIGNAL: emit_signal('player_spoke')], [ANIMATION_PLAYER: play('character_wave')]"
        };

        const fullPrompt = `You are a professional game scriptwriter creating a script for a game made in the ${gameEngine} engine.
Your task is to write a script for ONE specific section of the story outline. Format the output like a professional screenplay. Include scene descriptions, character actions, and dialogue. Where appropriate, include engine-specific cues for implementation (${engineSpecificCues[gameEngine]}).

--- FULL STORY OUTLINE (for context) ---
${fullOutlineText}

--- CURRENT SECTION TO WRITE (Section ${currentSectionIndex + 1}) ---
${sectionDescription}

--- CHARACTER PROFILES (for context) ---
${characterProfiles.length > 0 ? characterProfiles : 'No characters provided.'}

--- GAME DESIGN FRAMEWORK (for context) ---
${frameworkContext || 'No design framework provided.'}
---

NOW, WRITE THE SCRIPT FOR THE SPECIFIED SECTION ONLY. Do not write the entire script. Do not add introductory or concluding remarks.
`;

        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                safetySettings,
            },
        }));
        
        return response.text;
    } catch (error) {
        console.error("Error generating script section:", error);
        throw new Error("Failed to generate the script section.");
    }
};
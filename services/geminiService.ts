// FIX: Import GenerateContentResponse to correctly type API call results.
import { GoogleGenAI, Type, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Character, GameEngine, FrameworkInputs } from '../types';

// The environment proxy will handle authentication, so we initialize with an empty key
// to satisfy the constructor, assuming the proxy will override it.
// The user can provide their own key in the settings to override this.
let ai = new GoogleGenAI({ apiKey: "" });

/**
 * Re-initializes the AI client with a new API key and optional endpoint.
 * If the provided key/endpoint is empty, it reverts to the default environment-based authentication.
 * @param newApiKey The new API key to use.
 * @param newApiEndpoint The custom API endpoint to use.
 */
export const updateApiKey = (newApiKey?: string | null, newApiEndpoint?: string | null) => {
  const hasCustomKey = newApiKey && newApiKey.trim();
  const hasCustomEndpoint = newApiEndpoint && newApiEndpoint.trim();

  // If there are no custom settings, use the default environment proxy auth.
  if (!hasCustomKey && !hasCustomEndpoint) {
    ai = new GoogleGenAI({ apiKey: "" });
    console.log("Using default environment authentication.");
    return;
  }

  // If there are custom settings, a key is required.
  if (!hasCustomKey) {
    console.error("Custom API Key is required when using a custom endpoint, but was not provided. Reverting to default.");
    ai = new GoogleGenAI({ apiKey: "" });
    return;
  }
  
  const options: { apiKey: string, clientOptions?: { apiEndpoint: string } } = {
    apiKey: newApiKey,
  };

  if (hasCustomEndpoint) {
    try {
      // Basic validation to ensure it's a valid URL format
      const url = new URL(newApiEndpoint!);
      options.clientOptions = { apiEndpoint: url.toString() };
      console.log(`Using custom API endpoint: ${options.clientOptions.apiEndpoint}`);
    } catch (error) {
      console.error("Invalid custom API endpoint URL provided:", newApiEndpoint, error);
      // Revert to default if the endpoint is invalid.
      ai = new GoogleGenAI({ apiKey: "" });
      console.log("Reverted to default AI client instance due to invalid endpoint.");
      return;
    }
  }

  // Re-create the client instance with the user's custom key and optional endpoint.
  ai = new GoogleGenAI(options);
  console.log("AI client re-initialized with custom settings.");
};


/**
 * A utility function to retry an async operation with exponential backoff.
 * This version is more robust to handle transient network or server-side errors.
 * @param apiCall The async function to call.
 * @param maxRetries The maximum number of retries.
 * @param initialDelay The initial delay in milliseconds.
 * @returns The result of the successful API call.
 */
const withRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 4, initialDelay = 1500): Promise<T> => {
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            console.warn(`API call failed on attempt ${i + 1} of ${maxRetries}.`, error);
            
            if (i < maxRetries - 1) {
                // Exponential backoff with jitter
                const delay = initialDelay * Math.pow(2, i) + (Math.random() * 1000);
                console.log(`Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error("API call failed after all retries.", lastError);
    // The calling function will catch this and show a user-friendly error.
    // Re-throwing the last error preserves the original error information for logging.
    throw lastError;
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];


const characterSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "角色的基本信息，主要是姓名。(Basic info, mainly the character's name.)" },
    appearance: { type: Type.STRING, description: "角色的基本外貌形象描述。(A basic description of the character's appearance.)" },
    backstory: { type: Type.STRING, description: "角色的背景故事，与游戏设计框架保持一致。(The character's background story, consistent with the game design framework.)" },
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

/**
 * Summarizes the entire framework into a concise paragraph.
 * This is used to create a smaller, more efficient context for all generator calls.
 */
const summarizeFramework = async (fullContext: FrameworkInputs): Promise<string> => {
    const contextString = (Object.keys(fullContext) as Array<keyof FrameworkInputs>)
      .filter(key => fullContext[key] && fullContext[key].trim() !== '')
      .map(key => `--- ${key.toUpperCase()} ---\n${fullContext[key]}`)
      .join('\n\n');
      
    if (!contextString.trim()) {
      return "No game design context was provided.";
    }

    const prompt = `You are a game design expert. Read the following game design document sections and summarize the core concept of the game into a concise, 2-3 sentence paragraph.

--- DOCUMENT ---
${contextString}
--- END DOCUMENT ---

Summarize the core concept now.`;
    
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { safetySettings },
    }));

    return response.text;
};

export const generateCharacter = async (prompts: string[], gameEngine: GameEngine, frameworkInputs: FrameworkInputs): Promise<Character[]> => {
  if (prompts.length === 0) return [];
  try {
    const frameworkSummary = await summarizeFramework(frameworkInputs);
    const characterConcepts = prompts.map((p, i) => `Concept ${i + 1}: ${p}`).join('\n');

    const fullPrompt = `You are an expert narrative designer for video games, working on a project for the ${gameEngine} engine.
Based on the provided game design summary and a list of raw character concepts, your task is to refine them into CONCISE character profiles suitable for script generation.
For each character, you MUST ONLY provide these four things:
1. name: Basic information, primarily their name.
2. appearance: A brief description of their physical appearance.
3. backstory: A brief background story.
4. relationships: A description of their relationships with the OTHER characters being generated in this batch. This is crucial.

Do NOT include personality traits or motivations as separate fields. These elements can be subtly included in the backstory if necessary, but the output must be minimal and focused.

--- GAME DESIGN SUMMARY ---
${frameworkSummary}
---

--- RAW CHARACTER CONCEPTS ---
${characterConcepts}
---

Generate a single JSON object. This object must contain a single key, "characters", which is an array of character profile objects. Each character object must strictly follow the provided schema and contain ONLY the 'name', 'appearance', 'backstory', and 'relationships' fields.
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
    if (!textResponse) {
        throw new Error('API returned an empty response.');
    }
    
    const parsedData = JSON.parse(textResponse);
    if (!parsedData.characters || !Array.isArray(parsedData.characters)) {
      throw new Error("API returned an invalid format. Expected an object with a 'characters' array.");
    }
    return parsedData.characters as Character[];

  } catch (error) {
    console.error("Error generating character:", error);
     if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON response from AI:", error);
      throw new Error("Failed to generate character profile. The AI returned an invalid format.");
    }
    throw new Error("Failed to generate character profile. Please check the console for details.");
  }
};

export const generateScene = async (prompts: string[], gameEngine: GameEngine, frameworkInputs: FrameworkInputs): Promise<string> => {
  if (prompts.length === 0) return "";
  try {
     const engineSpecifics = {
        unity: "e.g., mention potential particle effects or shaders.",
        unreal: "e.g., mention potential lighting setups using Lumen.",
        godot: "e.g., mention potential nodes or scene setups."
    };

    const frameworkSummary = await summarizeFramework(frameworkInputs);
    const sceneConcepts = prompts.map((p, i) => `SCENE ${i + 1} CONCEPT:\n${p}`).join('\n\n');

    const fullPrompt = `You are a world-class game script editor. Your task is to take a list of raw scene descriptions and refine them into clear, concise, and evocative scene summaries for a video game script being built with the ${gameEngine} engine.
The scenes must be consistent with the provided summary of the game design framework. Focus on atmosphere, key actions, and the purpose of the scene within the narrative.
Do not expand them into full screenplay format. Instead, polish them into powerful summaries that can be used for a high-level outline.
Where relevant, you can briefly mention engine-specific possibilities (${engineSpecifics[gameEngine]}).

--- GAME DESIGN SUMMARY ---
${frameworkSummary}
---

--- RAW SCENE DESCRIPTIONS ---
${sceneConcepts}
---

Now, provide the refined scene summaries. Start each summary with "SCENE X:" and separate each scene with a double line break.
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
    throw new Error("Failed to generate scene description.");
  }
};

export const generateScriptSection = async (
    sectionPrompt: string, 
    fullOutline: string[],
    characters: Character[], 
    gameEngine: GameEngine, 
    frameworkInputs: FrameworkInputs
): Promise<string> => {
    try {
        const characterProfiles = characters.map(c => 
            `Name: ${c.name}\nAppearance: ${c.appearance}\nBackstory: ${c.backstory}\nRelationships: ${c.relationships}`
        ).join('\n\n');

        const engineSpecificCues = {
            unity: "e.g., [UNITY_EVENT: PlaySound('footsteps_metal')], [ANIMATION: Player.Trigger('sigh')]",
            unreal: "e.g., [UNREAL_CINEMATIC: TriggerSequence('Explosion_SEQ')], [SOUND: PlaySoundCue('Ambient_CaveDrips')]",
            godot: "e.g., [GODOT_SIGNAL: emit_signal('player_spoke')], [ANIMATION_PLAYER: play('character_wave')]"
        }
        
        const frameworkSummary = await summarizeFramework(frameworkInputs);
        const outlineContext = fullOutline.map((item, index) => `${index + 1}. ${item}`).join('\n');

        const fullPrompt = `You are a professional game scriptwriter creating a script for a game made in the ${gameEngine} engine.
The script must adhere to the provided game design framework summary and character profiles.
The full story outline is provided below for context. Your task is to write ONLY the script for the requested section. Do not write the entire script.

Format the output like a professional screenplay. Include scene descriptions, character actions, and dialogue. Where appropriate, include engine-specific cues for implementation (${engineSpecificCues[gameEngine]}).

---
FULL SCRIPT OUTLINE (FOR CONTEXT):
${outlineContext}
---
CHARACTERS INVOLVED:
${characterProfiles.length > 0 ? characterProfiles : 'No specific characters provided. Use characters appropriate for the story.'}
---
GAME DESIGN SUMMARY:
${frameworkSummary}
---
NOW, WRITE THE SCRIPT FOR THE FOLLOWING SECTION ONLY:
"${sectionPrompt}"
---

Generate the screenplay for this specific section now.`;

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

export const brainstormFrameworkIdea = async (
  section: keyof FrameworkInputs,
  currentText: string,
  fullContext: FrameworkInputs
): Promise<string> => {
  try {
    // 1. Isolate the context from other sections into a new object.
    const otherSectionsContext: Partial<FrameworkInputs> = {};
    (Object.keys(fullContext) as Array<keyof FrameworkInputs>).forEach(key => {
      if (key !== section && fullContext[key]?.trim() !== '') {
        otherSectionsContext[key] = fullContext[key];
      }
    });

    // 2. Conditionally build the context block for the prompt.
    let contextBlock = '';
    const hasOtherContext = Object.keys(otherSectionsContext).length > 0;

    if (hasOtherContext) {
        // Summarize that context if it exists to ensure the payload is small.
        const contextSummary = await summarizeFramework(otherSectionsContext as FrameworkInputs);
        contextBlock = `

Here is a summary of the context from other sections of their design document:
--- CONTEXT SUMMARY ---
${contextSummary}
---`;
    }
    
    // 3. Build the final prompt. If contextBlock is empty, it's simply omitted.
    const prompt = `You are a senior game design consultant and creative partner. A designer is working on a new game concept and needs help brainstorming for the "${section}" section of their design document.${contextBlock}

Here are their current notes for the "${section}" section they are working on:
--- CURRENT "${section.toUpperCase()}" NOTES ---
${currentText.trim().length > 0 ? currentText : "No notes yet."}
---

Based on all of this, provide a few creative, inspiring, and actionable ideas to help them expand on the "${section}" of their game. Frame your response as a helpful brainstorming partner. Append your ideas to their existing notes. Do not repeat their existing notes in your response. Your suggestions should be fresh and build upon what's already there.`;

    // 4. Make the final API call for brainstorming.
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

export const translateToChinese = async (textToTranslate: string): Promise<string> => {
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
import { GoogleGenAI, Type } from "@google/genai";
import type { VideoOptions, BaseImage, GeneratedPrompts, StoryboardImage, DirectorStyle, Scene, ChatMessage, ObjectRole, MediaAsset, EditorLayout, SplitViewSlot } from '../types';

// This is the single source of truth for the API key, read from environment variables.
const API_KEY = process.env.API_KEY;

// It will throw a clear error if not configured, which App.tsx will catch and display.
if (!API_KEY) {
    throw new Error(
        "Configuration Error: The API_KEY environment variable is not set. This is required for the application to function."
    );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });


// --- Video Generation Service (Single Mode) ---
export async function generateVideo(prompt: string, options: VideoOptions, image: BaseImage | null): Promise<any> {
    const config: any = {
      numberOfVideos: 1,
      aspectRatio: options.aspectRatio,
    };
    
    const requestPayload: any = {
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: config,
    };

    if (image) {
        requestPayload.image = {
            imageBytes: image.base64,
            mimeType: image.mimeType,
        };
    }

    try {
        return await ai.models.generateVideos(requestPayload);
    } catch (error) {
        console.error("Error starting video generation:", error);
        throw error;
    }
}

export async function pollVideoStatus(
    operation: any, 
    onUpdate: (op: any) => void
): Promise<any> {
    let currentOperation = operation;
    while (!currentOperation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
            currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
            onUpdate(currentOperation);
        } catch (error) {
            console.error("Error during polling:", error);
            throw error;
        }
    }
    
    if(currentOperation.error) {
        throw new Error(`Video generation failed with code ${currentOperation.error.code}: ${currentOperation.error.message}`);
    }

    return currentOperation;
}

export async function fetchVideoBlob(downloadLink: string): Promise<string> {
    try {
        const response = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video. Status: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error fetching video blob:", error);
        throw error;
    }
}

// --- Audio Generation Service (Storyboard Mode) ---

/**
 * Simulates a call to a Text-to-Speech API.
 * In a real-world application, this would be a call to a backend service
 * that securely handles the Google Cloud TTS API key.
 * @param text The text to convert to speech.
 * @returns A promise that resolves to a data URL of the audio.
 */
export async function generateAudioNarration(text: string): Promise<string> {
    console.log(`Simulating TTS generation for: "${text}"`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Using a public, placeholder TTS service for demonstration purposes.
    // This is not a production-ready solution.
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=id-ID&client=tw-ob&q=${encodeURIComponent(text)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error fetching narration audio:", error);
        throw new Error("Failed to generate audio narration.");
    }
}


// --- Prompt Generation Services (Storyboard Mode) ---

const styleDescriptions: Record<DirectorStyle, string> = {
    ['NONE']: 'a balanced, professional, and clean cinematic style.',
    ['CINEMATIC_NOIR']: 'the style of Cinematic Noir. Use high-contrast lighting, dramatic shadows, low-key lighting, and a mysterious, brooding mood. Think classic black-and-white detective films.',
    ['VIBRANT_ENERGETIC']: 'a Vibrant & Energetic style. Use saturated, bold colors, fast-paced cuts, dynamic camera movements, and a high-energy, optimistic mood. Think modern pop music videos.',
    ['DREAMY_ETHEREAL']: 'a Dreamy & Ethereal style. Use soft focus, overexposure, slow motion, lens flares, and a magical, surreal, and gentle mood. Think fantasy sequences or perfume ads.',
    ['GRITTY_REALISTIC']: 'a Gritty & Realistic style. Use handheld camera movements, natural and available lighting, muted colors, and an authentic, documentary-like mood. Think cinéma vérité.',
    ['EPIC_SWEEPING']: 'an Epic & Sweeping style. Use wide, grand establishing shots, crane and jib movements, orchestral swells, and a majestic, awe-inspiring mood. Think blockbuster film trailers.',
};

const mainSystemPrompt = `You are a world-class AI Film Director. Your purpose is to transform a user's brief into a professional, ready-to-shoot video storyboard with extreme detail and creativity.

**YOUR DIRECTIVE:**
1.  **Analyze Holistically:** Meticulously examine the user's Main Brief, all provided images (The Set, Actors, Props), and the chosen Director's Style. Synthesize these into a single, cohesive creative vision.
2.  **Write the Overture:** Begin with a rich, detailed "Overture" paragraph in Indonesian. This is your master shot description. It must paint a complete picture of the scene, atmosphere, characters, and mood, synthesizing all visual information from the images.
3.  **Direct the Scenes:** Craft a sequence of 3-5 distinct scenes that form a micro-story (e.g., Hook, Experience, Payoff). Each scene must be a logical progression.
4.  **Design the Soundscape:** Conclude with a "Soundscape" suggestion, detailing appropriate music and sound effects (SFX).

**MANDATORY SCENE STRUCTURE (FOR EACH SCENE):**
You MUST provide the following details for every scene:
- **Title:** A short, evocative title (e.g., "Adegan 1: Elegansi dalam Ruangan Hangat").
- **Duration:** A suggested duration in seconds (e.g., "Durasi: 1.5 detik").
- **Camera Style:** A specific, professional camera direction using terminology from the "CINEMATIC TOOLKIT" below (e.g., "Gaya Kamera: Medium Shot - Dolly In Perlahan").
- **Description:** A detailed description of the action, emotion, and visual focus in both English and Indonesian.

---
**CINEMATIC TOOLKIT (Your Creative Vocabulary)**

*   **Shot Types:** Extreme Wide Shot, Wide Shot (WS), Medium Shot (MS), Medium Close-up (MCU), Close-up (CU), Extreme Close-up (ECU), Low Angle, High Angle, Dutch Angle, Point of View (POV).
*   **Camera Movements:** Static, Pan, Tilt, Dolly In/Out, Trucking (Dolly Left/Right), Pedestal (Up/Down), Steadicam, Handheld, Crane/Jib, Slow Motion, Speed Ramp, Whip Pan, Rack Focus.
*   **Lighting Styles:** High-Key (bright, low contrast), Low-Key (dark, high contrast), Soft Light, Hard Light, Golden Hour, Blue Hour, Natural Light, Lens Flare.
---

If the Main Brief contains phrases like "spoken in indonesia", "voice over", or "narration", you MUST also include a 'voiceOver_Indonesian' field for each scene containing a compelling line of narration.

Now, apply this process to the user's request. Your output must be a valid JSON object.`;


export async function getCreativeSpark(mainBrief: string): Promise<string> {
    const prompt = `Anda adalah seorang ahli kreativitas. Berdasarkan ide naskah pengguna, berikan SATU saran tunggal yang tak terduga dan inspiratif dalam Bahasa Indonesia untuk membuatnya lebih unik. Saran tersebut harus berupa kalimat pendek yang dapat ditindaklanjuti. Jangan menjelaskan diri Anda.
    Ide Naskah Pengguna: "${mainBrief}"
    Saran mengejutkan Anda (dalam Bahasa Indonesia):`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting creative spark:", error);
        throw error;
    }
}

export async function translateText(
    sourceText: string,
    sourceLang: 'english' | 'indonesian',
    targetLang: 'english' | 'indonesian'
): Promise<string> {
    if (!sourceText.trim()) {
        return "";
    }

    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}.
Your response must ONLY be the raw translated text. Do not add any extra formatting, commentary, or quotation marks.

Text to translate:
"${sourceText}"`;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        throw error;
    }
}

export async function sendChatMessage(
    history: ChatMessage[],
    backgroundImage: BaseImage | null,
    objectImages: StoryboardImage[]
): Promise<string> {
    const chatSystemPrompt = `You are a "Creative Co-Pilot", a visually-aware brainstorming partner. Your goal is to help a user develop their script idea.
- **Be Proactive & Visual:** Every suggestion you make MUST reference the visual elements in the provided images (The Set, Actors, Props).
- **Ask Guiding Questions:** Help the user think deeper about their idea based on what you "see".
- **Offer Concrete, Actionable Ideas:** Propose specific shots, actions, or moods that can be directly added to a script.
- **Keep it Conversational & Encouraging:** Your tone is like a helpful creative partner.
- **Analyze Images First:** Before responding to the user's first message, briefly state what you see in the images to establish context. For example: "Okay, I see we're working with a stylish model in a warm, minimalist room. This is a great starting point! What's the core feeling you want this ad to convey?"
`;
    const isFirstUserMessage = history.filter(m => m.role === 'user').length === 1;

    const currentMessage = history[history.length - 1];
    if (!currentMessage || currentMessage.role !== 'user') {
        throw new Error("sendChatMessage was called without a valid user message.");
    }

    const parts: any[] = [{ text: currentMessage.text }];

    if (isFirstUserMessage) {
        if (backgroundImage || objectImages.length > 0) {
            parts.push({ text: "\n--- VISUAL ASSETS FOR OUR DISCUSSION --- \n" });
        }
        if (backgroundImage) {
            parts.push({ text: "\n[THE SET (BACKGROUND IMAGE)]" });
            parts.push({ inlineData: { mimeType: backgroundImage.mimeType, data: backgroundImage.base64 } });
        }
        if (objectImages.length > 0) {
            objectImages.forEach((img, index) => {
                parts.push({ text: `[IMAGE ${index + 1} - ROLE: ${img.role}]` });
                parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
            });
        }
    }

    // Convert history to the format expected by generateContent
    const contents = history.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: chatSystemPrompt,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error sending chat message:", error);
        throw error;
    }
}

export async function summarizeAndTitleChat(history: ChatMessage[]): Promise<{ brief: string; title: string }> {
    const chatTranscript = history.map(msg => `${msg.role === 'user' ? 'Director' : 'AI Co-Pilot'}: ${msg.text}`).join('\n\n');
    
    const systemPrompt = `You are a professional Script Editor and Summarizer.
Your task is to read the following brainstorming dialog and perform two actions:
1.  **Summarize:** Synthesize the entire conversation into a single, coherent, and executable 'Main Brief' (script) in Bahasa Indonesia. Focus ONLY on the final, agreed-upon creative decisions.
2.  **Title:** Generate a very short, descriptive title (3-5 words max) for this chat session, also in Bahasa Indonesia.

**Conversation to Process:**
---
${chatTranscript}
---

Your output must be a valid JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        brief: {
                            type: Type.STRING,
                            description: "The finalized main script brief, written in Bahasa Indonesia."
                        },
                        title: {
                            type: Type.STRING,
                            description: "A short, 3-5 word descriptive title for the chat, in Bahasa Indonesia."
                        }
                    },
                    required: ["brief", "title"]
                }
            }
        });
        
        const result = JSON.parse(response.text.trim());
        return result;

    } catch (error) {
        console.error("Error summarizing and titling chat:", error);
        throw error;
    }
}


export async function generatePromptFromStoryboard(
    mainBrief: string,
    backgroundImage: BaseImage | null,
    objectImages: StoryboardImage[],
    directorStyle: DirectorStyle
): Promise<GeneratedPrompts> {
    const parts: any[] = [];
    const styleInstruction = styleDescriptions[directorStyle];
    
    const systemPrompt = `${mainSystemPrompt}\n\nNow, execute this process precisely for the following request.\n**Director's Style to adopt:** ${styleInstruction}\n**User's Script (Main Brief):** "${mainBrief}"`;
    parts.push({ text: systemPrompt });

    if (backgroundImage || objectImages.length > 0) {
      parts.push({ text: "\n--- VISUAL ASSETS --- \n" });
    }
    if (backgroundImage) {
        parts.push({ text: "\n[THE SET (BACKGROUND IMAGE)]" });
        parts.push({ inlineData: { mimeType: backgroundImage.mimeType, data: backgroundImage.base64 } });
    }
    if (objectImages.length > 0) {
        objectImages.forEach((img, index) => {
          parts.push({ text: `[IMAGE ${index + 1} - ROLE: ${img.role}]` });
          parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
        });
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overture: {
                            type: Type.OBJECT,
                            properties: {
                                english: { type: Type.STRING },
                                indonesian: { type: Type.STRING },
                            },
                            required: ["english", "indonesian"],
                        },
                        scenes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    english: { type: Type.STRING },
                                    indonesian: { type: Type.STRING },
                                    voiceOver_Indonesian: { type: Type.STRING },
                                },
                                required: ["english", "indonesian"]
                            }
                        },
                        soundscape: {
                            type: Type.OBJECT,
                            properties: {
                                music: { type: Type.STRING },
                                sfx: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["music", "sfx"]
                        }
                    },
                    required: ["overture", "scenes", "soundscape"],
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        // Add client-side IDs to scenes
        result.scenes = result.scenes.map((scene: Omit<Scene, 'id'>) => ({
            ...scene,
            id: crypto.randomUUID(),
            videoGenerationStatus: 'IDLE',
            audioGenerationStatus: 'IDLE'
        }));
        return result;

    } catch (error) {
        console.error("Error generating prompt:", error);
        throw error;
    }
}


export async function regenerateScene(context: {
    sceneIdToRegenerate: string;
    mainBrief: string;
    backgroundImage: BaseImage | null;
    objectImages: StoryboardImage[];
    directorStyle: DirectorStyle;
    overture: GeneratedPrompts['overture'];
    allScenes: Scene[];
}): Promise<Omit<Scene, 'id'>> {
    const { sceneIdToRegenerate, mainBrief, backgroundImage, objectImages, directorStyle, overture, allScenes } = context;

    const sceneToRegen = allScenes.find(s => s.id === sceneIdToRegenerate);
    const sceneIndex = allScenes.findIndex(s => s.id === sceneIdToRegenerate);
    if (!sceneToRegen) throw new Error("Scene not found for regeneration.");

    const systemPrompt = `You are a world-class Film Editor and Director. Your task is to regenerate a single scene within an existing script to make it better, more creative, or different, while maintaining narrative consistency.

**CONTEXT:**
- **Director's Style:** ${styleDescriptions[directorStyle]}
- **User's Main Brief:** "${mainBrief}"
- **Overture (Story World):** "${overture.english}"
- **Full Scene List (for context):**
${allScenes.map((s, i) => `  Scene ${i + 1}: ${s.english}`).join('\n')}

**YOUR TASK:**
Regenerate **ONLY Scene ${sceneIndex + 1}**. The original version was: "${sceneToRegen.english}".
Your new version must fit seamlessly between Scene ${sceneIndex} and Scene ${sceneIndex + 2}. It must be more compelling and adhere strictly to the established Director's Style and Visual Facts. Do not change the other scenes.
If the Main Brief suggests narration (e.g., "spoken in indonesia"), you must also generate a new "voiceOver_Indonesian". Otherwise, omit it.

Your output MUST be a valid JSON object matching this schema: { "english": "string", "indonesian": "string", "voiceOver_Indonesian": "string" (optional) }.
Do not add any other text.`;

    const parts: any[] = [{ text: systemPrompt }];
     if (backgroundImage || objectImages.length > 0) {
      parts.push({ text: "\n--- VISUAL ASSETS (FOR REFERENCE) --- \n" });
    }
    if (backgroundImage) {
        parts.push({ text: "\n[THE SET]" });
        parts.push({ inlineData: { mimeType: backgroundImage.mimeType, data: backgroundImage.base64 } });
    }
    if (objectImages.length > 0) {
        objectImages.forEach((img, index) => {
          parts.push({ text: `[IMAGE ${index + 1} - ${img.role}]` });
          parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        english: { type: Type.STRING },
                        indonesian: { type: Type.STRING },
                        voiceOver_Indonesian: { type: Type.STRING },
                    },
                    required: ["english", "indonesian"]
                }
            }
        });
        return JSON.parse(response.text.trim());
    } catch(error) {
        console.error("Error regenerating scene:", error);
        throw error;
    }
}

// --- Editor AI Service ---

export async function analyzeMultipleVideoContents(
    assetsToAnalyze: { id: string; thumbnailBase64: string }[]
): Promise<{ assetId: string; description: string }[]> {
    if (assetsToAnalyze.length === 0) {
        return [];
    }

    const parts: any[] = [
        { text: "Analyze each of the following video frames and provide a concise, descriptive summary of its visual content. Respond with a JSON array where each object contains the assetId and its description." }
    ];

    for (const asset of assetsToAnalyze) {
        parts.push({ text: `--- ASSET ID: ${asset.id} ---` });
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: asset.thumbnailBase64.split(',')[1]
            }
        });
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            assetId: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["assetId", "description"]
                    }
                }
            }
        });
        const results = JSON.parse(response.text.trim());
        return results;
    } catch (error) {
        console.error("Error analyzing video content in batch:", error);
        throw error;
    }
}



export async function getEditorAction(
  prompt: string,
  mediaAssets: MediaAsset[],
  timelineAssetIds: string[]
): Promise<{ action: string; payload: any; responseText: string }> {
  const mediaContext = mediaAssets.length > 0 
    ? `Here are the available media assets in the Media Hub. Each has been analyzed for its content:\n${mediaAssets.map(a => `- "${a.name}" (Content: ${a.aiAnalysis || 'Not analyzed yet'})`).join('\n')}`
    : "The Media Hub is currently empty.";

  const timelineContext = timelineAssetIds.length > 0
    ? `The timeline currently has ${timelineAssetIds.length} clips.`
    : "The timeline is currently empty.";

  const systemPrompt = `You are an AI Creative Director and Video Editor. Your task is to translate a user's high-level creative request into a specific, executable action for the video editor.

**CONTEXT:**
- You are in a video editor with two primary layouts: 'TIMELINE' and 'SPLIT_VIEW' (a vertical 9:16 layout with 'top', 'middle', 'bottom' slots).
- ${mediaContext}
- ${timelineContext}

**YOUR CAPABILITIES & RULES:**
1.  **Analyze & Decide:** For creative requests like "make a tiktok ad", you MUST analyze the content descriptions of the available media assets and CHOOSE the most suitable ones.
2.  **Execute Creatively:** The primary creative action is 'COMPOSE_SPLIT_VIEW'. Use this to automatically populate the split view slots based on your creative decisions. Prioritize visually engaging content for the 'middle' slot.
3.  **Execute Technically:** For simple requests like "add clip X" or "switch view", use the appropriate technical actions ('ADD_CLIP_TO_TIMELINE', 'SET_EDITOR_LAYOUT', etc.).
4.  **Respond Clearly:** You MUST respond with a JSON object. Your \`responseText\` must be a friendly, conversational confirmation in Bahasa Indonesia.
5.  **Be Specific:** For actions involving assets, always use the exact asset name from the context provided.

**USER REQUEST:**
"${prompt}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "The action to perform. Must be one of: ADD_CLIP_TO_TIMELINE, REMOVE_CLIP_FROM_TIMELINE, SET_EDITOR_LAYOUT, SET_SPLIT_VIEW_CLIP, COMPOSE_SPLIT_VIEW, NO_ACTION."
            },
            payload: {
              type: Type.OBJECT,
              properties: {
                assetName: { type: Type.STRING, description: "The name of the asset from the Media Hub." },
                clipIndex: { type: Type.NUMBER, description: "The 1-based index of the clip on the timeline." },
                layout: { type: Type.STRING, description: "The editor layout to switch to. 'TIMELINE' or 'SPLIT_VIEW'." },
                slot: { type: Type.STRING, description: "The target slot in split view. 'top', 'middle', or 'bottom'." },
                topAssetName: { type: Type.STRING, description: "AI's chosen asset for the top slot." },
                middleAssetName: { type: Type.STRING, description: "AI's chosen asset for the middle slot." },
                bottomAssetName: { type: Type.STRING, description: "AI's chosen asset for the bottom slot." }
              }
            },
            responseText: {
              type: Type.STRING,
              description: "A friendly, conversational response in Bahasa Indonesia to show the user."
            }
          },
          required: ["action", "responseText"]
        }
      }
    });

    return JSON.parse(response.text.trim());

  } catch (error) {
    console.error("Error getting editor action:", error);
    throw error;
  }
}

// --- Future Feature Stubs ---
export async function createVisualPassport(image: StoryboardImage): Promise<string> {
    // In the future, this will generate a super-detailed description (a "passport")
    // of a person or prop to ensure visual consistency across multiple prompts.
    console.log("Future feature: Creating visual passport for", image.id);
    return Promise.resolve(crypto.randomUUID());
}

export async function adaptScriptToScenes(script: string): Promise<GeneratedPrompts> {
    // In the future, this will take a block of text and adapt it into a
    // structured Overture + Scenes prompt.
    console.log("Future feature: Adapting script to scenes", script);
    return Promise.resolve({
        overture: { english: "Adapted Overture", indonesian: "Overture yang Diadaptasi" },
        scenes: [],
        soundscape: { music: "", sfx: [] }
    });
}


import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, Source } from "../types";

const cleanJsonResponse = (text: string): string => {
  if (!text) return '{}';
  // Remove markdown code blocks and handle potentially messy output
  const cleaned = text.replace(/```json\n?|```/g, '').trim();
  const startBrace = cleaned.indexOf('{');
  const endBrace = cleaned.lastIndexOf('}');
  
  if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
    return cleaned.substring(startBrace, endBrace + 1);
  }
  return cleaned;
};

export const discoverJsonPrompts = async (query: string): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Stage 1: Live Grounding with Gemini 3 Flash - Refined for Authority
    const researchPrompt = `
      Act as a Lead Data Architect. Perform a targeted, industry-wide search for the most authoritative JSON data structures, API specifications, and formal schemas for: "${query}".
      
      PRIORITY SOURCES:
      1. Official Developer Documentation (e.g., Stripe, Google, AWS, GitHub).
      2. OpenAPI (Swagger) or GraphQL specifications.
      3. Public Schema Repositories (e.g., Schema.org, industry-standard GitHub repos).
      4. Technical RFCs or IETF standards.
      
      INSTRUCTIONS:
      - Prioritize official documentation over generic blog posts or community tutorials.
      - Identify the canonical "Source of Truth" for this data model.
      - Identify core keys, nesting patterns, and standardized naming conventions.
      - Distinguish between required and optional fields.
      - Reference specific implementations from major tech platforms.
    `;

    const searchResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: researchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const researchText = searchResponse.text || "No grounded data available.";
    
    // Extract sources safely
    const sources: Source[] = (searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .map((chunk: any) => ({
        title: chunk.web?.title || "Grounded Reference",
        uri: chunk.web?.uri || "#"
      }))
      .filter((s: Source) => s.uri !== "#")
      .slice(0, 5);

    // Stage 2: Prompt Synthesis
    const synthesisPrompt = `
      As a Senior AI Architect, use this research to engineer a high-fidelity JSON prompt package for: "${query}".
      
      Research Input:
      ${researchText}

      Return a JSON object with:
      1. "title": Descriptive professional title.
      2. "description": Deep overview in Markdown.
      3. "jsonPrompt": A precise, highly explicit LLM system prompt. This prompt MUST:
         - Define exactly what data to generate.
         - Explicitly list every key name.
         - Specify data types for every field (e.g., "Integer", "Floating point", "ISO-8601 date string", "Boolean").
         - Define array structures and constraints (e.g., "An array of exactly 5 items").
         - Mention mandatory vs. optional fields.
         - Use technical but clear language optimized for LLM accuracy.
      4. "exampleJson": A robust, realistic example JSON string.
      5. "tsInterface": Production-ready TypeScript interface.
      6. "jsonSchema": Comprehensive JSON Schema (Draft 7).
      7. "promptVariations": 3 alternative prompt strategies.
    `;

    const formatResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: synthesisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            jsonPrompt: { type: Type.STRING },
            exampleJson: { type: Type.STRING },
            tsInterface: { type: Type.STRING },
            jsonSchema: { type: Type.STRING },
            promptVariations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "jsonPrompt", "exampleJson", "tsInterface", "jsonSchema", "promptVariations"]
        }
      }
    });

    const rawResult = formatResponse.text || '{}';
    const parsed = JSON.parse(cleanJsonResponse(rawResult));

    return {
      ...parsed,
      sources: sources.length > 0 ? sources : [{ title: "General Industry Documentation", uri: "#" }]
    };
  } catch (error: any) {
    console.error("Discovery Engine Error:", error);
    throw new Error(error.message || "The synthesis engine encountered a logic fault. Please retry.");
  }
};

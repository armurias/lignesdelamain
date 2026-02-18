import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: "Image is required" },
                { status: 400 }
            );
        }

        // Parse base64 image
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json(
                { error: "Invalid image format" },
                { status: 400 }
            );
        }
        const mimeType = matches[1];
        const base64Data = matches[2];

        // Access API Key
        const apiKey = process.env.GEMINI_API_KEY || (getRequestContext().env as CloudflareEnv).GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing. Please check Cloudflare Settings.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // List of models to try in order of preference
        // Based on user's available models: gemini-2.0-flash, gemini-2.5-flash, etc.
        const candidateModels = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];

        let result = null;
        let lastError = null;

        const prompt = `You are an ancient and wise palm reader with a mystical aura. Your task is to analyze the image of a palm provided.

IMPORTANT: First, strictly verify if the image is a clear photo of a human palm.
- If the image is NOT a palm, or is too blurry/dark to read lines, respond with ONLY: "Je ne vois pas bien les lignes, veuillez reprendre la photo." and stop there.

If the image is a valid palm, provide a reading with the following structure:
1. **L'Atmosphère Générale**: A brief, poetic impression of the hand's energy.
2. **La Ligne de Vie**: Analyze its length and depth (vitality, groundedness).
3. **La Ligne de Tête**: Analyze its clear or waving nature (thought process, creativity).
4. **La Ligne de Cœur**: Analyze its emotional curve (romance, feelings).
5. **Conclusion Mystique**: A short, cryptic but positive prediction for the future.

Tone: Use "Tu" or "Vous" consistently (preferred "Vous"). Be benevolent, mysterious, and slightly theatrical. Use French. Keep it concise (max 200 words).`;

        // Try models sequentially
        for (const modelName of candidateModels) {
            try {
                // console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    }
                ]);
                if (result) break; // Success!
            } catch (e) {
                console.warn(`Failed with model ${modelName}:`, e);
                lastError = e;
            }
        }

        if (!result) {
            throw lastError || new Error("All models failed.");
        }

        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ result: text });

    } catch (error) {
        console.error("Gemini API Error:", error);

        let errorMsg = error instanceof Error ? error.message : String(error);

        // EXTRA DEBUG: Fetch list of models availability from the raw API to see what is actually allowed
        try {
            // Access API Key again for the debug call
            const apiKey = process.env.GEMINI_API_KEY || (getRequestContext().env as CloudflareEnv).GEMINI_API_KEY;
            if (apiKey) {
                const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (listResp.ok) {
                    const data = await listResp.json();
                    // @ts-ignore
                    const models = data.models?.map(m => m.name.replace('models/', '')).join(', ') || "No models found";
                    errorMsg += ` || AVAILABLE MODELS FOR YOUR KEY: ${models}`;
                } else {
                    errorMsg += ` || Could not list models (API Status: ${listResp.status})`;
                }
            }
        } catch (e) {
            errorMsg += " || Debug fetch failed";
        }

        return NextResponse.json(
            { error: `Failed: ${errorMsg}` },
            { status: 500 }
        );
    }
}

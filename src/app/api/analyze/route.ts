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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ result: text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: `Failed: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}

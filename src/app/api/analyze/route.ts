import Groq from "groq-sdk";
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

        // Try both process.env and Cloudflare context
        const apiKey = process.env.GROQ_API_KEY || (getRequestContext().env as CloudflareEnv).GROQ_API_KEY;

        if (!apiKey) {
            throw new Error("GROQ_API_KEY is missing. Please check Cloudflare Settings.");
        }

        const groq = new Groq({
            apiKey: apiKey,
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are an ancient and wise palm reader with a mystical aura. Your task is to analyze the image of a palm provided.

IMPORTANT: First, strictly verify if the image is a clear photo of a human palm.
- If the image is NOT a palm, or is too blurry/dark to read lines, respond with ONLY: "Je ne vois pas bien les lignes, veuillez reprendre la photo." and stop there.

If the image is a valid palm, provide a reading with the following structure:
1. **L'Atmosphère Générale**: A brief, poetic impression of the hand's energy.
2. **La Ligne de Vie**: Analyze its length and depth (vitality, groundedness).
3. **La Ligne de Tête**: Analyze its clear or waving nature (thought process, creativity).
4. **La Ligne de Cœur**: Analyze its emotional curve (romance, feelings).
5. **Conclusion Mystique**: A short, cryptic but positive prediction for the future.

Tone: Use "Tu" or "Vous" consistently (preferred "Vous"). Be benevolent, mysterious, and slightly theatrical. Use French. Keep it concise (max 200 words).`,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: image,
                            },
                        },
                    ],
                },
            ],
            model: "llama-3.2-11b-vision",
            temperature: 0.7,
            max_tokens: 500,
        });

        const analysis = chatCompletion.choices[0]?.message?.content || "Les astres sont silencieux...";

        return NextResponse.json({ result: analysis });
    } catch (error) {
        console.error("Groq API Error:", error);

        let errorMsg = error instanceof Error ? error.message : String(error);

        // Attempt to list models to help debug the "not found" issue
        try {
            // Re-instantiate if needed, but we can reuse the scope if defined, 
            // but safely we recreate it or just use the one from try block if we move the declaration up?
            // Simpler: just create a new light instance or assume the error isn't auth related.
            // Actually, we can't access 'groq' here if it's defined inside try. 
            // So we will move the groq initialization UP, outside the try, or just re-init text here.
            const apiKey = process.env.GROQ_API_KEY || (getRequestContext().env as CloudflareEnv).GROQ_API_KEY;
            if (apiKey) {
                const debugGroq = new Groq({ apiKey });
                const list = await debugGroq.models.list();
                const visionModels = list.data
                    .map((m: any) => m.id)
                    .filter((id: string) => id.includes('vision') || id.includes('3.2'))
                    .join(', ');
                errorMsg += ` || AVAILABLE MODELS: ${visionModels}`;
            }
        } catch (e) {
            errorMsg += " || Could not list models";
        }

        return NextResponse.json(
            { error: `Failed: ${errorMsg}` },
            { status: 500 }
        );
    }
}

import Groq from "groq-sdk";
import { NextResponse } from "next/server";

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

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
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
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.7,
            max_tokens: 500,
        });

        const analysis = chatCompletion.choices[0]?.message?.content || "Les astres sont silencieux...";

        return NextResponse.json({ result: analysis });
    } catch (error) {
        console.error("Groq API Error:", error);
        return NextResponse.json(
            { error: "Failed to analyze the image." },
            { status: 500 }
        );
    }
}

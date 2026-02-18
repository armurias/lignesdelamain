import { groq } from "@/lib/groq";
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

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "You are a mystical palm reader. Analyze this image of a palm. Provide a reading that focuses on the Life Line, Head Line, and Heart Line. Be creative, positive, and slightly mysterious. Keep it concise but engaging. Structure your response with a general impression followed by specific insights for each line. If the image is not a hand, politely ask for a clear photo of a palm.",
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

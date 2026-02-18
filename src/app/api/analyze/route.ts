import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const runtime = 'edge';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: "Image is required" },
                { status: 400 }
            );
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
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
            max_tokens: 500,
        });

        const analysis = response.choices[0].message.content;

        return NextResponse.json({ result: analysis });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json(
            { error: "Failed to analyze the image." },
            { status: 500 }
        );
    }
}

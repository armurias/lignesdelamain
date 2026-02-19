import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { image, mode = 'free' } = await req.json();

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
        // Removing 'lite' as it reported 0 quota. Prioritizing 2.5 and specific versions.
        const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash-001", "gemini-2.0-flash"];

        let result = null;
        let errors = [];

        const systemInstruction = `You are an expert Chiromancer (Master of Palmistry) with decades of experience in traditional reading. Your task is to analyze the image of a palm provided with seriousness and precision.

IMPORTANT: Verification of the photo.
- If the image is CLEARLY NOT a palm (e.g. a face, a landscape, a blank image), respond with ONLY this JSON: {"error": "Ceci ne ressemble pas à une main. Veuillez reprendre la photo."}
- If the image is a palm but slightly blurry or dark, TRY YOUR BEST to provide a reading anyway. Do not reject it unless it is impossible to see any lines.

If the image is a valid palm, provide a reading in strict JSON format.
Tone: Professional, insightful, respectful, and rooted in traditional Chiromancy. Use French. "Vous".

CRITICAL - AUTHENTICITY REQUIREMENTS:
1. Identify the **Hand Shape** (Earth, Air, Fire, Water) and mention how it influences the personality.
2. Analyze specific **Mounts** (Venus, Jupiter, Saturn, Sun/Apollo, Mercury, Mars, Moon) where relevant to the prediction.
3. Observe **Line Characteristics** (depth, length, curvature, islands, chains, forks, branches).
   - Example: "A forked Heart Line indicates..." instead of just "Your love life is..."
4. Justify your predictions by citing these physical observations.
5. Do NOT be vague. Be specific about what you "see" in the image.`;

        const promptFree = `
            Analyze the palm and provide a "Free Reading" (teaser).
            Return valid JSON with this structure:
            {
                "atmosphere": "A brief, poetic impression of the hand's energy (max 2 sentences).",
                "dominant_trait": "Identified dominant trait (e.g., 'Creative', 'Grounded').",
                "teaser": "A mysterious hint about their future (e.g., 'A major change is coming in your career...').",
                "is_premium": false
            }
        `;

        const promptPremium = `
            Analyze the palm and provide a "Premium Complete Reading".
            Return valid JSON with this structure:
            {
                "atmosphere": "A deep, poetic impression of the hand's energy.",
                "life_line": "Detailed analysis of the Life Line (Vitality, Health, Major Changes).",
                "head_line": "Detailed analysis of the Head Line (Intellect, Focus, Creativity).",
                "heart_line": "Detailed analysis of the Heart Line (Emotions, Relationships, Love).",
                "fate_line": "Analysis of the Fate Line (Career, Destiny) if visible.",
                "mounts": "Analysis of significant Mounts (Venus, Jupiter, etc.).",
                "love": "Detailed analysis of love compatibility and emotional life.",
                "health": "Insights on vitality and symbolic life expectancy based on palmistry traditions (disclaimer: not scientific/medical).",
                "work": "Analysis of career opportunities, ambition, and success.",
                "money": "Financial prospects and wealth indicators.",
                "future_prediction": "A detailed prediction for the next 12 months.",
                "is_premium": true
            }
        `;

        const prompt = mode === 'premium' ? promptPremium : promptFree;

        // Try models sequentially
        for (const modelName of candidateModels) {
            try {
                // console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction,
                    generationConfig: { responseMimeType: "application/json" }
                });

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
                errors.push(`${modelName}: ${e instanceof Error ? e.message : String(e)}`);
            }
        }

        if (!result) {
            throw new Error("All models failed. Details: " + errors.join(" | "));
        }

        const response = await result.response;
        const text = response.text();

        return NextResponse.json(JSON.parse(text));

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

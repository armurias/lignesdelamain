
import { NextResponse } from "next/server";

export const runtime = 'edge';

interface SendEmailRequest {
    email: string;
    result: any;
    date: string;
}

export async function POST(req: Request) {
    try {
        const { email, result, date } = await req.json() as SendEmailRequest;

        if (!email || !result) {
            return NextResponse.json(
                { error: "Email and result data are required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.BREVO_API_KEY;

        if (!apiKey) {
            console.error("CRITICAL: BREVO_API_KEY is missing in environment variables");
            return NextResponse.json(
                { error: "Server configuration error: Missing API Key" },
                { status: 500 }
            );
        }

        // Format the analysis for the email
        let analysisHtml = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4a044e; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">🔮 Lignes de la Main</h1>
                    <p style="margin: 5px 0 0;">Votre lecture du ${date}</p>
                </div>
                <div style="border: 1px solid #ddd; padding: 20px; border-radius: 0 0 10px 10px;">
        `;

        // Check if it's JSON or string
        let data = result;
        if (typeof result === 'string') {
            try {
                data = JSON.parse(result);
            } catch (e) {
                data = { atmosphere: result };
            }
        }

        if (data.atmosphere) analysisHtml += `<h2>🌌 Atmosphère</h2><p>${data.atmosphere}</p>`;
        if (data.dominant_trait) analysisHtml += `<h2>⚡ Trait Dominant</h2><p>${data.dominant_trait}</p>`;

        // Premium sections
        if (data.heart_line) analysisHtml += `<h2>❤️ Ligne de Cœur</h2><p>${data.heart_line}</p>`;
        if (data.head_line) analysisHtml += `<h2>🧠 Ligne de Tête</h2><p>${data.head_line}</p>`;
        if (data.life_line) analysisHtml += `<h2>🧬 Ligne de Vie</h2><p>${data.life_line}</p>`;
        if (data.mounts) analysisHtml += `<h2>⛰️ Les Monts</h2><p>${data.mounts}</p>`;
        if (data.future_prediction) analysisHtml += `<h2>🌟 Prédictions (12 mois)</h2><p>${data.future_prediction}</p>`;

        // Extended Premium sections
        if (data.love) analysisHtml += `<h2>💖 Amour & Relations</h2><p>${data.love}</p>`;
        if (data.health) analysisHtml += `<h2>🌿 Santé & Vitalité</h2><p>${data.health}</p>`;
        if (data.work) analysisHtml += `<h2>💼 Travail & Carrière</h2><p>${data.work}</p>`;
        if (data.money) analysisHtml += `<h2>💰 Argent & Prospérité</h2><p>${data.money}</p>`;

        if (data.teaser) analysisHtml += `<h2>🔮 Aperçu</h2><p>${data.teaser}</p>`;

        if (!data.is_premium) {
            analysisHtml += `
                <div style="background-color: #f3e8ff; border: 1px solid #d8b4fe; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
                    <h3 style="color: #6b21a8; margin-top: 0;">🔓 Débloquez votre destinée</h3>
                    <p style="color: #4a044e; margin-bottom: 20px;">
                        Optez pour la version Premium pour découvrir :<br>
                        • Votre espérance de vie<br>
                        • Votre compatibilité amoureuse<br>
                        • Vos opportunités de carrière<br>
                        • Des prédictions détaillées sur 12 mois
                    </p>
                    <a href="https://liremamain.fr?mode=premium" style="background-color: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Obtenir ma lecture complète
                    </a>
                </div>
            `;
        }

        analysisHtml += `
                    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 12px; color: #888;">
                        <p>© ${new Date().getFullYear()} Lignes de la Main - Armurias</p>
                    </div>
                </div>
            </div>
        `;

        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                "accept": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: "Lignes de la Main",
                    email: "contact@armurias.com"
                },
                to: [
                    {
                        email: email
                    }
                ],
                subject: "✨ Votre lecture des lignes de la main",
                htmlContent: analysisHtml
            })
        });

        if (!brevoResponse.ok) {
            const errorData = await brevoResponse.json();
            console.error("Brevo API Error:", JSON.stringify(errorData, null, 2));
            return NextResponse.json(
                { error: `Brevo Error: ${errorData.message || 'Unknown error'}` },
                { status: brevoResponse.status }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Email Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error during email sending" },
            { status: 500 }
        );
    }
}

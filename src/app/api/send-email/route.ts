
import { NextResponse } from "next/server";
import { sendAdminNotification } from "@/lib/notify";

export const runtime = 'edge';

interface SendEmailRequest {
    email: string;
    result: any;
    date: string;
    appOrigin?: string;
    image?: string;
}

function parsePremiumFlag(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "oui"].includes(normalized)) return true;
        if (["false", "0", "no", "non", ""].includes(normalized)) return false;
    }
    return false;
}

const ALLOWED_HOSTS = new Set(["liremamain.fr", "www.liremamain.fr"]);

function normalizeAllowedOrigin(rawOrigin?: string | null): string | null {
    if (!rawOrigin) return null;

    try {
        const url = new URL(rawOrigin);
        if ((url.protocol === "https:" || url.protocol === "http:") && ALLOWED_HOSTS.has(url.hostname)) {
            return `${url.protocol}//${url.host}`;
        }
    } catch {
        return null;
    }

    return null;
}

function resolveAppOrigin(req: Request, bodyOrigin?: string): string {
    const fallback = normalizeAllowedOrigin(process.env.NEXT_PUBLIC_APP_URL) || "https://liremamain.fr";

    const bodyValue = normalizeAllowedOrigin(bodyOrigin);
    if (bodyValue) return bodyValue;

    const headerValue = normalizeAllowedOrigin(req.headers.get("origin"));
    if (headerValue) return headerValue;

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const hostValue = normalizeAllowedOrigin(host ? `${proto}://${host}` : null);
    if (hostValue) return hostValue;

    return fallback;
}

const PREMIUM_IMAGE_TOKEN_TTL_SECONDS = 60 * 60 * 24;

function isLikelyBase64Image(value: unknown): value is string {
    return typeof value === "string" && value.startsWith("data:image/");
}

function buildPremiumImageCacheKey(token: string): Request {
    return new Request(`https://premium-image-cache.local/${encodeURIComponent(token)}`);
}

async function getPremiumImageCache(): Promise<Cache> {
    const cacheStorage = caches as CacheStorage & { default?: Cache };
    if (cacheStorage.default) return cacheStorage.default;
    return caches.open("premium-image-cache");
}

async function storePremiumImageToken(token: string, image: string): Promise<boolean> {
    try {
        const cache = await getPremiumImageCache();
        const payload = JSON.stringify({
            image,
            createdAt: Date.now(),
        });
        const response = new Response(payload, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": `public, max-age=${PREMIUM_IMAGE_TOKEN_TTL_SECONDS}`,
            },
        });
        await cache.put(buildPremiumImageCacheKey(token), response);
        return true;
    } catch (error) {
        console.error("Failed to store premium image token:", error);
        return false;
    }
}

export async function POST(req: Request) {
    try {
        const { email, result, date, appOrigin: bodyOrigin, image } = await req.json() as SendEmailRequest;
        const appOrigin = resolveAppOrigin(req, bodyOrigin);

        let premiumToken: string | null = null;
        if (isLikelyBase64Image(image)) {
            const token = crypto.randomUUID();
            const stored = await storePremiumImageToken(token, image);
            if (stored) premiumToken = token;
        }

        const premiumParams = new URLSearchParams({ mode: "premium" });
        if (premiumToken) {
            premiumParams.set("token", premiumToken);
        }
        const premiumLink = `${appOrigin}/?${premiumParams.toString()}`;

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

        const isPremium = parsePremiumFlag(data?.is_premium);

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

        if (!isPremium) {
            analysisHtml += `
                <div style="background-color: #f3e8ff; border: 1px solid #d8b4fe; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
                    <h3 style="color: #6b21a8; margin-top: 0;">🔓 Débloquez votre destinée</h3>
                    <p style="color: #4a044e; margin-bottom: 20px;">
                        Si vous le souhaitez, passez a la version Premium pour découvrir :<br>
                        • Votre espérance de vie<br>
                        • Votre compatibilité amoureuse<br>
                        • Vos opportunités de carrière<br>
                        • Des prédictions détaillées sur 12 mois
                    </p>
                    <a href="${premiumLink}" style="background-color: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Obtenir ma lecture complète
                    </a>
                    <p style="color: #6b21a8; margin-top: 12px; font-size: 12px;">
                        Si vous ouvrez ce lien sur un autre appareil, il faudra reimporter la photo.
                    </p>
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
                    email: "contact@liremamain.fr"
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

        await sendAdminNotification(isPremium ? "premium" : "free", {
            timestamp: new Date().toISOString(),
            clientEmail: email,
            source: "email_send",
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Email Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error during email sending" },
            { status: 500 }
        );
    }
}

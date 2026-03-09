import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const PREMIUM_ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 6;

function isLikelyStripeSessionId(value: unknown): value is string {
    return typeof value === "string" && value.startsWith("cs_") && value.length > 12;
}

function buildPremiumAccessCacheKey(token: string): Request {
    return new Request(`https://premium-access-cache.local/${encodeURIComponent(token)}`);
}

async function getPremiumAccessCache(): Promise<Cache> {
    const cacheStorage = caches as CacheStorage & { default?: Cache };
    if (cacheStorage.default) return cacheStorage.default;
    return caches.open("premium-access-cache");
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as { sessionId?: unknown };
        const sessionId = body?.sessionId;

        if (!isLikelyStripeSessionId(sessionId)) {
            return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
        }

        const env = getRequestContext().env as CloudflareEnv;
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey, { typescript: true });
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const isPaid = session.payment_status === "paid" && session.status === "complete";

        if (!isPaid) {
            return NextResponse.json({ error: "Payment not completed" }, { status: 403 });
        }

        const accessToken = crypto.randomUUID();
        const cache = await getPremiumAccessCache();
        const payload = JSON.stringify({
            sessionId: session.id,
            createdAt: Date.now(),
        });

        await cache.put(
            buildPremiumAccessCacheKey(accessToken),
            new Response(payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": `public, max-age=${PREMIUM_ACCESS_TOKEN_TTL_SECONDS}`,
                },
            })
        );

        return NextResponse.json({ accessToken });
    } catch (error) {
        console.error("Premium access creation failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

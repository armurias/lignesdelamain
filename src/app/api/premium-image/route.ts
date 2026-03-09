import { NextResponse } from "next/server";

export const runtime = "edge";

function isValidToken(token: string): boolean {
    return /^[a-fA-F0-9-]{20,80}$/.test(token);
}

function buildPremiumImageCacheKey(token: string): Request {
    return new Request(`https://premium-image-cache.local/${encodeURIComponent(token)}`);
}

async function getPremiumImageCache(): Promise<Cache> {
    const cacheStorage = caches as CacheStorage & { default?: Cache };
    if (cacheStorage.default) return cacheStorage.default;
    return caches.open("premium-image-cache");
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token || !isValidToken(token)) {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 });
        }

        const cacheKey = buildPremiumImageCacheKey(token);
        const cache = await getPremiumImageCache();
        const cached = await cache.match(cacheKey);

        if (!cached) {
            return NextResponse.json({ error: "Token expired or not found" }, { status: 404 });
        }

        const payload = await cached.json() as { image?: unknown };
        const image = typeof payload?.image === "string" ? payload.image : null;

        if (!image) {
            return NextResponse.json({ error: "Invalid image payload" }, { status: 404 });
        }

        return NextResponse.json({ image });
    } catch (error) {
        console.error("Premium image retrieval error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

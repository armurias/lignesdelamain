import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        // Access Secret Key from Cloudflare or process.env
        const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || (getRequestContext().env as CloudflareEnv).STRIPE_SECRET_KEY;

        if (!STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 });
        }

        const stripe = new Stripe(STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16', // Use a stable version
            typescript: true,
        });

        // Current host for success/cancel URLs
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Lecture Complète des Lignes de la Main',
                            description: 'Analyse détaillée Amour, Travail, Santé & Prédictions 12 mois.',
                            images: ['https://lignesdelamain.pages.dev/hand-preview.jpg'], // Ideally host a real preview image
                        },
                        unit_amount: 299, // 2.99 EUR
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/resultat-premium?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err) {
        console.error("Stripe Error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}

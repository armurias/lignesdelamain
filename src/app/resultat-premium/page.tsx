"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [status, setStatus] = useState<"loading" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        const activatePremium = async () => {
            if (!sessionId) {
                if (!cancelled) {
                    setStatus("error");
                    setErrorMessage("Session de paiement introuvable.");
                }
                return;
            }

            try {
                const response = await fetch("/api/premium-access", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId }),
                });

                if (!response.ok) {
                    const data = await response.json().catch(() => ({} as { error?: string }));
                    throw new Error(data?.error || "Validation du paiement impossible.");
                }

                const data = await response.json() as { accessToken?: unknown };
                if (typeof data.accessToken !== "string" || data.accessToken.length < 20) {
                    throw new Error("Token premium invalide.");
                }

                if (!cancelled) {
                    window.location.href = `/?mode=premium&access=${encodeURIComponent(data.accessToken)}`;
                }
            } catch (error) {
                console.error("Premium activation error:", error);
                if (!cancelled) {
                    setStatus("error");
                    setErrorMessage(error instanceof Error ? error.message : "Erreur inconnue.");
                }
            }
        };

        void activatePremium();

        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    return (
        <div className="glass-panel p-10 rounded-2xl max-w-lg text-center relative z-10 border-green-500/30">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✨</span>
            </div>

            {status === "loading" ? (
                <>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-4">
                        Paiement confirme
                    </h1>
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        Activation de votre acces premium en cours...
                    </p>
                </>
            ) : (
                <>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-300 to-orange-300 bg-clip-text text-transparent mb-4">
                        Activation impossible
                    </h1>
                    <p className="text-gray-300 mb-4 leading-relaxed">
                        {errorMessage || "Impossible de valider votre paiement pour l'instant."}
                    </p>
                    <Link
                        href="/"
                        className="block w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold hover:scale-105 transition-transform shadow-lg shadow-purple-900/50"
                    >
                        Retour a l&apos;accueil
                    </Link>
                </>
            )}
        </div>
    );
}

export default function PremiumSuccessPage() {
    return (
        <div className="min-h-screen w-full bg-[#0a0514] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/20 via-[#0a0514] to-[#0a0514] pointer-events-none" />

            <Suspense fallback={<div className="text-white">Chargement...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}

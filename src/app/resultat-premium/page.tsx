"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PremiumSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionId) {
            // Here we would ideally verify the session with the backend
            // For now, we simulate success and invite user to re-analyze or show a stored result
            const timer = setTimeout(() => setLoading(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [sessionId]);

    return (
        <div className="min-h-screen w-full bg-[#0a0514] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/20 via-[#0a0514] to-[#0a0514] pointer-events-none" />

            <div className="glass-panel p-10 rounded-2xl max-w-lg text-center relative z-10 border-green-500/30">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">✨</span>
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-4">
                    Paiement Réussi !
                </h1>

                <p className="text-gray-300 mb-8 leading-relaxed">
                    Votre destinée est désormais débloquée. Vous avez accès à l'analyse complète de vos lignes de la main.
                </p>

                <Link
                    href="/?mode=premium"
                    className="block w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold hover:scale-105 transition-transform shadow-lg shadow-purple-900/50"
                >
                    Voir mon analyse complète
                </Link>
            </div>
        </div>
    );
}

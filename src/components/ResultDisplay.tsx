"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

interface AnalysisResult {
    error?: string;
    atmosphere?: string;
    dominant_trait?: string;
    teaser?: string;
    life_line?: string;
    head_line?: string;
    heart_line?: string;
    fate_line?: string;
    mounts?: string;
    future_prediction?: string;
    is_premium?: boolean;
}

interface ResultDisplayProps {
    result: string | null; // We receive the JSON string from the API
    onReset: () => void;
}

export default function ResultDisplay({ result, onReset }: ResultDisplayProps) {
    // HOOKS MUST BE AT THE TOP LEVEL
    const [loadingCheckout, setLoadingCheckout] = useState(false);

    if (!result) return null;

    let parsedResult: AnalysisResult;
    try {
        parsedResult = JSON.parse(result);
    } catch (e) {
        // Fallback for plain text legacy results
        parsedResult = { atmosphere: result };
    }

    const handleCheckout = async () => {
        try {
            setLoadingCheckout(true);
            const res = await fetch('/api/checkout', {
                method: 'POST',
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Erreur lors de l'initialisation du paiement.");
                setLoadingCheckout(false);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Une erreur est survenue.");
            setLoadingCheckout(false);
        }
    };

    if (parsedResult.error) {
        return (
            <div className="glass-panel rounded-2xl p-8 text-center border-red-500/30">
                <h3 className="text-xl font-bold text-red-300 mb-2">Erreur</h3>
                <p className="text-white/80 mb-6">{parsedResult.error}</p>
                <button
                    onClick={onReset}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    const { is_premium } = parsedResult;

    const renderSection = (title: string, content?: string, forcedBlur: boolean = false) => {
        if (!content && !forcedBlur) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 last:mb-0"
            >
                <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                    {title}
                    {forcedBlur && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded ml-2">PREMIUM</span>}
                </h3>
                <div className={`text-white/90 leading-relaxed ${forcedBlur ? 'blur-sm select-none opacity-50' : ''}`}>
                    {forcedBlur ? (
                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."
                    ) : (
                        <ReactMarkdown>{content || ""}</ReactMarkdown>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-8 border-purple-500/30">
                <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                    {is_premium ? "✨ Lecture Premium Complète" : "🔮 Votre Lecture Gratuite"}
                </h2>

                <div className="space-y-6">
                    {/* Always visible */}
                    {renderSection("🌌 Atmosphère Générale", parsedResult.atmosphere)}
                    {renderSection("⚡ Trait Dominant", parsedResult.dominant_trait)}

                    {/* Teaser (Only for Free) */}
                    {!is_premium && renderSection("🔮 Aperçu de l'Avenir", parsedResult.teaser)}

                    {/* Premium Sections (Hidden or Shown) */}
                    {renderSection("❤️ Ligne de Cœur", parsedResult.heart_line, !is_premium)}
                    {renderSection("🧠 Ligne de Tête", parsedResult.head_line, !is_premium)}
                    {renderSection("🧬 Ligne de Vie", parsedResult.life_line, !is_premium)}
                    {renderSection("⛰️ Les Monts", parsedResult.mounts, !is_premium)}
                    {renderSection("🌟 Prédictions 12 Mois", parsedResult.future_prediction, !is_premium)}
                </div>

                {!is_premium && (
                    <div className="mt-8 pt-6 border-t border-white/10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent pointer-events-none" />
                        <h4 className="text-lg font-semibold text-purple-200 mb-2">
                            Débloquez votre Destinée
                        </h4>
                        <p className="text-sm text-gray-400 mb-6">
                            Accédez à l&apos;analyse complète de vos lignes et à vos prédictions détaillées pour les 12 prochains mois.
                        </p>

                        <button
                            className="relative z-10 py-3 px-8 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-bold shadow-lg shadow-yellow-900/20 transition-all transform hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loadingCheckout}
                            onClick={handleCheckout}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {loadingCheckout ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Redirection...
                                    </>
                                ) : (
                                    <>🔓 Débloquer le rapport complet (2.99€)</>
                                )}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            <button
                onClick={onReset}
                className="w-full py-3 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
                Analyser une autre main
            </button>
        </div>
    );
}

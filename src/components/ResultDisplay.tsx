"use client";

import { Sparkles, Loader2 } from "lucide-react";

interface ResultDisplayProps {
    analyzing: boolean;
    result: string | null;
    onReset: () => void;
}

export default function ResultDisplay({ analyzing, result, onReset }: ResultDisplayProps) {
    if (analyzing) {
        return (
            <div className="mt-8 text-center space-y-4 animate-fade-in">
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
                <p className="text-lg font-light tracking-wide animate-pulse">Connexion aux esprits...</p>
            </div>
        );
    }

    if (result) {
        return (
            <div className="mt-8 glass-panel p-6 rounded-xl border-t-4 border-yellow-400 animate-slide-up">
                <h3 className="text-2xl font-serif text-yellow-400 mb-4 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" /> Résultat
                </h3>
                <p className="text-lg leading-relaxed text-gray-200 whitespace-pre-wrap">
                    {result}
                </p>
                <button
                    onClick={onReset}
                    className="mt-6 text-sm text-purple-300 hover:text-purple-200 underline underline-offset-4"
                >
                    Nouvelle lecture
                </button>
            </div>
        );
    }

    return null;
}

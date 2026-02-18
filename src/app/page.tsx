"use client";

import { useState } from "react";
import { Sparkles, Hand } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ResultDisplay from "@/components/ResultDisplay";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const analyzeHand = async () => {
    if (!image) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
      } else {
        setResult("Les esprits sont brouillés... Veuillez réessayer plus tard. (Erreur: " + (data.error || "Inconnue") + ")");
      }
    } catch (error) {
      setResult("Une erreur mystique est survenue. Vérifiez votre connexion.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[-1]">
        <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-[20%] right-[20%] w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[20%] left-[30%] w-64 h-64 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <header className="text-center space-y-4 max-w-2xl z-10">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
          <span className="text-sm tracking-widest uppercase text-white/80">Révélez votre destin</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 pb-2">
          Lignes de la Main
        </h1>
        <p className="text-lg text-gray-300">
          Uploadez une photo de votre paume et laissez les astres décrypter les secrets de votre avenir.
        </p>
      </header>

      <main className="w-full max-w-md z-10">
        <FileUpload
          image={image}
          onImageChange={setImage}
          analyzing={analyzing}
          result={result}
          onAnalyze={analyzeHand}
        />

        <ResultDisplay
          analyzing={analyzing}
          result={result}
          onReset={() => { setImage(null); setResult(null); }}
        />
      </main>

      <footer className="mt-auto py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Lignes de la Main. Ceci est une démonstration à des fins de divertissement uniquement.</p>
      </footer>
    </div>
  );
}

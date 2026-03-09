"use client";

import { useState, useEffect } from "react";
import { Sparkles, Hand } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ResultDisplay from "@/components/ResultDisplay";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [premiumImageMissing, setPremiumImageMissing] = useState(false);

  const analyzeHand = async (imgToAnalyze?: string, mode: 'free' | 'premium' = 'free') => {
    const currentImage = imgToAnalyze || image;
    if (!currentImage) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: currentImage, mode }), // Pass mode here
      });

      const data = await response.json();

      if (response.ok) {
        setResult(JSON.stringify(data));
        // Clear storage if premium successful
        if (mode === 'premium') {
          localStorage.removeItem('palm_image_for_premium');
          // Remove query param to clean URL
          window.history.replaceState({}, '', '/');
        }
      } else {
        setResult("Les esprits sont brouillés... Veuillez réessayer plus tard. (Erreur: " + (data.error || "Inconnue") + ")");
      }
    } catch (error) {
      setResult("Une erreur mystique est survenue. Vérifiez votre connexion.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Check for premium return
  useEffect(() => {
    // Check if we are returning from a premium flow.
    if (typeof window === 'undefined') return;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode !== 'premium') return;

      const token = params.get('token');
      let recoveredImage: string | null = null;

      if (token) {
        try {
          const response = await fetch(`/api/premium-image?token=${encodeURIComponent(token)}`, {
            method: 'GET',
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json() as { image?: unknown };
            if (typeof data.image === 'string' && data.image.startsWith('data:image/')) {
              recoveredImage = data.image;
              localStorage.setItem('palm_image_for_premium', recoveredImage);
            }
          }
        } catch (error) {
          console.error('Premium image token recovery failed:', error);
        }
      }

      if (!recoveredImage) {
        recoveredImage = localStorage.getItem('palm_image_for_premium');
      }

      if (recoveredImage) {
        setPremiumImageMissing(false);
        setImage(recoveredImage);
        analyzeHand(recoveredImage, 'premium');
      } else {
        setPremiumImageMissing(true);
      }
    };

    void run();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          Uploadez une photo de votre paume droite et laissez les astres décrypter les secrets de votre avenir.
        </p>
        <div className="flex flex-col gap-1 text-sm text-gray-400">
          <p>✨ Résultats en quelques secondes</p>
          <p>🔒 L&apos;image est analysée à la volée et immédiatement supprimée</p>
        </div>
      </header>

      <main className="w-full max-w-md z-10">
        {premiumImageMissing && (
          <div className="mb-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Vous etes bien sur le parcours Premium. Pour des raisons de confidentialite, la photo
            n&apos;est pas conservee sur nos serveurs: importez a nouveau votre paume pour lancer
            l&apos;analyse complete.
          </div>
        )}

        <FileUpload
          image={image}
          onImageChange={setImage}
          analyzing={analyzing}
          result={result}
          onAnalyze={() => analyzeHand()}
        />

        <ResultDisplay
          result={result}
          image={image}
          onReset={() => { setImage(null); setResult(null); }}
        />
      </main>

      <footer className="mt-auto py-6 text-center text-xs text-gray-500 max-w-lg mx-auto">
        <p>&copy; {new Date().getFullYear()} Lignes de la Main.</p>
        <p className="mt-2">
          ⚠️ <strong>Avertissement :</strong> Ce service est réalisé à des fins de <strong>divertissement uniquement</strong>. Les résultats sont générés par une intelligence artificielle et ne constituent en aucun cas une vérité absolue ou un conseil professionnel.
        </p>
      </footer>
    </div>
  );
}

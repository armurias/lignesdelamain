"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ResultDisplay from "@/components/ResultDisplay";

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [premiumImageMissing, setPremiumImageMissing] = useState(false);
  const [premiumPaymentRequired, setPremiumPaymentRequired] = useState(false);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const checkoutRedirectRef = useRef(false);

  const startPremiumCheckout = async () => {
    if (checkoutRedirectRef.current) return;

    checkoutRedirectRef.current = true;
    setRedirectingToCheckout(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data?.error || "Erreur lors de l'initialisation du paiement.");
    } catch (error) {
      console.error("Checkout start failed:", error);
      setRedirectingToCheckout(false);
      checkoutRedirectRef.current = false;
      setResult("Paiement indisponible pour le moment. Veuillez reessayer.");
    }
  };

  const analyzeHand = async (
    imgToAnalyze?: string,
    mode: "free" | "premium" = "free",
    premiumAccessToken?: string
  ) => {
    const currentImage = imgToAnalyze || image;
    if (!currentImage) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const payload: {
        image: string;
        mode: "free" | "premium";
        premiumAccessToken?: string;
        clientEmail?: string;
      } = {
        image: currentImage,
        mode,
      };

      const clientEmail =
        typeof window !== "undefined" ? localStorage.getItem("client_email_for_notifications") : null;
      if (clientEmail) {
        payload.clientEmail = clientEmail;
      }

      if (mode === "premium") {
        const tokenFromStorage =
          typeof window !== "undefined" ? localStorage.getItem("premium_access_token") : null;
        const token = premiumAccessToken || tokenFromStorage || undefined;
        if (token) payload.premiumAccessToken = token;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(JSON.stringify(data));
        if (mode === "premium") {
          localStorage.removeItem("palm_image_for_premium");
          localStorage.removeItem("premium_access_token");
          window.history.replaceState({}, "", "/");
        }
        setPremiumPaymentRequired(false);
      } else if (response.status === 402 && mode === "premium") {
        setPremiumPaymentRequired(true);
        setResult("Paiement premium requis pour debloquer l'analyse complete.");
      } else {
        setResult(
          "Les esprits sont brouilles... Veuillez reessayer plus tard. (Erreur: " +
            (data.error || "Inconnue") +
            ")"
        );
      }
    } catch (error) {
      setResult("Une erreur mystique est survenue. Verifiez votre connexion.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode !== "premium") return;

      const accessFromQuery = params.get("access");
      if (accessFromQuery) {
        localStorage.setItem("premium_access_token", accessFromQuery);
      }

      const premiumAccessToken = accessFromQuery || localStorage.getItem("premium_access_token");
      const imageToken = params.get("token");
      let recoveredImage: string | null = null;

      if (imageToken) {
        try {
          const response = await fetch(`/api/premium-image?token=${encodeURIComponent(imageToken)}`, {
            method: "GET",
            cache: "no-store",
          });
          if (response.ok) {
            const data = (await response.json()) as { image?: unknown };
            if (typeof data.image === "string" && data.image.startsWith("data:image/")) {
              recoveredImage = data.image;
              localStorage.setItem("palm_image_for_premium", recoveredImage);
            }
          }
        } catch (error) {
          console.error("Premium image token recovery failed:", error);
        }
      }

      if (!recoveredImage) {
        recoveredImage = localStorage.getItem("palm_image_for_premium");
      }

      if (recoveredImage) {
        setPremiumImageMissing(false);
        setImage(recoveredImage);
      } else {
        setPremiumImageMissing(true);
      }

      if (premiumAccessToken && recoveredImage) {
        await analyzeHand(recoveredImage, "premium", premiumAccessToken);
        return;
      }

      setPremiumPaymentRequired(true);

      // Email premium CTA: no paid access yet, go directly to checkout.
      if (imageToken && !premiumAccessToken) {
        await startPremiumCheckout();
      }
    };

    void run();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[-1]">
        <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-[20%] right-[20%] w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[20%] left-[30%] w-64 h-64 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <header className="text-center space-y-4 max-w-2xl z-10">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
          <span className="text-sm tracking-widest uppercase text-white/80">Revelez votre destin</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 pb-2">
          Lignes de la Main
        </h1>
        <p className="text-lg text-gray-300">
          Uploadez une photo de votre paume droite et laissez les astres decrypter les secrets de votre avenir.
        </p>
        <div className="flex flex-col gap-1 text-sm text-gray-400">
          <p>Resultats en quelques secondes</p>
          <p>L&apos;image est analysee a la volee et immediatement supprimee</p>
        </div>
      </header>

      <main className="w-full max-w-md z-10">
        {premiumImageMissing && (
          <div className="mb-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Vous etes sur le parcours Premium. Pour des raisons de confidentialite, la photo n&apos;est pas
            conservee sur nos serveurs: importez a nouveau votre paume pour lancer l&apos;analyse complete.
          </div>
        )}

        {premiumPaymentRequired && !premiumImageMissing && (
          <div className="mb-4 rounded-xl border border-purple-400/30 bg-purple-500/10 p-4 text-sm text-purple-100">
            Paiement premium requis pour debloquer l&apos;analyse complete.
            <button
              onClick={() => void startPremiumCheckout()}
              disabled={redirectingToCheckout}
              className="mt-3 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {redirectingToCheckout ? "Redirection paiement..." : "Continuer vers le paiement premium"}
            </button>
          </div>
        )}

        <FileUpload image={image} onImageChange={setImage} analyzing={analyzing} result={result} onAnalyze={() => analyzeHand()} />

        <ResultDisplay
          result={result}
          image={image}
          onReset={() => {
            setImage(null);
            setResult(null);
            setPremiumImageMissing(false);
            setPremiumPaymentRequired(false);
          }}
        />
      </main>

      <footer className="mt-auto py-6 text-center text-xs text-gray-500 max-w-lg mx-auto">
        <p>&copy; {new Date().getFullYear()} Lignes de la Main.</p>
        <p className="mt-2">
          <strong>Avertissement :</strong> Ce service est realise a des fins de <strong>divertissement uniquement</strong>.
          Les resultats sont generes par une intelligence artificielle et ne constituent en aucun cas une verite absolue ou un
          conseil professionnel.
        </p>
      </footer>
    </div>
  );
}

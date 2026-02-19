import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lignes de la Main - Analyse IA Gratuite & Premium",
  description: "Découvrez votre destin grâce à l'analyse de vos lignes de la main par Intelligence Artificielle. Amour, Santé, Travail & Argent. Chiromancie moderne et précise.",
  metadataBase: new URL('https://liremamain.fr'),
  keywords: ["Chiromancie", "Lignes de la main", "Voyance IA", "Horoscope main", "Avenir amoureux", "Prédictions", "Astrologie", "Spiritualité", "Destin", "Fortune Teller"],
  openGraph: {
    title: "Lignes de la Main - Votre Destin Révélé par l'IA",
    description: "Prenez une photo de votre main et découvrez ce que vos lignes révèlent sur votre avenir amoureux, votre santé et votre carrière.",
    url: 'https://liremamain.fr',
    siteName: 'Lignes de la Main',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Lignes de la Main - Analyse IA",
    description: "Votre destin dans le creux de votre main. Analyse immédiate par IA.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

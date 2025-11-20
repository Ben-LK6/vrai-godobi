import type { Metadata } from "next";
import "./globals.css";
import CallProvider from "@/components/CallProvider";

export const metadata: Metadata = {
  title: "GODOBI - Réseau Social Créatif",
  description: "Réseau social avec IA, appels audio/vidéo, groupes et événements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <CallProvider>
          {children}
        </CallProvider>
      </body>
    </html>
  );
}

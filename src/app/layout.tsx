import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Fuente única de marca (licencia OFL, Google Fonts). El manual pide caer en
// Inter o la fuente de sistema si Archivo no está disponible -- next/font ya
// resuelve eso con su propio fallback automático.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "900"],
});

export const metadata: Metadata = {
  title: "CAP — Circuito Abierto de Pádel",
  description: "Fixture, resultados y tabla de posiciones del CAP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

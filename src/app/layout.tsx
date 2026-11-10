import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import FloatingThemeToggle from "./components/FloatingThemeToggle";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const shoulders = Big_Shoulders({
  variable: "--font-shoulders",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "MarcaGol · Tu liga como en las apps de resultados",
  description:
    "Calendario automático, resultados en vivo, tabla, goleo y liguilla para tu torneo de fútbol amateur. Panel web, app móvil para organizadores y capitanes, y página pública para la afición.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1a11" },
  ],
};

// Aplica el tema guardado antes de pintar (evita el parpadeo claro/oscuro)
const themeScript = `try{var t=localStorage.getItem("mg-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${manrope.variable} ${shoulders.variable} antialiased`}>
        {children}
        <FloatingThemeToggle />
        <Analytics />
      </body>
    </html>
  );
}

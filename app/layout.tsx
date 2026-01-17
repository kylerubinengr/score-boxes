import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { GameTabsProvider } from "@/context/GameTabsContext";
import { SeasonProvider } from "@/context/SeasonContext";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Score Boxes",
  description: "Real-time NFL scores, standings, and game tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider>
          <SeasonProvider>
            <GameTabsProvider>
              <Navbar />
              {children}
            </GameTabsProvider>
          </SeasonProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

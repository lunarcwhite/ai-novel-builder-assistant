import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const sansFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serifFont = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Novel Builder: AI Novel Writing Workspace",
  description: "A creative, focused workspace for novelists with contextual story intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sansFont.variable} ${serifFont.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-accent/20">
        {children}
      </body>
    </html>
  );
}

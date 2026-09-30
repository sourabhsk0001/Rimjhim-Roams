import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { GlobalTopographyBackground } from "@/components/layout/global-topography-background";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rimjhim Roams — AI-Powered Travel OS",
  description:
    "Intelligent, geospatial itinerary planner and travel operating system powered by Gemini, OpenStreetMap, and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary relative">
            <GlobalTopographyBackground />
            <div className="relative z-10 flex-1 flex flex-col">
              {children}
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}

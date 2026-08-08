import type { Metadata } from "next";
import { LanguageProvider } from "./components/LanguageProvider";
import DekoPerformanceMonitor from "./components/performance/DekoPerformanceMonitor";
import { CompanionProvider } from "./components/companion/CompanionUI";
import { PageContextProvider } from "./components/companion/PageContextProvider";
import EchoWelcomeExperience from "./components/echo-welcome/EchoWelcomeExperience";
import "./globals.css";

export const metadata: Metadata = {
  title: "DekoKraft",
  description: "Handmade products, gifts, candles, and creative services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head><script dangerouslySetInnerHTML={{ __html: "try{if(performance&&!performance.getEntriesByName('dekokraft-app-init').length)performance.mark('dekokraft-app-init')}catch(e){}" }} /></head>
      <body className="min-h-full flex flex-col">
        <DekoPerformanceMonitor />
        <LanguageProvider><PageContextProvider><CompanionProvider>{children}<EchoWelcomeExperience /></CompanionProvider></PageContextProvider></LanguageProvider>
      </body>
    </html>
  );
}

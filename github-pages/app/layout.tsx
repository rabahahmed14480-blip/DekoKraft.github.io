import type { Metadata } from "next";
import { LanguageProvider } from "../../app/components/LanguageProvider";
import { CompanionProvider } from "../../app/components/companion/CompanionUI";
import { PageContextProvider } from "../../app/components/companion/PageContextProvider";
import DekoPerformanceMonitor from "../../app/components/performance/DekoPerformanceMonitor";
import "../../app/globals.css";

export const metadata: Metadata = { title: "DekoKraft", description: "Handmade products, gifts, candles, and creative services." };
export default function GitHubPagesLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl" suppressHydrationWarning className="h-full antialiased"><head><script dangerouslySetInnerHTML={{ __html: "try{if(performance&&!performance.getEntriesByName('dekokraft-app-init').length)performance.mark('dekokraft-app-init')}catch(e){}" }} /></head><body className="min-h-full flex flex-col"><DekoPerformanceMonitor /><LanguageProvider><PageContextProvider><CompanionProvider>{children}</CompanionProvider></PageContextProvider></LanguageProvider></body></html>; }

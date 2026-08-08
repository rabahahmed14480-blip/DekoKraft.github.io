import type { ConversationPageContext } from "../types.ts";
import type { AccompanimentMode, CompanionUIStatus } from "./types.ts";

export type CompanionLocale = "ar" | "en" | "fr" | "de";
type LocalizedCompanionContent = {
  identity: string; title: string; welcome: string; returningWelcome: string;
  accompany: string; continueAlone: string; accompanimentThanks: string;
  intentQuestion: string; intents: string[]; statuses: Record<CompanionUIStatus, string>;
  placeholder: string; unavailable: string; microphoneUnavailable: string;
  clearConfirm: string; contextPrefix: string; labels: Record<string, string>;
};

export const companionContent: Record<CompanionLocale, LocalizedCompanionContent> = {
  ar: {
    identity: "المرافق الذكي", title: "المرافق", welcome: "السلام عليكم ورحمة الله وبركاته 🌹\nأهلاً بك في المرافق الذكي.\nكيف يمكنني مساعدتك اليوم؟",
    returningWelcome: "أهلاً بعودتك.\nهل ترغب أن أرافقك اليوم؟", accompany: "رافقني في الجولة", continueAlone: "شكرًا، سأكمل بمفردي",
    accompanimentThanks: "يسعدني مرافقتك.", intentQuestion: "ما هدف زيارتك اليوم؟",
    intents: ["التعرف على المنصة", "شراء منتج", "إنشاء تصميم", "المشاركة أو تقديم خدمة", "الحصول على مساعدة", "هدف آخر"],
    statuses: { ready: "جاهز لمساعدتك", listening: "أستمع إليك", transcribing: "أحوّل صوتك إلى نص", processing: "أفهم طلبك", responding: "أجهز الرد", speaking: "أقرأ الرد", paused: "القراءة متوقفة مؤقتًا", offline: "الخدمة غير متاحة مؤقتًا", failed: "تعذر إكمال الطلب" },
    placeholder: "اكتب رسالتك…", unavailable: "المرافق غير متاح مؤقتًا. بقيت محادثتك المكتوبة محفوظة.", microphoneUnavailable: "الإدخال الصوتي غير مهيأ حاليًا.", clearConfirm: "هل تريد مسح المحادثة المؤقتة؟", contextPrefix: "المرافق يفهم الصفحة الحالية:",
    labels: { open: "فتح المرافق", close: "إغلاق المرافق", minimize: "تصغير", expand: "فتح الصفحة الكاملة", send: "إرسال", microphone: "الميكروفون", cancel: "إلغاء", stop: "إيقاف", newConversation: "محادثة جديدة", clear: "مسح المحادثة", disableAccompaniment: "إيقاف المرافقة", suggestions: "اقتراحات", jumpLatest: "انتقل إلى أحدث رد", attach: "إرفاق (قريبًا)" },
  },
  en: {
    identity: "Smart Companion", title: "Companion", welcome: "Peace and welcome 🌹\nWelcome to your smart Companion.\nHow can I help today?",
    returningWelcome: "Welcome back.\nWould you like me to accompany you today?", accompany: "Accompany me", continueAlone: "Thanks, I’ll continue alone",
    accompanimentThanks: "I’m glad to accompany you.", intentQuestion: "What is the purpose of your visit?",
    intents: ["Explore the platform", "Buy a product", "Create a design", "Participate or offer a service", "Get help", "Another goal"],
    statuses: { ready: "Ready to help", listening: "Listening", transcribing: "Transcribing your speech", processing: "Understanding your request", responding: "Preparing the response", speaking: "Reading the response", paused: "Speech paused", offline: "Temporarily unavailable", failed: "Could not complete the request" },
    placeholder: "Write a message…", unavailable: "The Companion is temporarily unavailable. Your written conversation remains visible.", microphoneUnavailable: "Voice input is not configured yet.", clearConfirm: "Clear this temporary conversation?", contextPrefix: "Companion understands the current page:",
    labels: { open: "Open Companion", close: "Close Companion", minimize: "Minimize", expand: "Open full page", send: "Send", microphone: "Microphone", cancel: "Cancel", stop: "Stop", newConversation: "New conversation", clear: "Clear conversation", disableAccompaniment: "Disable accompaniment", suggestions: "Suggestions", jumpLatest: "Jump to latest response", attach: "Attach (coming soon)" },
  },
  fr: {
    identity: "Compagnon intelligent", title: "Compagnon", welcome: "Bienvenue 🌹\nBienvenue dans votre compagnon intelligent.\nComment puis-je vous aider aujourd’hui ?",
    returningWelcome: "Heureux de vous revoir.\nSouhaitez-vous être accompagné aujourd’hui ?", accompany: "Accompagnez-moi", continueAlone: "Merci, je continue seul",
    accompanimentThanks: "Je suis heureux de vous accompagner.", intentQuestion: "Quel est le but de votre visite ?",
    intents: ["Découvrir la plateforme", "Acheter un produit", "Créer un design", "Participer ou proposer un service", "Obtenir de l’aide", "Autre objectif"],
    statuses: { ready: "Prêt à vous aider", listening: "J’écoute", transcribing: "Transcription en cours", processing: "Analyse de votre demande", responding: "Préparation de la réponse", speaking: "Lecture de la réponse", paused: "Lecture en pause", offline: "Temporairement indisponible", failed: "La demande n’a pas abouti" },
    placeholder: "Écrivez un message…", unavailable: "Le compagnon est temporairement indisponible. La conversation écrite reste visible.", microphoneUnavailable: "L’entrée vocale n’est pas encore configurée.", clearConfirm: "Effacer cette conversation temporaire ?", contextPrefix: "Le compagnon comprend la page actuelle :",
    labels: { open: "Ouvrir le compagnon", close: "Fermer", minimize: "Réduire", expand: "Ouvrir la page complète", send: "Envoyer", microphone: "Microphone", cancel: "Annuler", stop: "Arrêter", newConversation: "Nouvelle conversation", clear: "Effacer", disableAccompaniment: "Désactiver l’accompagnement", suggestions: "Suggestions", jumpLatest: "Aller à la dernière réponse", attach: "Joindre (bientôt)" },
  },
  de: {
    identity: "Intelligenter Begleiter", title: "Begleiter", welcome: "Willkommen 🌹\nWillkommen beim intelligenten Begleiter.\nWie kann ich heute helfen?",
    returningWelcome: "Willkommen zurück.\nSoll ich Sie heute begleiten?", accompany: "Begleite mich", continueAlone: "Danke, ich mache allein weiter",
    accompanimentThanks: "Ich begleite Sie gern.", intentQuestion: "Was ist das Ziel Ihres Besuchs?",
    intents: ["Plattform kennenlernen", "Produkt kaufen", "Design erstellen", "Teilnehmen oder Dienst anbieten", "Hilfe erhalten", "Anderes Ziel"],
    statuses: { ready: "Bereit zu helfen", listening: "Ich höre zu", transcribing: "Sprache wird transkribiert", processing: "Anfrage wird verstanden", responding: "Antwort wird vorbereitet", speaking: "Antwort wird vorgelesen", paused: "Sprachausgabe pausiert", offline: "Vorübergehend nicht verfügbar", failed: "Anfrage konnte nicht abgeschlossen werden" },
    placeholder: "Nachricht schreiben…", unavailable: "Der Begleiter ist vorübergehend nicht verfügbar. Der schriftliche Verlauf bleibt sichtbar.", microphoneUnavailable: "Spracheingabe ist noch nicht konfiguriert.", clearConfirm: "Temporäre Unterhaltung löschen?", contextPrefix: "Der Begleiter versteht die aktuelle Seite:",
    labels: { open: "Begleiter öffnen", close: "Schließen", minimize: "Minimieren", expand: "Ganze Seite öffnen", send: "Senden", microphone: "Mikrofon", cancel: "Abbrechen", stop: "Stoppen", newConversation: "Neue Unterhaltung", clear: "Unterhaltung löschen", disableAccompaniment: "Begleitung deaktivieren", suggestions: "Vorschläge", jumpLatest: "Zur neuesten Antwort", attach: "Anhängen (demnächst)" },
  },
};

export const suggestionsForContext = (page: ConversationPageContext, locale: CompanionLocale) => {
  const ar = locale === "ar";
  const path = page.pageId.toLowerCase();
  if (path.includes("product") || path.includes("market")) return ar ? ["اشرح لي هذا المنتج", "ما خياراته؟", "ساعدني في الاختيار"] : ["Explain this product", "What are its options?", "Help me choose"];
  if (path.includes("settings")) return ar ? ["اشرح هذه الإعدادات", "ما الخيار المناسب؟", "افتح الإعدادات"] : ["Explain these settings", "Which option is right?", "Open settings"];
  if (path.includes("design") || path.includes("studio")) return ar ? ["ساعدني في التصميم", "اقترح ألوانًا", "راجع التصميم"] : ["Help with this design", "Suggest colors", "Review the design"];
  return ar ? ["اشرح هذه الصفحة", "اقرأ هذه الصفحة", "ساعدني"] : ["Explain this page", "Read this page", "Help me"];
};

export const isAccompanimentActive = (mode: AccompanimentMode) => mode === "enabled";

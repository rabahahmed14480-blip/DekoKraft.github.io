import type { Lang } from "./types.ts";

export type WelcomeCardKey =
  | "home"
  | "market"
  | "artisans"
  | "join"
  | "login"
  | "about"
  | "comments"
  | "suggestions"
  | "services"
  | "studio";

export type WelcomeMessages = {
  title: string;
  subtitle: string;
  introTitle: string;
  introTagline: string;
  skip: string;
  replay: string;
  comingSoon: string;
  navigationLabel: string;
  cards: Record<WelcomeCardKey, string>;
};

export const welcomeTranslations: Record<Lang, WelcomeMessages> = {
  ar: {
    title: "مرحبًا بكم في DekoKraft",
    subtitle: "منصة تجمع الإبداع، الحرف، التعلم والخدمات في مساحة واحدة.",
    introTitle: "مرحبًا بكم في DekoKraft",
    introTagline: "مساحة للإبداع والحِرف والمشاركة",
    skip: "تخطي",
    replay: "إعادة تشغيل الترحيب",
    comingSoon: "هذه الصفحة قيد التجهيز.",
    navigationLabel: "بوابة DekoKraft الرئيسية",
    cards: {
      home: "من نحن",
      market: "السوق",
      artisans: "استكشف أعمال الحرفيين",
      join: "انضم كمشارك",
      login: "تسجيل الدخول",
      about: "من نحن",
      comments: "التعليقات والاقتراحات",
      suggestions: "اقتراحات",
      services: "مركز الخدمات",
      studio: "الاستوديوهات الذكية",
    },
  },
  de: {
    title: "Willkommen bei DekoKraft",
    subtitle: "Eine Plattform für Kreativität, Handwerk, Lernen und Dienstleistungen.",
    introTitle: "Willkommen bei DekoKraft",
    introTagline: "Ein Raum für Kreativität, Handwerk und Gemeinschaft",
    skip: "Überspringen",
    replay: "Begrüßung wiederholen",
    comingSoon: "Diese Seite wird vorbereitet.",
    navigationLabel: "DekoKraft-Willkommensportal",
    cards: {
      home: "Startseite",
      market: "Marktplatz",
      artisans: "Werke der Kunsthandwerker",
      join: "Als Anbieter mitmachen",
      login: "Anmelden",
      about: "Über uns",
      comments: "Kommentare",
      suggestions: "Vorschläge",
      services: "Servicezentrum",
      studio: "Intelligente Studios",
    },
  },
  en: {
    title: "Welcome to DekoKraft",
    subtitle: "One space for creativity, crafts, learning, and services.",
    introTitle: "Welcome to DekoKraft",
    introTagline: "A space for creativity, crafts, and participation",
    skip: "Skip",
    replay: "Replay welcome",
    comingSoon: "This page is being prepared.",
    navigationLabel: "DekoKraft welcome portal",
    cards: {
      home: "Home",
      market: "Marketplace",
      artisans: "Explore artisan work",
      join: "Join as a seller",
      login: "Sign in",
      about: "About us",
      comments: "Comments",
      suggestions: "Suggestions",
      services: "Service center",
      studio: "Smart studios",
    },
  },
  fr: {
    title: "Bienvenue chez DekoKraft",
    subtitle: "Un espace dédié à la créativité, à l’artisanat, à l’apprentissage et aux services.",
    introTitle: "Bienvenue chez DekoKraft",
    introTagline: "Un espace de créativité, d’artisanat et de participation",
    skip: "Passer",
    replay: "Rejouer l’accueil",
    comingSoon: "Cette page est en préparation.",
    navigationLabel: "Portail d’accueil DekoKraft",
    cards: {
      home: "Accueil",
      market: "Marché",
      artisans: "Découvrir les artisans",
      join: "Devenir vendeur",
      login: "Connexion",
      about: "À propos",
      comments: "Commentaires",
      suggestions: "Suggestions",
      services: "Centre de services",
      studio: "Studios intelligents",
    },
  },
};

import type { PageRegistration, RegisteredPageType } from "./types.ts";

export class PageContextRegistry {
  private registrations = new Map<string, PageRegistration>();
  register(registration: PageRegistration) { if (this.registrations.has(registration.id)) throw new Error("PAGE_CONTEXT_REGISTRATION_DUPLICATE"); this.registrations.set(registration.id, registration); return this; }
  resolve(route: string) { return [...this.registrations.values()].find(item => item.match(route)); }
  list() { return [...this.registrations.values()]; }
}

const names: Record<RegisteredPageType, [string, string, string, string]> = {
  home: ["الرئيسية", "Home", "Accueil", "Startseite"], landing: ["صفحة ترحيبية", "Landing", "Accueil", "Landingpage"],
  product: ["المنتج", "Product", "Produit", "Produkt"], product_category: ["فئة المنتجات", "Product category", "Catégorie", "Produktkategorie"],
  design_workspace: ["مساحة التصميم", "Design workspace", "Espace de conception", "Design-Arbeitsbereich"], project: ["المشروع", "Project", "Projet", "Projekt"],
  shopping_cart: ["السلة", "Shopping cart", "Panier", "Warenkorb"], checkout: ["الدفع", "Checkout", "Paiement", "Kasse"],
  knowledge_article: ["مقال معرفي", "Knowledge article", "Article de connaissance", "Wissensartikel"], blog: ["المدونة", "Blog", "Blog", "Blog"],
  user_profile: ["الملف الشخصي", "User profile", "Profil utilisateur", "Benutzerprofil"], organization: ["المنظمة", "Organization", "Organisation", "Organisation"],
  dashboard: ["لوحة التحكم", "Dashboard", "Tableau de bord", "Dashboard"], settings: ["الإعدادات", "Settings", "Paramètres", "Einstellungen"],
  administration: ["الإدارة", "Administration", "Administration", "Administration"], reports: ["التقارير", "Reports", "Rapports", "Berichte"],
  search_results: ["نتائج البحث", "Search results", "Résultats", "Suchergebnisse"], support: ["الدعم", "Support", "Assistance", "Support"],
  help: ["المساعدة", "Help", "Aide", "Hilfe"], not_found: ["الصفحة غير موجودة", "Page not found", "Page introuvable", "Seite nicht gefunden"],
};
const title = (type: RegisteredPageType) => ({ ar: names[type][0], en: names[type][1], fr: names[type][2], de: names[type][3] });
const registration = (id: string, type: RegisteredPageType, match: (route: string) => boolean): PageRegistration => ({ id, type, title: title(type), match });

export const pageContextRegistry = new PageContextRegistry()
  .register(registration("home", "home", route => route === "/" || route === "/home"))
  .register(registration("checkout", "checkout", route => /\/checkout(\/|$)/.test(route)))
  .register(registration("cart", "shopping_cart", route => /\/(cart|basket)(\/|$)/.test(route)))
  .register(registration("search", "search_results", route => /\/(search|market)(\/|$)/.test(route) && route.includes("?")))
  .register(registration("product", "product", route => /\/(product|products)\//.test(route) || (/^\/[^/]+\/[^/]+$/.test(route) && !/^\/(admin|participant|seller|info|studio)\//.test(route))))
  .register(registration("category", "product_category", route => /^\/(candles|gift|kids|services)(\/|$)/.test(route)))
  .register(registration("design", "design_workspace", route => /\/(studio|design|page-designs)(\/|$)/.test(route)))
  .register(registration("knowledge", "knowledge_article", route => /\/knowledge\/[^/]+/.test(route)))
  .register(registration("blog", "blog", route => /\/blog(\/|$)/.test(route)))
  .register(registration("profile", "user_profile", route => /\/(profile|account)(\/|$)/.test(route)))
  .register(registration("organization", "organization", route => /\/organization(\/|$)/.test(route)))
  .register(registration("settings", "settings", route => /\/settings(\/|$)/.test(route)))
  .register(registration("reports", "reports", route => /\/(reports|analytics|finance|financial|earnings)(\/|$)/.test(route)))
  .register(registration("support", "support", route => /\/support(\/|$)/.test(route)))
  .register(registration("help", "help", route => /\/(help|about|info)(\/|$)/.test(route)))
  .register(registration("admin", "administration", route => /^\/admin(\/|$)/.test(route)))
  .register(registration("dashboard", "dashboard", route => /\/(participant|seller|dashboard)(\/|$)/.test(route)))
  .register(registration("project", "project", route => /\/project(\/|$)/.test(route)))
  .register(registration("not-found", "not_found", route => route === "/404" || route === "/_not-found"))
  .register(registration("landing", "landing", () => true));

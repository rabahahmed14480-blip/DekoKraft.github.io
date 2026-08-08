"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown, ExternalLink, Maximize2, MessageCircle, Mic, Minimize2, Paperclip, Pause, Play, RotateCcw, Send, Square, X } from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { companionContent, type CompanionLocale } from "../../../lib/companion/ui/content";
import { ConversationUIController, conversationHttpTransport } from "../../../lib/companion/ui/controller";
import type { ConversationMessage, ConversationPageContext } from "../../../lib/companion/types";
import type { CompanionUIStatus, ConversationUIViewModel, TrustedConversationAction } from "../../../lib/companion/ui/types";
import { usePageContextSnapshot } from "./PageContextProvider";

type CompanionContextValue = { controller: ConversationUIController; view: ConversationUIViewModel; content: typeof companionContent.ar; locale: CompanionLocale };
const CompanionContext = createContext<CompanionContextValue | null>(null);

function pageType(pathname: string): ConversationPageContext["pageType"] { return pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/participant") ? "participant" : "public"; }

export function CompanionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const pageSnapshot = usePageContextSnapshot();
  const locale = lang as CompanionLocale;
  const [controller] = useState(() => new ConversationUIController({ transport: conversationHttpTransport, page: { pageId: "/", pageType: "public", locale: "ar" } }));
  const view = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  useEffect(() => { void controller.initialize().catch(() => controller.reportUnavailable()); }, [controller]);
  useEffect(() => { controller.setPageContext({ pageId: pageSnapshot.route || pathname || "/", pageType: pageType(pathname || "/"), locale }); }, [controller, locale, pageSnapshot, pathname]);
  return <CompanionContext.Provider value={{ controller, view, content: companionContent[locale], locale }}>{children}{view.surfaceMode !== "page" && <CompanionPanel />}</CompanionContext.Provider>;
}

export function useCompanion() {
  const value = useContext(CompanionContext);
  if (!value) throw new Error("useCompanion must be used inside CompanionProvider");
  return value;
}

export function CompanionLauncher({ className = "" }: { className?: string }) {
  const { controller, view, content } = useCompanion();
  return <button type="button" className={`companionLauncher ${className}`} onClick={() => controller.setSurface("docked")} aria-label={content.labels.open} aria-haspopup="dialog" aria-expanded={view.isOpen}>
    <MessageCircle aria-hidden /><span className="companionLauncherLabel">{content.title}</span>
    {view.unreadCount > 0 && <span className="companionUnread" aria-label={`${view.unreadCount}`}>{view.unreadCount}</span>}
    {(view.isListening || view.isSpeaking || view.isProcessing) && <span className="companionActivity" aria-hidden />}
  </button>;
}

export function CompanionHeader({ fullPage = false }: { fullPage?: boolean }) {
  const { controller, view, content } = useCompanion();
  return <header className="companionHeader"><div><span className="companionIdentityIcon" aria-hidden><MessageCircle /></span><div><h1 tabIndex={-1}>{content.identity}</h1><ConversationStatus status={view.status} /></div></div><nav aria-label={content.title}>
    {!fullPage && <button type="button" onClick={() => controller.setSurface("compact", false)} aria-label={content.labels.minimize}><Minimize2 aria-hidden /></button>}
    {!fullPage && <Link href="/companion" onClick={() => controller.setSurface("page")} aria-label={content.labels.expand}><Maximize2 aria-hidden /></Link>}
    <button type="button" onClick={() => controller.close()} aria-label={content.labels.close}><X aria-hidden /></button>
  </nav></header>;
}

export function ConversationStatus({ status }: { status: CompanionUIStatus }) {
  const { content } = useCompanion();
  return <p className="companionStatus" data-status={status} role="status" aria-live="polite"><span aria-hidden />{content.statuses[status]}</p>;
}

function safeMessageBlocks(text: string) {
  const parts = text.replace(/<[^>]*>/g, "").split(/(```[\s\S]*?```)/g);
  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("```")) return <pre key={index}><code>{part.replace(/^```[^\n]*\n?|\n?```$/g, "")}</code></pre>;
    const lines = part.split("\n");
    return <div key={index}>{lines.map((line, lineIndex) => {
      if (/^\s*[-*]\s+/.test(line)) return <ul key={lineIndex}><li>{renderSafeInline(line.replace(/^\s*[-*]\s+/, ""))}</li></ul>;
      if (/^#{1,6}\s+/.test(line)) return <strong key={lineIndex}>{renderSafeInline(line.replace(/^#{1,6}\s+/, ""))}</strong>;
      return line ? <p key={lineIndex}>{renderSafeInline(line)}</p> : <br key={lineIndex} />;
    })}</div>;
  });
}

function renderSafeInline(text: string) {
  const pieces = text.split(/(\[[^\]]+\]\(\/[^)]+\))/g);
  return pieces.map((piece, index) => {
    const match = piece.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/);
    return match ? <Link key={index} href={match[2]}>{match[1]}</Link> : piece;
  });
}

export function SpeechPlaybackControl({ message }: { message: ConversationMessage }) {
  const { controller, view, content } = useCompanion();
  const active = view.isSpeaking;
  return <div className="companionSpeechActions" aria-label="Speech playback">
    <button type="button" onClick={() => active ? controller.pauseSpeech() : view.status === "paused" ? controller.resumeSpeech() : void controller.playSpeech(message)} aria-label={active ? "Pause speech" : "Play speech"}>{active ? <Pause aria-hidden /> : <Play aria-hidden />}</button>
    {view.canStopSpeech && <button type="button" onClick={() => controller.stopSpeech()} aria-label={content.labels.stop}><Square aria-hidden /></button>}
    <button type="button" onClick={() => void controller.playSpeech(message)} aria-label="Replay speech"><RotateCcw aria-hidden /></button>
  </div>;
}

export function ConversationMessageItem({ message }: { message: ConversationMessage }) {
  const direction = /[\u0600-\u06ff]/.test(message.text) ? "rtl" : "ltr";
  return <article className={`companionMessage companionMessage--${message.sender}`} dir={direction} aria-label={message.sender}>
    <div className="companionMessageText">{safeMessageBlocks(message.text)}</div>
    <footer><time dateTime={message.timestamp}>{new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(message.timestamp))}</time>{message.sender === "companion" && <SpeechPlaybackControl message={message} />}</footer>
  </article>;
}

export function ConversationMessageList() {
  const { view, content } = useCompanion();
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  useEffect(() => { const node = listRef.current; if (!node) return; if (nearBottom.current) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" }); else setShowLatest(true); }, [view.messages]);
  return <div className="companionMessagesWrap"><div ref={listRef} className="companionMessages" role="log" aria-live="polite" aria-relevant="additions" onScroll={(event) => { const node = event.currentTarget; nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100; if (nearBottom.current) setShowLatest(false); }}>
    {view.messages.length === 0 ? <div className="companionEmptyState"><p>{content.welcome}</p></div> : view.messages.map(message => <ConversationMessageItem key={message.id} message={message} />)}
  </div>{showLatest && <button className="companionJumpLatest" type="button" onClick={() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); setShowLatest(false); }}>{content.labels.jumpLatest}</button>}</div>;
}

export function VoiceInputControl() {
  const { controller, view, content } = useCompanion();
  const active = view.microphoneState === "listening" || view.microphoneState === "requesting_permission";
  return <button type="button" className="companionMic" data-active={active} onClick={() => active ? controller.cancelMicrophone() : void controller.startMicrophone()} aria-label={active ? content.labels.cancel : content.labels.microphone} aria-pressed={active}><Mic aria-hidden /></button>;
}

export function ConversationComposer() {
  const { controller, view, content } = useCompanion();
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey && !window.matchMedia("(max-width: 720px)").matches) { event.preventDefault(); void controller.submit(); } };
  return <form className="conversationComposer" onSubmit={(event) => { event.preventDefault(); void controller.submit(); }}>
    {view.partialTranscript && <p className="partialTranscript" aria-live="polite">{view.partialTranscript}</p>}
    <textarea value={view.draftText} onChange={event => controller.setDraft(event.target.value)} onKeyDown={onKeyDown} placeholder={content.placeholder} maxLength={10_000} rows={2} dir="auto" aria-label={content.placeholder} />
    <div className="composerControls"><button type="button" disabled aria-label={content.labels.attach} title={content.labels.attach}><Paperclip aria-hidden /></button><VoiceInputControl />{view.isProcessing ? <button type="button" onClick={() => controller.stopGeneration()} aria-label={content.labels.cancel}><Square aria-hidden /></button> : <button className="composerSend" type="submit" disabled={!view.canSend} aria-label={content.labels.send}><Send aria-hidden /></button>}</div>
  </form>;
}

export function ContextSuggestionList() {
  const { controller, view, content } = useCompanion();
  return <section className="companionSuggestions" aria-label={content.labels.suggestions}><div>{view.suggestions.map(value => <button key={value} type="button" onClick={() => void controller.selectSuggestion(value)}>{value}</button>)}</div></section>;
}

export function CompanionWelcomeCard() {
  const { view, content } = useCompanion();
  if (view.accompanimentMode !== "undecided") return null;
  return <section className="companionWelcomeCard"><p>{content.welcome}</p><AccompanimentChoice /></section>;
}

export function AccompanimentChoice() {
  const { controller, content } = useCompanion();
  return <div className="accompanimentChoice"><button type="button" onClick={() => controller.chooseAccompaniment("enabled")}>{content.accompany}</button><button type="button" onClick={() => controller.chooseAccompaniment("disabled")}>{content.continueAlone}</button></div>;
}

export function VisitIntentSelector() {
  const { controller, view, content } = useCompanion();
  if (view.accompanimentMode !== "enabled") return null;
  return <section className="visitIntent"><p>{content.accompanimentThanks} {content.intentQuestion}</p><div>{content.intents.map(intent => <button key={intent} type="button" onClick={() => controller.setDraft(intent)}>{intent}</button>)}</div></section>;
}

export function ConversationSessionMenu() {
  const { controller, view, content } = useCompanion();
  const [open, setOpen] = useState(false);
  return <div className="companionSessionMenu"><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open}>{content.labels.newConversation}<ChevronDown aria-hidden /></button>{open && <div role="menu"><button role="menuitem" type="button" onClick={() => { if (!view.messages.length || window.confirm(content.clearConfirm)) void controller.newConversation(); setOpen(false); }}>{content.labels.newConversation}</button><button role="menuitem" type="button" onClick={() => { if (!view.messages.length || window.confirm(content.clearConfirm)) void controller.clearConversation(); setOpen(false); }}>{content.labels.clear}</button><button role="menuitem" type="button" onClick={() => { controller.chooseAccompaniment("disabled"); setOpen(false); }}>{content.labels.disableAccompaniment}</button></div>}</div>;
}

function TrustedActions({ actions }: { actions: TrustedConversationAction[] }) {
  const { controller } = useCompanion();
  const router = useRouter();
  return <div className="companionTrustedActions">{actions.filter(action => controller.validateAction(action)).map(action => <button type="button" key={action.id} onClick={async() => {
    if (!action.request) return;
    let result = await controller.executeAction(action, false);
    if (result.status === "confirmation_required") {
      if (!window.confirm(action.label)) return;
      result = await controller.executeAction(action, true);
    }
    if (result.success && result.output?.directive === "navigate" && typeof result.output.href === "string") router.push(result.output.href);
  }}>{action.label}<ExternalLink aria-hidden /></button>)}</div>;
}

export function CompanionConversation({ fullPage = false }: { fullPage?: boolean }) {
  const { controller, view, content } = useCompanion();
  return <div className="companionConversation"><CompanionHeader fullPage={fullPage}/><div className="companionContext"><label><input type="checkbox" checked={view.contextEnabled} onChange={event => controller.setContextEnabled(event.target.checked)} />{content.contextPrefix} <b>{view.currentPageContext.pageType}</b></label><ConversationSessionMenu /></div>
    <CompanionWelcomeCard /><VisitIntentSelector /><ConversationMessageList />{view.error && <p className="companionError" role="alert">{view.error === "microphone_unavailable" ? content.microphoneUnavailable : content.unavailable}</p>}<TrustedActions actions={view.actions}/><ContextSuggestionList /><ConversationComposer />
  </div>;
}

export function CompanionPanel() {
  const { view, content } = useCompanion();
  if (!view.isOpen) return null;
  return <aside className="companionPanel" role="dialog" aria-modal="false" aria-label={content.identity} data-mode={view.surfaceMode}><CompanionConversation /></aside>;
}

export function CompanionMobileSheet() {
  return <div className="companionMobileSheet"><CompanionConversation /></div>;
}

export function CompanionPage() {
  const { controller } = useCompanion();
  useEffect(() => { controller.setSurface("page"); return () => controller.setSurface("compact", false); }, [controller]);
  return <main className="companionFullPage"><CompanionConversation fullPage /></main>;
}

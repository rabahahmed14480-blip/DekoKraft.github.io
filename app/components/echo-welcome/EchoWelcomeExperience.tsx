"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { completeWelcome, isWelcomeCompleted } from "../../../lib/welcome/welcomeStorage";
import styles from "./EchoWelcomeExperience.module.css";

const WELCOME_AUDIO_PATH = "/audio/echo-welcome.mp3";

async function playWelcomeSound() {
  try {
    const response = await fetch(WELCOME_AUDIO_PATH, { method: "HEAD" });
    if (!response.ok) return;
    await new Audio(WELCOME_AUDIO_PATH).play();
  } catch {
    // Audio is optional.
  }
}

export default function EchoWelcomeExperience() {
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    try {
      setWelcomeOpen(!isWelcomeCompleted(window.localStorage));
    } catch {
      setWelcomeOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!welcomeOpen) return;
    firstActionRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      try {
        completeWelcome(window.localStorage);
      } catch {
        // Storage can be unavailable in privacy-restricted environments.
      }
      setWelcomeOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [welcomeOpen]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      const panelWidth = Math.min(390, window.innerWidth - 24);
      const left = Math.max(8, Math.min(event.clientX - dragRef.current.offsetX, window.innerWidth - panelWidth - 8));
      const top = Math.max(8, Math.min(event.clientY - dragRef.current.offsetY, window.innerHeight - 70));
      setPosition({ left, top });
    };
    const stopDragging = () => { dragRef.current = null; };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", stopDragging);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", stopDragging);
    };
  }, []);

  function persistCompletion() {
    try {
      completeWelcome(window.localStorage);
    } catch {
      // Storage can be unavailable in privacy-restricted environments.
    }
  }

  function dismissWelcome() {
    persistCompletion();
    setWelcomeOpen(false);
  }

  function openEcho() {
    persistCompletion();
    setLeaving(true);
    void playWelcomeSound();
    window.setTimeout(() => {
      setWelcomeOpen(false);
      setLeaving(false);
      setPanelOpen(true);
    }, 180);
  }

  function startDrag(event: React.PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    const panel = event.currentTarget.parentElement;
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    dragRef.current = { offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top };
  }

  return (
    <>
      {welcomeOpen ? (
        <div className={`${styles.backdrop} ${leaving ? styles.backdropLeaving : ""}`}>
          <section
            className={styles.welcome}
            role="dialog"
            aria-modal="true"
            aria-labelledby="echo-welcome-title"
            aria-describedby="echo-welcome-description"
            dir="rtl"
          >
            <Image className={styles.logo} src="/logo-dekokraft-600.webp" alt="DekoKraft" width={210} height={64} priority />
            <h1 id="echo-welcome-title">مرحبًا بك في DekoKraft</h1>
            <p id="echo-welcome-description" className={styles.description}>
              {"يسعدنا انضمامك إلينا.\nدع Echo يساعدك أثناء رحلتك داخل المنصة."}
            </p>
            <div className={styles.actions}>
              <button ref={firstActionRef} type="button" className={`${styles.action} ${styles.actionPrimary}`} onClick={() => console.log("Start Participation clicked")}>
                🚀 ابدأ المشاركة
              </button>
              <button type="button" className={styles.action} onClick={() => console.log("Quick Tour clicked")}>
                🎯 جولة سريعة
              </button>
              <button type="button" className={styles.action} onClick={openEcho}>
                💬 اسأل Echo
              </button>
              <button type="button" className={styles.action} onClick={dismissWelcome}>
                😊 لاحقًا
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {panelOpen ? (
        <section
          className={`${styles.panel} ${minimized ? styles.panelMinimized : ""}`}
          style={position ? { left: position.left, top: position.top, right: "auto", bottom: "auto" } : undefined}
          role="dialog"
          aria-label="Echo"
          dir="rtl"
        >
          <header className={styles.panelHeader} onPointerDown={startDrag}>
            <div className={styles.panelTitle}><span className={styles.echoMark}>E</span><span>Echo</span></div>
            <div className={styles.panelControls}>
              <button type="button" className={styles.iconButton} aria-label={minimized ? "توسيع نافذة Echo" : "تصغير نافذة Echo"} onClick={() => setMinimized(value => !value)}>
                {minimized ? "□" : "−"}
              </button>
              <button type="button" className={styles.iconButton} aria-label="إغلاق نافذة Echo" onClick={() => setPanelOpen(false)}>×</button>
            </div>
          </header>
          {!minimized ? (
            <>
              <div className={styles.panelBody}>
                <p><strong>مرحبًا 👋</strong></p>
                <p>وشكرًا لاختيارك Echo.</p>
                <p>سأكون مرافقك أثناء استخدام DekoKraft.</p>
                <p>يمكنك التحدث معي من خلال زر 🎤 الموجود في الشريط أو القائمة.</p>
                <p>أو الكتابة في مربع الرسائل.</p>
                <p>وسأجيبك كتابةً أو صوتيًا حسب إعداداتك.</p>
              </div>
              <div className={styles.composer} aria-label="مربع رسائل Echo">
                <button type="button" className={styles.iconButton} disabled aria-label="إرفاق ملف">📎</button>
                <button type="button" className={styles.iconButton} disabled aria-label="تسجيل صوتي">🎤</button>
                <input className={styles.input} type="text" placeholder="اكتب رسالتك..." disabled aria-label="اكتب رسالتك" />
                <button type="button" className={styles.send} disabled aria-label="إرسال الرسالة">إرسال</button>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useProgress } from "@react-three/drei";
import type { SiteContent } from "@/content/schema";
import { bump, ease, journey, lerp, range, STAGES } from "./journey/store";
import type { Scene } from "./journey/JourneyCanvas";
import { Portfolio } from "./portfolio/Portfolio";

gsap.registerPlugin(ScrollTrigger);

const JourneyCanvas = dynamic(() => import("./journey/JourneyCanvas"), { ssr: false });

type Mode = "journey" | "portfolio";
const OPEN_AT = 0.995;

const STOPS = [
  { label: "Earth", at: 0 },
  { label: "India", at: STAGES.india[0] + 0.04 },
  { label: "West Bengal", at: STAGES.bengal[0] },
  { label: "Kharagpur", at: STAGES.kgp[0] },
  { label: "Hall", at: STAGES.toCampus },
  { label: "Room", at: STAGES.toRoom },
  { label: "Laptop", at: STAGES.screen[0] },
];

function formatAltitude(m: number) {
  if (m > 10000) return `${Math.round(m / 1000).toLocaleString("en-IN")} km`;
  return `${Math.max(1, Math.round(m)).toLocaleString("en-IN")} m`;
}

export default function Experience({ content }: { content: SiteContent }) {
  const [mode, setMode] = useState<Mode>("journey");
  const [scene, setScene] = useState<Scene>("earth");
  const lenisRef = useRef<Lenis | null>(null);
  const modeRef = useRef<Mode>("journey");
  const veilRef = useRef<HTMLDivElement>(null);

  const { firstName, headline } = content.profile;
  const { hallName, roomLabel, campusName } = content.journey;

  const captions = [
    { a: -1, b: 0.055, eyebrow: "Hello, world", title: `I'm ${firstName}.`, sub: headline },
    { a: 0.07, b: 0.22, eyebrow: "20.59° N · 78.96° E", title: "India", sub: "Where the story begins" },
    { a: 0.245, b: 0.355, eyebrow: "22.98° N · 87.85° E", title: "West Bengal", sub: "The land of the Hooghly" },
    { a: 0.365, b: 0.47, eyebrow: "22.31° N · 87.31° E", title: campusName, sub: "The first IIT · est. 1951" },
    { a: 0.505, b: 0.645, eyebrow: "Hall of Residence", title: hallName, sub: "Home, for five years of dual degree" },
    { a: 0.69, b: 0.815, eyebrow: "Knock knock", title: roomLabel, sub: "Where the late-night builds happen" },
    { a: 0.825, b: 0.885, eyebrow: "", title: "Let me show you my work", sub: "" },
  ];

  // --- Smooth scrolling shared by both modes --------------------------------
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: true, syncTouchLerp: 0.08 });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  const openPortfolio = useCallback(() => {
    if (modeRef.current === "portfolio") return;
    modeRef.current = "portfolio";
    setMode("portfolio");
  }, []);

  useLayoutEffect(() => {
    history.scrollRestoration = "manual";
    ScrollTrigger.refresh();
    const reset = () => {
      lenisRef.current?.resize();
      lenisRef.current?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    };
    reset();
    if (mode === "journey") journey.p = 0;
    const raf = requestAnimationFrame(reset);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const backToEarth = useCallback(() => {
    const veil = veilRef.current;
    gsap.to(veil, {
      opacity: 1,
      duration: 0.6,
      ease: "power2.in",
      onComplete: () => {
        lenisRef.current?.scrollTo(0, { immediate: true, force: true });
        modeRef.current = "journey";
        setMode("journey");
        gsap.to(veil, { opacity: 0, duration: 1.1, delay: 0.25, ease: "power2.out" });
      },
    });
  }, []);

  const skip = useCallback(() => {
    const veil = veilRef.current;
    gsap.to(veil, { opacity: 1, duration: 0.45, onComplete: () => {
      openPortfolio();
      gsap.to(veil, { opacity: 0, duration: 0.8, delay: 0.1 });
    } });
  }, [openPortfolio]);

  // --- Per-frame DOM updates for the journey overlay -------------------------
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const whiteRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<(HTMLLIElement | null)[]>([]);
  const altRef = useRef<HTMLSpanElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "journey") return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const lenis = lenisRef.current;
      const p = lenis && lenis.limit > 0 ? Math.min(1, lenis.scroll / lenis.limit) : 0;
      journey.p = p;

      captions.forEach((c, i) => {
        const el = captionRefs.current[i];
        if (!el) return;
        const fade = Math.min((c.b - c.a) * 0.25, 0.03);
        const o = Math.min(range(p, c.a, c.a + fade), 1 - range(p, c.b - fade, c.b));
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(1 - o) * (p < (c.a + c.b) / 2 ? 30 : -30)}px, 0)`;
        el.style.filter = `blur(${(1 - o) * 10}px)`;
        el.style.visibility = o <= 0.001 ? "hidden" : "visible";
      });
      if (whiteRef.current) whiteRef.current.style.opacity = String(bump(p, 0.45, 0.53));
      if (darkRef.current) darkRef.current.style.opacity = String(bump(p, 0.655, 0.695));
      if (hintRef.current) hintRef.current.style.opacity = String(1 - range(p, 0, 0.02));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      if (hudRef.current) hudRef.current.style.opacity = String(1 - ease(p, 0.915, 0.95));
      if (altRef.current) altRef.current.textContent = formatAltitude(journey.altitude);
      STOPS.forEach((s, i) => {
        const el = stopRefs.current[i];
        const next = STOPS[i + 1]?.at ?? 2;
        el?.classList.toggle("is-active", p >= s.at - 0.001 && p < next);
        el?.classList.toggle("is-past", p >= next);
      });

      // Lay the live site over the laptop screen, then grow it to fill the window.
      const shell = shellRef.current;
      const page = pageRef.current;
      if (shell && page) {
        const show = ease(p, STAGES.screen[0] + 0.012, STAGES.screen[0] + 0.035);
        const s = journey.screen;
        if (!s.ok || show <= 0) {
          shell.style.visibility = "hidden";
        } else {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const grow = ease(p, 0.93, OPEN_AT);
          const x = lerp(s.x, 0, grow);
          const y = lerp(s.y, 0, grow);
          const w = lerp(s.w, vw, grow);
          const h = lerp(s.h, vh, grow);
          const scale = w / vw;
          shell.style.visibility = "visible";
          shell.style.opacity = String(show);
          shell.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          shell.style.width = `${w}px`;
          shell.style.height = `${h}px`;
          shell.style.borderRadius = `${lerp(6, 0, grow)}px`;
          page.style.transform = `scale(${scale})`;
          page.style.height = `${h / scale}px`;
        }
      }

      if (p >= OPEN_AT) openPortfolio();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // captions are derived from content, which is fixed for the page's life
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, openPortfolio]);

  return (
    <>
      {mode === "journey" ? (
        <div className="journey">
          <div className="journey-track" />
          <div className="journey-stage">
            <JourneyCanvas name={content.profile.name} headline={headline} hallName={hallName} onScene={setScene} />
          </div>

          <div ref={whiteRef} className="veil veil-white" />
          <div ref={darkRef} className="veil veil-dark" />

          <div ref={hudRef} className="hud">
          <header className="hud-top">
            <span className="hud-logo">
              {content.profile.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </span>
            <button className="hud-skip" onClick={skip}>
              Skip to portfolio <span aria-hidden>→</span>
            </button>
          </header>

          <div className={`hud-captions scene-${scene}`}>
            {captions.map((c, i) => (
              <div
                key={i}
                ref={(el) => {
                  captionRefs.current[i] = el;
                }}
                className="caption"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                {c.eyebrow && <p className="caption-eyebrow">{c.eyebrow}</p>}
                <h2 className="caption-title">{c.title}</h2>
                {c.sub && <p className="caption-sub">{c.sub}</p>}
              </div>
            ))}
          </div>

          <div ref={hintRef} className="hud-hint">
            <span className="mouse" aria-hidden>
              <span />
            </span>
            Drag the Earth · Scroll to travel
          </div>

          <footer className="hud-bottom">
            <ol className="hud-stops">
              {STOPS.map((s, i) => (
                <li
                  key={s.label}
                  ref={(el) => {
                    stopRefs.current[i] = el;
                  }}
                >
                  {s.label}
                </li>
              ))}
            </ol>
            <div className="hud-alt">
              ALT <span ref={altRef}>—</span>
            </div>
            <div className="hud-bar">
              <div ref={barRef} />
            </div>
          </footer>
          </div>

          <div ref={shellRef} className="screen-shell" aria-hidden>
            <div ref={pageRef} className="screen-page">
              <Portfolio content={content} preview />
            </div>
          </div>

          <Loader />
        </div>
      ) : (
        <Portfolio content={content} onBackToEarth={backToEarth} />
      )}
      <div ref={veilRef} className="veil veil-transition" />
    </>
  );
}

function Loader() {
  const { progress, active } = useProgress();
  const done = !active && progress >= 100;
  return (
    <div className={`loader ${done ? "is-done" : ""}`}>
      <div className="loader-orb" />
      <p>Loading the planet · {Math.round(progress)}%</p>
    </div>
  );
}

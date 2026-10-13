"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { SiteContent } from "@/content/schema";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = { content: SiteContent; preview?: boolean; onBackToEarth?: () => void };

export function Portfolio({ content, preview = false, onBackToEarth }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const visible = content.sections.filter((s) => s.visible);

  useGSAP(
    () => {
      if (preview) return;
      const mm = gsap.matchMedia();

      // Generic reveal for anything tagged data-reveal.
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 60,
          opacity: 0,
          filter: "blur(8px)",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      // Staggered groups.
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        gsap.from(group.children, {
          y: 40,
          opacity: 0,
          scale: 0.96,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: group, start: "top 85%" },
        });
      });
      // Section titles: letters slide up.
      gsap.utils.toArray<HTMLElement>(".section-title .char").forEach((ch, i) => {
        gsap.from(ch, {
          yPercent: 110,
          duration: 0.9,
          ease: "power4.out",
          delay: (i % 30) * 0.025,
          scrollTrigger: { trigger: ch.closest(".section-title"), start: "top 85%" },
        });
      });
      // About paragraphs: words light up as you scroll through them.
      gsap.utils.toArray<HTMLElement>(".scrub-words").forEach((p) => {
        gsap.fromTo(
          p.querySelectorAll(".w"),
          { opacity: 0.15 },
          { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 45%", scrub: true } },
        );
      });
      // Timelines draw their spine.
      gsap.utils.toArray<HTMLElement>(".timeline").forEach((tl) => {
        gsap.fromTo(
          tl.querySelector(".timeline-spine"),
          { scaleY: 0 },
          { scaleY: 1, ease: "none", scrollTrigger: { trigger: tl, start: "top 75%", end: "bottom 60%", scrub: true } },
        );
      });
      // Stat counters.
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = parseFloat(el.dataset.count || "");
        if (Number.isNaN(target)) return;
        const suffix = el.dataset.suffix || "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => (el.textContent = `${Math.round(obj.v)}${suffix}`),
        });
      });
      // Projects: pinned horizontal gallery on wide screens.
      mm.add("(min-width: 900px)", () => {
        const track = root.current?.querySelector<HTMLElement>(".projects-track");
        const wrap = root.current?.querySelector<HTMLElement>(".projects-pin");
        if (!track || !wrap) return;
        const dist = () => track.scrollWidth - window.innerWidth + 80;
        if (dist() <= 0) return;
        gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: wrap, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
      });
      // Hero parallax on the way out.
      gsap.to(".hero-inner", {
        yPercent: -25,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });
      // Progress bar.
      gsap.to(".page-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
    },
    { scope: root, dependencies: [preview] },
  );

  return (
    <div ref={root} className={`portfolio ${preview ? "is-preview" : ""}`}>
      {!preview && <CursorGlow />}
      {!preview && <div className="page-progress" />}
      <Nav content={content} sections={visible} onBackToEarth={onBackToEarth} preview={preview} />
      <Hero content={content} preview={preview} />
      {visible.map((s) => (
        <SectionSwitch key={s.id} id={s.id} title={s.title} content={content} onBackToEarth={onBackToEarth} />
      ))}
      <footer className="site-footer">
        <span>
          © {new Date().getFullYear()} {content.profile.name}
        </span>
        <span>Built from Earth to a study table in {content.journey.hallName}</span>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ chrome */

function Nav({
  content,
  sections,
  onBackToEarth,
  preview,
}: {
  content: SiteContent;
  sections: SiteContent["sections"];
  onBackToEarth?: () => void;
  preview: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <nav className="nav">
      <a href="#top" className="nav-logo">
        {content.profile.name}
      </a>
      <div className={`nav-links ${open ? "is-open" : ""}`}>
        {sections
          .filter((s) => s.id !== "contact")
          .slice(0, 6)
          .map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)}>
              {s.title.split(" ")[0]}
            </a>
          ))}
        <a href="#contact" onClick={() => setOpen(false)}>
          Contact
        </a>
      </div>
      <div className="nav-actions">
        {content.profile.resumeUrl && (
          <a className="btn btn-ghost" href={content.profile.resumeUrl} target="_blank" rel="noreferrer">
            Resume
          </a>
        )}
        {!preview && (
          <button className="btn btn-earth" onClick={onBackToEarth} title="Back to the globe">
            <span className="earth-dot" aria-hidden />
            Back to Earth
          </button>
        )}
        <button className="nav-burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}

function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const xTo = gsap.quickTo(ref.current, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(ref.current, "y", { duration: 0.6, ease: "power3" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return <div ref={ref} className="cursor-glow" aria-hidden />;
}

function Magnetic({ children, className = "", href }: { children: ReactNode; className?: string; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    gsap.to(ref.current, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4 });
  };
  const onLeave = () => gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  return (
    <a ref={ref} href={href} className={className} onPointerMove={onMove} onPointerLeave={onLeave} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  );
}

function SplitTitle({ text }: { text: string }) {
  return (
    <h2 className="section-title" aria-label={text}>
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="word" aria-hidden>
          {word.split("").map((ch, i) => (
            <span key={i} className="char-mask">
              <span className="char">{ch}</span>
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}

function Section({ id, title, kicker, children }: { id: string; title: string; kicker: string; children: ReactNode }) {
  return (
    <section id={id} className="section">
      <div className="section-head">
        <span className="section-kicker">{kicker}</span>
        <SplitTitle text={title} />
      </div>
      {children}
    </section>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="chips" data-stagger>
      {items.filter(Boolean).map((t) => (
        <span key={t} className="chip">
          {t}
        </span>
      ))}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  const list = items.filter(Boolean);
  if (!list.length) return null;
  return (
    <ul className="bullets">
      {list.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ hero */

function Roles({ roles, preview }: { roles: string[]; preview: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (preview || roles.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % roles.length), 2200);
    return () => clearInterval(t);
  }, [roles.length, preview]);
  return (
    <span className="roles">
      <span key={i} className="role">
        {roles[i] ?? ""}
      </span>
    </span>
  );
}

function Hero({ content, preview }: { content: SiteContent; preview: boolean }) {
  const p = content.profile;
  return (
    <header id="top" className="hero">
      <div className="hero-bg" aria-hidden>
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="grid" />
      </div>
      <div className="hero-inner">
        <p className="hero-kicker">
          <span className="pulse" /> {p.availability}
        </p>
        <h1 className="hero-name">
          {p.name.split(" ").map((w, i) => (
            <span key={i} className="hero-word">
              {w}
            </span>
          ))}
        </h1>
        <p className="hero-headline">
          {p.headline} <span className="sep">/</span> <Roles roles={p.roles} preview={preview} />
        </p>
        <p className="hero-tagline">{p.tagline}</p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#projects">
            See my work
          </a>
          {p.resumeUrl ? (
            <a className="btn btn-ghost" href={p.resumeUrl} target="_blank" rel="noreferrer">
              Download resume
            </a>
          ) : (
            <a className="btn btn-ghost" href="#contact">
              Get in touch
            </a>
          )}
        </div>
        <p className="hero-loc">📍 {p.location}</p>
      </div>
      <div className="scroll-cue" aria-hidden>
        <span />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ sections */

function SectionSwitch({
  id,
  title,
  content,
  onBackToEarth,
}: {
  id: string;
  title: string;
  content: SiteContent;
  onBackToEarth?: () => void;
}) {
  switch (id) {
    case "about":
      return <About title={title} content={content} />;
    case "education":
      return (
        <Section id="education" title={title} kicker="01 · Learning">
          <div className="timeline">
            <div className="timeline-spine" />
            {content.education.map((e, i) => (
              <article key={i} className="tl-item" data-reveal>
                <span className="tl-dot" />
                <div className="tl-when">
                  {e.start}
                  {e.start && e.end ? " – " : ""}
                  {e.end}
                </div>
                <div className="card">
                  <h3>{e.institute}</h3>
                  <p className="muted">
                    {e.degree}
                    {e.field ? ` · ${e.field}` : ""}
                  </p>
                  {e.score && <p className="badge">{e.score}</p>}
                  <Bullets items={e.details} />
                </div>
              </article>
            ))}
          </div>
        </Section>
      );
    case "experience":
      if (!content.experience.length) return null;
      return (
        <Section id="experience" title={title} kicker="02 · Work">
          <div className="timeline">
            <div className="timeline-spine" />
            {content.experience.map((e, i) => (
              <article key={i} className="tl-item" data-reveal>
                <span className="tl-dot" />
                <div className="tl-when">
                  {e.start} – {e.end}
                </div>
                <div className="card">
                  <h3>
                    {e.role} <span className="at">@ {e.link ? <a href={e.link} target="_blank" rel="noreferrer">{e.company}</a> : e.company}</span>
                  </h3>
                  <p className="muted">{e.location}</p>
                  <Bullets items={e.points} />
                  <Chips items={e.tech} />
                </div>
              </article>
            ))}
          </div>
        </Section>
      );
    case "projects":
      return <Projects title={title} content={content} />;
    case "research":
      if (!content.research.length) return null;
      return (
        <Section id="research" title={title} kicker="04 · Research">
          <div className="grid-2" data-stagger>
            {content.research.map((r, i) => (
              <article key={i} className="card card-glow">
                <p className="muted small">{r.period}</p>
                <h3>{r.title}</h3>
                {r.guide && <p className="muted">Guide: {r.guide}</p>}
                <p>{r.summary}</p>
                <Bullets items={r.points} />
                {r.link && (
                  <a className="link-arrow" href={r.link} target="_blank" rel="noreferrer">
                    Read more →
                  </a>
                )}
              </article>
            ))}
          </div>
        </Section>
      );
    case "skills":
      return <Skills title={title} content={content} />;
    case "achievements":
      if (!content.achievements.length) return null;
      return (
        <Section id="achievements" title={title} kicker="06 · Milestones">
          <div className="grid-3" data-stagger>
            {content.achievements.map((a, i) => (
              <article key={i} className="card trophy">
                <span className="trophy-year">{a.year}</span>
                <h3>{a.title}</h3>
                <p className="muted">{a.detail}</p>
              </article>
            ))}
          </div>
        </Section>
      );
    case "positions":
      if (!content.positions.length) return null;
      return (
        <Section id="positions" title={title} kicker="07 · Leadership">
          <div className="rows">
            {content.positions.map((p, i) => (
              <article key={i} className="row" data-reveal>
                <div>
                  <h3>{p.role}</h3>
                  <p className="muted">{p.organisation}</p>
                </div>
                <div>
                  <p className="muted small">{p.period}</p>
                  <Bullets items={p.points} />
                </div>
              </article>
            ))}
          </div>
        </Section>
      );
    case "coursework":
      return (
        <Section id="coursework" title={title} kicker="08 · Foundations">
          <Chips items={content.coursework} />
          {content.certifications.length > 0 && (
            <div className="grid-3 mt" data-stagger>
              {content.certifications.map((c, i) => (
                <a key={i} className="card cert" href={c.link || undefined} target="_blank" rel="noreferrer">
                  <h3>{c.name}</h3>
                  <p className="muted">
                    {c.issuer} {c.year && `· ${c.year}`}
                  </p>
                </a>
              ))}
            </div>
          )}
        </Section>
      );
    case "extracurricular":
      if (!content.extracurricular.length) return null;
      return (
        <Section id="extracurricular" title={title} kicker="09 · Life">
          <div className="grid-2" data-stagger>
            {content.extracurricular.map((t, i) => (
              <p key={i} className="card">
                {t}
              </p>
            ))}
          </div>
        </Section>
      );
    case "contact":
      return <Contact content={content} onBackToEarth={onBackToEarth} />;
    default:
      return null;
  }
}

function About({ title, content }: { title: string; content: SiteContent }) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = tiltRef.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(tiltRef.current, { rotateY: x * 14, rotateX: -y * 14, duration: 0.5 });
  };
  const onLeave = () => gsap.to(tiltRef.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1,0.5)" });
  const p = content.profile;
  return (
    <Section id="about" title={title} kicker="00 · Hello">
      <div className="about">
        <div className="about-photo-wrap" onPointerMove={onMove} onPointerLeave={onLeave}>
          <div ref={tiltRef} className="about-photo">
            {p.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo} alt={p.name} />
            ) : (
              <span className="about-initials">
                {p.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </span>
            )}
            <span className="about-photo-shine" />
          </div>
        </div>
        <div>
          {content.about.paragraphs.map((para, i) => (
            <p key={i} className="scrub-words">
              {para.split(" ").map((w, j) => (
                <span key={j} className="w">
                  {w}{" "}
                </span>
              ))}
            </p>
          ))}
          <div className="stats" data-stagger>
            {content.about.stats.map((s, i) => {
              const m = s.value.match(/^(\d+)(.*)$/);
              return (
                <div key={i} className="stat">
                  <span className="stat-value" data-count={m ? m[1] : undefined} data-suffix={m ? m[2] : undefined}>
                    {s.value}
                  </span>
                  <span className="stat-label">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Projects({ title, content }: { title: string; content: SiteContent }) {
  const projects = [...content.projects].sort((a, b) => Number(b.featured) - Number(a.featured));
  return (
    <section id="projects" className="section section-projects">
      <div className="projects-pin">
        <div className="section-head">
          <span className="section-kicker">03 · Things I&apos;ve built</span>
          <SplitTitle text={title} />
        </div>
        <div className="projects-track">
          {projects.map((p, i) => (
            <article key={i} className={`project ${p.featured ? "is-featured" : ""}`}>
              <div className="project-media">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} />
                ) : (
                  <span className="project-index">{String(i + 1).padStart(2, "0")}</span>
                )}
              </div>
              <div className="project-body">
                <p className="muted small">
                  {p.period}
                  {p.featured && <span className="pill">Featured</span>}
                </p>
                <h3>{p.title}</h3>
                <p>{p.summary}</p>
                <Bullets items={p.points} />
                <div className="chips">
                  {p.tech.filter(Boolean).map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="project-links">
                  {p.repo && (
                    <a href={p.repo} target="_blank" rel="noreferrer" className="link-arrow">
                      Code →
                    </a>
                  )}
                  {p.live && (
                    <a href={p.live} target="_blank" rel="noreferrer" className="link-arrow">
                      Live →
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Skills({ title, content }: { title: string; content: SiteContent }) {
  const all = content.skills.flatMap((g) => g.items).filter(Boolean);
  return (
    <Section id="skills" title={title} kicker="05 · Toolbox">
      <div className="marquee" aria-hidden>
        {[0, 1].map((row) => (
          <div key={row} className={`marquee-row ${row ? "reverse" : ""}`}>
            {[...all, ...all, ...all].map((s, i) => (
              <span key={i}>{s} ✦</span>
            ))}
          </div>
        ))}
      </div>
      <div className="grid-3" data-stagger>
        {content.skills.map((g, i) => (
          <article key={i} className="card">
            <h3>{g.group}</h3>
            <div className="chips">
              {g.items.filter(Boolean).map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Contact({ content, onBackToEarth }: { content: SiteContent; onBackToEarth?: () => void }) {
  const email = content.profile.email;
  return (
    <section id="contact" className="section contact">
      <p className="section-kicker">10 · Say hi</p>
      <h2 className="contact-heading" data-reveal>
        {content.contact.heading}
      </h2>
      <p className="contact-msg" data-reveal>
        {content.contact.message}
      </p>
      <div className="contact-actions">
        {email && (
          <Magnetic href={`mailto:${email}`} className="btn btn-primary btn-lg">
            {email}
          </Magnetic>
        )}
        {content.socials
          .filter((s) => s.url)
          .map((s) => (
            <Magnetic key={s.label} href={s.url} className="btn btn-ghost btn-lg">
              {s.label} ↗
            </Magnetic>
          ))}
      </div>
      {onBackToEarth && (
        <button className="earth-return" onClick={onBackToEarth}>
          <span className="earth-ball" aria-hidden />
          <span>Fly back to Earth</span>
        </button>
      )}
    </section>
  );
}

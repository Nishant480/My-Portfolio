"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import type { SiteContent } from "@/content/schema";
import { defaultContent } from "@/content/default-content";
import { saveContentAction, signOutAction, uploadAction } from "./actions";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Path = (string | number)[];

const GROUPS: { key: keyof SiteContent; label: string; hint?: string }[] = [
  { key: "profile", label: "Profile", hint: "Name, headline, photo, resume and contact details." },
  { key: "socials", label: "Social links" },
  { key: "about", label: "About" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "research", label: "Research / Thesis" },
  { key: "skills", label: "Skills" },
  { key: "achievements", label: "Achievements" },
  { key: "positions", label: "Positions of responsibility" },
  { key: "coursework", label: "Coursework" },
  { key: "certifications", label: "Certifications" },
  { key: "extracurricular", label: "Beyond academics" },
  { key: "contact", label: "Contact section" },
  { key: "sections", label: "Section order & visibility", hint: "Reorder with the arrows; untick to hide a section." },
  { key: "journey", label: "3D journey labels", hint: "Names shown during the Earth-to-room animation." },
  { key: "meta", label: "SEO", hint: "Browser tab title and search description." },
];

const LONG_TEXT = new Set(["tagline", "summary", "message", "description", "detail"]);
const UPLOADABLE = new Set(["photo", "image", "logo", "resumeUrl"]);

const EMPTY_ITEMS: Record<string, Json> = {
  certifications: { name: "", issuer: "", year: "", link: "" },
};

function blank(v: Json): Json {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return v;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return v;
}

function templateFor(path: Path, current: Json[]): Json {
  const key = String(path[0]);
  const source = (current[0] ?? (defaultContent as unknown as Record<string, Json[]>)[key]?.[0] ?? EMPTY_ITEMS[key]) as Json;
  if (key === "sections") return { id: "", title: "", visible: true };
  return source === undefined ? "" : blank(source);
}

function setIn(obj: Json, path: Path, value: Json): Json {
  if (!path.length) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[head as number] = setIn(copy[head as number], rest, value);
    return copy;
  }
  const o = obj as Record<string, Json>;
  return { ...o, [head]: setIn(o[head as string], rest, value) };
}

const humanize = (k: string) =>
  k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).replace(/Url$/, "URL");

export function AdminEditor({ initial, email, storage }: { initial: SiteContent; email: string; storage: string }) {
  const [data, setData] = useState<Json>(initial as unknown as Json);
  const [saved, setSaved] = useState<string>(JSON.stringify(initial));
  const [active, setActive] = useState<keyof SiteContent | "raw">("profile");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [raw, setRaw] = useState("");

  const dirty = useMemo(() => JSON.stringify(data) !== saved, [data, saved]);
  const update = (path: Path, value: Json) => setData((d) => setIn(d, path, value));

  const save = () =>
    start(async () => {
      const json = JSON.stringify(data);
      const res = await saveContentAction(json);
      if (res.ok) {
        setSaved(json);
        setStatus({ kind: "ok", text: "Saved. The live site is updated." });
      } else setStatus({ kind: "err", text: res.error ?? "Save failed." });
    });

  const openRaw = () => {
    setRaw(JSON.stringify(data, null, 2));
    setActive("raw");
  };
  const applyRaw = () => {
    try {
      setData(JSON.parse(raw));
      setStatus({ kind: "ok", text: "JSON applied. Press Save to publish." });
    } catch {
      setStatus({ kind: "err", text: "That JSON doesn't parse." });
    }
  };

  const group = GROUPS.find((g) => g.key === active);

  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-brand">
          <span className="ad-dot" /> Site admin
        </div>
        <nav>
          {GROUPS.map((g) => (
            <button key={g.key} className={active === g.key ? "on" : ""} onClick={() => setActive(g.key)}>
              {g.label}
            </button>
          ))}
          <button className={active === "raw" ? "on" : ""} onClick={openRaw}>
            Raw JSON
          </button>
        </nav>
        <div className="ad-who">
          <p>{email}</p>
          <p className="ad-store">Storage: {storage}</p>
          <div className="ad-who-actions">
            <a href="/" target="_blank" rel="noreferrer">
              View site ↗
            </a>
            <form action={signOutAction}>
              <button type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      <main className="ad-main">
        <header className="ad-head">
          <div>
            <h1>{active === "raw" ? "Raw JSON" : group?.label}</h1>
            {group?.hint && <p className="ad-hint">{group.hint}</p>}
          </div>
          <div className="ad-head-actions">
            {status && <span className={`ad-status ${status.kind}`}>{status.text}</span>}
            <button className="ad-save" disabled={!dirty || pending} onClick={save}>
              {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </header>

        {active === "raw" ? (
          <div className="ad-raw">
            <textarea value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false} />
            <button className="ad-btn" onClick={applyRaw}>
              Apply JSON
            </button>
          </div>
        ) : (
          <Field
            path={[active]}
            name={active}
            value={(data as Record<string, Json>)[active]}
            onChange={update}
            root
          />
        )}
      </main>
    </div>
  );
}

function Field({
  path,
  name,
  value,
  onChange,
  root = false,
}: {
  path: Path;
  name: string;
  value: Json;
  onChange: (p: Path, v: Json) => void;
  root?: boolean;
}) {
  if (typeof value === "boolean") {
    return (
      <label className="ad-check">
        <input type="checkbox" checked={value} onChange={(e) => onChange(path, e.target.checked)} />
        {humanize(name)}
      </label>
    );
  }
  if (typeof value === "string" || value === null) {
    const long = LONG_TEXT.has(name) || (value ?? "").length > 90;
    return (
      <label className="ad-field">
        <span>{humanize(name)}</span>
        {long ? (
          <textarea rows={4} value={value ?? ""} onChange={(e) => onChange(path, e.target.value)} />
        ) : (
          <div className="ad-row">
            <input value={value ?? ""} onChange={(e) => onChange(path, e.target.value)} />
            {UPLOADABLE.has(name) && <Upload onDone={(url) => onChange(path, url)} accept={name === "resumeUrl" ? "application/pdf" : "image/*"} />}
          </div>
        )}
        {UPLOADABLE.has(name) && value && name !== "resumeUrl" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ad-thumb" src={value} alt="" />
        )}
      </label>
    );
  }
  if (Array.isArray(value)) {
    const isStrings = value.every((v) => typeof v === "string") && (value.length > 0 || !isObjectList(path));
    if (isStrings) {
      return (
        <label className="ad-field">
          <span>
            {humanize(name)} <em>one per line</em>
          </span>
          <textarea
            rows={Math.max(3, value.length + 1)}
            value={(value as string[]).join("\n")}
            onChange={(e) => onChange(path, e.target.value.split("\n"))}
            onBlur={(e) => onChange(path, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
          />
        </label>
      );
    }
    const move = (i: number, d: number) => {
      const next = value.slice();
      const [it] = next.splice(i, 1);
      next.splice(i + d, 0, it);
      onChange(path, next);
    };
    return (
      <div className={root ? "" : "ad-field"}>
        {!root && <span className="ad-label">{humanize(name)}</span>}
        <div className="ad-list">
          {value.map((item, i) => (
            <div key={i} className="ad-item">
              <div className="ad-item-bar">
                <strong>{itemTitle(item, i)}</strong>
                <div>
                  <button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                    ↓
                  </button>
                  <button
                    className="danger"
                    onClick={() => confirm("Delete this item?") && onChange(path, value.filter((_, j) => j !== i))}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <Field path={[...path, i]} name={name} value={item} onChange={onChange} />
            </div>
          ))}
        </div>
        <button className="ad-btn" onClick={() => onChange(path, [...value, templateFor(path, value)])}>
          + Add
        </button>
      </div>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div className={`ad-obj ${root ? "root" : ""}`}>
        {Object.entries(value).map(([k, v]) => (
          <Field key={k} path={[...path, k]} name={k} value={v} onChange={onChange} />
        ))}
      </div>
    );
  }
  return null;
}

function isObjectList(path: Path) {
  const key = String(path[0]);
  const sample = (defaultContent as unknown as Record<string, unknown>)[key];
  return path.length === 1 && Array.isArray(sample) && (sample.length === 0 || typeof sample[0] === "object");
}

function itemTitle(item: Json, i: number) {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const o = item as Record<string, Json>;
    const t = o.title || o.name || o.institute || o.company || o.role || o.group || o.label;
    if (typeof t === "string" && t) return t;
  }
  return `Item ${i + 1}`;
}

function Upload({ onDone, accept }: { onDone: (url: string) => void; accept: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          setErr(null);
          const fd = new FormData();
          fd.append("file", f);
          const res = await uploadAction(fd);
          setBusy(false);
          if (res.ok && res.url) onDone(res.url);
          else setErr(res.error ?? "Upload failed");
          e.target.value = "";
        }}
      />
      <button type="button" className="ad-btn" onClick={() => input.current?.click()} disabled={busy} title={err ?? undefined}>
        {busy ? "Uploading…" : err ? "Retry upload" : "Upload"}
      </button>
    </>
  );
}

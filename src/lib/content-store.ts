import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SiteSchema, type SiteContent } from "@/content/schema";
import { defaultContent } from "@/content/default-content";

// Content lives in one JSON document. With Supabase configured it is a row in
// the `site_content` table (see supabase/schema.sql); otherwise a local file,
// which is fine for development but not writable on serverless hosts.
const LOCAL_FILE = path.join(process.cwd(), "data", "content.json");
const ROW_ID = "main";

function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function normalize(raw: unknown): SiteContent {
  const merged = { ...defaultContent, ...(raw as object) };
  const parsed = SiteSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultContent;
}

export async function getContent(): Promise<SiteContent> {
  const db = supabase();
  if (db) {
    const { data, error } = await db.from("site_content").select("data").eq("id", ROW_ID).maybeSingle();
    if (error) console.error("[content] supabase read failed:", error.message);
    return data ? normalize(data.data) : defaultContent;
  }
  try {
    return normalize(JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")));
  } catch {
    return defaultContent;
  }
}

export async function saveContent(content: SiteContent): Promise<void> {
  const db = supabase();
  if (db) {
    const { error } = await db
      .from("site_content")
      .upsert({ id: ROW_ID, data: content, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Saving to Supabase failed: ${error.message}`);
    return;
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(content, null, 2));
}

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "application/pdf"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function storeUpload(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Only images and PDFs can be uploaded.");
  if (file.size > MAX_BYTES) throw new Error("File is larger than 8 MB.");
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const db = supabase();
  if (db) {
    const bucket = process.env.SUPABASE_BUCKET || "portfolio";
    const { error } = await db.storage.from(bucket).upload(name, bytes, { contentType: file.type });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return db.storage.from(bucket).getPublicUrl(name).data.publicUrl;
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}

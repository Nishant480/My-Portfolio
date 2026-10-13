"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, signIn, signOut } from "@/auth";
import { SiteSchema } from "@/content/schema";
import { saveContent, storeUpload } from "@/lib/content-store";

export async function saveContentAction(json: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "That isn't valid JSON." };
  }
  const parsed = SiteSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".")}: ${issue.message}` };
  }
  try {
    await saveContent(parsed.data);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function uploadAction(form: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  try {
    return { ok: true, url: await storeUpload(file) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/admin" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

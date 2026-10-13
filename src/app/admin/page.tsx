import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "@/auth";
import { getContent } from "@/lib/content-store";
import { AdminEditor } from "./AdminEditor";

export default async function AdminPage() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) redirect("/admin/login");
  const content = await getContent();
  const storage = process.env.SUPABASE_URL ? "Supabase" : "local file (data/content.json)";
  return <AdminEditor initial={content} email={session!.user!.email!} storage={storage} />;
}

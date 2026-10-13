import type { Metadata } from "next";
import Experience from "@/components/Experience";
import { getContent } from "@/lib/content-store";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getContent();
  return { title: meta.siteTitle, description: meta.description };
}

export default async function Home() {
  const content = await getContent();
  return <Experience content={content} />;
}

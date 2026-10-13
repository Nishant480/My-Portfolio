import { z } from "zod";

const str = z.string().max(5000).default("");
const url = z.string().max(2000).default("");
const list = z.array(z.string().max(300)).default([]);

export const LinkSchema = z.object({ label: str, url });

export const SiteSchema = z.object({
  meta: z.object({
    siteTitle: str,
    description: str,
  }),
  profile: z.object({
    name: str,
    firstName: str,
    headline: str,
    roles: list,
    tagline: str,
    photo: url,
    location: str,
    email: str,
    phone: str,
    resumeUrl: url,
    availability: str,
  }),
  socials: z.array(LinkSchema).default([]),
  about: z.object({
    paragraphs: list,
    stats: z.array(z.object({ value: str, label: str })).default([]),
  }),
  education: z.array(
    z.object({
      institute: str,
      degree: str,
      field: str,
      start: str,
      end: str,
      score: str,
      details: list,
      logo: url,
    }),
  ).default([]),
  experience: z.array(
    z.object({
      company: str,
      role: str,
      location: str,
      start: str,
      end: str,
      points: list,
      tech: list,
      link: url,
    }),
  ).default([]),
  projects: z.array(
    z.object({
      title: str,
      summary: str,
      points: list,
      tech: list,
      image: url,
      repo: url,
      live: url,
      period: str,
      featured: z.boolean().default(false),
    }),
  ).default([]),
  research: z.array(
    z.object({
      title: str,
      guide: str,
      period: str,
      summary: str,
      points: list,
      link: url,
    }),
  ).default([]),
  skills: z.array(z.object({ group: str, items: list })).default([]),
  achievements: z.array(z.object({ title: str, detail: str, year: str })).default([]),
  positions: z.array(
    z.object({ role: str, organisation: str, period: str, points: list }),
  ).default([]),
  coursework: list,
  certifications: z.array(z.object({ name: str, issuer: str, year: str, link: url })).default([]),
  extracurricular: list,
  contact: z.object({ heading: str, message: str }),
  sections: z.array(
    z.object({ id: str, title: str, visible: z.boolean().default(true) }),
  ).default([]),
  journey: z.object({
    hallName: str,
    roomLabel: str,
    campusName: str,
  }),
});

export type SiteContent = z.infer<typeof SiteSchema>;

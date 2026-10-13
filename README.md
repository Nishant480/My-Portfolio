# Earth → Laptop Portfolio

A portfolio that starts as a draggable 3D Earth. Scrolling flies the camera to
India, West Bengal and IIT Kharagpur, down onto Atal Bihari Vajpayee Hall, through
the lit window of my room and into the laptop on the study table, whose screen
expands into the actual portfolio. From there the page scrolls normally; the
**Back to Earth** button is the only way back to the globe.

Everything on the site is edited from `/admin`, which only the owner's Google
account can open.

## Stack

- Next.js 16 (App Router), TypeScript
- React Three Fiber + drei + Three.js for the Earth, campus and room scenes
- Lenis smooth scrolling, GSAP + ScrollTrigger for the portfolio animations
- Auth.js (NextAuth v5) with Google, locked to one email (`ADMIN_EMAIL`)
- Content: one JSON document, stored in Supabase in production or
  `data/content.json` locally

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000, admin at /admin
```

## Admin sign-in setup (Google)

1. Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID*
   (type: Web application).
2. Authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-DOMAIN/api/auth/callback/google`
3. Put the client ID/secret in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`,
   your Gmail in `ADMIN_EMAIL`, and a random `AUTH_SECRET` (`npx auth secret`).

How the lock works:
- The Google sign-in callback refuses any account whose verified email isn't
  `ADMIN_EMAIL`, so no session is ever created for anyone else.
- `src/proxy.ts` redirects every `/admin` request without the owner session.
- Every server action re-checks the session (`requireAdmin`) before reading
  input, and validates content with Zod before saving.
- Sessions last 8 hours; `/admin` is `noindex`; security headers are set in
  `next.config.ts`.

## Content storage (needed on Vercel)

Serverless hosts can't write files, so in production use Supabase:

1. Create a free Supabase project, run `supabase/schema.sql` in its SQL editor.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only, never
   exposed to the browser).

Uploads (photo, project images, resume PDF) go to the `portfolio` storage bucket.

## Where things live

| Path | What |
| --- | --- |
| `src/components/Experience.tsx` | Journey ↔ portfolio switch, HUD, captions, screen expansion |
| `src/components/journey/` | 3D scenes: `Earth`, `Campus`, `Room`, camera rig and scroll stages (`store.ts`) |
| `src/components/portfolio/Portfolio.tsx` | All portfolio sections and their scroll animations |
| `src/content/` | Content schema and placeholder content |
| `src/app/admin/` | Login, editor and server actions |

Earth textures: NASA Blue Marble / Black Marble (public domain), via the
`three-globe` examples.

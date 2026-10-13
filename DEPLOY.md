# Putting the site live on Vercel

The public site works as soon as Vercel builds it. The admin panel needs
steps 2–4.

## 1. Import the repo (2 minutes)

1. Open https://vercel.com/new and sign in with GitHub.
2. Find **My-Portfolio**, click **Import**, then **Deploy**. Leave every setting as it is.
3. When it finishes, copy your site address, e.g. `https://my-portfolio-xyz.vercel.app`.
   You'll need it in step 2.

## 2. Google sign-in keys (for /admin)

1. Go to https://console.cloud.google.com and create a project (any name).
2. **APIs & Services → OAuth consent screen**: choose *External*, fill in the app name
   and your Gmail, save. Under *Audience / Test users*, add `meenanishant36@gmail.com`.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: *Web application*
   - Authorised redirect URIs:
     - `https://YOUR-SITE.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
4. Copy the **Client ID** and **Client secret**.

## 3. Free database for your admin edits (Supabase)

1. Go to https://supabase.com, create a free project.
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, click **Run**.
3. **Project Settings → API**: copy the **Project URL** and the **service_role** key
   (keep this one secret, it only goes into Vercel).

## 4. Add the settings in Vercel

Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value |
| --- | --- |
| `AUTH_SECRET` | a random string: open https://generate-secret.vercel.app/32 and copy it |
| `AUTH_GOOGLE_ID` | Client ID from step 2 |
| `AUTH_GOOGLE_SECRET` | Client secret from step 2 |
| `ADMIN_EMAIL` | `meenanishant36@gmail.com` |
| `SUPABASE_URL` | Project URL from step 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key from step 3 |

Then **Deployments → ⋯ on the latest one → Redeploy**.

## 5. Check it

- Open your site: the Earth journey should play.
- Open `/admin`, click **Continue with Google**, pick your Gmail. You're in.
- Any other Google account is refused.

Every push to `main` on GitHub redeploys the site automatically.

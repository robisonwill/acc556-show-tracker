# ACC 556 Show Tracker

A browser prototype for discovering shows on household subscriptions and tracking shared episode progress. It uses the six existing Supabase tables through the Data API and runs locally with Node.js 22 or later. There are no packages to install.

## Run locally

1. Open a terminal in this repository. In the course workspace, that directory is `phase4/app`.
2. If `.env` is missing, copy `.env.example` to `.env`. In the **ACC556 Final Project -- Will Robison** dashboard, copy the Project URL and a publishable API key from **Connect** or **Settings → API Keys**. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `.env`. The server accepts only a Supabase project URL and a modern `sb_publishable_` key. Git ignores `.env`.
3. Complete the household access setup below before attempting to sign in.
4. Run `node --env-file-if-exists=.env server.js` and open `http://127.0.0.1:4173`. If needed, set `PORT` to a different port and use the address printed by the server.
5. Sign in with an approved household account. The header displays **Live Supabase** after a successful catalog load.

The Node server serves a fixed list of app files and listens only on loopback. The browser signs in with Supabase Auth and sends the access token to the Data API. The app keeps the access token in memory for the current page. Reloading, signing out, or reaching session expiry requires a fresh sign-in. Use a publishable key for this client. [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)

## Household access setup

On November 10, 2026 the live database had six populated tables, RLS enabled on each table, the necessary table grants, zero policies, and zero Auth users. `sql/household-access.review.sql` is the proposed access change. Review and approve it before applying it to the live project.

1. In the Final Project dashboard, open **Authentication → Users → Add user → Create new user**. Create and confirm an email/password user for each intended household member. Keep the password in your password manager. The app provides sign-in only.
2. Copy the intended Auth user UUIDs from that page. In a local copy of the reviewed SQL, replace the placeholder UUID with the first user's ID and add any additional approved IDs to the same array. The script checks that every ID belongs to an existing non-anonymous Auth user.
3. Run the reviewed SQL in the Final Project SQL Editor. It adds six UUID-restricted SELECT policies and one UUID-restricted INSERT policy on `episode_progress`. Existing RLS, grants, tables, keys, and rows are preserved. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Try the workflow

Filter by title, primary genre, award wins or nominations, subscribed service, and minimum average episode IMDb rating. Open a show to see its seasons, completion, and first unwatched episode in season and episode order. Select **Mark next watched**, leave the household rating blank or enter a rating, and save. The page refreshes completion and the next episode as soon as Supabase confirms the write.

The average uses available IMDb episode ratings on a 0–10 scale. A missing progress row is unwatched. A progress row can carry a household rating, watch date, and seed notes, which appear separately from IMDb. Saving an episode that was already recorded reads the existing record and preserves its date, rating, and notes. Availability reflects the catalog's last-checked dates.

## Verification

Run `node --test` from this repository. The tests cover filters, average IMDb rating, watch order, completion, API pagination, and preservation of existing progress on duplicate submissions.

The course workspace has a separate browser integration test using the full Phase 3 seed in an in-memory PostgreSQL database. Live checks covered the schema and access audit, the demo SQL, and signed-out Data API reads. The live signed-in workflow needs an approved household account and the reviewed policies.

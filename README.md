# Show Tracker

Open [Show Tracker](https://robisonwill.github.io/acc556-show-tracker/) to browse the live Supabase catalog and record shared viewing progress. The app opens directly into the catalog. It needs an internet connection.

## Use the app

Filter by title, genre, award wins or nominations, subscribed service, and minimum average episode IMDb rating. Open a show and select Mark next watched. The optional household rating is separate from IMDb. Saving creates a progress record in Supabase and updates completion and the next episode after the database confirms the write.

Progress is shared with everyone using the app. Existing records are preserved when an episode is submitted again. The database supplies the watch date.

## Connection and queries

[public/database.js](public/database.js) contains the live Data API reads and writes. It selects IDs as strings and fetches every API page. [public/catalog.js](public/catalog.js) contains filters, average episode IMDb ratings, completion, and next-episode calculations. [public/app.js](public/app.js) renders the interface.

Run [sql/discovery_progress.sql](sql/discovery_progress.sql) in the Final Project Supabase SQL Editor to see subscribed shows, average episode IMDb ratings, completion, and next unwatched episodes. [sql/live-demo-access.review.sql](sql/live-demo-access.review.sql) records the reviewed access policies applied for the demo.

The browser uses a publishable Supabase key. Anonymous clients can read the catalog and shared history and add watched episodes under the database policies. The generated HTML includes this public connection configuration.

## GitHub Pages and development

GitHub Pages publishes the `docs/` directory from `main`. To build, set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in an ignored local .env file, then run `node --env-file=.env build.mjs`. The build writes `Show Tracker.html` and `docs/index.html` with the same live app. Only the Final Project URL and a publishable key are accepted.

Run `node --test` for catalog rule tests. To preview the generated HTML locally, run `node server.js`. You can also download the ZIP from [Releases](https://github.com/robisonwill/acc556-show-tracker/releases/latest), extract it, and open Show Tracker.html in your browser.

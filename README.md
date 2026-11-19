# Show Tracker

Download **Show-Tracker.zip** from the [latest GitHub release](https://github.com/robisonwill/acc556-show-tracker/releases/latest). In Windows, right-click the ZIP, select **Extract All**, and double-click **Show Tracker.html** in the extracted folder. You can also open that HTML file from the repository's source ZIP.

The app runs offline with a 60-show snapshot of the Supabase catalog and the original sample viewing history. New watch progress saves in your browser. If you already use a downloaded copy, replace the old HTML with the new file at the same path and open it in the same browser profile to keep your progress. The browser keeps progress for the downloaded file separately from the localhost preview.

## Development

## SQL and Supabase

The [discovery and progress query](sql/discovery_progress.sql) can be run in the SQL Editor of ACC556 Final Project -- Will Robison. It returns subscribed shows, average episode IMDb ratings, completion percentages, and each show's first unwatched episode.

The downloadable app uses a bundled snapshot. Its catalog filters and progress calculations are in [public/catalog.js](public/catalog.js), and its browser storage writes are in [public/app.js](public/app.js). Running the SQL separately queries live Supabase. Changes saved in the offline app stay in that browser.

The standalone HTML contains the interface, catalog, and browser storage logic. From the full course workspace run `node phase4/prepare-local.mjs` to regenerate the sample catalog. From this repository run `node build.mjs` to rebuild the HTML and `node --test` to check catalog and progress calculations. Use `node server.js` to preview the same HTML at a local browser address.

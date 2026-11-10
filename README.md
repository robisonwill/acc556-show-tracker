# ACC 556 Show Tracker

An interactive TV discovery and episode tracker for one household. This folder is the starter for the private Phase 4 app repository.

## First working flow

1. Filter the catalog by title, primary genre, and subscribed streaming service. Show the award flags and use episode IMDb ratings for the rating filter; the current schema does not store a separate show-level public rating. Label any aggregate explicitly, for example, “Average episode IMDb rating.”
2. Open a show, see its episodes in season and episode order, and display completion and the next unwatched episode.
3. Mark an episode watched and confirm that the updated percentage and next episode appear immediately. Keep public IMDb ratings separate from optional household ratings. A missing progress row means unwatched.

Use the existing six-table Supabase database and sample data. Plan authenticated household access before wiring up reads or writes. Keep privileged credentials out of the frontend and version control.

## Phase 4 demo

Record a 2–3 minute video: open the working app, show its live Supabase connection, demonstrate the full flow, run and explain a non-trivial SQL query in Supabase, then describe the remaining Phase 5 work. Better Call Saul is a useful in-progress case; verify the actual next episode before recording.

The application implementation and Supabase configuration are pending. The course submissions, research data, and screenshots remain in the course workspace.

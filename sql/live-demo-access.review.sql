-- Proposed no-sign-in access for this shared-household prototype.
-- Review before applying to ACC556 Final Project -- Will Robison.
-- Anonymous clients can read the catalog and household viewing history.
-- They can insert today's watched episodes with an optional household rating.
begin;

create policy phase4_demo_read on public.shows
  for select to anon using (true);
create policy phase4_demo_read on public.seasons
  for select to anon using (true);
create policy phase4_demo_read on public.episodes
  for select to anon using (true);
create policy phase4_demo_read on public.streaming_services
  for select to anon using (true);
create policy phase4_demo_read on public.show_availability
  for select to anon using (true);
create policy phase4_demo_read on public.episode_progress
  for select to anon using (true);

create policy phase4_demo_mark_watched on public.episode_progress
  for insert to anon
  with check (
    watched_on = current_date
    and notes is null
    and (our_rating is null or our_rating between 0 and 10)
  );

commit;

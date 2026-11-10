-- Proposal for review. Apply only after confirming the intended Auth user IDs.
-- Create the household account(s) in Authentication > Users before applying.
-- Replace the all-zero placeholder with the first UUID. Add a second UUID if needed.
begin;

do $policies$
declare
  household_users uuid[] := array['00000000-0000-0000-0000-000000000000'::uuid];
  household_rule text;
  tracker_table text;
begin
  if cardinality(household_users) = 0 or exists (
    select 1
    from unnest(household_users) as member(user_id)
    where not exists (
      select 1 from auth.users as account
      where account.id = member.user_id and account.is_anonymous is not true
    )
  ) then
    raise exception 'Replace the placeholder with the intended existing household Auth UUID(s).';
  end if;

  household_rule := format('(select auth.uid()) = any (%L::uuid[])', household_users);
  foreach tracker_table in array array[
    'shows', 'seasons', 'episodes', 'streaming_services', 'show_availability', 'episode_progress'
  ] loop
    execute format(
      'create policy phase4_household_read on public.%I for select to authenticated using (%s)',
      tracker_table, household_rule
    );
  end loop;

  execute format(
    'create policy phase4_household_mark_watched on public.episode_progress for insert to authenticated with check (%s)',
    household_rule
  );
end
$policies$;

commit;

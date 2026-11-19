-- Subscribed shows with an average episode IMDb rating of at least 8.5.
with subscribed_shows as (
  select a.show_id, string_agg(s.name, ', ' order by s.name) as subscribed_services
  from public.show_availability as a
  join public.streaming_services as s on s.service_id = a.service_id
  where s.subscribed
  group by a.show_id
),
episode_status as (
  select e.show_id, e.season_number, e.episode_number, e.title, e.imdb_rating,
         (p.episode_id is not null) as watched
  from public.episodes as e
  left join public.episode_progress as p on p.episode_id = e.episode_id
),
show_progress as (
  select show_id, avg(imdb_rating) as average_episode_imdb,
         count(*) as episodes, count(*) filter (where watched) as watched
  from episode_status
  group by show_id
),
next_episode as (
  select distinct on (show_id) show_id, season_number, episode_number, title
  from episode_status
  where not watched
  order by show_id, season_number, episode_number
)
select sh.title, ss.subscribed_services,
       round(p.average_episode_imdb, 2) as average_episode_imdb,
       p.watched, p.episodes, round(100.0 * p.watched / p.episodes, 1) as completion_pct,
       case when n.show_id is not null
            then format('S%s E%s · %s', n.season_number, n.episode_number, n.title)
       end as next_unwatched
from public.shows as sh
join subscribed_shows as ss on ss.show_id = sh.show_id
join show_progress as p on p.show_id = sh.show_id
left join next_episode as n on n.show_id = sh.show_id
where p.average_episode_imdb >= 8.5
order by p.average_episode_imdb desc, sh.title, sh.show_id;

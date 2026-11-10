export function buildCatalog({ shows, seasons, episodes, services, availability, progress }) {
  const serviceById = new Map(services.map(service => [service.service_id, service]));
  const progressByEpisode = new Map(progress.map(row => [row.episode_id, row]));
  const byShow = new Map(shows.map(show => [show.show_id, {
    ...show, seasons: [], episodes: [], services: [], averageRating: null,
  }]));

  for (const season of seasons) byShow.get(season.show_id)?.seasons.push(season);
  for (const row of availability) {
    const service = serviceById.get(row.service_id);
    if (service) byShow.get(row.show_id)?.services.push({ ...service, last_checked_on: row.last_checked_on });
  }
  for (const episode of episodes) {
    byShow.get(episode.show_id)?.episodes.push({
      ...episode, progress: progressByEpisode.get(episode.episode_id) ?? null,
    });
  }

  for (const show of byShow.values()) {
    show.seasons.sort((a, b) => a.season_number - b.season_number);
    show.episodes.sort((a, b) => a.season_number - b.season_number || a.episode_number - b.episode_number);
    show.services.sort((a, b) => a.name.localeCompare(b.name));
    const rated = show.episodes.filter(episode => episode.imdb_rating != null);
    if (rated.length) {
      show.averageRating = rated.reduce((total, episode) => total + Math.round(Number(episode.imdb_rating) * 10), 0)
        / (rated.length * 10);
    }
  }
  return [...byShow.values()].sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1)
    || a.title.localeCompare(b.title));
}

export function filterCatalog(shows, { title, genre, award, service, minimum }) {
  const search = title.trim().toLocaleLowerCase();
  return shows.filter(show =>
    show.title.toLocaleLowerCase().includes(search)
    && (!genre || show.primary_genre === genre)
    && (!award || show[award] === true)
    && (!service || show.services.some(item => item.subscribed && (service === 'subscribed' || item.service_id === service)))
    && (minimum === '' || (show.averageRating != null && show.averageRating >= Number(minimum))));
}

export function viewingProgress(show) {
  const total = show.episodes.length;
  const watched = show.episodes.filter(episode => episode.progress !== null).length;
  return {
    total,
    watched,
    percent: total ? (100 * watched / total).toFixed(1) : '0.0',
    next: show.episodes.find(episode => episode.progress === null) ?? null,
  };
}

export function localDate(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

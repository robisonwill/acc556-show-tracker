import { buildCatalog, filterCatalog, localDate, viewingProgress } from './catalog.js';

const byId = id => document.getElementById(id);
const connection = byId('connection');
const message = byId('message');
const discover = byId('discover');
const filters = byId('filters');
const detail = byId('detail');
const overview = byId('show-overview');
const dialog = byId('watch-dialog');
const watchForm = byId('watch-form');
const watchError = byId('watch-error');
const saveButton = byId('save-watch');
const cancelButton = byId('cancel-watch');
const openSeasons = new Set();
let database;
let shows = [];
let selectedShow;
let selectedEpisode;
let saving = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function button(text, onClick, className) {
  const node = element('button', className, text);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

function showMessage(text) {
  message.textContent = text;
  message.hidden = !text;
}

function addChoices(select, options, defaults) {
  select.options.length = defaults;
  for (const [value, label] of options) select.add(new Option(label, value));
}

function configureFilters(services) {
  const genres = [...new Set(shows.map(show => show.primary_genre))].sort((a, b) => a.localeCompare(b));
  addChoices(filters.elements.genre, genres.map(genre => [genre, genre]), 1);
  const subscriptions = services.filter(service => service.subscribed).sort((a, b) => a.name.localeCompare(b.name));
  addChoices(filters.elements.service, subscriptions.map(service => [service.service_id, service.name]), 2);
  filters.reset();
}

function serviceTags(show, includeDate = false) {
  const tags = element('div', 'tags');
  for (const service of show.services) {
    const label = service.subscribed ? `${service.name} · Subscribed` : service.name;
    tags.append(element('span', service.subscribed ? 'tag subscribed' : 'tag',
      includeDate ? `${label} · Checked ${service.last_checked_on}` : label));
  }
  if (!show.services.length) tags.append(element('span', 'muted', 'No availability recorded'));
  return tags;
}

function ratingLabel(show) {
  return element('p', 'rating', show.averageRating == null
    ? 'Average episode IMDb rating unavailable'
    : `${show.averageRating.toFixed(2)}/10 · Average episode IMDb rating`);
}

function awardLabel(show) {
  const label = value => value == null ? 'Unknown' : value ? 'Yes' : 'No';
  return element('p', 'muted', `Award wins: ${label(show.has_award_wins)} · Nominations: ${label(show.has_award_nominations)}`);
}

function renderCatalog() {
  const matches = filterCatalog(shows, Object.fromEntries(new FormData(filters)));
  byId('result-count').textContent = `${matches.length} of ${shows.length} shows`;
  const results = byId('results');
  results.replaceChildren();
  if (!matches.length) results.append(element('p', 'panel empty', 'No shows match these filters.'));

  for (const show of matches) {
    const card = element('article', 'panel card');
    const { watched, total, percent } = viewingProgress(show);
    const title = element('h3');
    const open = button(show.title, () => openShow(show), 'title-button');
    open.dataset.showId = show.show_id;
    title.append(open);
    card.append(element('p', 'eyebrow', show.primary_genre), title, ratingLabel(show), awardLabel(show),
      serviceTags(show), element('p', 'card-progress', `${watched} of ${total} watched · ${percent}%`));
    results.append(card);
  }
}

function episodeLabel(episode) {
  return `S${episode.season_number} E${episode.episode_number} · ${episode.title}`;
}

function chooseEpisode(episode) {
  selectedEpisode = episode;
  watchForm.reset();
  watchError.hidden = true;
  byId('watch-episode').textContent = episodeLabel(episode);
  dialog.showModal();
}

function renderDetail(focusId = 'show-title') {
  const show = selectedShow;
  const { total, watched, percent, next } = viewingProgress(show);
  const title = element('h1', '', show.title);
  title.id = 'show-title';
  title.tabIndex = -1;
  const header = element('div', 'intro');
  header.append(element('p', 'eyebrow', show.primary_genre), title, ratingLabel(show), awardLabel(show), serviceTags(show, true));

  const progress = element('div', 'panel progress-panel');
  const progressText = element('div');
  progressText.setAttribute('role', 'status');
  const bar = element('progress');
  bar.max = total || 1;
  bar.value = watched;
  bar.setAttribute('aria-label', 'Episode completion');
  const nextLabel = next ? episodeLabel(next) : total ? 'All episodes watched' : 'No episodes in the catalog';
  progressText.append(element('p', 'eyebrow', 'Shared viewing progress'),
    element('h2', '', `${percent}% complete`), bar,
    element('p', '', `${watched} of ${total} episodes watched`),
    element('p', 'next', `Next unwatched: ${nextLabel}`));
  progress.append(progressText);
  if (next) {
    const markNext = button('Mark next watched', () => chooseEpisode(next));
    markNext.id = 'mark-next';
    progress.append(markNext);
  }
  overview.replaceChildren(header, progress);

  const seasonList = byId('season-list');
  seasonList.replaceChildren(element('h2', 'season-heading', 'Episodes'));
  for (const season of show.seasons) {
    const number = season.season_number;
    const episodes = show.episodes.filter(episode => episode.season_number === number);
    const group = element('details', 'panel season');
    group.open = openSeasons.has(number);
    group.addEventListener('toggle', () => {
      if (!group.isConnected) return;
      if (group.open) openSeasons.add(number);
      else openSeasons.delete(number);
    });
    const watchedCount = episodes.filter(episode => episode.progress).length;
    group.append(element('summary', '', `Season ${number} · ${watchedCount}/${episodes.length} watched`));
    const list = element('ul', 'episodes');
    if (!episodes.length) list.append(element('li', 'episode', 'No cataloged episodes'));
    for (const episode of episodes) {
      const row = element('li', 'episode');
      const info = element('div');
      const record = episode.progress;
      info.append(element('strong', '', episodeLabel(episode)),
        element('p', 'muted', episode.imdb_rating == null ? 'IMDb rating unavailable' : `IMDb ${Number(episode.imdb_rating).toFixed(1)}/10`));
      if (record) {
        info.append(element('p', '', `Watched ${record.watched_on} · Household rating ${record.our_rating == null ? '—' : `${Number(record.our_rating).toFixed(1)}/10`}`));
        if (record.notes) info.append(element('p', 'muted', record.notes));
      }
      row.append(info);
      if (!record) {
        const mark = button('Mark watched', () => chooseEpisode(episode), 'secondary');
        mark.setAttribute('aria-label', `Mark ${episodeLabel(episode)} watched`);
        row.append(mark);
      }
      list.append(row);
    }
    group.append(list);
    seasonList.append(group);
  }
  (byId(focusId) ?? title).focus();
}

function openShow(show) {
  selectedShow = show;
  openSeasons.clear();
  const next = viewingProgress(show).next;
  if (next) openSeasons.add(next.season_number);
  discover.hidden = true;
  detail.hidden = false;
  renderDetail();
  window.scrollTo(0, 0);
}

byId('back').addEventListener('click', () => {
  detail.hidden = true;
  discover.hidden = false;
  renderCatalog();
  const previous = [...byId('results').querySelectorAll('button')].find(node => node.dataset.showId === selectedShow.show_id);
  previous?.focus();
});

filters.addEventListener('input', renderCatalog);
filters.addEventListener('submit', event => event.preventDefault());
filters.addEventListener('reset', () => queueMicrotask(renderCatalog));
cancelButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('cancel', event => {
  if (saving) event.preventDefault();
});

watchForm.addEventListener('submit', event => {
  event.preventDefault();
  const episode = selectedEpisode;
  if (saving || !episode) return;
  const input = watchForm.elements.rating.value;
  saving = saveButton.disabled = cancelButton.disabled = true;
  saveButton.textContent = 'Saving…';
  watchError.hidden = true;
  try {
    episode.progress = database.markWatched(episode.episode_id, localDate(), input === '' ? null : Number(input));
    dialog.close();
    renderDetail('mark-next');
  } catch (error) {
    watchError.textContent = `Unable to save progress. ${error.message}`;
    watchError.hidden = false;
  } finally {
    saving = saveButton.disabled = cancelButton.disabled = false;
    saveButton.textContent = 'Save watched episode';
  }
});

function localDatabase(seed) {
  const storageKey = 'acc556-local-progress-v1';
  const records = new Map(seed.progress.map(row => [row.episode_id, row]));
  function readSaved() {
    return JSON.parse(localStorage.getItem(storageKey) ?? '{}');
  }
  return {
    loadCatalog() {
      const saved = Object.values(readSaved());
      return { ...seed, progress: [...seed.progress, ...saved.filter(row => !records.has(row.episode_id))] };
    },
    markWatched(episodeId, watchedOn, rating) {
      const saved = readSaved();
      const existing = records.get(episodeId) ?? saved[episodeId];
      if (existing) return existing;
      const row = { episode_id: episodeId, watched_on: watchedOn, our_rating: rating };
      saved[episodeId] = row;
      localStorage.setItem(storageKey, JSON.stringify(saved));
      return row;
    },
  };
}

try {
  database = localDatabase(JSON.parse(byId('sample-catalog').textContent));
  const data = database.loadCatalog();
  shows = buildCatalog(data);
  discover.hidden = false;
  connection.textContent = 'Local sample data';
  configureFilters(data.services);
  renderCatalog();
  filters.elements.title.focus();
} catch (error) {
  connection.textContent = 'Setup error';
  showMessage(`Unable to open Show Tracker. ${error.message}`);
}

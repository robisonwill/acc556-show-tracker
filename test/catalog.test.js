import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCatalog, filterCatalog, localDate, viewingProgress } from '../public/catalog.js';
import { createSupabase } from '../public/supabase.js';

const episodeId = '9007199254740993';
const fixture = {
  shows: [
    { show_id: '1', title: 'Example Crime Show', primary_genre: 'Crime', has_award_wins: true },
    { show_id: '2', title: 'Example Comedy', primary_genre: 'Comedy', has_award_wins: null },
  ],
  seasons: [{ show_id: '1', season_number: 2 }, { show_id: '1', season_number: 1 }],
  episodes: [
    { show_id: '1', episode_id: '2', season_number: 2, episode_number: 1, imdb_rating: 8.3 },
    { show_id: '1', episode_id: '3', season_number: 1, episode_number: 2, imdb_rating: null },
    { show_id: '1', episode_id: episodeId, season_number: 1, episode_number: 1, imdb_rating: 8.7 },
  ],
  services: [
    { service_id: '10', name: 'Subscribed service', subscribed: true },
    { service_id: '11', name: 'Other service', subscribed: false },
  ],
  availability: [{ show_id: '1', service_id: '10' }, { show_id: '2', service_id: '11' }],
  progress: [{ episode_id: '2', watched_on: '2026-10-06', our_rating: 9.9 }],
};

test('filters use subscribed availability and IMDb only, and keep unrated shows with no minimum', () => {
  const shows = buildCatalog(fixture);
  const filters = { title: '  CRIME ', genre: 'Crime', award: 'has_award_wins', service: '10', minimum: '8.5' };
  assert.equal(shows[0].averageRating, 8.5);
  assert.deepEqual(filterCatalog(shows, filters), [shows[0]]);
  assert.deepEqual(filterCatalog(shows, { ...filters, minimum: '9' }), []);
  assert.deepEqual(filterCatalog(shows, { title: '', genre: '', award: '', service: 'subscribed', minimum: '' }), [shows[0]]);
  assert.deepEqual(filterCatalog(shows, { title: '', genre: '', award: '', service: '', minimum: '' }), shows);
  assert.equal(shows[1].averageRating, null);
});

test('progress counts rows and advances in season and episode order', () => {
  const [show, empty] = buildCatalog(fixture);
  const before = viewingProgress(show);
  assert.equal(before.next.episode_id, episodeId);
  assert.equal(before.percent, '33.3');
  before.next.progress = { watched_on: '2026-11-10', our_rating: null };
  const after = viewingProgress(show);
  assert.equal(after.watched, 2);
  assert.equal(after.percent, '66.7');
  assert.equal(after.next.episode_id, '3');
  after.next.progress = { watched_on: '2026-11-10' };
  assert.deepEqual(viewingProgress(show), { total: 3, watched: 3, percent: '100.0', next: null });
  assert.deepEqual(viewingProgress(empty), { total: 0, watched: 0, percent: '0.0', next: null });
  assert.equal(localDate(new Date(2026, 0, 4, 23, 15)), '2026-01-04');
});

test('client signs in, pages the six tables and preserves progress on a duplicate write', async t => {
  const original = { episode_id: episodeId, watched_on: '2026-10-06', our_rating: 9.1 };
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const url = new URL(input);
    const table = url.pathname.split('/').at(-1);
    calls.push({ table, params: url.searchParams, options });
    if (table === 'token') return Response.json({ access_token: 'test-token' });
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    if (options.method === 'POST') return Response.json([]);
    if (url.searchParams.has('episode_id')) return Response.json([original]);
    const offset = Number(url.searchParams.get('offset'));
    return Response.json(table === 'episodes' ? fixture.episodes.slice(offset, offset + 2) : []);
  });
  const db = createSupabase({ url: 'https://example.supabase.co', key: 'sb_publishable_test' });
  await db.signIn('household@example.invalid', 'test-password');
  const data = await db.loadCatalog();
  assert.deepEqual(data.episodes, fixture.episodes);
  assert.equal(new Set(calls.filter(call => call.params.has('order')).map(call => call.table)).size, 6);
  assert.equal(await db.markWatched(episodeId, '2026-11-10', null).then(row => row.watched_on), original.watched_on);
  const insert = calls.find(call => call.table === 'episode_progress' && call.options.method === 'POST');
  assert.match(insert.options.headers.Prefer, /resolution=ignore-duplicates/);
  assert.deepEqual(JSON.parse(insert.options.body), { episode_id: episodeId, watched_on: '2026-11-10', our_rating: null });
  assert.equal(calls.at(-1).params.get('episode_id'), `eq.${episodeId}`);
});

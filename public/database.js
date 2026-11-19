const tableQueries = {
  shows: ['show_id::text,title,primary_genre,has_award_wins,has_award_nominations', 'show_id'],
  seasons: ['show_id::text,season_number,release_date', 'show_id,season_number'],
  episodes: ['episode_id::text,show_id::text,season_number,episode_number,title,imdb_rating', 'episode_id'],
  services: ['service_id::text,name,subscribed', 'service_id'],
  availability: ['show_id::text,service_id::text,last_checked_on', 'show_id,service_id'],
  progress: ['episode_id::text,watched_on,our_rating,notes', 'episode_id'],
};
const tableNames = { services: 'streaming_services', availability: 'show_availability', progress: 'episode_progress' };

export function createDatabase({ url, key }) {
  if (url !== 'https://xayntuwdftxxacchihxb.supabase.co' || !/^sb_publishable_[\w-]+$/.test(key)) {
    throw new Error('The app requires the Final Project URL and its publishable key.');
  }

  async function request(table, parameters, options = {}) {
    const response = await fetch(`${url}/rest/v1/${table}?${parameters}`, {
      ...options,
      headers: { apikey: key, 'Content-Type': 'application/json', ...options.headers },
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message ?? `Supabase returned HTTP ${response.status}.`);
    }
    return response.json();
  }

  async function readTable(name) {
    const [select, order] = tableQueries[name];
    const parameters = new URLSearchParams({ select, order, limit: 500 });
    const rows = [];
    while (true) {
      parameters.set('offset', rows.length);
      const page = await request(tableNames[name] ?? name, parameters);
      if (!page.length) return rows;
      rows.push(...page);
    }
  }

  return {
    async loadCatalog() {
      const names = Object.keys(tableQueries);
      const values = await Promise.all(names.map(readTable));
      const catalog = Object.fromEntries(names.map((name, index) => [name, values[index]]));
      if (!catalog.shows.length) throw new Error('No shows are visible. Check the Supabase read policies.');
      return catalog;
    },
    async markWatched(episodeId, rating) {
      const select = tableQueries.progress[0];
      const parameters = new URLSearchParams({ select, on_conflict: 'episode_id' });
      const [inserted] = await request('episode_progress', parameters, {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        // The database supplies watched_on. Existing progress survives retries.
        body: JSON.stringify({ episode_id: episodeId, our_rating: rating }),
      });
      if (inserted) return inserted;
      const [existing] = await request('episode_progress', new URLSearchParams({ select, episode_id: `eq.${episodeId}` }));
      if (!existing) throw new Error('The saved row could not be read. Reload and check before trying again.');
      return existing;
    },
  };
}

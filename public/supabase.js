const tables = {
  shows: ['show_id::text,title,primary_genre,has_award_wins,has_award_nominations', 'show_id'],
  seasons: ['show_id::text,season_number,release_date', 'show_id,season_number'],
  episodes: ['episode_id::text,show_id::text,season_number,episode_number,title,imdb_rating', 'episode_id'],
  streaming_services: ['service_id::text,name,subscribed', 'service_id'],
  show_availability: ['show_id::text,service_id::text,last_checked_on', 'show_id,service_id'],
  episode_progress: ['episode_id::text,watched_on,our_rating,notes', 'episode_id'],
};

export function createSupabase({ url, key }) {
  let token;

  async function request(path, options = {}) {
    const response = await fetch(`${url}${path}`, {
      ...options,
      headers: {
        apikey: key,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(body.message || body.msg || body.error_description || `Supabase returned HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? undefined : response.json();
  }

  async function rows(table) {
    const [select, order] = tables[table];
    const params = new URLSearchParams({ select, order, limit: 500 });
    const all = [];
    // Request until an empty page to handle custom API row caps as well.
    while (true) {
      params.set('offset', all.length);
      const page = await request(`/rest/v1/${table}?${params}`);
      if (!page.length) return all;
      all.push(...page);
    }
  }

  return {
    async signIn(email, password) {
      const session = await request('/auth/v1/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      token = session.access_token;
    },
    clearSession() {
      token = undefined;
    },
    async loadCatalog() {
      const [shows, seasons, episodes, services, availability, progress] =
        await Promise.all(Object.keys(tables).map(rows));
      return { shows, seasons, episodes, services, availability, progress };
    },
    async markWatched(episodeId, watchedOn, rating) {
      const select = tables.episode_progress[0];
      const params = new URLSearchParams({ on_conflict: 'episode_id', select });
      const [saved] = await request(`/rest/v1/episode_progress?${params}`, {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        // PostgREST converts the exact ID string to the existing bigint column.
        body: JSON.stringify({ episode_id: episodeId, watched_on: watchedOn, our_rating: rating }),
      });
      if (saved) return saved;

      // Another session may already have recorded the episode. Keep its original row.
      const lookup = new URLSearchParams({ select, episode_id: `eq.${episodeId}` });
      const [existing] = await request(`/rest/v1/episode_progress?${lookup}`);
      if (!existing) throw new Error('The saved progress could not be read. Reload the catalog and try again.');
      return existing;
    },
  };
}

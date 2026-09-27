const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      let database = false;
      if (env.DB) {
        try {
          await env.DB.prepare('SELECT 1').first();
          database = true;
        } catch (_) {}
      }
      return json({ ok: true, service: 'config-web', database });
    }

    if (url.pathname === '/api/configs' && request.method === 'GET') {
      if (!env.DB) return json({ error: 'Database binding is not configured' }, 503);
      const rows = await env.DB.prepare(
        'SELECT id, name, data, created_at FROM configs ORDER BY created_at DESC LIMIT 100'
      ).all();
      return json({ configs: rows.results ?? [] });
    }

    if (url.pathname === '/api/configs' && request.method === 'POST') {
      if (!env.DB) return json({ error: 'Database binding is not configured' }, 503);
      let body;
      try { body = await request.json(); } catch (_) { return json({ error: 'Invalid JSON' }, 400); }
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const data = typeof body.data === 'string' ? body.data : JSON.stringify(body.data ?? {});
      if (!name || name.length > 100) return json({ error: 'Invalid name' }, 400);
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO configs (id, user_id, name, data) VALUES (?, ?, ?, ?)')
        .bind(id, 'system', name, data).run();
      return json({ id, name, data }, 201);
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  }
};

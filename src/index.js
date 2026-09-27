export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({ ok: true, service: 'config-web', database: Boolean(env.DB) });
    }

    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Not implemented' }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  }
};

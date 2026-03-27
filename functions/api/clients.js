const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT name FROM clients ORDER BY name ASC'
  ).all();
  return json(results.map(r => r.name));
}

export async function onRequestPost({ request, env }) {
  const { name } = await request.json();
  const trimmed = (name ?? '').trim();
  if (!trimmed) return json({ error: 'Name required' }, 400);

  await env.DB.prepare('INSERT OR IGNORE INTO clients (name) VALUES (?)').bind(trimmed).run();
  return json({ ok: true });
}

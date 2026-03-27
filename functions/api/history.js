const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    'SELECT * FROM imei_history ORDER BY timestamp DESC'
  ).all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  const records = await request.json();
  if (!Array.isArray(records) || records.length === 0) {
    return json({ error: 'Expected non-empty array' }, 400);
  }

  const stmt = env.DB.prepare(
    `INSERT OR IGNORE INTO imei_history
     (imei, tac, serial, brand, model, client, timestamp, is5g, has_physical_sim)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batch = records.map(r =>
    stmt.bind(
      r.imei, r.tac, r.serial, r.brand, r.model,
      r.client ?? '', r.timestamp,
      r.is5g === true ? 1 : r.is5g === false ? 0 : null,
      r.hasPhysicalSim === true ? 1 : r.hasPhysicalSim === false ? 0 : null
    )
  );

  await env.DB.batch(batch);
  return json({ ok: true });
}

export async function onRequestPut({ request, env }) {
  const { timestamp, client } = await request.json();
  if (typeof timestamp !== 'number' || typeof client !== 'string') {
    return json({ error: 'Invalid input' }, 400);
  }
  await env.DB.prepare(
    'UPDATE imei_history SET client = ? WHERE timestamp = ?'
  ).bind(client.trim(), timestamp).run();
  return json({ ok: true });
}

export async function onRequestDelete({ env }) {
  await env.DB.prepare('DELETE FROM imei_history').run();
  return json({ ok: true });
}

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
  const [addRes, remRes] = await Promise.all([
    env.DB.prepare('SELECT * FROM tac_additions').all(),
    env.DB.prepare('SELECT tac FROM tac_removals').all(),
  ]);

  const additions = {};
  for (const row of addRes.results) {
    additions[row.tac] = {
      brand: row.brand,
      model: row.model,
      is5g: row.is5g === 1,
      hasPhysicalSim: row.has_physical_sim === 1,
    };
  }

  return json({
    additions,
    removals: remRes.results.map(r => r.tac),
  });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();

  if (body.action === 'add') {
    const { tac, brand, model, is5g, hasPhysicalSim } = body;
    if (!/^\d{8}$/.test(tac) || !brand || !model) {
      return json({ error: 'Invalid input' }, 400);
    }
    await env.DB.prepare(
      `INSERT OR REPLACE INTO tac_additions (tac, brand, model, is5g, has_physical_sim)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(tac, brand, model, is5g ? 1 : 0, hasPhysicalSim ? 1 : 0).run();

    // If it was previously removed, un-remove it
    await env.DB.prepare('DELETE FROM tac_removals WHERE tac = ?').bind(tac).run();
    return json({ ok: true });
  }

  if (body.action === 'remove') {
    const { tac } = body;
    if (!/^\d{8}$/.test(tac)) return json({ error: 'Invalid TAC' }, 400);

    // Remove from additions if it was user-added; otherwise mark as removed
    await env.DB.prepare('DELETE FROM tac_additions WHERE tac = ?').bind(tac).run();
    await env.DB.prepare('INSERT OR IGNORE INTO tac_removals (tac) VALUES (?)').bind(tac).run();
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
}

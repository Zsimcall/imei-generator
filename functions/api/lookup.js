const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export async function onRequestPost({ request, env }) {
  const { imei } = await request.json();

  if (!imei || !/^\d{15}$/.test(imei)) {
    return json({ success: false, error: 'Must be exactly 15 digits.' }, 400);
  }

  if (!env.IMEICHECK_API_KEY) {
    return json({ success: false, error: 'Lookup not configured (missing API key).' }, 500);
  }

  // Service 11: IMEI to Brand/Model/Name — $0.01, returns structured object
  const url = `https://alpha.imeicheck.com/api/php-api/create?key=${env.IMEICHECK_API_KEY}&service=11&imei=${imei}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    return json({ success: false, error: `imeicheck.com error: ${resp.status}` }, 502);
  }

  const body = await resp.json();

  if (body.status !== 'success') {
    return json({ success: false, error: body.result || body.status || 'Lookup failed.' });
  }

  return json({
    success: true,
    imei: body.imei,
    brand: body.object?.brand  || '—',
    name:  body.object?.name   || '—',
    model: body.object?.model  || '—',
  });
}

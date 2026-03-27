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

export async function onRequestPost({ request }) {
  const { imei } = await request.json();

  if (!imei || !/^\d{15}$/.test(imei)) {
    return json({ success: false, error: 'Must be exactly 15 digits.' }, 400);
  }

  // Proxy to Cricket — Worker runs server-side so Akamai doesn't block it
  const resp = await fetch(
    'https://www.cricketwireless.com/restservices/validateequipment/v1/devices/imei/eligibility',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://www.cricketwireless.com/shop/imei-check.html',
        'Origin': 'https://www.cricketwireless.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ imei }),
    }
  );

  if (!resp.ok) {
    return json({ success: false, error: `Cricket API error: ${resp.status}` }, 502);
  }

  const body = await resp.json();
  if (!body.success) {
    return json({ success: false, error: 'No data returned for this IMEI.' });
  }

  const d = body.data;
  const net = d.network || {};
  return json({
    success: true,
    data: {
      imei,
      tac:        imei.slice(0, 8),
      make:       d.make        || 'Unknown',
      model:      d.model       || 'Unknown',
      deviceType: d.deviceType  || 'Unknown',
      blocked:    d.blockedDevice ?? false,
      locked:     d.isLocked    ?? null,
      esim:       d.esimSupport || 'Unknown',
      fiveG:      net.fiveG     ?? false,
      volte:      net.volte     ?? false,
      lte:        net.lte       ?? false,
    },
  });
}

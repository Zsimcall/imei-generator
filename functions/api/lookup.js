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

  if (!env.IMEI_INFO_API_KEY) {
    return json({ success: false, error: 'Lookup not configured (missing API key).' }, 500);
  }

  // Service 0 = Basic IMEI Check
  const url = `https://dash.imei.info/api/check/0/?API_KEY=${env.IMEI_INFO_API_KEY}&imei=${imei}`;
  const resp = await fetch(url);
  const body = await resp.json();

  if (!resp.ok) {
    return json({ success: false, error: body.detail || `IMEI.info error ${resp.status}` }, 502);
  }

  // 202 = result still processing (async service)
  if (resp.status === 202) {
    return json({ success: false, error: 'Result is still processing — try again in a few seconds.' });
  }

  if (body.status === 'Rejected' || body.status === 'Refunded') {
    return json({ success: false, error: `Check ${body.status.toLowerCase()}.` });
  }

  return json({
    success: true,
    imei: body.imei,
    service: body.service,
    result: body.result,
  });
}

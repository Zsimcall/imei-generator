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

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  const BROWSER_HEADERS = {
    'User-Agent': UA,
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };

  // Step 1: GET the IMEI check page to collect Akamai session cookies
  const pageResp = await fetch('https://www.cricketwireless.com/shop/imei-check.html', {
    headers: {
      ...BROWSER_HEADERS,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Site': 'none',
    },
  });

  // Collect all Set-Cookie values from the page response
  const rawCookies = pageResp.headers.getAll
    ? pageResp.headers.getAll('set-cookie')
    : [pageResp.headers.get('set-cookie')].filter(Boolean);

  const cookieStr = rawCookies
    .map(c => c.split(';')[0])
    .join('; ');

  // Step 2: POST the IMEI check with the session cookies
  const resp = await fetch(
    'https://www.cricketwireless.com/restservices/validateequipment/v1/devices/imei/eligibility',
    {
      method: 'POST',
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.cricketwireless.com/shop/imei-check.html',
        'Origin': 'https://www.cricketwireless.com',
        ...(cookieStr ? { 'Cookie': cookieStr } : {}),
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

const SUPABASE_API_URL = 'https://jjvbitlansidirrecrnt.functions.supabase.co/merch-catalog-api';

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-pin',
    'Vary': 'Origin'
  };
}

async function proxyMerchCatalogApi(request) {
  const cors = corsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (!['GET', 'POST'].includes(request.method)) {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors });
  }

  const inboundUrl = new URL(request.url);
  const targetUrl = new URL(SUPABASE_API_URL);
  targetUrl.search = inboundUrl.search;

  const upstreamHeaders = new Headers();
  const contentType = request.headers.get('content-type');
  const adminPin = request.headers.get('x-admin-pin');
  if (contentType) upstreamHeaders.set('content-type', contentType);
  if (adminPin) upstreamHeaders.set('x-admin-pin', adminPin);

  const upstream = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: upstreamHeaders,
    body: request.method === 'GET' ? undefined : request.body
  });

  const headers = new Headers(upstream.headers);
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  headers.set('Cache-Control', 'no-store');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/merch-catalog-api') {
      return proxyMerchCatalogApi(request);
    }
    return env.ASSETS.fetch(request);
  }
};

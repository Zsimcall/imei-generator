import * as history from '../functions/api/history.js';
import * as clients from '../functions/api/clients.js';
import * as tac from '../functions/api/tac.js';
import * as lookup from '../functions/api/lookup.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    const context = { request, env, ctx };

    if (path === '/api/history') {
      if (method === 'OPTIONS') return history.onRequestOptions(context);
      if (method === 'GET') return history.onRequestGet(context);
      if (method === 'POST') return history.onRequestPost(context);
      if (method === 'DELETE') return history.onRequestDelete(context);
    }

    if (path === '/api/clients') {
      if (method === 'OPTIONS') return clients.onRequestOptions(context);
      if (method === 'GET') return clients.onRequestGet(context);
      if (method === 'POST') return clients.onRequestPost(context);
    }

    if (path === '/api/tac') {
      if (method === 'OPTIONS') return tac.onRequestOptions(context);
      if (method === 'GET') return tac.onRequestGet(context);
      if (method === 'POST') return tac.onRequestPost(context);
    }

    if (path === '/api/lookup') {
      if (method === 'OPTIONS') return lookup.onRequestOptions(context);
      if (method === 'POST')    return lookup.onRequestPost(context);
    }

    return env.ASSETS.fetch(request);
  }
};

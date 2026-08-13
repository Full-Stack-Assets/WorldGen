import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 10000);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseBackendToken = process.env.SUPABASE_BACKEND_TOKEN;
const dist = new URL('./dist/', import.meta.url).pathname;

if (!supabaseUrl || !supabaseKey || !supabaseBackendToken) {
  console.warn('Supabase backend gateway configuration is missing; API routes will return 503.');
}

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'], ['.ico', 'image/x-icon'], ['.webmanifest', 'application/manifest+json'],
]);

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req, maxBytes = 1_000_000) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new Error('payload_too_large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function gatewayRequest(action, { projectId = null, project = null } = {}) {
  if (!supabaseUrl || !supabaseKey || !supabaseBackendToken) throw new Error('backend_not_configured');

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/worldline_backend_gateway`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_token: supabaseBackendToken,
      p_action: action,
      p_project_id: projectId,
      p_project: project,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    const error = new Error(text || `database_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : null;
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    try {
      const result = await gatewayRequest('health');
      return json(res, 200, {
        ok: result?.ok === true,
        backend: 'render-node',
        database: result?.database ?? 'supabase',
        gateway: result?.gateway ?? 'worldline_backend_gateway',
      });
    } catch (error) {
      console.error('healthcheck_failed', error instanceof Error ? error.message : error);
      return json(res, 503, { ok: false, backend: 'render-node', database: 'unavailable' });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/projects') {
    try {
      const result = await gatewayRequest('list_projects');
      return json(res, 200, { projects: Array.isArray(result?.projects) ? result.projects : [] });
    } catch (error) {
      console.error('project_list_failed', error instanceof Error ? error.message : error);
      return json(res, 500, { error: 'project_list_failed' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/projects/sync') {
    try {
      const project = await readJson(req);
      if (!project || project.schema !== 'worldline-project-v2' || !project.id || !project.title) {
        return json(res, 400, { error: 'invalid_project' });
      }
      const result = await gatewayRequest('sync_project', { project });
      return json(res, 200, {
        synced: result?.synced === true,
        projectId: result?.projectId ?? project.id,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'payload_too_large') {
        return json(res, 413, { error: 'project_payload_too_large' });
      }
      console.error('project_sync_failed', error instanceof Error ? error.message : error);
      return json(res, 500, { error: 'project_sync_failed' });
    }
  }

  const match = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (match && req.method === 'DELETE') {
    try {
      const projectId = decodeURIComponent(match[1]);
      await gatewayRequest('delete_project', { projectId });
      return json(res, 200, { deleted: true, projectId });
    } catch (error) {
      console.error('project_delete_failed', error instanceof Error ? error.message : error);
      return json(res, 500, { error: 'project_delete_failed' });
    }
  }

  return json(res, 404, { error: 'not_found' });
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const safe = normalize(requested).replace(/^\.\.(\/|\\|$)+/, '');
  let file = join(dist, safe);
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': mime.get(extname(file)) || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(body);
  } catch {
    try {
      const body = await readFile(join(dist, 'index.html'));
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(body);
    } catch {
      return json(res, 500, { error: 'frontend_not_built' });
    }
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  return serveStatic(req, res, url);
}).listen(port, '0.0.0.0', () => console.log(`Worldline v2 listening on ${port}`));

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 10000);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const dist = new URL('./dist/', import.meta.url).pathname;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase backend configuration is missing; API routes will return 503.');
}

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'], ['.ico', 'image/x-icon'], ['.webmanifest', 'application/manifest+json'],
]);

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function dbRequest(path, init = {}) {
  if (!supabaseUrl || !supabaseKey) throw new Error('backend_not_configured');
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `database_${response.status}`);
  return text ? JSON.parse(text) : null;
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    try {
      await dbRequest('worldline_projects?select=id&limit=1');
      return json(res, 200, { ok: true, backend: 'render-node', database: 'supabase' });
    } catch {
      return json(res, 503, { ok: false, backend: 'render-node', database: 'unavailable' });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/projects') {
    try {
      const rows = await dbRequest('worldline_projects?select=client_project_id,title,state,updated_at&client_project_id=not.is.null&order=updated_at.desc');
      return json(res, 200, { projects: (rows || []).map((row) => row.state).filter(Boolean) });
    } catch (error) {
      console.error(error);
      return json(res, 500, { error: 'project_list_failed' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/projects/sync') {
    try {
      const project = await readJson(req);
      if (!project || project.schema !== 'worldline-project-v2' || !project.id || !project.title) {
        return json(res, 400, { error: 'invalid_project' });
      }
      const branch = project.state?.branches?.[project.state?.activeBranchId];
      const baseline = Array.isArray(branch?.snapshots) ? branch.snapshots[0]?.metrics ?? {} : {};
      const payload = [{
        client_project_id: project.id,
        title: project.title,
        world_id: project.state?.activeWorld?.id ?? 'worldgen-prime',
        baseline_metrics: baseline,
        state: project,
        updated_at: new Date().toISOString(),
      }];
      const rows = await dbRequest('worldline_projects?on_conflict=client_project_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload),
      });
      return json(res, 200, { synced: true, projectId: rows?.[0]?.client_project_id ?? project.id });
    } catch (error) {
      console.error(error);
      return json(res, 500, { error: 'project_sync_failed' });
    }
  }

  const match = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (match && req.method === 'DELETE') {
    try {
      await dbRequest(`worldline_projects?client_project_id=eq.${encodeURIComponent(match[1])}`, { method: 'DELETE' });
      return json(res, 200, { deleted: true });
    } catch (error) {
      console.error(error);
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
    res.writeHead(200, { 'Content-Type': mime.get(extname(file)) || 'application/octet-stream' });
    return res.end(body);
  } catch {
    try {
      const body = await readFile(join(dist, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
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

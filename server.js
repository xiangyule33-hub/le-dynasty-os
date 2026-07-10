const fs = require('fs');
const http = require('http');
const path = require('path');
const { GovernanceEngine, ROLES } = require('./governance-engine');

const root = __dirname;
const deliverablesDir = path.join(root, 'deliverables');
const engine = new GovernanceEngine({ deliverablesDir });
const clients = new Set();
const port = Number(process.env.PORT || 3456);

function sendJson(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('Request body is too large.'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON body.')); }
    });
    req.on('error', reject);
  });
}

function listDeliverables() {
  if (!fs.existsSync(deliverablesDir)) return [];
  return fs.readdirSync(deliverablesDir).filter(name => name.endsWith('.md')).map(filename => {
    const fullPath = path.join(deliverablesDir, filename);
    const stat = fs.statSync(fullPath);
    const title = filename.endsWith('-decision-report.md') ? 'AI PPT Product Decision Report' : filename.replace(/\.md$/, '').replace(/-/g, ' ');
    return { filename, title, path: `deliverables/${filename}`, size: stat.size, created: stat.mtime.toISOString() };
  }).sort((a, b) => new Date(b.created) - new Date(a.created));
}

function serveFile(res, filePath, contentType) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return sendJson(res, 404, { error: 'Not found' });
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  fs.createReadStream(filePath).pipe(res);
}

engine.on('event', event => {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) client.write(message);
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(`data: ${JSON.stringify({ event: 'connected' })}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/tasks') return sendJson(res, 200, engine.snapshot().tasks);
    if (req.method === 'GET' && url.pathname === '/api/agents') return sendJson(res, 200, ROLES.map(role => ({ ...role, status: 'active' })));
    if (req.method === 'GET' && url.pathname === '/api/deliverables') return sendJson(res, 200, listDeliverables());
    if (req.method === 'GET' && url.pathname === '/api/token-usage') return sendJson(res, 200, { total: engine.snapshot().usage });
    if (req.method === 'GET' && url.pathname === '/api/workflows') return sendJson(res, 200, engine.snapshot().runs);

    if (req.method === 'POST' && url.pathname === '/api/tasks') {
      const body = await readBody(req);
      if (!body.title?.trim()) return sendJson(res, 400, { error: 'title is required' });
      const role = ROLES.find(item => item.id === Number(body.assignee)) || ROLES[0];
      const task = engine.createTask('MANUAL', role, body.title.trim(), engine.tasks.length + 1);
      return sendJson(res, 201, task);
    }

    if (req.method === 'POST' && (url.pathname === '/api/workflows' || url.pathname === '/api/workflows/demo')) {
      const body = await readBody(req);
      const objective = body.objective?.trim() || 'Compare three AI presentation product approaches and produce a product decision report.';
      if (engine.running) return sendJson(res, 409, { error: 'A workflow is already running.' });
      const accepted = { accepted: true, objective, mode: process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'offline' };
      sendJson(res, 202, accepted);
      engine.run(objective).catch(error => console.error('[workflow]', error.message));
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/deliverables/')) {
      const filename = path.basename(decodeURIComponent(url.pathname));
      return serveFile(res, path.join(deliverablesDir, filename), 'text/markdown; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/assets/dashboard.png') return serveFile(res, path.join(root, 'assets', 'dashboard.png'), 'image/png');
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) return serveFile(res, path.join(root, 'index.html'), 'text/html; charset=utf-8');
    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

if (require.main === module) {
  server.listen(port, '127.0.0.1', () => console.log(`Le Dynasty OS: http://127.0.0.1:${port}`));
}

module.exports = { server, engine, listDeliverables };

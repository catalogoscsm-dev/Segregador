const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

// ── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
const PORT        = 8787;
const STATIC_DIR  = __dirname;
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Fallback caso config.json não exista ainda
const DEFAULT_ROOT = 'C:\\Users\\joao.miguel\\Documents\\PROJETOS CSM\\catalogos\\catalogos separados\\Art Ferro 2024-25\\imagens dos produtos';

function loadConfig() {
    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const cfg = JSON.parse(raw);
        return cfg.rootFolder || DEFAULT_ROOT;
    } catch {
        return DEFAULT_ROOT;
    }
}

function saveConfig(rootFolder) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ rootFolder }, null, 2), 'utf8');
    } catch (e) {
        console.warn('[config] Não foi possível salvar config.json:', e.message);
    }
}

let ROOT_FOLDER = loadConfig();
// ─────────────────────────────────────────────────────────────────────────────

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.pdf':  'application/pdf',
    '.json': 'application/json',
    '.woff2':'font/woff2',
};

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getSubfolders(dir) {
    try {
        return fs.readdirSync(dir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    } catch { return []; }
}

// Lista catálogos irmãos: sobe dois níveis (sai de "imagens dos produtos" e do fornecedor)
// e lista subpastas que contêm "imagens dos produtos"
function listSiblingCatalogs(currentRoot) {
    try {
        const supplierDir  = path.dirname(currentRoot);       // ex: Art Ferro 2024-25
        const catalogsDir  = path.dirname(supplierDir);       // ex: catalogos separados
        const siblings     = fs.readdirSync(catalogsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        return siblings.map(name => {
            const imgDir = path.join(catalogsDir, name, 'imagens dos produtos');
            const hasImagens = fs.existsSync(imgDir);
            return {
                name,
                root: hasImagens ? imgDir : path.join(catalogsDir, name),
                hasImagens,
                current: name === path.basename(supplierDir),
            };
        });
    } catch { return []; }
}

const server = http.createServer((req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    const parsed   = url.parse(req.url, true);
    const pathname = parsed.pathname;

    // ── GET /api/folders ──────────────────────────────────────────────────────
    if (pathname === '/api/folders' && req.method === 'GET') {
        const exists  = fs.existsSync(ROOT_FOLDER);
        const folders = exists ? getSubfolders(ROOT_FOLDER) : [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ root: ROOT_FOLDER, folders, exists }));
        return;
    }

    // ── GET /api/catalogs ─────────────────────────────────────────────────────
    if (pathname === '/api/catalogs' && req.method === 'GET') {
        const catalogs = listSiblingCatalogs(ROOT_FOLDER);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ catalogs, currentRoot: ROOT_FOLDER }));
        return;
    }

    // ── POST /api/set-root ────────────────────────────────────────────────────
    if (pathname === '/api/set-root' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { root } = JSON.parse(body);
                if (!root || typeof root !== 'string') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Campo "root" obrigatório.' }));
                    return;
                }
                const newRoot = path.resolve(root.trim());
                if (!fs.existsSync(newRoot)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: `Pasta não encontrada: ${newRoot}` }));
                    return;
                }
                ROOT_FOLDER = newRoot;
                saveConfig(ROOT_FOLDER);
                const folders = getSubfolders(ROOT_FOLDER);
                console.log(`[set-root] Nova pasta raiz: ${ROOT_FOLDER} (${folders.length} subpastas)`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, root: ROOT_FOLDER, folders }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── POST /api/save ────────────────────────────────────────────────────────
    if (pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { folder, filename, data, root: reqRoot } = JSON.parse(body);

                const baseRoot = (reqRoot && typeof reqRoot === 'string') ? reqRoot : ROOT_FOLDER;
                const destDir  = path.resolve(path.join(baseRoot, folder));
                const rootRes  = path.resolve(baseRoot);
                if (!destDir.startsWith(rootRes)) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Caminho fora da pasta raiz.' }));
                    return;
                }

                if (!fs.existsSync(destDir)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: `Pasta não encontrada: ${folder}` }));
                    return;
                }

                const filePath = path.join(destDir, filename);
                fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, path: filePath }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── Ficheiros estáticos ───────────────────────────────────────────────────
    let filePath = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!path.resolve(filePath).startsWith(path.resolve(STATIC_DIR))) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const ext  = path.extname(filePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`\n✓ Servidor iniciado em http://localhost:${PORT}`);
    console.log(`  Pasta raiz: ${ROOT_FOLDER}`);
    const exists = fs.existsSync(ROOT_FOLDER);
    if (!exists) console.warn(`  ⚠ Atenção: pasta raiz não encontrada`);
    else         console.log(`  Subpastas: ${getSubfolders(ROOT_FOLDER).length} encontradas\n`);
});

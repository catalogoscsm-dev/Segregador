const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

let sharp;
try { sharp = require('sharp'); } catch { sharp = null; }

async function enhanceBuffer(buf) {
    if (!sharp) return buf;
    return sharp(buf)
        .sharpen({ sigma: 2.0, m1: 2.5, m2: 0.8 })
        .modulate({ brightness: 1.02, saturation: 1.08 })
        .png({ compressionLevel: 8, adaptiveFiltering: true })
        .toBuffer();
}

// ── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
const PORT        = 8787;
const STATIC_DIR  = __dirname;
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Fallback caso config.json não exista ainda
const DEFAULT_ROOT = 'C:\\Users\\joao.miguel\\Documents\\PROJETOS CSM\\catalogos\\catalogos separados\\Art Ferro 2024-25\\imagens dos produtos';

function loadConfig() {
    try {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(raw);
    } catch {
        return { rootFolder: DEFAULT_ROOT, enhance: false };
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ rootFolder: ROOT_FOLDER, enhance: ENHANCE, geminiApiKey: GEMINI_KEY }, null, 2), 'utf8');
    } catch (e) {
        console.warn('[config] Não foi possível salvar config.json:', e.message);
    }
}

const _cfg       = loadConfig();
let ROOT_FOLDER  = _cfg.rootFolder  || DEFAULT_ROOT;
let ENHANCE      = !!_cfg.enhance;
let GEMINI_KEY   = _cfg.geminiApiKey || '';
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

    // ── GET /api/config ───────────────────────────────────────────────────────
    if (pathname === '/api/config' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ enhance: ENHANCE, sharpAvailable: !!sharp }));
        return;
    }

    // ── POST /api/set-enhance ─────────────────────────────────────────────────
    if (pathname === '/api/set-enhance' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { enhance } = JSON.parse(body);
                ENHANCE = !!enhance;
                saveConfig();
                console.log(`[enhance] ${ENHANCE ? 'LIGADO' : 'DESLIGADO'}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, enhance: ENHANCE }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

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
                saveConfig();
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

    // ── POST /api/save-bin ───────────────────────────────────────────────────
    // Recebe o PNG em binário direto (sem base64) — mais rápido e mais leve
    if (pathname === '/api/save-bin' && req.method === 'POST') {
        const { folder, filename, root: reqRoot } = parsed.query;
        if (!folder || !filename) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Parâmetros folder e filename obrigatórios.' }));
            return;
        }
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
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const buf      = Buffer.concat(chunks);
            const filePath = path.join(destDir, filename);
            const doSave   = (finalBuf) => {
                try {
                    fs.writeFileSync(filePath, finalBuf);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true, enhanced: ENHANCE && !!sharp }));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            };
            if (ENHANCE && sharp) {
                enhanceBuffer(buf).then(doSave).catch(() => doSave(buf));
            } else {
                doSave(buf);
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

    // ── POST /api/fetch-url ──────────────────────────────────────────────────
    if (pathname === '/api/fetch-url' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { url, folder, filename } = JSON.parse(body);
                if (!url || !folder || !filename) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'url, folder e filename obrigatórios.' }));
                    return;
                }
                const destDir = path.resolve(path.join(ROOT_FOLDER, folder));
                if (!destDir.startsWith(path.resolve(ROOT_FOLDER))) {
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
                const proto = url.startsWith('https') ? require('https') : require('http');
                proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (imgRes) => {
                    if (imgRes.statusCode !== 200) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: `HTTP ${imgRes.statusCode} ao buscar imagem.` }));
                        return;
                    }
                    const chunks = [];
                    imgRes.on('data', c => chunks.push(c));
                    imgRes.on('end', () => {
                        try {
                            fs.writeFileSync(filePath, Buffer.concat(chunks));
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ ok: true }));
                        } catch (e) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: e.message }));
                        }
                    });
                }).on('error', e => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                });
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── POST /api/create-folders ─────────────────────────────────────────────
    if (pathname === '/api/create-folders' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { root, folders } = JSON.parse(body);
                if (!root || !Array.isArray(folders)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'root e folders obrigatórios.' }));
                    return;
                }
                const baseRoot = path.resolve(root.trim());
                const created = [], existed = [], errors = [];
                for (const folder of folders) {
                    const destDir = path.resolve(path.join(baseRoot, folder));
                    if (!destDir.startsWith(baseRoot)) { errors.push(folder); continue; }
                    try {
                        const wasNew = !fs.existsSync(destDir);
                        fs.mkdirSync(destDir, { recursive: true });
                        wasNew ? created.push(folder) : existed.push(folder);
                    } catch (e) { errors.push(folder); }
                }
                console.log(`[create-folders] criadas: ${created.length}, já existiam: ${existed.length}, erros: ${errors.length}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, created, existed, errors }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ── POST /api/gemini-enhance ─────────────────────────────────────────────
    if (pathname === '/api/gemini-enhance' && req.method === 'POST') {
        if (!GEMINI_KEY) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'geminiApiKey não configurada em config.json.' }));
            return;
        }
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const imgBuf  = Buffer.concat(chunks);
                const b64img  = imgBuf.toString('base64');
                const apiUrl  = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_KEY}`;
                const payload = {
                    contents: [{
                        parts: [
                            {
                                text: 'Você é um especialista em fotografia de produto de alto padrão. Melhore esta imagem de produto: aumente a nitidez, melhore o contraste, corrija o balanço de branco, deixe o fundo mais branco e limpo, e realce os detalhes do produto. Mantenha as proporções e o enquadramento originais. Retorne apenas a imagem melhorada, sem texto adicional.'
                            },
                            {
                                inline_data: { mime_type: 'image/png', data: b64img }
                            }
                        ]
                    }],
                    generationConfig: { responseModalities: ['image', 'text'] }
                };
                const apiRes = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const json = await apiRes.json();
                if (!apiRes.ok) {
                    console.error('[gemini] erro API:', JSON.stringify(json));
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: json.error?.message || 'Erro na API Gemini.' }));
                    return;
                }
                // Extrai a imagem da resposta
                const parts = json.candidates?.[0]?.content?.parts || [];
                const imgPart = parts.find(p => p.inline_data?.mime_type?.startsWith('image/'));
                if (!imgPart) {
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Gemini não retornou imagem.' }));
                    return;
                }
                const outBuf = Buffer.from(imgPart.inline_data.data, 'base64');
                console.log(`[gemini] imagem melhorada: ${Math.round(outBuf.length/1024)}KB`);
                res.writeHead(200, { 'Content-Type': imgPart.inline_data.mime_type });
                res.end(outBuf);
            } catch (e) {
                console.error('[gemini] erro interno:', e.message);
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

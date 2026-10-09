// Rendu rapide du moteur « haut de gamme » : comme render.mjs du skill motion-reel (--video-only), mais les images sont
// capturées en JPEG qualité 96 au lieu de PNG. Avec les dégradés et la lumière, l'encodage PNG prenait à lui seul 0,8 s par image.
//
//   node rendu.mjs --film <dossier> [--workers 10] [--fps 60]      (à lancer depuis le dossier qui contient <dossier>/index.html)
//   -> out/<dossier>/video_9x16.mp4 (image seule, 1080x1920) ; le son est ajouté ensuite, comme avant.
// Pour les images de contrôle (--at, --strip, --contact), continuer d'utiliser render.mjs du skill.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const ROOT = process.cwd(), FILM = opt('film', null), FPS = Number(opt('fps', 60)), WORKERS = Number(opt('workers', 6)), W = 1080, H = 1920;
if (!FILM || !fs.existsSync(path.join(ROOT, FILM, 'index.html'))) { console.error('usage : node rendu.mjs --film <dossier> [--workers 10] [--fps 60]'); process.exit(1); }
const require = createRequire(path.join(ROOT, 'x.js'));
const { chromium } = require('playwright');
const DUR = Number(JSON.parse(fs.readFileSync(path.join(ROOT, FILM, 'film.json'), 'utf8')).duration || 15);
const OUT = path.join(ROOT, 'out', FILM), FR = path.join(OUT, 'frames_jpg');
fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${FILM}/index.html?render=1&blur=1&fps=${FPS}&format=9x16&w=${W}&h=${H}`;
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
try {
  const pages = await Promise.all(Array.from({ length: WORKERS }, async () => {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error('[page]', e.message));
    await page.goto(url); await page.waitForFunction(() => window.filmReady === true, null, { timeout: 60000 });
    return page;
  }));
  const n = Math.round(DUR * FPS); let next = 0, done = 0; const t0 = Date.now();
  console.log(`rendu de ${n} images ${W}x${H} à ${FPS} i/s, ${WORKERS} pages`);
  await Promise.all(pages.map(async (page) => {
    while (next < n) {
      const i = next++;
      await page.evaluate((t) => window.seek(t), i / FPS);
      await page.screenshot({ path: path.join(FR, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 96, animations: 'disabled', caret: 'hide' });
      if (++done % 300 === 0) console.log(`  ${done}/${n} images  ${(done / ((Date.now() - t0) / 1000)).toFixed(1)} i/s`);
    }
  }));
} finally { await browser.close(); server.close(); }
const video = path.join(OUT, 'video_9x16.mp4');
const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(FR, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-movflags', '+faststart', video], { stdio: 'inherit' });
if (r.status !== 0) process.exit(1);
fs.rmSync(FR, { recursive: true, force: true });
console.log('-> ' + path.relative(ROOT, video));

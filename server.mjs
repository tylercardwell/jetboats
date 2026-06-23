import { createReadStream, existsSync, statSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, 'dist');
const port = Number(process.env.PORT || 4321);
const host = '0.0.0.0';

const contentTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

function safePath(pathname) {
  const normalizedPath = normalize(decodeURIComponent(pathname))
    .replace(/^[/\\]+/, '')
    .replace(/^(\.\.(\/|\\|$))+/, '');
  return join(publicDir, normalizedPath);
}

function resolveFilePath(pathname) {
  const basePath = safePath(pathname);

  if (existsSync(basePath) && statSync(basePath).isFile()) {
    return basePath;
  }

  if (existsSync(basePath) && statSync(basePath).isDirectory()) {
    const nestedIndex = join(basePath, 'index.html');
    if (existsSync(nestedIndex)) {
      return nestedIndex;
    }
  }

  if (!extname(basePath)) {
    const nestedIndex = join(basePath, 'index.html');
    if (existsSync(nestedIndex)) {
      return nestedIndex;
    }
  }

  if (pathname === '/' || pathname === '') {
    return join(publicDir, 'index.html');
  }

  return null;
}

async function streamFile(filePath, response, statusCode = 200) {
  await access(filePath);
  const extension = extname(filePath).toLowerCase();
  const contentType = contentTypes[extension] || 'application/octet-stream';

  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });

  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || '/', `http://${host}:${port}`);
    const filePath = resolveFilePath(requestUrl.pathname);

    if (filePath) {
      await streamFile(filePath, response);
      return;
    }

    const notFoundPath = join(publicDir, '404.html');
    if (existsSync(notFoundPath)) {
      await streamFile(notFoundPath, response, 404);
      return;
    }

    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
});

server.listen(port, host, () => {
  console.log(`Serving dist on http://${host}:${port}`);
});

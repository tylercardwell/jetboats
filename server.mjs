import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import handler from 'serve-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, 'dist');
const port = Number(process.env.PORT || 4321);
const host = '0.0.0.0';

const server = createServer((request, response) =>
  handler(request, response, {
    public: publicDir,
    cleanUrls: false,
  }),
);

server.listen(port, host, () => {
  console.log(`Serving dist on http://${host}:${port}`);
});

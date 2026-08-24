import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const publicDirectory = join(projectRoot, 'public');
const outputDirectory = join(projectRoot, '.vercel-static');

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(publicDirectory, outputDirectory, { recursive: true });

const catalogPath = join(publicDirectory, 'catalog.html');
let catalogHtml = await readFile(catalogPath, 'utf8');

const vercelHostname =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

if (vercelHostname) {
  const vercelOrigin = `https://${vercelHostname}`;
  catalogHtml = catalogHtml.replaceAll(
    'https://techpolymers-catalog-ua.fotokesh.chatgpt.site',
    vercelOrigin,
  );
}

await Promise.all([
  writeFile(join(outputDirectory, 'index.html'), catalogHtml, 'utf8'),
  writeFile(join(outputDirectory, 'catalog.html'), catalogHtml, 'utf8'),
]);

console.log('Vercel static catalog prepared in .vercel-static');

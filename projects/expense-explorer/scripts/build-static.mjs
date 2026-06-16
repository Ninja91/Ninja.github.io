import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const sourceHtmlPath = resolve(projectRoot, 'index.html.source');
const deployHtmlPath = resolve(projectRoot, 'index.html');
const distPath = resolve(projectRoot, 'dist');

const run = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const deployHtml = await readFile(deployHtmlPath, 'utf8');
const sourceHtml = await readFile(sourceHtmlPath, 'utf8');

try {
  await writeFile(deployHtmlPath, sourceHtml);
  await rm(distPath, { recursive: true, force: true });

  run('tsc', ['-b']);
  run('vite', ['build']);
} finally {
  await writeFile(deployHtmlPath, deployHtml);
}

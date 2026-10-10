import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const resolve = (...parts) => path.join(root, ...parts);
export const readJson = async (file) => JSON.parse(await readFile(resolve(file), 'utf8'));
export async function writeJson(file, value) {
  await mkdir(path.dirname(resolve(file)), { recursive: true });
  await writeFile(resolve(file), `${JSON.stringify(value, null, 2)}\n`);
}
export async function publisher() {
  try { return await readJson('distribution/publisher.json'); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export function validatePublisher(config) {
  if (!config) throw new Error('Publisher is not configured. Run npm run release:configure -- --github OWNER/REPO --npm @SCOPE/super-resume-mcp --author NAME --license UNLICENSED (or MIT).');
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})\/[a-zA-Z0-9._-]+$/u.test(config.github ?? '')) throw new Error('Invalid GitHub owner/repository.');
  if (!/^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/u.test(config.npm ?? '')) throw new Error('Use a scoped npm package name.');
  if (!config.author?.trim() || /[\r\n]/u.test(config.author)) throw new Error('A single-line publisher name is required.');
  if (!['UNLICENSED', 'MIT'].includes(config.license)) throw new Error('Choose UNLICENSED or MIT explicitly.');
  if (/^(?:your-|example|publisher\/)/iu.test(config.github) || /@(?:your-|example)/iu.test(config.npm)) throw new Error('Replace example publishing identities with your own.');
  return config;
}
export function registryMetadata(config, version) {
  validatePublisher(config);
  return {
    $schema: 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
    name: `io.github.${config.github.split('/')[0].toLowerCase()}/super-resume`,
    title: 'Super Resume',
    description: 'Extract PDF/Word text, validate and tailor resumes, export PDF/DOCX. No LLM key needed.',
    repository: { url: `https://github.com/${config.github}`, source: 'github' },
    version,
    packages: [{ registryType: 'npm', identifier: config.npm, version, transport: { type: 'stdio' } }],
  };
}
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: false, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}\n${result.stderr ?? ''}\n${result.stdout ?? ''}`);
  return result.stdout;
}
export function npm(args, options = {}) {
  const cli = process.env.npm_execpath;
  if (!cli) throw new Error('Run this script through its npm run command.');
  return run(process.execPath, [cli, ...args], options);
}

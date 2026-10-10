import { mkdir, copyFile, cp, readFile, writeFile, readdir, rm, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { zipSync } from 'fflate';
import { resolve, readJson, writeJson, publisher, validatePublisher, registryMetadata, npm } from './lib.mjs';

const pkg = await readJson('package.json');
if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/u.test(pkg.version)) throw new Error('Invalid release version.');
const owner = await publisher();
const isPublic = process.argv.includes('--publish');
if (isPublic) validatePublisher(owner);
const output = `artifacts/${pkg.version}/${isPublic ? 'public' : 'local'}`;
// Regenerate only this script's own output directory after checking its real location.
await mkdir(resolve('artifacts'), { recursive: true });
const artifactRoot = await realpath(resolve('artifacts'));
let previous;
try { previous = await realpath(resolve(output)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (previous) {
  if (!previous.startsWith(`${artifactRoot}${path.sep}`) || previous === artifactRoot) throw new Error('Unsafe artifact output location.');
  await rm(previous, { recursive: true });
}
await mkdir(resolve(output, 'npm'), { recursive: true });
await mkdir(resolve(output, 'npm/dist'), { recursive: true });
await cp(resolve('dist/assets'), resolve(output, 'npm/dist/assets'), { recursive: true });
await cp(resolve('plugins/super-resume'), resolve(output, 'plugin'), { recursive: true });
for (const [from, to] of [
  ['dist/cli.cjs', 'dist/cli.cjs'], ['dist/document-worker.mjs', 'dist/document-worker.mjs'], ['dist/THIRD_PARTY_LICENSES.txt', 'THIRD_PARTY_LICENSES.txt'],
  ['LICENSE', 'LICENSE'], ['docs/package-readme.md', 'README.md'],
]) await copyFile(resolve(from), resolve(output, 'npm', to));
const npmPackage = {
  name: owner?.npm ?? 'super-resume-mcp-local', version: pkg.version, description: pkg.description,
  license: owner?.license ?? 'UNLICENSED', private: !isPublic,
  bin: { 'super-resume-mcp': 'dist/cli.cjs' },
  files: ['dist/cli.cjs', 'dist/document-worker.mjs', 'dist/assets', 'THIRD_PARTY_LICENSES.txt', 'LICENSE', 'README.md', 'server.json'],
  engines: pkg.engines, keywords: ['mcp', 'resume', 'cv', 'json-resume', '简历'],
  ...(owner ? {
    author: owner.author, repository: { type: 'git', url: `git+https://github.com/${owner.github}.git` },
    homepage: `https://github.com/${owner.github}#readme`,
    mcpName: registryMetadata(owner, pkg.version).name, publishConfig: { access: 'public' },
  } : {}),
};
await writeJson(`${output}/npm/package.json`, npmPackage);
if (owner) {
  await writeJson(`${output}/server.json`, registryMetadata(owner, pkg.version));
  await writeJson(`${output}/npm/server.json`, registryMetadata(owner, pkg.version));
}
async function archive(directory, filename) {
  const entries = {};
  await walk(directory, entries);
  await writeFile(resolve(output, filename), zipSync(entries, { level: 6, mtime: new Date('2026-01-01T00:00:00Z') }));
  return Object.keys(entries);
}
async function walk(directory, entries, prefix = '') {
  const children = await readdir(directory, { withFileTypes: true });
  for (const entry of children.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
    if (entry.isSymbolicLink()) throw new Error('Plugin archives must be self-contained.');
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) await walk(path.join(directory, entry.name), entries, `${name}/`);
    else entries[name] = new Uint8Array(await readFile(path.join(directory, entry.name)));
  }
}
const zipName = `super-resume-plugin-${pkg.version}.zip`;
const pluginFiles = await archive(resolve(output, 'plugin'), zipName);
const marketplaceName = `super-resume-marketplace-${pkg.version}.zip`;
await cp(resolve(output, 'plugin'), resolve(output, 'marketplace/plugins/super-resume'), { recursive: true });
for (const file of ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json']) {
  await mkdir(path.dirname(resolve(output, 'marketplace', file)), { recursive: true });
  await copyFile(resolve(file), resolve(output, 'marketplace', file));
}
await copyFile(resolve('docs/plugin-install.md'), resolve(output, 'marketplace/README.md'));
const marketplaceFiles = await archive(resolve(output, 'marketplace'), marketplaceName);
const packed = JSON.parse(npm(['pack', '--json', '--ignore-scripts', '--pack-destination', resolve(output)], { cwd: resolve(output, 'npm') }))[0];
const forbidden = packed.files.filter(({ path: file }) => /(?:^|\/)(?:references|\.env|node_modules|tests|src)(?:\/|$)/u.test(file));
if (forbidden.length) throw new Error('Unexpected development or private files in npm archive.');
await writeJson(`${output}/contents.json`, { version: pkg.version, mode: isPublic ? 'public-candidate' : 'local-test', npmFiles: packed.files.map((file) => file.path), pluginFiles, marketplaceFiles, publisherConfigured: Boolean(owner) });
const checksums = [];
for (const file of [zipName, marketplaceName, packed.filename]) checksums.push(`${createHash('sha256').update(await readFile(resolve(output, file))).digest('hex')}  ${file}`);
await writeFile(resolve(output, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`);
console.log(`Created ${output}: ${marketplaceName}, ${zipName}, ${packed.filename}. ${isPublic ? 'Public candidate prepared; publishing still requires account authentication and explicit publish commands.' : 'Local package only; it is marked private and has not been published.'}`);

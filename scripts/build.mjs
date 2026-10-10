import { build } from 'esbuild';
import { mkdir, readFile, writeFile, readdir, copyFile, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { root, resolve, readJson, writeJson, publisher, registryMetadata } from './lib.mjs';

const pkg = await readJson('package.json');
const owner = await publisher();
const template = await readJson('distribution/server.template.json');
template.version = pkg.version;
template.packages[0].version = pkg.version;
await writeJson('distribution/server.template.json', template);
await mkdir(resolve('dist'), { recursive: true });
const built = await build({
  absWorkingDir: root, entryPoints: ['src/cli.ts'], outfile: 'dist/cli.cjs',
  bundle: true, platform: 'node', format: 'cjs', target: 'node22',
  metafile: true, sourcemap: false, legalComments: 'eof', logLevel: 'warning',
  banner: { js: 'const __resumeWorkerPath = __dirname + "/document-worker.mjs"; const __resumeThemePath = __dirname + "/assets/themes/";' },
  define: { SUPER_RESUME_WORKER_PATH: '__resumeWorkerPath', SUPER_RESUME_THEME_PATH: '__resumeThemePath' },
  logOverride: { 'empty-import-meta': 'silent' },
});
const worker = await build({
  absWorkingDir: root, entryPoints: ['src/core/documents/worker.ts'], outfile: 'dist/document-worker.mjs',
  bundle: true, platform: 'node', format: 'esm', target: 'node22',
  metafile: true, sourcemap: false, legalComments: 'eof', logLevel: 'warning',
  banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url); const __resumeFontPath = new URL("./assets/fonts/NotoSansCJKsc-Regular.otf", import.meta.url); const __resumeThemePath = new URL("./assets/themes/", import.meta.url); const __resumeDecorationPath = new URL("./assets/decorations/", import.meta.url);' },
  define: { SUPER_RESUME_FONT_PATH: '__resumeFontPath', SUPER_RESUME_THEME_PATH: '__resumeThemePath', SUPER_RESUME_DECORATION_PATH: '__resumeDecorationPath' },
  external: ['@napi-rs/canvas'],
});
const fontSource = JSON.parse((await readFile(resolve('assets/fonts/source.json'), 'utf8')).replace(/^\uFEFF/u, ''));
{
  const hash = createHash('sha256').update(await readFile(resolve('assets/fonts/NotoSansCJKsc-Regular.otf'))).digest('hex');
  if (hash !== fontSource.sha256) throw new Error('Bundled font differs from the pinned source hash.');
}
await cp(resolve('assets'), resolve('dist/assets'), { recursive: true });
const lock = await readJson('package-lock.json');
const inputs = [...Object.keys(built.metafile.inputs), ...Object.keys(worker.metafile.inputs)].map((file) => file.replaceAll('\\', '/'));
const notices = ['Super Resume bundled dependencies', 'Generated from actual bundle inputs. Upstream reference checkouts are not bundled.', ''];
for (const dependency of Object.keys(lock.packages).filter((name) => name.startsWith('node_modules/')).sort()) {
  if (!inputs.some((input) => input.startsWith(`${dependency}/`))) continue;
  const info = await readJson(`${dependency}/package.json`);
  notices.push(`===== ${info.name} ${info.version} (${info.license ?? 'See below'}) =====`);
  const files = await readdir(resolve(dependency));
  const licenses = files.filter((file) => /^(LICENSE|LICENCE|COPYING|NOTICE)(?:\.|$|-)/iu.test(file));
  if (licenses.length === 0) {
    // These exact releases place their declaration in README rather than a
    // standalone license. Preserve that text and add the full MIT grant.
    const readmeLicensed = ['fontkit@2.0.4', 'dfa@1.2.0', 'brotli@1.3.3', 'hash.js@1.1.7', 'isarray@1.0.0'];
    if (readmeLicensed.includes(`${info.name}@${info.version}`)) {
      const filename = files.find((name) => /^readme\.md$/iu.test(name));
      const readme = await readFile(resolve(dependency, filename), 'utf8');
      const license = readme.match(/^#+\s*LICENSE\s*\r?\n[\s\S]*$/imu)?.[0];
      if (!license || !/\bMIT\b/u.test(license)) throw new Error(`Expected MIT README declaration for ${info.name}`);
      notices.push(`Author metadata: ${typeof info.author === 'string' ? info.author : info.author?.name}`, license);
      if (!license.includes('Permission is hereby granted')) notices.push((await readFile(resolve('assets/licenses/MIT.txt'), 'utf8')).replace(/^Copyright.*\r?\n/imu, ''));
      if (info.name === 'brotli') notices.push('Decoder copyright 2013 Google Inc. All Rights Reserved.', await readFile(resolve('assets/licenses/PDFjs-Apache-2.0.txt'), 'utf8'));
    } else if (info.name === 'saxes' && info.version === '6.0.0') notices.push(await readFile(resolve('assets/licenses/saxes-6.0.0-ISC.txt'), 'utf8'));
    else throw new Error(`Bundled dependency has no license file: ${info.name}`);
  }
  for (const file of licenses) notices.push(await readFile(resolve(dependency, file), 'utf8'));
}
notices.push('===== Noto Sans CJK SC (OFL-1.1) =====', await readFile(resolve('assets/fonts/OFL.txt'), 'utf8'));
notices.push('===== Mozilla PDF.js 6.1.200 bundled by unpdf (Apache-2.0) =====', 'Copyright Mozilla Foundation and contributors. Source: https://github.com/mozilla/pdf.js/tree/v6.1.200', await readFile(resolve('assets/licenses/PDFjs-Apache-2.0.txt'), 'utf8'));
await writeFile(resolve('dist/THIRD_PARTY_LICENSES.txt'), `${notices.join('\n\n')}\n`);
await mkdir(resolve('plugins/super-resume/bin'), { recursive: true });
await copyFile(resolve('dist/cli.cjs'), resolve('plugins/super-resume/bin/super-resume.cjs'));
await copyFile(resolve('dist/document-worker.mjs'), resolve('plugins/super-resume/bin/document-worker.mjs'));
await cp(resolve('dist/assets'), resolve('plugins/super-resume/bin/assets'), { recursive: true });
await copyFile(resolve('dist/THIRD_PARTY_LICENSES.txt'), resolve('plugins/super-resume/THIRD_PARTY_LICENSES.txt'));
await copyFile(resolve('LICENSE'), resolve('plugins/super-resume/LICENSE'));
for (const file of ['plugins/super-resume/plugin.json', 'plugins/super-resume/.claude-plugin/plugin.json']) {
  const manifest = await readJson(file);
  manifest.version = pkg.version;
  if (owner) {
    manifest.author = { name: owner.author };
    manifest.repository = `https://github.com/${owner.github}`;
    manifest.homepage = `https://github.com/${owner.github}#readme`;
    manifest.license = owner.license;
  }
  await writeJson(file, manifest);
}
if (owner) await writeJson('distribution/server.json', registryMetadata(owner, pkg.version));
console.log(`Built MCP ${pkg.version} and self-contained plugin at ${path.relative(root, resolve('plugins/super-resume'))}.`);

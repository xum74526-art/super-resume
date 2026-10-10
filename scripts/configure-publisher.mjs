import { readFile, writeFile } from 'node:fs/promises';
import { readJson, writeJson, validatePublisher, registryMetadata, resolve } from './lib.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || !args.length) {
  console.log('npm run release:configure -- --github OWNER/REPO --npm @SCOPE/super-resume-mcp --author "Publisher name" --license UNLICENSED|MIT');
  process.exit(args.includes('--help') ? 0 : 1);
}
const config = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--github', '--npm', '--author', '--license'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Invalid arguments. Run with --help.');
  config[args[i].slice(2)] = args[i + 1];
}
validatePublisher(config);
const pkg = await readJson('package.json');
await writeJson('distribution/publisher.json', config);
await writeJson('distribution/server.json', registryMetadata(config, pkg.version));
const licenseText = config.license === 'MIT'
  ? (await readFile(resolve('distribution/licenses/MIT.txt'), 'utf8')).replaceAll('{{COPYRIGHT_HOLDER}}', config.author)
  : `Copyright (c) 2026 ${config.author}. All rights reserved.\n\nNo license is granted for original Super Resume code. Third-party components retain their respective licenses; see THIRD_PARTY_LICENSES.txt.\n`;
await writeFile(resolve('LICENSE'), licenseText);
const marketplace = await readJson('.claude-plugin/marketplace.json');
marketplace.owner = { name: config.author };
await writeJson('.claude-plugin/marketplace.json', marketplace);
console.log('Publisher identity configured locally. Run npm run release:pack:public. No repository, account, or package has been created or published.');

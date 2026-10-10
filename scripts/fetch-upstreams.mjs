import { mkdir, access } from 'node:fs/promises';
import { readJson, resolve, run } from './lib.mjs';

const lock = await readJson('references/upstream.lock.json');
await mkdir(resolve('references/upstream'), { recursive: true });
for (const item of lock.projects) {
  if (!/^[a-z0-9-]+$/u.test(item.directory) || !/^[a-f0-9]{40}$/u.test(item.commit) || !/^https:\/\/github\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.git$/u.test(item.repository)) throw new Error('Invalid upstream lock entry.');
  const target = resolve('references/upstream', item.directory);
  let exists = true;
  try { await access(target); } catch { exists = false; }
  if (exists) {
    const remote = run('git', ['-C', target, 'remote', 'get-url', 'origin']).trim();
    const commit = run('git', ['-C', target, 'rev-parse', 'HEAD']).trim();
    const dirty = run('git', ['-C', target, 'status', '--porcelain']).trim();
    if (remote !== item.repository || commit !== item.commit || dirty) throw new Error(`${item.directory} differs from the lock or has local changes. Existing checkout was left untouched.`);
    console.log(`Verified ${item.directory} at ${commit.slice(0, 12)}`);
    continue;
  }
  run('git', ['init', target]);
  run('git', ['-C', target, 'remote', 'add', 'origin', item.repository]);
  if (item.sparsePaths?.length) {
    run('git', ['-C', target, 'sparse-checkout', 'init', '--cone']);
    run('git', ['-C', target, 'sparse-checkout', 'set', ...item.sparsePaths]);
  }
  run('git', ['-C', target, 'fetch', '--depth=1', 'origin', item.commit]);
  run('git', ['-C', target, 'checkout', '--detach', 'FETCH_HEAD']);
  console.log(`Fetched ${item.directory} at ${item.commit.slice(0, 12)}`);
}

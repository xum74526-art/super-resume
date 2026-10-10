// Compatibility entry point; the typed generator owns the complete catalog.
import { run, resolve } from './lib.mjs';
run(process.execPath, ['--import', 'tsx', resolve('scripts/generate-design-samples.ts')], { stdio: 'inherit' });

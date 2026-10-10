import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from './lib.mjs';
// Local authoring helper. The generated originals are kept outside release assets.
const [python,female,male]=process.argv.slice(2);
if(!python||!female||!male)throw new Error('Pass bundled Python and the two generated portrait paths.');
await mkdir(resolve('artifacts/design-research/portraits'),{recursive:true});
await mkdir(resolve('assets/samples'),{recursive:true});
for(const [name,source] of [['female',female],['male',male]]){
 await copyFile(source,resolve(`artifacts/design-research/portraits/${name}-original.png`));
 const result=spawnSync(python,['-c','from PIL import Image; import sys; im=Image.open(sys.argv[1]).convert("RGB"); im.thumbnail((360,450)); im.save(sys.argv[2],quality=85,optimize=True)',source,resolve(`assets/samples/${name}.jpg`)],{encoding:'utf8'});
 if(result.status!==0)throw new Error(result.stderr);
}
const portraits={};for(const name of ['female','male'])portraits[name]='data:image/jpeg;base64,'+(await readFile(resolve(`assets/samples/${name}.jpg`))).toString('base64');
await writeFile(resolve('assets/samples/portraits.json'),JSON.stringify(portraits)+'\n');
console.log('Two fictional ImageGen portraits prepared as small local JPEGs.');

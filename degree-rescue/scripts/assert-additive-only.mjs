import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

// Historical filename retained for workflow compatibility. This is a *scope*
// guard, not a ban on editing academic files after the first PR is merged.
const root=resolve(import.meta.dirname,'../..');
const changed=execFileSync('git',[
  'diff','--name-only','--no-renames','origin/main...HEAD',
],{cwd:root,encoding:'utf8',maxBuffer:1024*1024}).trim().split('\n').filter(Boolean);
const allowed=path=>path.startsWith('degree-rescue/')
  ||/^\.github\/workflows\/degree-rescue-[a-z0-9-]+\.yml$/.test(path);
const offenders=changed.filter(path=>!allowed(path));
if(offenders.length){
  throw new Error('Protected original Hanmo files changed:\n'+offenders.join('\n'));
}
console.log('Original Hanmo untouched: '+changed.length+' changed academic/CI files only.');

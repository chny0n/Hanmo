import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const text=execFileSync('git',['diff','--name-status','origin/main...HEAD'],{
  cwd:root,encoding:'utf8',maxBuffer:1024*1024
});
const allowed=(p)=>p.startsWith('degree-rescue/')
  ||p.startsWith('docs/superpowers/plans/')
  ||p.startsWith('docs/superpowers/specs/')
  ||/^\.github\/workflows\/degree-rescue-[a-z0-9-]+\.yml$/.test(p);
const offenders=[];
for(const line of text.trim().split('\n')){
  if(!line)continue;
  const fields=line.split('\t');
  const status=fields[0];
  const path=fields[1];
  if(status!=='A'||!allowed(path))offenders.push(line);
}
if(offenders.length){
  throw new Error('Original Hanmo or disallowed paths changed:\n'+offenders.join('\n'));
}
console.log('Additive-only guard: original Hanmo untouched; new files restricted to Degree Rescue and its CI/docs.');

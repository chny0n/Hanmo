import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

// 과거 파일명은 워크플로 호환성을 위해 유지한다.
// 이 검사는 코드 변경 범위를 제한하는 장치이지 첫 PR 병합 후 학업 파일 수정을 금지하지 않는다.
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

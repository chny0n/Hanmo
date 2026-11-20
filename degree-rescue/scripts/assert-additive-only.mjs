import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

// UI redesign is explicitly approved for public student entry and academic screens.
// Preserve the HUFS-mimicking practice/selectZone HTML, JS and shared practice CSS.
const root=resolve(import.meta.dirname,'../..');
const changed=execFileSync('git',[
  'diff','--name-only','--no-renames','origin/main...HEAD',
],{cwd:root,encoding:'utf8',maxBuffer:1024*1024}).trim().split('\n').filter(Boolean);
const protectedFiles=new Set([
 'html/practice.html','html/selectZone.html',
 'js/practice.js','js/selectZone.js','css/practice.css',
]);
const forbidden=changed.filter(path=>protectedFiles.has(path));
if(forbidden.length)throw Error('Protected HUFS-like practice source changed:\n'+forbidden.join('\n'));
const allowed=path=>path.startsWith('degree-rescue/')
  ||path==='index.html'
  ||path.startsWith('html/')
  ||path==='css/student-ui.css'
  ||/^js\/student-[a-z0-9-]+\.js$/.test(path)
  ||/^tests\/student-[a-z0-9-]+\.test\.cjs$/.test(path)
  ||path==='.github/workflows/deploy-pages.yml'
  ||/^\.github\/workflows\/degree-rescue-[a-z0-9-]+\.yml$/.test(path);
const unexpected=changed.filter(path=>!allowed(path));
if(unexpected.length)throw Error('Out-of-scope UI changes:\n'+unexpected.join('\n'));
console.log('Protected course-registration imitation unchanged; '+changed.length+' allowed UI/academic files changed.');

import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const changed=execFileSync('git',['diff','--name-only','--no-renames','origin/main...HEAD'],
 {cwd:root,encoding:'utf8',maxBuffer:4*1024*1024}).trim().split('\n').filter(Boolean);
// #116 사용자가 selectZone.html·selectZone.js·practice.css의 제한된 확장을 승인했다.
// practice.html·practice.js와 기존 모의신청 진입 CSS는 계속 원본 보호 대상으로 둔다.
const protectedFiles=new Set(['html/practice.html','js/practice.js','css/vsugang.css']);
const offenders=changed.filter(path=>protectedFiles.has(path));
if(offenders.length)throw Error('Protected HUFS imitation changed:\n'+offenders.join('\n'));
// 원본의 비공식 브랜딩 정리 대상 자산만 동기화하도록 허용합니다.
const allowed=p=>p.startsWith('degree-rescue/')||p.startsWith('js/academic/')||(p.startsWith('js/scenario-')||['js/capacity-settings.js','js/academic-calendar.js','js/academic-faq.js','js/academic-support.js','js/selectZone.js','js/student-preferences.js','js/student-profile-bar.js','js/incident-options.js','js/incident-404.js','js/hanmoSys.js','js/index.js','js/home-fit.js','js/result.js','js/vsugang-fit.js','js/academic-data-source.js','js/student-notices.js','js/student-catalog.js','js/student-progress.js','js/vsugang.js'].includes(p))
 ||p.startsWith('docs/')||p.startsWith('scripts/')||p.startsWith('data/')
 ||p.startsWith('tests/')||p.startsWith('e2e/')||p.startsWith('css/')||p.startsWith('html/')
 ||['img/background.svg','img/hanmo_color.png','img/watermark.png'].includes(p)
 ||p.startsWith('.github/workflows/')||['index.html','package.json','jsconfig.json','tsconfig.json',
 '.gitignore','README.md','AGENTS.md','agent.md','sitemap.xml',
 'package-lock.json','playwright.config.mjs'].includes(p);
const unexpected=changed.filter(p=>!allowed(p));
if(unexpected.length)throw Error('Unexpected files:\n'+unexpected.join('\n'));
console.log('Original HUFS registration imitation preserved; '+changed.length+' scoped changes.');

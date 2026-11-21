// @ts-check
// 모든 학업 JavaScript 파일을 Node 파서로 확인하고 TypeScript 잔여 파일을 차단한다.
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
function find(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?find(join(dir,x.name)):x.isFile()&&x.name.endsWith('.js')?[join(dir,x.name)]:[]);}
const files=find('js/academic');
for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
console.log('JavaScript 정적 구문 검사 통과: '+files.length+'개');

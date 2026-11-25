import {readdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const directory=resolve(import.meta.dirname,'../.github/workflows');
for(const name of readdirSync(directory).filter(name=>/\.ya?ml$/.test(name))){
  const lines=readFileSync(resolve(directory,name),'utf8').split(/\r?\n/);
  for(const [index,line] of lines.entries()){
    if(!/^\s*(?:-\s*)?uses\s*:/.test(line))continue;
    const match=line.match(/^\s*(?:-\s*)?uses\s*:\s*(['"]?)([^'"\s#]+)\1\s*(?:#.*)?$/);
    if(!match||(!match[2].startsWith('./')&&!/^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/.test(match[2])))
      throw new Error('Action SHA 고정 누락: '+name+':'+(index+1));
  }
}
console.log('외부 GitHub Actions SHA 고정 검사 통과');

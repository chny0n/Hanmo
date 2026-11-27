// @ts-check
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

/** @param {string} root @param {readonly string[]} paths @returns {Map<string,string>} */
export function gitBlobHashes(root,paths){
  if(paths.length===0)return new Map();

  // 각 경로에 적용되는 Git 필터를 유지한 채 작업 트리 파일을 한 번에 읽는다.
  let output;
  try{
    output=execFileSync('git',['hash-object','--stdin-paths'],{
      cwd:root,encoding:'utf8',stdio:['pipe','pipe','ignore'],
      input:paths.map(path=>JSON.stringify(path)).join('\n')+'\n',
    });
  }catch{
    // Git을 실행할 수 없는 정적 아카이브에서는 파일 바이트로 계산한다.
    return new Map(paths.map(path=>{
      const data=readFileSync(resolve(root,path));
      return [path,createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex')];
    }));
  }
  const hashes=output.trim().split(/\r?\n/);
  if(hashes.length!==paths.length)throw new Error('Git blob 해시 수가 파일 수와 다릅니다.');
  return new Map(paths.map((path,index)=>[path,hashes[index]]));
}

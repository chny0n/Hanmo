// @ts-check
// 남은 TypeScript 소스와 테스트를 한 번만 JavaScript/JSDoc으로 옮긴다.
import ts from 'typescript';
import {readFileSync,writeFileSync,rmSync,renameSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {dirname,join,extname,relative} from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const ignored=new Set(['.git','node_modules','dist','.build','coverage','.cache']);
function walk(dir,prefix=''){
  return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(entry.isDirectory()&&ignored.has(entry.name))return [];
    const rel=prefix?prefix+'/'+entry.name:entry.name;
    if(entry.isDirectory())return walk(join(dir,entry.name),rel);
    return entry.isFile()?[rel]:[];
  });
}
const all=walk(root);
const old=all.filter(p=>/\.(?:ts|tsx|mts|cts)$/.test(p));
if(old.length!==42)throw Error('예상한 TypeScript 42개와 실제 파일 수가 다릅니다: '+old.length);

// TypeScript 컴파일러의 파서/출력기로 문법을 변환해 실행 순서와 주석을 보존한다.
function docsOf(sf){
  const defs=[],functions=[];
  // JSDoc 안에 다른 블록 주석을 넣으면 컴파일이 손상되므로 타입 선언에서 분리한다.
  const safe=text=>text.replace(/\/\*[\s\S]*?\*\//g,' ')
    .replace(/^\s*\/\/[^\r\n]*/gm,' ')
    .replace(/\s+/g,' ').replace(/;{2,}/g,';').trim();
  for(const st of sf.statements){
    if(ts.isInterfaceDeclaration(st)||ts.isTypeAliasDeclaration(st)){
      const name=st.name.text;
      let shape;
      if(ts.isInterfaceDeclaration(st)){
        const members=st.members.map(m=>safe(m.getText(sf))).join('; ');
        const bases=st.heritageClauses?.flatMap(h=>h.types.map(v=>safe(v.getText(sf))))??[];
        shape=(bases.length?bases.join(' & ')+' & ':'')+'{ '+members+' }';
      }else shape=safe(st.type.getText(sf));
      defs.push('/** @typedef {'+shape+'} '+name+' */');
    }
    if(ts.isImportDeclaration(st)&&st.importClause){
      const from=st.moduleSpecifier.text;
      const clause=st.importClause;
      if(clause.isTypeOnly&&clause.name)
        defs.push('/** @typedef {import('+JSON.stringify(from)+').default} '+clause.name.text+' */');
      if(clause.namedBindings&&ts.isNamedImports(clause.namedBindings)){
        for(const spec of clause.namedBindings.elements){
          if(!clause.isTypeOnly&&!spec.isTypeOnly)continue;
          const remote=spec.propertyName?.text??spec.name.text;
          defs.push('/** @typedef {import('+JSON.stringify(from)+').'+remote+'} '+spec.name.text+' */');
        }
      }
    }
    if(ts.isFunctionDeclaration(st)&&st.body&&st.name&&
       (st.parameters.some(p=>p.type)||st.type||st.typeParameters?.length)){
      const items=[];
      for(const param of st.typeParameters??[])items.push(' * @template '+param.name.text);
      for(const param of st.parameters){
        const name=ts.isIdentifier(param.name)?param.name.text:'argument';
        const type=param.type?safe(param.type.getText(sf)):'unknown';
        items.push(' * @param {'+type+'} '+(param.questionToken||param.initializer?'['+name+']':name));
      }
      if(st.type)items.push(' * @returns {'+(st.type.kind===ts.SyntaxKind.TypePredicate?'void':safe(st.type.getText(sf)))+'} 기능 결과');
      if(items.length)functions.push({name:st.name.text,doc:'/**\n'+items.join('\n')+'\n */'});
    }
  }
  return {defs,functions};
}
for(const path of old){
  const absolute=join(root,path);
  const input=readFileSync(absolute,'utf8');
  const sf=ts.createSourceFile(path,input,ts.ScriptTarget.Latest,true,path.endsWith('.js')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  if(sf.parseDiagnostics.length)throw Error(path+': TypeScript 구문 오류 '+sf.parseDiagnostics.map(d=>d.messageText).join(','));
  const {defs,functions}=docsOf(sf);
  // 유효한 TypeScript 원본에서 먼저 실행 코드를 생성하고, 이후 주석만 덧붙인다.
  const converted=ts.transpileModule(input,{
    fileName:path,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,removeComments:false,jsx:ts.JsxEmit.Preserve,
      esModuleInterop:true,verbatimModuleSyntax:false}
  });
  if(converted.diagnostics?.length)throw Error(path+': 변환 진단 '+converted.diagnostics.map(d=>d.messageText).join(','));
  let output='// @ts-check\n'+(defs.length?defs.join('\n')+'\n':'')+converted.outputText;
  // 생성된 JavaScript에만 JSDoc을 연결해 원본 구문 해석을 바꾸지 않는다.
  for(const fn of functions){
    const candidates=['export async function ','export function ','async function ','function '];
    for(const prefix of candidates){
      const marker=prefix+fn.name+'(';
      if(!output.includes(marker))continue;
      output=output.replace(marker,fn.doc+'\n'+marker);
      break;
    }
  }
  // 코드나 검사 도구가 아직 참조하는 TypeScript 원본 경로를 JavaScript에 맞춘다.
  output=output.replace(/(\.test|\.property)?\.js?\b/g,match=>match.replace(/\.js?$/,'.js'));
  const next=absolute.replace(/\.(?:ts|tsx|mts|cts)$/,'.js');
  if(existsSync(next))throw Error('JS 파일과 이름 충돌: '+next);
  writeFileSync(next,output);
  rmSync(absolute);
  console.log('이관: '+path+' -> '+relative(root,next));
}

// 신규 소스의 런타임 경로와 테스트에 남은 직접 파일명 참조를 수정한다.
for(const path of walk(root)){
  if(!/\.(?:js|mjs|cjs|json|yml|yaml)$/.test(path))continue;
  if(path.startsWith('js/')&&!path.startsWith('js/academic/'))continue;
  if(path.startsWith('scripts/baselines/'))continue;
  const absolute=join(root,path),input=readFileSync(absolute,'utf8');
  const updated=input.replace(/(\.test|\.property)?\.js?\b/g,match=>match.replace(/\.js?$/,'.js'));
  if(updated!==input)writeFileSync(absolute,updated);
}

if(walk(root).some(path=>/\.(?:ts|tsx|mts|cts)$/.test(path)))throw Error('TS 파일 잔여');
console.log('이관 완료: TypeScript 42개 -> JavaScript 42개. CI 회귀 검사 후 검수 필요.');

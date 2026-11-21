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
  const defs=[],before=[];
  for(const st of sf.statements){
    if(ts.isInterfaceDeclaration(st)||ts.isTypeAliasDeclaration(st)){
      const name=st.name.text;
      let shape;
      if(ts.isInterfaceDeclaration(st)){
        const members=st.members.map(m=>m.getText(sf)).join('; ');
        const bases=st.heritageClauses?.flatMap(h=>h.types.map(v=>v.getText(sf)))??[];
        shape=(bases.length?bases.join(' & ')+' & ':'')+'{ '+members+' }';
      }else shape=st.type.getText(sf);
      defs.push('/** @typedef {'+shape+'} '+name+' */');
    }
    if(ts.isImportDeclaration(st)&&st.importClause){
      const from=st.moduleSpecifier.text;
      const clause=st.importClause;
      if(clause.isTypeOnly&&clause.name)defs.push('/** @typedef {import('+JSON.stringify(from)+').default} '+clause.name.text+' */');
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
        const type=param.type?.getText(sf)??'unknown';
        items.push(' * @param {'+type+'} '+(param.questionToken||param.initializer?'['+name+']':name));
      }
      if(st.type)items.push(' * @returns {'+(st.type.kind===ts.SyntaxKind.TypePredicate?'void':st.type.getText(sf))+'} 실행 결과');
      if(items.length)before.push({pos:st.getStart(sf),str:'/**\n'+items.join('\n')+'\n */\n'});
    }
    if(ts.isVariableStatement(st)&&st.declarationList.declarations.length===1){
      const d=st.declarationList.declarations[0];
      if(d.type)before.push({pos:st.getStart(sf),str:'/** @type {'+d.type.getText(sf)+'} */\n'});
    }
  }
  return {defs,before};
}
for(const path of old){
  const absolute=join(root,path);
  const input=readFileSync(absolute,'utf8');
  const sf=ts.createSourceFile(path,input,ts.ScriptTarget.Latest,true,path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  if(sf.parseDiagnostics.length)throw Error(path+': TypeScript 구문 오류 '+sf.parseDiagnostics.map(d=>d.messageText).join(','));
  const {defs,before}=docsOf(sf);
  let annotated=input;
  for(const insertion of before.sort((a,b)=>b.pos-a.pos))annotated=annotated.slice(0,insertion.pos)+insertion.str+annotated.slice(insertion.pos);
  const converted=ts.transpileModule(annotated,{
    fileName:path,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,removeComments:false,jsx:ts.JsxEmit.Preserve,
      esModuleInterop:true,verbatimModuleSyntax:false}
  });
  if(converted.diagnostics?.length)throw Error(path+': 변환 진단 '+converted.diagnostics.map(d=>d.messageText).join(','));
  let output='// @ts-check\n'+(defs.length?defs.join('\n')+'\n':'')+converted.outputText;
  // 코드나 검사 도구가 아직 참조하는 TypeScript 원본 경로를 JavaScript에 맞춘다.
  output=output.replace(/(\.test|\.property)?\.tsx?\b/g,match=>match.replace(/\.tsx?$/,'.js'));
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
  const updated=input.replace(/(\.test|\.property)?\.tsx?\b/g,match=>match.replace(/\.tsx?$/,'.js'));
  if(updated!==input)writeFileSync(absolute,updated);
}

// 이제 입력 소스는 JavaScript다. TypeScript 전용 파일명·커맨드를 제거한다.
const packagePath=join(root,'package.json');
const pkg=JSON.parse(readFileSync(packagePath,'utf8'));
pkg.scripts.build=pkg.scripts.build.replaceAll('.ts --bundle','.js --bundle');
delete pkg.scripts.typecheck;
pkg.scripts['check:syntax']='node scripts/check-js-syntax.mjs';
pkg.scripts.check=pkg.scripts.check.replace('npm run typecheck','npm run check:syntax');
writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
rmSync(join(root,'tsconfig.json'));
writeFileSync(join(root,'jsconfig.json'),JSON.stringify({
  compilerOptions:{target:'ES2022',lib:['ES2022','DOM'],module:'ESNext',moduleResolution:'Bundler',
    checkJs:true,allowJs:true,noEmit:true},
  include:['js/academic/**/*.js']
},null,2)+'\n');

const boundaryPath=join(root,'scripts/assert-language-boundary.mjs');
let boundary=readFileSync(boundaryPath,'utf8');
boundary=boundary.replace(/^const baseline=.*\n/m,'');
const begin=boundary.indexOf('const permitted=new Map('),end=boundary.indexOf('for(const path of academicJs)',begin);
if(begin<0||end<begin)throw Error('언어 경계 검사의 이전 목록 위치를 찾지 못했습니다');
boundary=boundary.slice(0,begin)+
  "if(all.length)throw Error('저장소에 TypeScript 소스가 남아 있습니다: '+all.join(', '));\n"+
  boundary.slice(end);
boundary=boundary.replace(/console\.log\('Existing TypeScript left to migrate: '[\s\S]*?;\n/,"console.log('TypeScript 소스 파일: 0개 (JavaScript 전용)');\n");
writeFileSync(boundaryPath,boundary);
rmSync(join(root,'scripts/baselines/ts-migration.json'));

// 파서 기반 주석 검사는 TypeScript를 코드 언어로 허용하지 않고 JS 주석 토큰만 검사한다.
// 기존 JSDoc 편집기 검사는 유지하고 CI의 실행 언어는 JavaScript로 제한한다.
const syntaxPath=join(root,'scripts/check-js-syntax.mjs');
writeFileSync(syntaxPath,
"// @ts-check\n"+
"// 모든 학업 JavaScript 파일을 Node 파서로 확인하고 TypeScript 잔여 파일을 차단한다.\n"+
"import {readdirSync} from 'node:fs';\n"+
"import {join} from 'node:path';\n"+
"import {execFileSync} from 'node:child_process';\n"+
"function find(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?find(join(dir,x.name)):x.isFile()&&x.name.endsWith('.js')?[join(dir,x.name)]:[]);}\n"+
"const files=find('js/academic');\n"+
"for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'pipe'});\n"+
"console.log('JavaScript 정적 구문 검사 통과: '+files.length+'개');\n");

if(walk(root).some(path=>/\.(?:ts|tsx|mts|cts)$/.test(path)))throw Error('TS 파일 잔여');
console.log('이관 완료: TypeScript 42개 -> JavaScript 42개. CI 회귀 검사 후 검수 필요.');

import {readFile,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';

// 허용 목록에 없는 저장소 입력은 트리 셰이킹되더라도 학생 빌드에서 금지한다.
export const studentInputs = Object.freeze([
  "js/academic/app/student-entry.js",
  "js/academic/app/academic-calendar.js",
  "js/academic/views/student-entry.js"
]);
const permitted = new Set(studentInputs);
export const studentStyles = Object.freeze([
  'css/student-ui.css','css/hanmo-tokens.css','css/hanmo-components.css','css/hanmo-views.css','css/hanmo-flat.css'
]);
const permittedStyles = new Set(studentStyles);
const styleOutput = '.build/student-ui.css';
const normal = path => path.replaceAll('\\','/');
export const rootAssets = Object.freeze([
  'index.html', 'sitemap.xml', 'LICENSE',
]);
const generatedFiles = Object.freeze([
  'THIRD-PARTY-NOTICES.txt', 'data/academic-source-config.json', 'data/network-probe.txt',
]);
export const bundleOutputs = Object.freeze({
  'student-entry.js':'js/student-entry.js',
  'academic-calendar.js':'js/academic-calendar.js',
  'academic-calendar.css':'css/academic-calendar-vendor.css',
  'student-ui.css':'css/student-ui.css',
});
const requiredPublicAssets = Object.freeze([
  'css/academic-calendar.css', 'css/academic-unified.css', 'css/hanmo-labs.css', 'css/home-fit.css',
  'css/incident-404.css', 'css/vsugang-fit.css',
  'html/academic-timeline.html', 'html/catalog.html', 'html/developer.html', 'html/forecast.html',
  'html/incident-404.html', 'html/pc-only.html', 'html/planner.html', 'html/practice.html',
  'html/reaction-test.html', 'html/readiness.html', 'html/result.html', 'html/selectZone.html',
  'html/strategy-lab.html', 'html/vsugang.html',
  'img/background.svg', 'img/boo.png', 'img/favicon-purple.svg', 'img/lucide/LICENSE',
  'js/academic-data-source.js', 'js/academic-unified.js', 'js/home-fit.js', 'js/incident-404.js',
  'js/pc-only.js', 'js/reaction-page.mjs', 'js/reaction-profile.mjs', 'js/readiness.mjs',
  'js/scenario-settings.js', 'js/strategy-engine.mjs', 'js/strategy-page.mjs', 'js/strategy-worker.mjs',
  'js/student-catalog.js', 'js/student-notices.js', 'js/student-preferences.js', 'js/student-profile-bar.js',
  'js/vsugang-fit.js',
]);
const disallowedPublicAssets = Object.freeze([
  'css/academic-faq.css', 'css/academic-progress.css', 'css/academic-support.css', 'css/scenario-settings.css',
  'html/academic-calendar.html', 'html/academic-faq.html', 'html/academic-progress.html',
  'html/academic-support.html', 'html/scenario-lab.html', 'html/scenario-workshop.html',
  'img/hanmo_purple.png', 'img/hufs_logo.png', 'img/lucide/external-link.svg', 'img/lucide/search.svg',
  'js/academic-faq.js', 'js/academic-support.js', 'js/degree-preparation.js', 'js/incident-courses.js',
  'js/incident-options.js', 'js/lab-share.mjs', 'js/scenario-composite.js', 'js/scenario-engine.js',
  'js/scenario-lab.js', 'js/scenario-review.js', 'js/scenario-workshop.js', 'js/strategy-recommendation.mjs',
  'js/strategy-sensitivity-worker.mjs', 'js/student-forecast.js',
]);
const expected = new Set(Object.keys(bundleOutputs).map(path=>'.build/'+path));
const checkInput = path => {
  const p = normal(path);
  if (p.split('/').some(part => part === '..' || part === '') ||
      (!permitted.has(p) && !p.startsWith('node_modules/')))
    throw new Error('학생 번들에 미승인 입력: '+path);
};
export function assertStudentBundleMeta(meta) {
  if (!meta || !meta.inputs || !meta.outputs || Array.isArray(meta.inputs) || Array.isArray(meta.outputs))
    throw new Error('학생 번들 메타데이터 누락');
  const inputs = new Set(Object.keys(meta.inputs).map(normal));
  for (const path of inputs) if (!permittedStyles.has(path)) checkInput(path);
  const outputs = Object.keys(meta.outputs).map(normal);
  if (outputs.length !== expected.size || outputs.some(path => !expected.has(path)) || new Set(outputs).size !== expected.size)
    throw new Error('학생 번들 산출물 목록 불일치');
  for (const [target,output] of Object.entries(meta.outputs)) {
    if (!output.inputs) throw new Error('학생 번들 입력 목록 누락');
    if (normal(target) === styleOutput) {
      if (!output.entryPoint || normal(output.entryPoint) !== studentStyles[0])
        throw new Error('학생 스타일 번들 진입점 미승인');
      const styles = new Set(Object.keys(output.inputs).map(normal));
      for (const path of styles)
        if (!permittedStyles.has(path)) throw new Error('학생 스타일 번들에 미승인 입력: '+path);
      for (const path of studentStyles)
        if (!styles.has(path)) throw new Error('학생 스타일 번들 필수 입력 누락: '+path);
      if (output.imports?.some(({path,kind,external}) => path !== '../img/background.svg' || kind !== 'url-token' || !external))
        throw new Error('학생 스타일 번들에 미승인 참조');
      continue;
    }
    for (const path of Object.keys(output.inputs)) checkInput(path);
    if (output.entryPoint && !permitted.has(normal(output.entryPoint)))
      throw new Error('학생 번들 진입점 미승인: '+output.entryPoint);
    if (output.imports?.some(({external}) => external)) throw new Error('학생 번들에 미승인 외부 참조');
  }
  for (const path of [...studentInputs,...studentStyles])
    if (!inputs.has(path)) throw new Error('학생 번들 필수 입력 누락: '+path);
}
export async function readPublicAssets(root) {
  const paths = JSON.parse(await readFile(resolve(root,'scripts/public-assets.json'),'utf8'));
  if (!Array.isArray(paths) || new Set(paths).size !== paths.length ||
      paths.some(path => typeof path !== 'string' || !/^(?:css\/[^/]+\.css|js\/[^/]+\.(?:js|mjs)|html\/[^/]+\.html|img\/[^/]+\.(?:png|jpg|svg)|img\/lucide\/(?:[^/]+\.(?:png|jpg|svg)|LICENSE))$/.test(path) || path.includes('\\')))
    throw new Error('정적 공개 파일 허용 목록 오류');
  const listed=new Set(paths);
  for(const path of requiredPublicAssets)
    if(!listed.has(path))throw Error('Missing public student asset '+path);
  for(const path of [...disallowedPublicAssets,...studentStyles,...Object.values(bundleOutputs)])
    if(listed.has(path))throw Error('Disallowed web artifact: '+path);
  return paths;
}

export async function assertStagedAssets(dist,publicAssets){
  const allowed=new Set([...rootAssets,...publicAssets,...Object.values(bundleOutputs),...generatedFiles]);
  const missing=new Set(allowed);
  const directories=new Set();
  for(const path of allowed){
    for(let slash=path.indexOf('/');slash!==-1;slash=path.indexOf('/',slash+1))
      directories.add(path.slice(0,slash));
  }
  async function inspect(prefix=''){
    for(const entry of await readdir(join(dist,prefix),{withFileTypes:true})){
      const path=prefix+entry.name;
      if(entry.isDirectory()&&directories.has(path))await inspect(path+'/');
      else if(!entry.isFile()||!missing.delete(path))throw Error('Unexpected staged asset '+path);
    }
  }
  await inspect();
  if(missing.size)throw Error('Missing staged asset '+[...missing].join(', '));
  return allowed;
}

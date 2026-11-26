import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

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
const expected = new Set(['.build/student-entry.js','.build/academic-calendar.js','.build/academic-calendar.css',styleOutput]);
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
  return paths;
}

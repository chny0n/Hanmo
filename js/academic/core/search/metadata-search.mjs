// 보존한 질의 정규화와 문자 2그램 순위 알고리즘을 제목·허용 후보 메타데이터 검색으로 제한합니다.
// 실제 학교 자료 연결·검수·개인별 학사 판단은 하지 않습니다.
import {normalizeSearchText} from './search-text.mjs';
import {rankMetadata} from './metadata-rank.mjs';
/** @typedef {'COURSE_CODE'|'DATE'|'NUMBER'} ProtectedKind */
/** @typedef {{kind:ProtectedKind,text:string}} ProtectedToken */
/** @typedef {{from:string,to:string,kind:'TYPO'|'ABBREVIATION'|'SPACING'}} QueryCorrection */
/** @typedef {{original:string,normalized:string,variants:string[],corrections:QueryCorrection[],protectedTokens:ProtectedToken[]}} NormalizedQuery */
/** 흔한 오타 → 표준 표기. 한 글자 차이로 다른 뜻이 되는 단어는 넣지 않는다. */
/** @type {Readonly<Record<string,string>>} */
const TYPOS={
  수강신철:'수강신청',수강신쳥:'수강신청',수강싱청:'수강신청',수강신천:'수강신청',
  이중전궁:'이중전공',이중젼공:'이중전공',졸업시헙:'졸업시험',졸업시엄:'졸업시험',
  휴학싱청:'휴학신청',복학싱청:'복학신청',계절학긔:'계절학기',장학굼:'장학금',
};
/** 교내 약칭 → 정식 명칭. 원래 약칭도 함께 검색한다. */
/** @type {Readonly<Record<string,string>>} */
const ABBREVIATIONS={
  복전:'이중전공',부전:'부전공',수신:'수강신청',졸시:'졸업시험',수강정정:'수강신청 정정',
  계학:'계절학기',국장:'국가장학금',전필:'전공필수',교필:'교양필수',
};
/** 띄어 써도 하나로 묶어 검색할 복합어. 글자 사이 공백을 허용하는 정규식으로 찾는다. */
const COMPOUNDS=['수강신청','이중전공','부전공','졸업시험','졸업논문','계절학기','학점교류','성적정정','수강취소',
  '휴학신청','복학신청','전공심화','교환학생','장학금','출석인정','졸업요건','외국어인증'];
/** @param {string} word */
const spacedPattern=word=>new RegExp([...word].map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s*'),'g');
const COMPOUND_RES=COMPOUNDS.map(w=>/** @type {[string,RegExp]} */([w,spacedPattern(w)]));

/** 보호 토큰 정규식. 교정 사전은 한글 단어에만 적용되지만, 보호 토큰은 원문 그대로 결과에 남긴다. */
const PROTECTED=/** @type {[ProtectedKind,RegExp][]} */([
  ['COURSE_CODE',/\b[a-z]{2,6}\d{3,6}[a-z]?\b/gi],
  
  ['DATE',/20\d{2}\s*[.\-/년]\s*\d{1,2}\s*[.\-/월]\s*\d{1,2}\s*일?|\d{1,2}\s*월\s*\d{1,2}\s*일/g],
  ['NUMBER',/\d+(?:\.\d+)?/g],
]);

/**
 * 원 질의를 보존하고 검색용 변형을 만든다. 보호 토큰은 교정하지 않고 그대로 둔다.
 * @param {string} raw 학생이 입력한 원 질의
 * @returns {NormalizedQuery}
 */
export function normalizeAcademicQuery(raw){
  if(typeof raw!=='string')throw new TypeError('query must be a string');
  const normalized=normalizeSearchText(raw);
  if(!normalized||normalized.length>200)throw new RangeError('Invalid search query length');
  /** @type {ProtectedToken[]} */
  const protectedTokens=[];
  let masked=normalized;
  for(const [kind,re] of PROTECTED){
    masked=masked.replace(re,m=>{protectedTokens.push({kind,text:m.trim()});return ' '.repeat(m.length);});
  }
  /** @type {QueryCorrection[]} */
  const corrections=[];
  // 보호 토큰 위치는 공백으로 가렸으므로 사전 교정이 숫자·학수번호를 바꾸지 못한다.
  let joined=normalized;
  for(const [word,re] of COMPOUND_RES){
    re.lastIndex=0;
    // 복합어 사전은 한글만 담고 있어 보호 토큰(숫자·영문 학수번호)과 겹치지 않는다.
    joined=joined.replace(re,m=>{
      if(m!==word)corrections.push({from:m,to:word,kind:'SPACING'});
      return word;
    });
  }
  const words=masked.split(/\s+/).filter(Boolean);
  let corrected=joined;
  for(const w of words){
    for(const [typo,fix] of Object.entries(TYPOS)){
      if(w.includes(typo)){corrected=corrected.split(typo).join(fix);corrections.push({from:typo,to:fix,kind:'TYPO'});}
    }
  }
  let expanded=corrected;
  for(const w of corrected.split(/\s+/)){
    // '부전공'처럼 이미 정식 명칭이거나 복합어로 시작하는 단어는 약칭으로 보지 않는다('부전'+'공' 오인 방지).
    if(COMPOUNDS.some(c=>w.startsWith(c)))continue;
    const base=Object.keys(ABBREVIATIONS).find(a=>w===a||(w.startsWith(a)&&w.length<=a.length+2&&!w.startsWith(ABBREVIATIONS[a])));
    if(base){expanded=expanded+' '+ABBREVIATIONS[base];corrections.push({from:base,to:ABBREVIATIONS[base],kind:'ABBREVIATION'});}
  }
  const variants=[...new Set([normalized,joined,corrected,expanded])];
  const seen=new Set();
  return {original:raw,normalized,variants,
    corrections:corrections.filter(c=>{const k=c.kind+c.from+c.to;if(seen.has(k))return false;seen.add(k);return true;}),
    protectedTokens};
}


/** 합성·검수 후보용 메타데이터. 원문·교수명·개인 식별 필드는 입력 계약에 없습니다. */
const keys={
  notice:new Set(['id','title','publishedDate','category','campus','sourceUrl']),
  course:new Set(['id','title','courseId','term','campus','sourceUrl'])
};
function validateRows(rows,kind){
  if(!Array.isArray(rows)||rows.length>50000)throw new RangeError('Invalid metadata rows');
  const ids=new Set();
  for(const row of rows){
    if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(key=>!keys[kind].has(key)))
      throw new TypeError('Unsupported metadata field');
    if(typeof row.id!=='string'||!row.id.trim()||ids.has(row.id)||typeof row.title!=='string'||!row.title.trim())
      throw new TypeError('Invalid or duplicate metadata');
    if(Object.values(row).some(value=>typeof value!=='string'||value.length>500))throw new TypeError('Invalid metadata value');
    if(kind==='course'&&(!row.courseId||!/^(19|20|21)\d{2}-[12]$/.test(row.term??'')||!['SEOUL','GLOBAL'].includes(row.campus)))
      throw new TypeError('Invalid course metadata');
    ids.add(row.id);
  }
}
export function searchMetadata({query,kind,rows,campus,category,term,limit=20}){
  if(!Object.hasOwn(keys,kind)||!Number.isInteger(limit)||limit<1||limit>50)throw new RangeError('Invalid metadata search');
  if(rows===undefined)return {status:'NOT_CONNECTED',hits:[]};
  validateRows(rows,kind);
  const candidates=rows.filter(row=>(!campus||campus==='ALL'||row.campus===campus)
    &&(!category||category==='ALL'||row.category===category)&&(!term||row.term===term));
  if(typeof query!=='string')throw new TypeError('query must be a string');
  if(!query.trim())return {status:candidates.length?'OK':'NO_MATCH',hits:candidates.slice(0,limit)};
  const q=normalizeAcademicQuery(query);
  const docs=candidates.map(row=>({key:row.id,title:row.title,text:kind==='course'?row.courseId:(row.category??'')}));
  const exact=new Set(kind==='course'?candidates.filter(row=>normalizeSearchText(row.courseId)===q.normalized).map(row=>row.id):[]);
  const scores=new Map();
  for(const variant of q.variants){
    for(const hit of rankMetadata(variant,docs,{limit:Math.max(docs.length,1)}))
      scores.set(hit.key,Math.max(scores.get(hit.key)??0,hit.score));
  }
  const hits=candidates.filter(row=>exact.has(row.id)||scores.has(row.id)).sort((a,b)=>
    Number(exact.has(b.id))-Number(exact.has(a.id))||
    (scores.get(b.id)??0)-(scores.get(a.id)??0)||a.id.localeCompare(b.id)).slice(0,limit);
  return {status:hits.length?'OK':'NO_MATCH',hits};
}

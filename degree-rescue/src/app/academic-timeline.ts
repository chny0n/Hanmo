import {
  AcademicEventSchema,AcademicProfileSchema,AcademicAuditHintSchema,ACADEMIC_AUDIT_BRIDGE_KEY,GRADUATION_STEPS,
  buildAcademicAgenda,parseAcademicSchedule,
  type AcademicAgendaItem,type AcademicEvent,type AcademicGroup,type AcademicProfile,type GraduationStepId,
} from '../core/academic-schedule.js';
import {importantNotices} from '../core/important-notices.js';
import {academicSourceLink,selectedMajors,studentDeadlineDisplay} from '../core/academic-display.js';

const KEY='hanmo:degree-rescue:academic-roadmap:v1';
type StepStatus='UNREVIEWED'|'IN_PROGRESS'|'DONE'|'NOT_APPLICABLE';
const STATUSES:readonly StepStatus[]=['UNREVIEWED','IN_PROGRESS','DONE','NOT_APPLICABLE'];
const STATUS_TEXT:Record<StepStatus,string>={
  UNREVIEWED:'학교 확인 전',IN_PROGRESS:'준비 중',DONE:'본인 확인 완료',NOT_APPLICABLE:'내게 해당 없음',
};
const GROUP_LABELS:Record<AcademicGroup,string>={
  SEMESTER:'학기·학사일정',COURSE:'수강·개설',MAJOR:'전공·이중전공',
  GRADUATION:'졸업·인증',GRADE:'학점·성적',STATUS:'학적·등록',
  EXCHANGE:'교환·학점교류',ACADEMIC_SUPPORT:'기타 학사',
};
const profileIds=['profile-campus','profile-cohort','profile-major','profile-double','profile-term','profile-requirements'] as const;
const inputs=Object.fromEntries(profileIds.map(id=>[id,document.getElementById(id)])) as Record<typeof profileIds[number],HTMLInputElement|HTMLSelectElement|null>;
let records:AcademicEvent[]=[];
let progress:Partial<Record<GraduationStepId,StepStatus>>={};
const element=<T extends HTMLElement>(id:string):T=>{
  const e=document.getElementById(id);if(!e)throw new Error('필수 UI 누락: '+id);return e as T;
};
const value=(id:typeof profileIds[number]):string=>(inputs[id] as HTMLInputElement|HTMLSelectElement).value.trim();
const create=(tag:keyof HTMLElementTagNameMap,cls='',message=''):HTMLElement=>{
  const e=document.createElement(tag);if(cls)e.className=cls;if(message)e.textContent=message;return e;
};
function setMessage(id:string,message:string):void{element<HTMLElement>(id).textContent=message;}
function readProfile():AcademicProfile{
  const campus=value('profile-campus'),year=value('profile-cohort');
  const majors=selectedMajors(value('profile-major'),value('profile-double'));
  const requirements=value('profile-requirements');
  const target=value('profile-term');
  return AcademicProfileSchema.parse({
    ...(campus?{campus}:{}),
    ...(year?{cohort:Number(year)}:{}),
    ...(majors.length?{majors}:{}),
    ...(target?{targetGraduationTerm:target}:{}),
    // 학생 자가 입력이나 계산기에서 만든 요건 ID는 참고 힌트일 뿐 독립 검토된 진단 결과가 아니다.
    openRequirementIds:null,
    candidateOpenRequirementIds:requirements?requirements.split(',').map(x=>x.trim()).filter(Boolean):[],
  });
}
function fillProfile(p:AcademicProfile):void{
  const data:Record<typeof profileIds[number],string>={
    'profile-campus':p.campus??'',
    'profile-cohort':p.cohort===undefined?'':String(p.cohort),
    'profile-major':p.majors?.[0]??'',
    'profile-double':p.majors?.[1]??'',
    'profile-term':p.targetGraduationTerm??'',
    'profile-requirements':(p.candidateOpenRequirementIds??p.openRequirementIds)?.join(', ')??'',
  };
  for(const id of profileIds)(inputs[id] as HTMLInputElement|HTMLSelectElement).value=data[id];
}
function loadSaved():void{
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return;
    const stored=JSON.parse(raw) as {profile?:unknown;progress?:unknown};
    const parsed=AcademicProfileSchema.safeParse(stored.profile);
    if(parsed.success)fillProfile(parsed.data);
    if(stored.progress&&typeof stored.progress==='object'&&!Array.isArray(stored.progress)){
      const result=stored.progress as Record<string,unknown>;
      progress={};
      for(const step of GRADUATION_STEPS){
        const status=result[step.id];
        if(typeof status==='string'&&STATUSES.some(s=>s===status))progress[step.id]=status as StepStatus;
      }
    }
    setMessage('profile-message','이 브라우저에 이전에 저장한 설정을 불러왔습니다.');
  }catch{
    setMessage('profile-message','저장된 설정을 읽을 수 없습니다. 브라우저 데이터 상태를 확인하세요.');
  }
}
function save():void{
  try{
    const profile=readProfile();
    localStorage.setItem(KEY,JSON.stringify({profile,progress}));
    setMessage('profile-message','저장 완료: 이 브라우저에만 보관됩니다. 공식 학적 확인을 대신하지 않습니다.');
  }catch(e){
    setMessage('profile-message','저장 실패: '+(e instanceof Error?e.message:String(e)));
  }
}
function clearSaved():void{
  try{localStorage.removeItem(KEY);}catch{/* browser may block storage */}
  try{sessionStorage.removeItem(ACADEMIC_AUDIT_BRIDGE_KEY);}catch{/* storage disabled */}
  fillProfile({openRequirementIds:null});progress={};renderSteps();render();
  setMessage('profile-message','이 브라우저의 저장된 학업 설정과 체크 상태를 삭제했습니다.');
}
const kst=new Intl.DateTimeFormat('ko-KR',{
  timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hour12:false,
});
function when(iso:string):string{return kst.format(new Date(iso))+' KST';}
function tag(label:string,cls=''):HTMLElement{return create('span','tag '+cls,label);}
function renderOne(item:AcademicAgendaItem):HTMLElement{
  const e=item.event,card=create('article','agenda-card');
  const title=create('h3','',e.title);card.append(title);
  const tags=create('div','meta');
  tags.append(tag(GROUP_LABELS[item.group]));
  tags.append(item.evidence==='SYNTHETIC'?tag('가상 일정','demo')
    :item.evidence==='SOURCE_REVIEWED'?tag('운영 검수된 원문'):tag('출처·검수 확인 필요','review'));
  if(item.appliesTo==='UNKNOWN')tags.append(tag('적용 대상 확인 필요','unknown'));
  if(item.candidateRequirementMatch)tags.append(tag('내 미충족 요건 후보와 연결','unknown'));
  if(item.priority==='DUE_SOON')tags.append(item.evidence==='SOURCE_REVIEWED'&&item.appliesTo==='YES'
    ?tag('확인된 마감 7일 이내','urgent'):tag('입력된 마감 7일 이내 · 미확정','review'));
  else if(item.priority==='OVERDUE')tags.append(tag('입력된 마감 시점 경과','review'));
  card.append(tags);
  const dates=create('p');
  if(e.opensAt)dates.append(create('span','', '신청 시작(입력 기준): '+when(e.opensAt)+' · '));
  if(item.studentDeadline){
    const display=studentDeadlineDisplay(item);
    const caption=display.kind==='VERIFIED'?'검수된 학생 신청 마감'
      :display.kind==='SYNTHETIC'?'가상 마감 · 연습용'
      :'입력된 날짜 · 공식 마감 미검증';
    dates.append(create('strong','',caption+': '+when(item.studentDeadline)+' · '+display.status));
  }else if(e.eventAt){
    dates.append(create('strong','', '행사·시험 날짜(입력 기준): '+when(e.eventAt)));
  }else{
    dates.append(create('strong','', '신청·마감일 미확인 — 공지 원문 확인 필요'));
  }
  card.append(dates);
  if(e.memo)card.append(create('p','',e.memo));
  const citation=create('details','source-footnote');
  citation.append(create('summary','', '근거 주석 · 출처와 적용 조건 확인'));
  citation.append(create('p','tiny','자료: '+e.source.title
    +(e.source.publishedDate?' · 게시일 '+e.source.publishedDate:' · 게시일 미확인')
    +' · 판본 '+e.revision));
  const evidenceText=item.evidence==='SOURCE_REVIEWED'
    ?'독립 운영 검수된 자료입니다. 해당 대상·마감의 검수 범위를 원문에서 확인하세요.'
    :item.evidence==='SYNTHETIC'
    ?'한모가 생성한 가상 사례입니다. 실제 학교 일정이 아닙니다.'
    :'공식 목록의 제목만 참조했거나 검수되지 않은 자료입니다. 원문·학생 대상·날짜를 확인해야 합니다.';
  citation.append(create('p','tiny','자료 상태: '+evidenceText));
  const sc=e.scope;
  const conditions=[
    sc?.campuses?.length?'캠퍼스 '+sc.campuses.join(', '):'캠퍼스 적용 범위 미확인',
    sc?.majors?.length?'전공 '+sc.majors.join(', '):'전공별 대상 미확인',
    sc?.cohortFrom!==undefined||sc?.cohortTo!==undefined
      ?'입학년도 '+String(sc.cohortFrom??'미상')+'~'+String(sc.cohortTo??'미상')
      :'학번별 대상 미확인',
  ];
  citation.append(create('p','tiny','자료에 기재된 조건(독립 검수 전일 수 있음): '+conditions.join(' · ')));
  if(item.scopeUnknown.length)citation.append(create('p','tiny','추가 확인할 조건: '+item.scopeUnknown.join(', ')));
  if(e.requirementRefs?.length)citation.append(create('p','tiny','연결 요건 ID: '+e.requirementRefs.join(', ')));
  const sourceLink=academicSourceLink(e.source.url);
  if(e.source.url&&sourceLink!=='NONE'){
    const link=create('a','',sourceLink==='HUFS_DOMAIN'
      ?'학교 도메인의 자료 링크 · 원문/최신성 확인'
      :'외부 참고 링크 · 학교 공식 사이트가 아닐 수 있음');
    link.setAttribute('href',e.source.url);link.setAttribute('target','_blank');
    link.setAttribute('rel','noopener noreferrer');
    citation.append(link);
  }
  card.append(citation);
  return card;
}
function render():void{
  let profile:AcademicProfile;
  try{profile=readProfile();setMessage('profile-message',element('profile-message').textContent?.startsWith('저장')?
    element('profile-message').textContent||'':'');}
  catch(e){setMessage('profile-message','학업 조건 형식을 확인하세요: '+(e instanceof Error?e.message:String(e)));return;}
  const summary=buildAcademicAgenda({asOf:new Date().toISOString(),profile,events:records});
  const focus=importantNotices(profile,summary.items);
  const focusList=element<HTMLElement>('focus-list');
  focusList.replaceChildren();
  if(focus.mode==='CHOOSE_MAJOR'){
    setMessage('focus-status','주전공을 입력하면 졸업시험·이중전공·수강신청 등 중요공지 후보를 먼저 보여줍니다. 해당 여부는 공식 원문에서 확인해야 합니다.');
    focusList.append(create('p','empty-state','주전공을 선택하거나 입력해 시작하세요. 성적표·학번·학교 계정이 필요하지 않습니다.'));
  }else{
    const hasVerifiedMajorTag=[...focus.confirmed,...focus.toCheck].some(item=>
      !!item.event.scope?.majors?.some(major=>profile.majors?.includes(major)));
    setMessage('focus-status','독립 검수된 확정 마감 '+focus.confirmed.length+
      '건 · 공식 확인이 필요한 공지 후보 '+focus.toCheck.length+'건. '+
      (hasVerifiedMajorTag?'전공 조건이 표시된 자료와 일반 공지가 함께 나옵니다. '
        :'현재 기본 참고 목록에는 전공별 적용 태그가 없어 일반 중요공지 후보를 보여줍니다. ')+
      '후보는 본인 대상이거나 실제 접수 중임을 뜻하지 않습니다.');
    if(focus.confirmed.length){
      focusList.append(create('h3','focus-subtitle','운영 검수된 중요 신청 마감 (최대 2건)'));
      for(const item of focus.confirmed)focusList.append(renderOne(item));
    }
    if(focus.toCheck.length){
      focusList.append(create('h3','focus-subtitle','먼저 확인할 참고 공지 · 적용 대상과 날짜 미확정'));
      for(const item of focus.toCheck)focusList.append(renderOne(item));
    }
    if(!focus.confirmed.length&&!focus.toCheck.length){
      focusList.append(create('p','empty-state','해당 조건으로 우선 표시할 공지 후보가 없습니다. 아래 전체 목록과 공식 학교 공지를 확인하세요.'));
    }
  }
  const onlyUnknown=element<HTMLInputElement>('include-unknown').checked;
  const group=element<HTMLSelectElement>('group-filter').value;
  const search=element<HTMLInputElement>('agenda-search').value.trim().toLocaleLowerCase('ko');
  element('count-relevant').textContent=String(summary.relevantCount);
  element('count-urgent').textContent=String(summary.dueSoonCount);
  element('count-review').textContent=String(summary.reviewNeededCount);
  element('asof').textContent='조회 기준: '+when(summary.asOf);
  const list=element<HTMLElement>('agenda-list');list.replaceChildren();
  const visible=summary.items.filter(x=>
    x.appliesTo!=='NO'&&(onlyUnknown||x.appliesTo!=='UNKNOWN')&&
    (group==='ALL'||x.group===group)&&
    (!search||x.event.title.toLocaleLowerCase('ko').includes(search)||
      x.event.type.toLocaleLowerCase('ko').includes(search)));
  if(!visible.length){
    list.append(create('p','empty-state',records.length===0?
      '일정 자료가 없습니다. 학교 공지의 제목을 불러오거나 검토된 JSON을 가져오세요.':
      '현재 선택한 학업 조건과 필터에 해당하는 일정이 없습니다. 불명확한 대상 조건이나 학사공지를 다시 확인하세요.'));
  }else for(const item of visible)list.append(renderOne(item));
  if(summary.excluded.length){
    list.append(create('p','subtle','자료 충돌·취소·미게시 등의 사유로 제외된 레코드 '
      +summary.excluded.length+'개. 같은 공지 ID 중복은 임의로 최신본을 선택하지 않습니다.'));
  }
}
function renderSteps():void{
  const root=element<HTMLElement>('graduation-steps');root.replaceChildren();
  for(const step of GRADUATION_STEPS){
    const row=create('article','milestone');
    const detail=create('div');detail.append(create('strong','',step.title));
    detail.append(create('p','',step.description));row.append(detail);
    const sel=document.createElement('select');
    sel.setAttribute('aria-label',step.title+' 개인 점검 상태');
    for(const status of STATUSES){
      const option=document.createElement('option');option.value=status;option.textContent=STATUS_TEXT[status];
      if((progress[step.id]??'UNREVIEWED')===status)option.selected=true;
      sel.append(option);
    }
    sel.addEventListener('change',()=>{progress[step.id]=sel.value as StepStatus;
      setMessage('profile-message','체크 상태를 변경했습니다. 보존하려면 위의 "이 브라우저에 설정 저장"을 누르세요.');});
    row.append(sel);root.append(row);
  }
}
const demoTime=(days:number):string=>new Date(Date.now()+days*86400000).toISOString();
function demo():AcademicEvent[]{
  const base=(id:string,title:string,type:AcademicEvent['type'],offset:number):AcademicEvent=>
    AcademicEventSchema.parse({
      id,revision:'r1',title:'[가상] '+title,type,
      source:{title:'Hanmo 합성 시뮬레이션',review:'SYNTHETIC'},
      opensAt:demoTime(offset-5),deadlineAt:demoTime(offset),
      memo:'모의 데이터입니다. 한국외국어대학교의 실제 신청기간과 다릅니다.',
      studentActionRequired:true,
    });
  return [
    base('SYN-COURSE','다음 학기 수강신청', 'COURSE_REGISTRATION',4),
    base('SYN-DOUBLE','이중전공 신청', 'DOUBLE_MAJOR_APPLICATION',9),
    base('SYN-GRAD-EXAM','졸업시험 응시 신청','GRADUATION_EXAM',17),
    base('SYN-LANGUAGE','졸업 외국어인증 서류 제출','LANGUAGE_CERTIFICATION',24),
    base('SYN-GRADE','성적 정정 접수','GRADE_CORRECTION',31),
    base('SYN-DOCUMENT','졸업 심사 서류 제출','GRADUATION_DOCUMENT',38),
  ];
}
async function officialTitles():Promise<void>{
  try{
    const r=await fetch('./data/academic-notices-reference.json',{cache:'no-store'});
    if(!r.ok)throw new Error('정적 JSON을 읽지 못했습니다: '+r.status);
    const json=await r.json() as {schemaVersion?:number;events?:unknown;note?:string;snapshotDate?:string};
    const loaded=parseAcademicSchedule({schemaVersion:json.schemaVersion,events:json.events});
    records=loaded.events;
    setMessage('data-message','게시 제목 '+records.length+'건 · '+(json.snapshotDate??'미상')+
      ' 기준 참고 자료. 신청·마감일은 수록되지 않았습니다. '+loaded.invalid.length+'건 제외.');
    render();
  }catch(e){
    records=[];render();
    setMessage('data-message','기본 자료를 읽지 못했습니다: '+(e instanceof Error?e.message:String(e))+
      ' · 정적 파일 서버에서 페이지를 열었는지 확인하세요.');
  }
}
/** 사용자가 명시적으로 실행한 경우에만 반영한다. 계산기 응답은 관련 링크를 제안할 수 있어도 공식 요건을 완료 처리하지 못한다. */
function applyLocalAuditHints():void{
  try{
    const raw=sessionStorage.getItem(ACADEMIC_AUDIT_BRIDGE_KEY);
    if(!raw)throw new Error('이 탭에서 먼저 학업 플래너의 학점·졸업요건 계산을 실행하세요.');
    const hint=AcademicAuditHintSchema.parse(JSON.parse(raw) as unknown);
    if(hint.candidateOpenRequirementIds===null)throw new Error(
      '원장의 기준이 부족해 연결할 요건을 판단하지 못했습니다. 학점·학칙 데이터를 확인하세요.');
    element<HTMLInputElement>('profile-requirements').value=hint.candidateOpenRequirementIds.join(', ');
    render();
    setMessage('profile-message','로컬 계산 요건 후보 '+hint.candidateOpenRequirementIds.length+'건 반영 · 규정 판본 '
      +hint.rulePackVersion+' · 계산 기준 '+when(hint.asOf)
      +'. 공식 자료 검수나 졸업 충족 확정이 아닙니다. 저장하려면 위의 저장 버튼을 누르세요.');
  }catch(e){setMessage('profile-message','계산 결과 연결 실패: '+(e instanceof Error?e.message:String(e)));}
}
function exportJson():void{
  const json=JSON.stringify({schemaVersion:1,events:records},null,2);
  const blob=new Blob([json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='hanmo-academic-timeline.json';a.click();
  URL.revokeObjectURL(url);
}
async function importJson():Promise<void>{
  const file=element<HTMLInputElement>('timeline-file').files?.[0];
  if(!file)return;
  if(file.size>1024*1024){
    setMessage('data-message','일정 자료는 최대 1MB JSON 파일만 불러올 수 있습니다.');return;
  }
  try{
    const data=JSON.parse(await file.text()) as unknown;
    const {events,invalid}=parseAcademicSchedule(data);
    if(!events.length&&invalid.length)throw new Error('유효한 공지 항목이 없습니다. 첫 오류: '+invalid[0]?.reason);
    records=events;
    setMessage('data-message','이 기기의 JSON '+events.length+'건 불러옴. 형식 오류 '+invalid.length+
      '건 제외. JSON 안의 SOURCE_REVIEWED 자기선언은 운영 검수로 인정하지 않습니다. 모든 기한은 원문을 재확인하세요.');
    render();
  }catch(e){setMessage('data-message','JSON 가져오기 실패: '+(e instanceof Error?e.message:String(e)));}
}
for(const id of profileIds)inputs[id]?.addEventListener('input',render);
element<HTMLButtonElement>('profile-save').addEventListener('click',save);
element<HTMLButtonElement>('audit-transfer').addEventListener('click',applyLocalAuditHints);
element<HTMLButtonElement>('profile-clear').addEventListener('click',clearSaved);
element<HTMLButtonElement>('data-official').addEventListener('click',()=>{void officialTitles();});
element<HTMLButtonElement>('data-demo').addEventListener('click',()=>{
  records=demo();render();
  setMessage('data-message','합성 마감 시연 '+records.length+'건. 아래 D-day와 신청기간은 실제 학교 일정이 아닙니다.');
});
element<HTMLInputElement>('timeline-file').addEventListener('change',()=>{void importJson();});
element<HTMLButtonElement>('template-export').addEventListener('click',exportJson);
element<HTMLSelectElement>('group-filter').addEventListener('change',render);
element<HTMLInputElement>('agenda-search').addEventListener('input',render);
element<HTMLInputElement>('include-unknown').addEventListener('change',render);
loadSaved();renderSteps();void officialTitles();

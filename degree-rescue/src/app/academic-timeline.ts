import {
  AcademicEventSchema,AcademicProfileSchema,GRADUATION_STEPS,
  buildAcademicAgenda,parseAcademicSchedule,
  type AcademicAgendaItem,type AcademicEvent,type AcademicGroup,type AcademicProfile,type GraduationStepId,
} from '../core/academic-schedule.js';

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
let currentMode='reference';
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
  const majors=[value('profile-major'),value('profile-double')].filter(Boolean);
  const requirements=value('profile-requirements');
  const target=value('profile-term');
  return AcademicProfileSchema.parse({
    ...(campus?{campus}:{}),
    ...(year?{cohort:Number(year)}:{}),
    ...(majors.length?{majors}:{}),
    ...(target?{targetGraduationTerm:target}:{}),
    openRequirementIds:requirements?requirements.split(',').map(x=>x.trim()).filter(Boolean):null,
  });
}
function fillProfile(p:AcademicProfile):void{
  const data:Record<typeof profileIds[number],string>={
    'profile-campus':p.campus??'',
    'profile-cohort':p.cohort===undefined?'':String(p.cohort),
    'profile-major':p.majors?.[0]??'',
    'profile-double':p.majors?.[1]??'',
    'profile-term':p.targetGraduationTerm??'',
    'profile-requirements':p.openRequirementIds?.join(', ')??'',
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
    :item.evidence==='SOURCE_REVIEWED'?tag('제공자 원문 검토 표시'):tag('원문 확인 필요','review'));
  if(item.appliesTo==='UNKNOWN')tags.append(tag('적용 대상 확인 필요','unknown'));
  if(item.priority==='DUE_SOON')tags.append(tag('마감 7일 이내','urgent'));
  else if(item.priority==='OVERDUE')tags.append(tag('입력된 마감 시점 경과','review'));
  card.append(tags);
  const dates=create('p');
  if(e.opensAt)dates.append(create('span','', '신청 시작(입력 기준): '+when(e.opensAt)+' · '));
  if(item.studentDeadline){
    const due=item.daysLeft===0?'오늘':item.daysLeft!==null&&item.daysLeft>0?'D-'+item.daysLeft:'마감 시점 경과';
    dates.append(create('strong','', '학생 신청 마감(입력 기준): '+when(item.studentDeadline)+' · '+due));
  }else if(e.eventAt){
    dates.append(create('strong','', '행사·시험 날짜(입력 기준): '+when(e.eventAt)));
  }else{
    dates.append(create('strong','', '신청·마감일 미확인 — 공지 원문 확인 필요'));
  }
  card.append(dates);
  const source=create('p','tiny','게시 출처: '+e.source.title
    +(e.source.publishedDate?' · 게시일 '+e.source.publishedDate:''));
  card.append(source);
  if(e.memo)card.append(create('p','',e.memo));
  if(item.scopeUnknown.length)card.append(create('p','tiny','확인해야 할 대상 조건: '+item.scopeUnknown.join(', ')));
  if(e.requirementRefs?.length)card.append(create('p','tiny','연결된 졸업요건 ID: '+e.requirementRefs.join(', ')));
  if(e.source.url){
    const link=create('a','', '학교 공지 원문·목록 열기');
    link.setAttribute('href',e.source.url);link.setAttribute('target','_blank');
    link.setAttribute('rel','noopener noreferrer');card.append(link);
  }
  return card;
}
function render():void{
  let profile:AcademicProfile;
  try{profile=readProfile();setMessage('profile-message',element('profile-message').textContent?.startsWith('저장')?
    element('profile-message').textContent||'':'');}
  catch(e){setMessage('profile-message','학업 조건 형식을 확인하세요: '+(e instanceof Error?e.message:String(e)));return;}
  const summary=buildAcademicAgenda({asOf:new Date().toISOString(),profile,events:records});
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
    records=loaded.events;currentMode='reference';
    setMessage('data-message','게시 제목 '+records.length+'건 · '+(json.snapshotDate??'미상')+
      ' 기준 참고 자료. 신청·마감일은 수록되지 않았습니다. '+loaded.invalid.length+'건 제외.');
    render();
  }catch(e){
    records=[];render();
    setMessage('data-message','기본 자료를 읽지 못했습니다: '+(e instanceof Error?e.message:String(e))+
      ' · 정적 파일 서버에서 페이지를 열었는지 확인하세요.');
  }
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
    records=events;currentMode='imported';
    setMessage('data-message','이 기기의 JSON '+events.length+'건 불러옴. 형식 오류 '+invalid.length+
      '건 제외. SOURCE_REVIEWED 표시를 포함한 자료의 실제 출처는 사용자가 다시 확인해야 합니다.');
    render();
  }catch(e){setMessage('data-message','JSON 가져오기 실패: '+(e instanceof Error?e.message:String(e)));}
}
for(const id of profileIds)inputs[id]?.addEventListener('input',render);
element<HTMLButtonElement>('profile-save').addEventListener('click',save);
element<HTMLButtonElement>('profile-clear').addEventListener('click',clearSaved);
element<HTMLButtonElement>('data-official').addEventListener('click',()=>{void officialTitles();});
element<HTMLButtonElement>('data-demo').addEventListener('click',()=>{
  records=demo();currentMode='demo';render();
  setMessage('data-message','합성 마감 시연 '+records.length+'건. 아래 D-day와 신청기간은 실제 학교 일정이 아닙니다.');
});
element<HTMLInputElement>('timeline-file').addEventListener('change',()=>{void importJson();});
element<HTMLButtonElement>('template-export').addEventListener('click',exportJson);
element<HTMLSelectElement>('group-filter').addEventListener('change',render);
element<HTMLInputElement>('agenda-search').addEventListener('input',render);
element<HTMLInputElement>('include-unknown').addEventListener('change',render);
loadSaved();renderSteps();void officialTitles();

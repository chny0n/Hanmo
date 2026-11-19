/** Browser-only, no-network academic settings. Never reads the original Hanmo keys. */
export const ROADMAP_KEY='hanmo.academic.v1.roadmap';
export const ROADMAP_MAX_BYTES=1024*1024;
export const ROADMAP_SOURCE='hanmo-degree-rescue-v1';
const STATUSES=new Set(['UNREVIEWED','IN_PROGRESS','DONE','NOT_APPLICABLE']);

export type RoadmapProgress=Record<string,'UNREVIEWED'|'IN_PROGRESS'|'DONE'|'NOT_APPLICABLE'>;
export type RoadmapPayload<T>={profile:T;progress:RoadmapProgress};
export type RoadmapStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;

function object(value:unknown):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('백업 데이터 객체 형식이 아닙니다.');
  return value as Record<string,unknown>;
}
function iso(value:unknown):boolean{
  return typeof value==='string'&&/^\d{4}-\d\d-\d\dT/.test(value)&&
    /(Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value));
}
function bounded(raw:string):void{
  if(new TextEncoder().encode(raw).length>ROADMAP_MAX_BYTES)throw new Error('백업/저장 자료는 1MiB 이하만 허용됩니다.');
}
/** A profile parser should reject unknown/invalid fields, e.g. AcademicProfileSchema.parse. */
export function parseRoadmap<T>(raw:string,parseProfile:(value:unknown)=>T,
  allowedSteps:ReadonlySet<string>):RoadmapPayload<T>{
  bounded(raw);
  const envelope=object(JSON.parse(raw) as unknown);
  if(envelope.schemaVersion!==1||!iso(envelope.updatedAt))throw new Error('지원되지 않는 저장 버전/시각입니다.');
  const payload=object(envelope.payload);
  const profile=parseProfile(payload.profile);
  const progressRaw=object(payload.progress);
  const progress:RoadmapProgress={};
  for(const [key,value] of Object.entries(progressRaw)){
    if(!allowedSteps.has(key)||!STATUSES.has(value as string))throw new Error('알 수 없는 체크 항목 또는 상태: '+key);
    // Unknown keys are rejected by the explicit allowedSteps set.
    progress[key]=value as RoadmapProgress[string];
  }
  return {profile,progress};
}
function encode<T>(value:RoadmapPayload<T>,parseProfile:(value:unknown)=>T,
  allowedSteps:ReadonlySet<string>,timestamp:string,backup:boolean):string{
  if(!iso(timestamp))throw new Error('저장 시각이 유효하지 않습니다.');
  const raw=JSON.stringify({schemaVersion:1,updatedAt:timestamp,
    ...(backup?{exportedAt:timestamp,sourceRevision:ROADMAP_SOURCE}:{}),payload:value});
  parseRoadmap(raw,parseProfile,allowedSteps);
  return raw;
}
export function readRoadmap<T>(storage:RoadmapStorage,parseProfile:(value:unknown)=>T,
  allowedSteps:ReadonlySet<string>):RoadmapPayload<T>|null{
  const raw=storage.getItem(ROADMAP_KEY);
  return raw===null?null:parseRoadmap(raw,parseProfile,allowedSteps);
}
/** Exactly one localStorage key is written; a failure cannot partially update multiple keys. */
export function saveRoadmap<T>(storage:RoadmapStorage,value:RoadmapPayload<T>,
  parseProfile:(value:unknown)=>T,allowedSteps:ReadonlySet<string>,
  timestamp=new Date().toISOString()):void{
  const raw=encode(value,parseProfile,allowedSteps,timestamp,false);
  storage.setItem(ROADMAP_KEY,raw);
}
export function exportRoadmap<T>(value:RoadmapPayload<T>,parseProfile:(value:unknown)=>T,
  allowedSteps:ReadonlySet<string>,timestamp=new Date().toISOString()):string{
  const pretty=JSON.stringify(JSON.parse(encode(value,parseProfile,allowedSteps,timestamp,true)),null,2)+'\n';
  // A pretty printed export can be larger than the compact saved payload.
  bounded(pretty);
  return pretty;
}
export function parseRoadmapBackup<T>(raw:string,parseProfile:(value:unknown)=>T,
  allowedSteps:ReadonlySet<string>):RoadmapPayload<T>{
  bounded(raw);
  const obj=object(JSON.parse(raw) as unknown);
  if(obj.sourceRevision!==ROADMAP_SOURCE||!iso(obj.exportedAt)){
    throw new Error('한모 학업 설정 백업 파일이 아니거나 판본을 알 수 없습니다.');
  }
  return parseRoadmap(raw,parseProfile,allowedSteps);
}
export function clearRoadmap(storage:RoadmapStorage):void{storage.removeItem(ROADMAP_KEY);}

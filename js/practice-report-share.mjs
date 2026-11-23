// @ts-check
// 모의연습 직후의 결과와 직접 선택한 옵션만 PNG에 담아 다운로드합니다.
import {saveReportCard} from './lab-share.mjs';
const button=document.getElementById('practice-report-save');
if(button){
  const status=document.getElementById('practice-report-save-status');
  const safeGet=(store,key)=>{
    try{return store?.getItem(key);}catch{return null;}
  };
  const asYes=value=>value==='yes'?'예':'아니오';
  const bounded=(raw,min,max)=>{
    const number=Number(raw);return Number.isInteger(number)&&number>=min&&number<=max?number:0;
  };
  button.addEventListener('click',async()=>{
    const local=window.localStorage,session=window.sessionStorage;
    const mode=bounded(safeGet(local,'practiceSetter'),1,3);
    const names={1:'BASIC',2:'TIME',3:'SELECT'};
    const pCount=bounded(safeGet(local,'psubjectValue'),1,15);
    const count=bounded(safeGet(local,'subjectValue'),1,15);
    const detail=typeof window.readPracticeReport==='function'?window.readPracticeReport():null;
    const rows=[
      '연습 모드: '+(names[mode]??'정보 없음'),
      '관심강좌 과목 수: '+pCount+'개 · 신청 목표: '+(mode===2?0:count)+'개',
      '강의 신청 대기: '+asYes(safeGet(local,'waitingValue')),
      '페이지 진입 대기: '+asYes(safeGet(local,'waitingEntryValue')),
      '가상 404 선택: '+(mode===1?asYes(safeGet(session,'hanmo.synthetic404.selection.v1')):'해당 모드에 적용 안 됨'),
      '가상 정원 마감 선택: '+(mode===1?asYes(safeGet(session,'hanmo.syntheticCapacity.selection.v1')):'해당 모드에 적용 안 됨'),
      'TIME 소요: '+(detail?.timeSeconds??'0.000')+'초',
      'SELECT 소요: '+(mode===2?'해당 없음':detail?.selectSeconds??'0.000')+'초',
      '총 소요: '+(mode===2?(detail?.timeSeconds??'0.000'):(detail?.totalSeconds??'0.000'))+'초',
      '표기한 돌발상황은 선택값이며 실제 발생 여부를 뜻하지 않습니다.',
    ];
    button.disabled=true;
    try{
      await saveReportCard('한모 모의수강신청 결과',rows,'hanmo-practice-result.png');
      status.textContent='현재 연습 결과와 설정을 PNG로 저장했습니다.';
    }catch(error){status.textContent=error instanceof Error?error.message:'결과 카드 저장에 실패했습니다.';}
    finally{button.disabled=false;}
  });
}

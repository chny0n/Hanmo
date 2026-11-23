// @ts-check
// 복수의 합성 실험을 메인 스레드가 아닌 Worker에서 수행합니다.
import {sensitivityScenarios,simulate} from './strategy-engine.mjs';
self.addEventListener('message',event=>{
  try{
    const variants=sensitivityScenarios(event.data);
    const reports=[];
    for(const [index,variant] of variants.entries()){
      reports.push({id:variant.id,label:variant.label,result:simulate(variant.scenario)});
      self.postMessage({type:'progress',done:index+1,total:variants.length});
    }
    self.postMessage({type:'complete',reports});
  }catch(error){
    self.postMessage({type:'error',message:error instanceof Error?error.message:'계산하지 못했습니다.'});
  }
});

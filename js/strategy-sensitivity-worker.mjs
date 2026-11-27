import {compareRivalCounts} from './strategy-recommendation.mjs';

self.addEventListener('message',({data:{courses,orderedIds}})=>{
  const reportDistance=checkedDistance=>self.postMessage({checkedDistance});
  for(const change of compareRivalCounts(courses,orderedIds,reportDistance))self.postMessage(change);
},{once:true});

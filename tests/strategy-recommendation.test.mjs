import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendCourses} from '../js/strategy-recommendation.mjs';

const ids='ABCDEFGH';
function makeCourses(pairs,ranks=ids){
  return pairs.map(([capacity,rivals],index)=>({
    id:ids[index],name:ids[index],rank:ranks.indexOf(ids[index])+1,capacity,rivals,
  }));
}
const order=courses=>recommendCourses(courses).map(course=>course.id).join('');

test('경쟁이 높은 중요도 1위는 살리고 중요 순위를 바꾸면 경쟁도도 함께 반영한다',()=>{
  const pairs=[[8,30],[20,50],[20,30],...Array.from({length:5},()=>[15,30])];
  assert.equal(order(makeCourses(pairs)),ids);
  const reversed=makeCourses(pairs,'HGFEDCBA');
  assert.equal(order(reversed),'HGAFEDBC');
  assert.equal(order([...reversed].reverse()),'HGAFEDBC');
  assert.equal(reversed.map(course=>course.id).join(''),ids);
});

test('자리당 경쟁자 수가 비슷한 8과목은 중요 순위대로 추천한다',()=>{
  const pairs=[20,24,28,32,36,40,44,48].map(capacity=>[capacity,capacity+1]);
  for(const ranks of [ids,'HGFEDCBA'])assert.equal(order(makeCourses(pairs,ranks)),ranks);
});

test('여석이 항상 남는 과목은 경합 과목 뒤에서 중요 순위를 지킨다',()=>{
  assert.equal(order(makeCourses([[20,19],[1,200],[300,200],[5,0]])),'BACD');
  assert.equal(order(makeCourses([[20,19],[300,200],[5,0]],'CBA')),'CBA');
});

test('정원과 경쟁자가 같은 경합 과목은 서로의 중요 순서를 지킨다',()=>{
  assert.equal(order(makeCourses([[20,20],[20,20],[8,30]])),'CAB');
  assert.equal(order(makeCourses([[20,20],[20,20],[8,8]])),'ABC');
});

test('다른 과목이 훨씬 빨리 마감되는 사례에서 경합 중 가장 중요한 과목을 두 번째에 보호한다',()=>{
  const pairs=[[200,200],...Array.from({length:7},(_,i)=>[i+1,200])];
  assert.equal(order(makeCourses(pairs)),'BACDEFGH');
});

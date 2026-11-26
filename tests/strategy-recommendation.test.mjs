import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendCourses} from '../js/strategy-recommendation.mjs';

const ids='ABCDEFGH';
const inputs=[[8,30],[12,33],[16,34],[20,35],[24,36],[30,40],[40,44],[55,50]];
const rankedCourses=ranks=>inputs.map(([capacity,rivals],index)=>({
  id:ids[index],name:ids[index],rank:ranks.indexOf(ids[index])+1,capacity,rivals,
}));

test('같은 8과목에서도 입력한 중요 순위에 따라 추천 순서가 달라진다',()=>{
  for(const [ranks,expected] of [['ABCDEFGH','ACFBDEGH'],['HGFEDCBA','FECDGHBA'],['EFGHABCD','EFCDGHAB']]){
    const courses=rankedCourses(ranks);
    assert.equal(recommendCourses(courses).map(course=>course.id).join(''),expected);
    assert.deepEqual(recommendCourses([...courses].reverse()),recommendCourses(courses));
    assert.equal(courses.map(course=>course.id).join(''),ids);
  }
});
test('첫 응답만 더 늦는 조건에서 고정 간격 추천보다 한 과목을 더 확보한다',()=>{
  // 경쟁자 세 과목, 상대 간격 2, 동시 도착 경쟁자 우선, 내 응답 간격 2·1·1·1·1·1·1인 경우입니다.
  const rivalRounds=[1,2,2,3,3,4,4,5];
  const closingRounds=[1,2,2,2,2,3,3,Infinity];
  const secured=order=>[...order].filter((id,slot)=>rivalRounds[slot]<closingRounds[ids.indexOf(id)]).length;
  const recommendation=recommendCourses(rankedCourses(ids)).map(course=>course.id).join('');
  assert.equal(secured('BFGACDEH'),4);
  assert.equal(secured('ABEFCDGH'),1);
  assert.equal(secured(recommendation),2);
});
test('자리당 경쟁자 수가 비슷하면 입력 중요 순위를 유지한다',()=>{
  const capacities=[20,24,28,32,36,40,44,48];
  for(const ranks of [ids,'HGFEDCBA']){
    const courses=capacities.map((capacity,index)=>({
      id:ids[index],name:ids[index],rank:ranks.indexOf(ids[index])+1,capacity,rivals:capacity+1,
    }));
    assert.equal(recommendCourses(courses).map(course=>course.id).join(''),ranks);
  }
});
test('한 과목은 여석이 남고 다른 과목은 첫 처리 차례에 마감될 수 있으면 경합 과목을 먼저 둔다',()=>{
  const courses=[
    {id:'A',name:'가상 A',rank:1,capacity:20,rivals:19},
    {id:'B',name:'가상 B',rank:2,capacity:1,rivals:200},
  ];
  assert.deepEqual(recommendCourses(courses).map(course=>course.id),['B','A']);
});
test('마감 순서가 같아 보여도 가능한 확보 수가 다른 조건은 함께 반영한다',()=>{
  const courses=[
    {id:'A',name:'가상 A',rank:1,capacity:8,rivals:30},
    {id:'B',name:'가상 B',rank:2,capacity:10,rivals:18},
  ];
  assert.deepEqual(recommendCourses(courses).map(course=>course.id),['A','B']);
});
test('전체 손실을 한 과목 줄이려고 경쟁이 높은 중요도 1위 과목을 포기하지 않는다',()=>{
  const pairs=[[8,30],[20,50],[20,30],...Array.from({length:5},()=>[15,30])];
  const courses=pairs.map(([capacity,rivals],i)=>({id:ids[i],name:ids[i],rank:i+1,capacity,rivals}));
  assert.equal(recommendCourses(courses).map(course=>course.id).join(''),'ABCDEFGH');
});
test('중요도 1위가 안전하면 대기열 조건에 따라 다른 과목을 먼저 배치한다',()=>{
  const pairs=[[20,12],[15,23],[16,30],[23,38],[18,17]];
  const courses=pairs.map(([capacity,rivals],i)=>({id:ids[i],name:ids[i],rank:i+1,capacity,rivals}));
  assert.equal(recommendCourses(courses).map(course=>course.id).join(''),'BCADE');
});
test('경쟁자 수가 정원에 닿아도 중요 순위가 갑자기 밀리지 않는다',()=>{
  const courses=[
    {id:'A',name:'가상 A',rank:1,capacity:20,rivals:19},
    {id:'B',name:'가상 B',rank:2,capacity:20,rivals:20},
    {id:'C',name:'가상 C',rank:3,capacity:8,rivals:30},
  ];
  assert.deepEqual(recommendCourses(courses).map(course=>course.id),['A','B','C']);
  courses[0].rivals=20;
  assert.deepEqual(recommendCourses(courses).map(course=>course.id),['A','B','C']);
  courses[2].rivals=8;
  assert.deepEqual(recommendCourses(courses).map(course=>course.id),['A','B','C']);
});

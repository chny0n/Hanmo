import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendCourses} from '../js/strategy-recommendation.mjs';

test('같은 8과목에서도 입력한 중요 순위에 따라 추천 순서가 달라진다',()=>{
  const ids='ABCDEFGH';
  const inputs=[[8,30],[12,33],[16,34],[20,35],[24,36],[30,40],[40,44],[55,50]];
  for(const [ranks,expected] of [['ABCDEFGH','ABECDGFH'],['HGFEDCBA','GEDCFHBA'],['EFGHABCD','EBFCGHAD']]){
    const courses=inputs.map(([capacity,rivals],index)=>({
      id:ids[index],name:ids[index],rank:ranks.indexOf(ids[index])+1,capacity,rivals,
    }));
    assert.equal(recommendCourses(courses).map(course=>course.id).join(''),expected);
    assert.deepEqual(recommendCourses([...courses].reverse()),recommendCourses(courses));
    assert.equal(courses.map(course=>course.id).join(''),ids);
  }
});
test('자리당 경쟁자 수가 비슷하면 입력 중요 순위를 유지한다',()=>{
  const ids='ABCDEFGH';
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
test('응답 사이 경쟁자가 두 차례 진행하면 B보다 D를 앞세우는 순서를 고른다',()=>{
  const courses=[
    {id:'A',name:'가상 A',rank:1,capacity:8,rivals:30},
    {id:'B',name:'가상 B',rank:2,capacity:10,rivals:18},
    {id:'C',name:'가상 C',rank:3,capacity:20,rivals:20},
    {id:'D',name:'가상 D',rank:4,capacity:20,rivals:24},
  ];
  assert.equal(recommendCourses(courses).map(course=>course.id).join(''),'ACDB');
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

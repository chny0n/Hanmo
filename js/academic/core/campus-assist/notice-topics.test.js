// @ts-check
import {expect,it} from 'vitest';
import {noticeTopics} from './notice-topics.js';

it('공지 제목의 띄어쓰기와 약칭을 받아 여러 주제를 분류한다',()=>{
  expect(noticeTopics('가상 수강 신청 및 복전 안내')).toEqual(['COURSE','MAJOR']);
  expect(noticeTopics('가상 졸업시험 신청 안내')).toEqual(['GRADUATION']);
  expect(noticeTopics('가상 기숙사 안내')).toEqual(['OTHER']);
});

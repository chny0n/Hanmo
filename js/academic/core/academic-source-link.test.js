// @ts-check
import {expect,it} from 'vitest';
import {academicSourceLink} from './academic-source-link.js';

it('학교 도메인과 유사 주소를 구분한다',()=>{
  expect(academicSourceLink('https://dep.hufs.ac.kr/hufs/11282/subview.do')).toBe('HUFS_DOMAIN');
  expect(academicSourceLink('https://hufs.ac.kr.evil.example/path')).toBe('OTHER_HTTPS');
  expect(academicSourceLink('https://example.org/hufs.ac.kr')).toBe('OTHER_HTTPS');
  expect(academicSourceLink('https://hufs.ac.kr@evil.example/path')).toBe('OTHER_HTTPS');
  expect(academicSourceLink('javascript:alert(1)')).toBe('NONE');
  expect(academicSourceLink(undefined)).toBe('NONE');
});

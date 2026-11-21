// @ts-check
import {parse} from 'acorn';

/**
 * JavaScript의 주석 토큰을 분리해 문자열·URL 안의 // 문자를 주석으로 오인하지 않는다.
 * JSDoc의 타입 구문·기계 지시문은 번역 대상에서 제외한다.
 * @param {string} source 검사할 JavaScript 소스
 * @returns {{line:number,comment:string}[]} 한국어가 없는 영문 설명 목록
 */
export function findEnglishOnlyComments(source){
  /** @type {{line:number,comment:string}[]} */
  const violations=[];
  /** @type {{line:number,text:string}[]} */
  const comments=[];
  // 문자열·정규식 안의 슬래시를 제외하기 위해 ECMAScript 토크나이저를 사용한다.
  parse(source,{ecmaVersion:'latest',sourceType:'module',locations:true,allowHashBang:true,
    onComment:(_block,text,_start,_end,startLocation)=>comments.push({line:startLocation.line,text})});
  for(const token of comments){
    const lines=token.text.split(/\r?\n/);
    const initialLine=token.line;
    let typeDeclaration=false;
    for(let i=0;i<lines.length;i++){
      let line=lines[i].trim().replace(/^\*\s?/,'').trim();
      if(!line)continue;
      // 여러 줄에 걸친 JSDoc 객체 타입은 문장이 아니라 선언 구문이다.
      if(/^@typedef\s+\{\{/.test(line)){
        typeDeclaration=!/\}\}\s+[A-Za-z_$][\w$]*$/.test(line);
        continue;
      }
      if(typeDeclaration){
        if(/\}\}\s+[A-Za-z_$][\w$]*$/.test(line))typeDeclaration=false;
        continue;
      }
      // 기계 지시문과 변경해서는 안 되는 권리 표시는 번역하지 않는다.
      if(/^(?:@ts-(?:check|nocheck|ignore|expect-error)|@eslint\b|eslint-(?:disable|enable|ignore)|prettier-ignore|istanbul ignore|c8 ignore|SPDX-|Copyright\b|©)/i.test(line))continue;
      // JSDoc의 타입·매개변수 식별자는 그대로 두되 뒤에 붙은 영문 설명은 검사한다.
      if(/^@(?:typedef|type|param|returns?|throws|property|template|satisfies|see|deprecated)\b/.test(line)){
        line=line.replace(/^@\w+\s*/,'').trim().replace(/^\{.*\}\s*/,'').trim();
        line=line.replace(/^[\w$.?\[\]-]+(?:\s+-\s+)?/,'').trim();
      }
      // 영문 식별자·숫자만 있는 순수 유형 표기는 자연어 설명이 아니다.
      if(!line||/^[\w$.[\]'"|()<>{},:;?+-]+$/.test(line))continue;
      if(/[A-Za-z]{2,}/.test(line)&&!/[가-힣]/.test(line)){
        violations.push({line:initialLine+i,comment:line.slice(0,150)});
      }
    }
  }
  return violations;
}

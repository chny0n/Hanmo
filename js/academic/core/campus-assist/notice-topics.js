// @ts-check
/** @typedef {'COURSE'|'MAJOR'|'GRADUATION'|'STATUS'|'GRADE'|'SCHOLARSHIP'|'EXCHANGE'|'OTHER'} NoticeTopic */

/** 띄어쓰기·약칭이 달라도 주제를 찾을 수 있게 글자 사이 공백을 허용한다. 주제는 검색용이다. */
/** @type {[NoticeTopic,RegExp][]} */
const TOPIC_RULES=[
  ['COURSE',/수\s*강\s*신\s*청|수신|수\s*강\s*정\s*정|수\s*강\s*취\s*소|계\s*절\s*학\s*기|강\s*의\s*평\s*가|폐\s*강/],
  ['MAJOR',/이\s*중\s*전\s*공|복전|부\s*전\s*공|전\s*공\s*(?:신\s*청|변\s*경|포\s*기|심\s*화|배\s*정)/],
  ['GRADUATION',/졸\s*업|졸시|학\s*위|외\s*국\s*어\s*인\s*증|논\s*문/],
  ['STATUS',/휴\s*학|복\s*학|등\s*록\s*금|자\s*퇴|학\s*적/],
  ['GRADE',/성\s*적|학\s*점\s*포\s*기|재\s*수\s*강|학\s*점\s*교\s*류/],
  ['SCHOLARSHIP',/장\s*학/],
  ['EXCHANGE',/교\s*환\s*학\s*생|파\s*견|해\s*외\s*연\s*수/],
];

/**
 * 공지 제목으로 검색용 주제를 정한다. 여러 주제가 동시에 나올 수 있다.
 * @param {string} title 공지 제목
 * @returns {NoticeTopic[]}
 */
export function noticeTopics(title){
  const found=TOPIC_RULES.filter(([,re])=>re.test(title)).map(([t])=>t);
  return found.length?found:['OTHER'];
}

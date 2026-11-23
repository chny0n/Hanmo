// 학교 연락처·담당 부서를 추정하지 않고 문의 주제의 검색어만 제안합니다.
(function(){
  'use strict';
  const form=document.getElementById('support-search-form');
  const input=document.getElementById('support-query');
  const suggestions=document.getElementById('support-suggestions');
  const feedback=document.getElementById('support-feedback');
  const result=document.getElementById('support-result');
  const resultText=document.getElementById('support-result-text');
  const resultLink=document.getElementById('support-result-link');
  if(!form||!input||!suggestions||!feedback||!result||!resultText||!resultLink)return;

  // 이 목록은 검색어 예시일 뿐 학교 조직표나 공식 연락처 자료가 아닙니다.
  const topics=[
    {query:'수강신청 문의',matches:['수강','정정','과목','강의']},
    {query:'휴학 복학 문의',matches:['휴학','복학','학적']},
    {query:'장학금 문의',matches:['장학','지원금']},
    {query:'등록금 납부 문의',matches:['등록','납부','고지서']},
    {query:'증명서 발급 문의',matches:['증명','서류','발급']},
    {query:'학생증 발급 문의',matches:['학생증','카드']},
    {query:'이중전공 신청 문의',matches:['이중','전공','부전공']},
    {query:'교환학생 문의',matches:['교환','국제교류']},
    {query:'계절학기 문의',matches:['계절','여름','겨울']},
    {query:'학사일정 문의',matches:['학사','일정','학기']}
  ];
  const normalize=value=>value.replace(/\s+/g,'').toLowerCase();
  function createButton(query){
    const button=document.createElement('button');
    button.type='button';
    button.className='hanmo-support-suggestion';
    button.textContent=query;
    button.addEventListener('click',()=>{
      input.value=query;
      showSuggestions();
      showSearchLink();
      input.focus();
    });
    return button;
  }
  function showSuggestions(){
    const key=normalize(input.value.trim());
    const matches=key?topics.filter(item=>
      normalize(item.query).includes(key)||
      item.matches.some(word=>normalize(word).includes(key)||key.includes(normalize(word)))
    ):topics;
    suggestions.replaceChildren();
    if(matches.length===0){
      const message=document.createElement('p');
      message.className='hanmo-support-no-match';
      message.textContent='추천 검색어가 없어도 직접 입력한 문구로 검색할 수 있습니다.';
      suggestions.append(message);
      return;
    }
    for(const topic of matches)suggestions.append(createButton(topic.query));
  }
  function showSearchLink(){
    const value=input.value.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,80);
    if(!value){
      result.hidden=true;
      feedback.textContent='검색어를 입력하거나 추천 검색어를 선택하세요.';
      input.focus();
      return;
    }
    const search=new URL('https://www.google.com/search');
    search.searchParams.set('q','site:hufs.ac.kr '+value+' 담당 부서 연락처');
    resultLink.href=search.toString();
    resultLink.textContent='외부 검색에서 공식 사이트 결과 보기';
    resultText.textContent='검색어: '+value+' — 학교 공식 사이트로 범위를 제한한 외부 검색 링크입니다. 결과의 정확성과 최신성은 확인되지 않았습니다.';
    result.hidden=false;
    feedback.textContent='검색 링크를 만들었습니다. 외부 검색을 열기 전 검색어를 확인하세요.';
  }
  input.addEventListener('input',()=>{
    result.hidden=true;
    feedback.textContent='추천 검색어를 누르거나 검색어를 직접 입력하세요.';
    showSuggestions();
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    showSearchLink();
  });
  showSuggestions();
})();

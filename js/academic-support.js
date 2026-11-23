// @ts-check
/* 학교가 공개한 부서 연락처로 안내하며 개인 정보나 질문 내용을 수집하지 않습니다. */
(function(){
  'use strict';
  const campus=document.getElementById('support-campus');
  const topic=document.getElementById('support-topic');
  const results=document.getElementById('support-results');
  const directory=document.getElementById('support-directory');
  if(!campus||!topic||!results||!directory)return;

  const academic='https://haksa.hufs.ac.kr/haksa/index.do';
  const oneStop='https://dep.hufs.ac.kr/onestop/13394/subview.do';
  const scholarship='https://dep.hufs.ac.kr/student/12765/subview.do';
  // 공개 부서 안내에 없는 개인 연락처·개별 직원 정보는 사용하지 않습니다.
  const offices={
    SEOUL:{
      academic:{name:'서울 학사종합지원센터',telephone:'02-2173-2130',email:'haksa@hufs.ac.kr',
        location:'서울캠퍼스 사이버관 105호',source:academic},
      oneStop:{name:'서울 원스톱서비스센터',telephone:'02-2173-2151',email:'onestop@hufs.ac.kr',
        location:'서울캠퍼스 국제학사 1층 118호',source:oneStop},
      student:{name:'서울 장학팀',telephone:'02-2173-3342',email:'scholarship@hufs.ac.kr',
        location:'서울캠퍼스 학생회관',source:scholarship}
    },
    GLOBAL:{
      academic:{name:'글로벌 학사종합지원센터',telephone:'031-330-4052',email:'haksay@hufs.ac.kr',
        location:'글로벌캠퍼스 학생회관 109호',source:academic},
      oneStop:{name:'글로벌 원스톱서비스센터',telephone:'031-330-4634',email:'onestopy@hufs.ac.kr',
        location:'글로벌캠퍼스 학생회관 109호',source:oneStop},
      student:{name:'글로벌 학생지원·장학팀',telephone:'031-330-4032',email:'studenty@hufs.ac.kr',
        location:'글로벌캠퍼스 학생회관 108호',source:scholarship}
    }
  };
  // 전화번호의 세부 내선은 학교의 공식 학사종합지원센터 업무 안내를 따릅니다.
  const routes={
    ACADEMIC:{office:'academic',suffix:'',label:'학사 일반 문의',SEOUL:'02-2173-2130',GLOBAL:'031-330-4052'},
    COURSE:{office:'academic',suffix:' · 정규학기 수업',label:'정규학기 수업·교과과정',SEOUL:'02-2173-2108',GLOBAL:'031-330-4028'},
    SEASONAL:{office:'academic',suffix:' · 계절학기',label:'계절학기 담당 부서',SEOUL:'02-2173-2111',GLOBAL:'031-330-4086'},
    STATUS:{office:'academic',suffix:' · 학적',label:'휴학·복학·학적변동',SEOUL:'02-2173-2112',GLOBAL:'031-330-4027'},
    MAJOR:{office:'academic',suffix:' · 전공',label:'이중전공·부전공 관련 문의',SEOUL:'02-2173-2118',GLOBAL:'031-330-4026'},
    GRADUATION:{office:'academic',suffix:' · 졸업/학적',label:'졸업·학적 담당 부서',SEOUL:'02-2173-2130',GLOBAL:'031-330-4027'},
    CERTIFICATE:{office:'oneStop',suffix:'',label:'제증명 발급 창구',SEOUL:'02-2173-2151',GLOBAL:'031-330-4634'},
    STUDENT_CARD:{office:'oneStop',suffix:'',label:'학생증·신분증 발급 문의',SEOUL:'02-2173-2151',GLOBAL:'031-330-4634'},
    SCHOLARSHIP:{office:'student',suffix:'',label:'장학·학생지원 창구',SEOUL:'02-2173-3342',GLOBAL:'031-330-4032'},
    TEACHING:{office:'academic',suffix:' · 교직',label:'교직 관련 담당 부서',SEOUL:'02-2173-2338',GLOBAL:'031-330-4953'}
  };

  /** @param {string} tag @param {string} [content] */
  const element=(tag,content='')=>{
    const item=document.createElement(tag);
    item.textContent=content;
    return item;
  };
  /** @param {string} href @param {string} text @param {boolean} [external] */
  const anchor=(href,text,external=false)=>{
    const a=element('a',text);
    a.href=href;
    if(external){a.target='_blank';a.rel='noopener noreferrer';}
    return a;
  };
  /** @param {HTMLElement} parent @param {string} label @param {string} value @param {string} [href] */
  function line(parent,label,value,href){
    const p=element('p');
    const title=element('span',label);
    p.append(title);
    p.append(href?anchor(href,value,href.startsWith('https://')):document.createTextNode(value));
    parent.append(p);
  }
  /** @param {HTMLElement} parent @param {object} record */
  function contactLines(parent,record){
    const info=element('div');info.className='hanmo-support-contact-lines';
    line(info,'전화',record.telephone,'tel:'+record.telephone);
    line(info,'메일',record.email,'mailto:'+record.email);
    line(info,'위치',record.location);
    parent.append(info);
  }
  function render(){
    results.replaceChildren();
    directory.replaceChildren();
    const key=campus.value;
    const selected=routes[topic.value];
    const campusOffices=offices[key];
    if(!selected||!campusOffices){
      results.append(element('p','담당 연락처를 확인할 수 없습니다.'));
      return;
    }
    const office=campusOffices[selected.office];
    const chosen={...office,telephone:selected[key]};
    const article=element('article');article.className='hanmo-item hanmo-support-choice';
    const heading=element('h3');
    heading.append(anchor(office.source,office.name+selected.suffix,true));
    article.append(heading);
    const summary=element('p',selected.label);summary.className='hanmo-support-topic';
    article.append(summary);
    contactLines(article,chosen);
    results.append(article);

    // 캠퍼스별 공식 창구를 함께 보여 주어 담당 업무 변동 시 우회 검색할 수 있습니다.
    for(const id of ['academic','oneStop','student']){
      const item=campusOffices[id];
      const card=element('article');card.className='hanmo-item';
      const title=element('h3');
      title.append(anchor(item.source,item.name,true));
      card.append(title);
      contactLines(card,item);
      directory.append(card);
    }
  }
  campus.addEventListener('change',render);
  topic.addEventListener('change',render);
  render();
})();

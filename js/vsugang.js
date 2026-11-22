// 설정 페이지의 함수는 vsugang.html의 인라인 onclick에서 호출하므로 전역으로 유지한다.
// 이벤트 연결 방식을 바꿀 때는 별도 PR에서 회귀 테스트를 수행한다.
const printValue=document.getElementsByClassName('printValue')[0];
const setting=document.getElementsByClassName('setting')[0];
const settingSection=document.getElementsByClassName('settingSection')[0];
const psugangInput=document.getElementsByClassName('psugangVal')[0];
const vsugangInput=document.getElementsByClassName('vsugangVal')[0];

let isSettedValue=false;

/** 이 저장 키들은 기존 페이지 간 계약이므로 이름을 변경하지 않는다. */
function validSetting(preselected,requested,waiting){
  return Number.isInteger(preselected)&&preselected>=1&&preselected<=15
    &&Number.isInteger(requested)&&requested>=1&&requested<=preselected
    &&(waiting==='yes'||waiting==='no');
}

function hasValidPracticeSettings(){
  const preselected=Number(localStorage.getItem('psubjectValue'));
  const requested=Number(localStorage.getItem('subjectValue'));
  const waiting=localStorage.getItem('waitingValue');
  return validSetting(preselected,requested,waiting);
}

function setValue(){
  isSettedValue=hasValidPracticeSettings();
  const background=isSettedValue?'#001203':'#120000';
  setting.style.background=background;
  if(isSettedValue){
    printValue.innerText='올바른 설정값이 들어갔어요.';
    printValue.style.color='white';
  }
}

/** 인라인 HTML의 모드 식별값: BASIC=1, TIME=2, SELECT=3. */
function goPractice(mode){
  if(!isSettedValue){
    alert('SETTING에서 과목 수를 지정해주세요.');
    return;
  }
  localStorage.setItem('practiceSetter',mode);
  location.href='practice.html';
}

function getSettingValue(){
  const preselected=Number(psugangInput.value);
  const requested=Number(vsugangInput.value);
  const checked=document.querySelector('input[name="waitingYN"]:checked');
  const waiting=checked?.value;
  if(!validSetting(preselected,requested,waiting)){
    alert('설정 값을 다시 확인해주세요.');
    return;
  }
  localStorage.setItem('psubjectValue',preselected);
  localStorage.setItem('subjectValue',requested);
  localStorage.setItem('waitingValue',waiting);
  settingSection.style.display='none';
  setValue();
}

function openSettingPanel(){
  settingSection.style.display='flex';
  psugangInput.value=localStorage.getItem('psubjectValue');
  vsugangInput.value=localStorage.getItem('subjectValue');
}

setValue();

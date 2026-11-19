// Settings page: keep these functions globally callable from vsugang.html
// until its inline onclick handlers are converted in a separately tested PR.
const printValue=document.getElementsByClassName('printValue')[0];
const setting=document.getElementsByClassName('setting')[0];
const settingSection=document.getElementsByClassName('settingSection')[0];
const psugangInput=document.getElementsByClassName('psugangVal')[0];
const vsugangInput=document.getElementsByClassName('vsugangVal')[0];

let isSettedValue=false;

/** These keys are part of the legacy page-to-page contract; never rename them. */
function validSetting(preselected,requested,waiting){
  return Number.isInteger(preselected)&&preselected>=1&&preselected<=15
    &&Number.isInteger(requested)&&requested>=1&&requested<=preselected
    &&(waiting==='yes'||waiting==='no');
}

function setValue(){
  const preselected=Number(localStorage.getItem('psubjectValue'));
  const requested=Number(localStorage.getItem('subjectValue'));
  const waiting=localStorage.getItem('waitingValue');
  isSettedValue=validSetting(preselected,requested,waiting);
  setting.style.background=isSettedValue?'#001203':'#120000';
  if(isSettedValue){
    printValue.innerText='올바른 설정값이 들어갔어요.';
    printValue.style.color='white';
  }
}

/** Inline HTML mode IDs: BASIC=1, TIME=2, SELECT=3. */
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

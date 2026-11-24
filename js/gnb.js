const $headerNotice = document.getElementsByClassName('headerNotice')[0];
const $HEADERNOTICELIST = document.getElementsByClassName('headerNoticeList')[0];
const $header = document.getElementsByTagName('header')[0];

const thisTime = new Date();

/*접속 제한 5분 전(09:53~09:57) 상단 안내 띠 내리기*/
showHeaderNotice = () => {
	//if (true){
	//if(thisTime.getHours() === 20 && thisTime.getMinutes() >= 53 && thisTime.getMinutes() < 58){
	if(thisTime.getHours() === 9 && thisTime.getMinutes() >= 53 && thisTime.getMinutes() < 58){
		$header.style.top = '0px';
		$headerNotice.style.display = 'flex';
	}
}

showHeaderNotice();

var headerNoticeCnt = 1;

const setHeaderNotice = setInterval(() => {
	if (headerNoticeCnt === 1) {
		headerNoticeBottom = 81;
		headerNoticeCnt = 2;
	} else if (headerNoticeCnt === 2) {
		headerNoticeBottom = 137;
		headerNoticeCnt = 3;
	} else{
		headerNoticeBottom = 25;
		headerNoticeCnt = 1;
	}
	$HEADERNOTICELIST.style.bottom = `${headerNoticeBottom}px`;
}, 5000);


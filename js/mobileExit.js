/*모바일 환경이면 화면을 그리기 전에 바로 alert 후 한모에서 내보내기
  모든 페이지 <head>에서 가장 먼저 불러와야 해요.*/

/*나가는 곳: 외부 사이트에서 들어왔으면 그 이전 페이지, 아니면 아래 주소*/
const MOBILE_EXIT_URL = 'https://www.google.com/';

(function () {
	if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;

	window.HANMO_EXITING = true; // 이후 스크립트의 페이지 이동이 나가기를 덮어쓰지 않도록
	document.documentElement.style.visibility = 'hidden'; // 이동하는 동안 화면이 그려지지 않도록

	alert('현재 한모를 사용할 수 없는 환경이에요. 원활한 사용을 위해 PC 및 올바른 브라우저에서 접속해주세요.');

	let cameFromOutside = false;
	try {
		cameFromOutside = document.referrer !== '' && new URL(document.referrer).origin !== location.origin;
	} catch (e) {}

	if (cameFromOutside && history.length > 1) {
		history.back();
	} else {
		location.replace(MOBILE_EXIT_URL);
	}
})();

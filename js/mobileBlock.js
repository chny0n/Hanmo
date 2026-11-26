/*모바일 환경이면 페이지 위에 '입장 불가' 안내 화면을 덮어요.
  - 다른 곳으로 이동(리다이렉트)하지 않아요: 검색엔진(모바일 기준으로 수집)이 페이지 내용을 그대로 읽을 수 있도록
  - 모든 페이지 <head>에서 가장 먼저 불러와야 해요.*/

(function () {
	if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;

	const MESSAGE = '현재 한모를 사용할 수 없는 환경이에요.<br>원활한 사용을 위해 PC 및 올바른 브라우저에서 접속해주세요.';

	/*화면이 그려지기 전에 스타일부터 넣어서 원래 화면이 잠깐 보이지 않도록*/
	const style = document.createElement('style');
	style.textContent =
		'html.mobileBlocked, html.mobileBlocked body { overflow: hidden; }' +
		'.mobileBlock {' +
			'position: fixed; inset: 0; z-index: 2147483647;' +
			'display: flex; align-items: center; justify-content: center;' +
			'padding: 0 24px; box-sizing: border-box;' +
			'background: #06111c; color: #ffffff;' +
			"font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;" +
			'font-size: 17px; font-weight: bold; line-height: 1.7; text-align: center;' +
			'word-break: keep-all;' +
		'}' +
		'.mobileBlock p { margin: 0; max-width: 320px; }';
	document.head.appendChild(style);
	document.documentElement.classList.add('mobileBlocked');

	const showBlock = () => {
		const $BLOCK = document.createElement('div');
		$BLOCK.className = 'mobileBlock';
		$BLOCK.setAttribute('role', 'alertdialog');
		$BLOCK.innerHTML = `<p>${MESSAGE}</p>`;
		document.body.appendChild($BLOCK);
	};

	if (document.body) {
		showBlock();
	} else {
		document.addEventListener('DOMContentLoaded', showBlock);
	}
})();

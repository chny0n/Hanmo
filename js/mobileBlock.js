/*모바일 환경이면 페이지 위에 '입장 불가' 안내 화면을 덮어요.
  - 다른 곳으로 이동(리다이렉트)하지 않아요: 검색엔진(모바일 기준으로 수집)이 페이지 내용을 그대로 읽을 수 있도록
  - 모든 페이지 <head>에서 가장 먼저 불러와야 해요.*/

(function () {
	if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;

	/*이미지 경로: 이 스크립트 위치(/js/) 기준으로 찾아서 index.html, html/*.html 어디서든 동작*/
	const scriptSrc = (document.currentScript && document.currentScript.src) || location.href;
	const LOGO_SRC = new URL('../img/hanmo_white.svg', scriptSrc).href;
	const SITE = 'tofuhanmo.com'; // 안내에 보여줄 주소 (접속 주소와 상관없이 고정)

	/*화면이 그려지기 전에 스타일부터 넣어서 원래 화면이 잠깐 보이지 않도록*/
	const style = document.createElement('style');
	style.textContent = `
		html.mobileBlocked, html.mobileBlocked body { overflow: hidden; }

		.mobileBlock {
			position: fixed; inset: 0; z-index: 2147483647;
			display: flex; flex-direction: column; align-items: center; justify-content: center;
			padding: 0 28px; box-sizing: border-box;
			background: #000d18; color: #ffffff;
			font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
			text-align: center; word-break: keep-all;
			overflow: hidden;
		}

		/*한모 타이틀과 같은 '선 - 로고 - 선' 구성*/
		.mobileBlock .mbLogo {
			display: flex; align-items: center; gap: 14px;
			width: 100%; max-width: 280px; margin-bottom: 32px;
		}
		.mobileBlock .mbLogo hr {
			flex: 1; margin: 0; border: 0; height: 1px; background: #bdbdbd;
		}
		.mobileBlock .mbLogo img { height: 12px; }

		.mobileBlock .mbTitle {
			margin: 0 0 12px;
			font-size: 20px; font-weight: 700; line-height: 1.5;
		}
		.mobileBlock .mbDesc {
			margin: 0 0 32px; max-width: 300px;
			font-size: 15px; font-weight: 400; line-height: 1.7;
			color: rgba(255, 255, 255, 0.6);
		}

		/*PC에서 열 주소*/
		.mobileBlock .mbSite {
			display: inline-flex; align-items: center; gap: 10px;
			padding: 10px 18px; border-radius: 15px;
			background: #06111c; border: 1px solid rgba(255, 210, 122, 0.5);
			font-size: 14px; font-weight: 500; color: rgba(255, 255, 255, 0.6);
		}
		.mobileBlock .mbSite b { color: #ffd27a; font-weight: 700; letter-spacing: 0.3px; }
	`;
	document.head.appendChild(style);
	document.documentElement.classList.add('mobileBlocked');

	const showBlock = () => {
		const $BLOCK = document.createElement('div');
		$BLOCK.className = 'mobileBlock';
		$BLOCK.setAttribute('role', 'alertdialog');
		$BLOCK.setAttribute('aria-labelledby', 'mbTitle');
		$BLOCK.innerHTML = `
			<div class="mbLogo"><hr><img src="${LOGO_SRC}" alt="한모"><hr></div>
			<p class="mbTitle" id="mbTitle">현재 한모를 사용할 수 없는 환경이에요.</p>
			<p class="mbDesc">원활한 사용을 위해 PC 및 올바른 브라우저에서 접속해주세요.</p>
			<div class="mbSite">PC에서 <b>${SITE}</b></div>
		`;
		document.body.appendChild($BLOCK);
	};

	if (document.body) {
		showBlock();
	} else {
		document.addEventListener('DOMContentLoaded', showBlock);
	}
})();

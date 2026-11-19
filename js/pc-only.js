/* 한모 전체 PC 전용 정책: 모든 진입 HTML의 head에서 동기 실행한다. */
(function enforcePcOnly() {
  'use strict';
  const device = window.navigator;
  const ua = String(device.userAgent || '');
  const ipadDesktopMode = /Macintosh/i.test(ua) &&
    device.platform === 'MacIntel' && Number(device.maxTouchPoints) > 1;
  const mobileAgent = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|BB10|PlayBook|webOS|Kindle|Silk|Opera Mini|Opera Mobi|Mobi|Tablet/i.test(ua);
  // 기존 deviceInfo/localStorage는 과거 판정일 수 있으므로 차단 근거로 재사용하지 않는다.
  const blocked = device.userAgentData?.mobile === true || mobileAgent || ipadDesktopMode;
  window.HanmoPcOnly = Object.freeze({blocked});
  if (!blocked) return;

  // 후속 스크립트 실행/페이지 이동을 기다리는 동안에도 입력 폼을 노출하지 않는다.
  document.documentElement.setAttribute('data-hanmo-pc-only', 'blocked');
  const style = document.createElement('style');
  style.textContent = 'html[data-hanmo-pc-only="blocked"] { visibility: hidden !important; }';
  document.head.appendChild(style);
  const source = document.currentScript?.src;
  const destination = new URL('../html/pc-only.html', source || window.location.href);
  window.location.replace(destination.href);
})();

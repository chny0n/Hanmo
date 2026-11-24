const now = new Date();

const title = document.getElementsByClassName('title')[0];

restrictHanmo = () => {
	if (window.HANMO_EXITING) return; // 모바일 나가기 진행 중 (mobileExit.js)
	if (((now.getHours() === 9 && now.getMinutes() >= 58) || (now.getHours() === 10 && now.getMinutes() <= 10))){
		location.href = '/';
	}
}

setSemester = () => {
	let hakgi = 1
	if (now.getMonth() >= 6 && now.getMonth() <= 11){
		hakgi = 2;
	}
	title.innerText = `${now.getFullYear()}-${hakgi}학기`;

}


setSemester();
restrictHanmo();
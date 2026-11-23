// @ts-check
// 화면에 표시된 비공식 결과만 로컬 PNG 카드로 저장합니다.
export async function saveReportCard(title,rows,filename){
  if(typeof document==='undefined')throw new Error('브라우저에서만 저장할 수 있습니다.');
  const canvas=document.createElement('canvas');
  canvas.width=960;
  canvas.height=240+Math.min(rows.length,12)*56;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('이미지 생성이 지원되지 않는 브라우저입니다.');
  ctx.fillStyle='#061521';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#f4c76c';ctx.fillRect(52,42,56,5);
  ctx.font='bold 32px "Noto Sans KR", sans-serif';
  ctx.fillStyle='#f2f5f8';ctx.fillText(title,52,116,850);
  ctx.font='19px "Noto Sans KR", sans-serif';
  for(const [index,row] of rows.slice(0,12).entries()){
    ctx.fillStyle=index%2===0?'#0c2738':'#102b3e';
    ctx.fillRect(44,145+index*56,872,50);
    ctx.fillStyle='#f2f5f8';
    ctx.fillText(String(row).slice(0,85),62,179+index*56,830);
  }
  ctx.fillStyle='#bacbd5';
  ctx.font='16px "Noto Sans KR", sans-serif';
  ctx.fillText('한모 · 비공식 · 학교 성능 및 실제 수강신청 결과와 무관합니다.',52,canvas.height-33,860);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('이미지 파일을 생성하지 못했습니다.');
  const url=URL.createObjectURL(blob);
  try{
    const link=document.createElement('a');
    link.href=url;link.download=filename;
    document.body.append(link);link.click();link.remove();
  }finally{
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
}

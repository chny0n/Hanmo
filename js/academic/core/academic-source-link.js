// @ts-check
/** @typedef {'NONE'|'HUFS_DOMAIN'|'OTHER_HTTPS'} AcademicSourceLink */

/**
 * 학교 도메인 일치는 공지의 검수나 자료 이용 승인을 증명하지 않는다.
 * @param {string|undefined} raw
 * @returns {AcademicSourceLink}
 */
export function academicSourceLink(raw){
  if(!raw)return 'NONE';
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:')return 'NONE';
    const hostname=url.hostname.toLowerCase();
    if(url.username||url.password)return 'OTHER_HTTPS';
    return hostname==='hufs.ac.kr'||hostname.endsWith('.hufs.ac.kr')
      ?'HUFS_DOMAIN':'OTHER_HTTPS';
  }catch{return 'NONE';}
}

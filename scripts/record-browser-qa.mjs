import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {release,platform} from 'node:os';

const channel=process.env.HANMO_BROWSER_CHANNEL;
if(!['chrome','msedge'].includes(channel))throw new Error('검증 브라우저 채널을 명시하세요.');
const browser=await chromium.launch({channel,headless:true});
try{
  const page=await browser.newPage();
  const evidence={
    sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    recordedAt:new Date().toISOString(),
    platform:platform(),osRelease:release(),node:process.version,
    channel,browserVersion:browser.version(),
    userAgent:await page.evaluate(()=>navigator.userAgent),
    automation:'Playwright headless',physicalInput:false,actualBrowserZoom:false,nvda:false,
  };
  await mkdir('qa-artifacts',{recursive:true});
  await writeFile('qa-artifacts/browser-environment.json',JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence,null,2));
}finally{await browser.close();}

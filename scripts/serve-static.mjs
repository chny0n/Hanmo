// @ts-check
// 로컬 정적 서버이며 빌드된 dist만 제공한다.
import {createServer} from 'node:http';
import {open,readFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute,extname} from 'node:path';

const root=resolve(import.meta.dirname,'../dist');
const port=Number(process.env.PORT||4173);
const mime={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.xml':'application/xml; charset=utf-8',
  '.txt':'text/plain; charset=utf-8',
};
createServer(async(request,response)=>{
  let file;
  try{
    const pathname=new URL(request.url||'/','http://localhost').pathname;
    file=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
    const rel=relative(root,file);
    if(rel.startsWith('..')||isAbsolute(rel))throw new Error('outside dist');
  }catch{
    response.writeHead(400);response.end('Invalid route');return;
  }
  try{
    let body;
    if(request.method==='HEAD'){
      const handle=await open(file);
      try{
        if(!(await handle.stat()).isFile())throw new Error('Not a file');
      }finally{
        await handle.close();
      }
    }else body=await readFile(file);
    response.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});
    response.end(body);
  }catch{
    response.writeHead(404,{'content-type':'text/plain; charset=utf-8'});response.end('Not found');
  }
}).listen(port,'127.0.0.1',function(){
  console.log('한모: http://127.0.0.1:'+this.address().port);
});

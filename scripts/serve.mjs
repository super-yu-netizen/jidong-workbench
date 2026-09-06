// 肌动仅提供本地静态页面；个人记录仍由浏览器本地数据库保存。
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.JIDONG_PORT||5198);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('肌动的本地页面仅供读取。');return;}
    const pathname=decodeURIComponent(new URL(req.url,`http://127.0.0.1:${port}`).pathname);
    let file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end('这个路径不属于肌动。');return;}
    if(file===root)file=path.join(root,'index.html');
    let info;try{info=await stat(file)}catch{if(!path.extname(pathname)){file=path.join(root,'index.html');info=await stat(file)}else{res.writeHead(404);res.end('这份素材还没有找到，请回到肌动重新打开。');return;}}
    if(!info.isFile()){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:await readFile(file));
  }catch(error){console.error('[肌动] 页面暂时没能送达：',error.message);res.writeHead(500);res.end('页面暂时没能打开，请重新启动肌动。');}
});
server.on('error',error=>{console.error('[肌动] 本地入口未启动：',error.code==='EADDRINUSE'?`端口 ${port} 已被使用；已有肌动页面时直接打开即可。`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`[肌动] 训练档案已就绪：http://127.0.0.1:${port}/`));

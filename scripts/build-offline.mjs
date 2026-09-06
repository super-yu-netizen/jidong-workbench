import {readdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=(await readdir('dist/assets')).filter(name=>/\.(png|svg|js|css)$/.test(name)).map(name=>'/assets/'+name);
const fingerprintHash=createHash('sha256').update(await readFile('dist/index.html'));
for(const asset of files)fingerprintHash.update(await readFile('dist'+asset));
const fingerprint=fingerprintHash.digest('hex').slice(0,12);
const urls=['/','/index.html','/manifest.webmanifest',...files];
// 缓存只包含程序和原创素材，不处理个人记录；更新不会清空本地档案。
const worker=`const CACHE='jidong-${fingerprint}';const FILES=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('jidong-')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    try{return await fetch(event.request)}
    catch{
      const saved=await caches.match(event.request);
      if(saved)return saved;
      if(event.request.mode==='navigate')return await caches.match('/index.html');
      return Response.error();
    }
  })());
});`;
await writeFile('dist/sw.js',worker);
console.log(`[肌动] 已准备 ${urls.length} 份离线程序与素材，版本 ${fingerprint}。`);

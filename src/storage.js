import { createInitialState, validateRecord } from './data.js';

const DB_NAME='jidong-personal-workbench';
const STORE_NAME='workspace';
const STATE_KEY='personal-state-v1';
const LOCAL_KEY='jidong-state-v1';
let overwriteProtection=false;
let activeBackend='indexeddb';
const protectedBackends=new Set();

function storageError(message,code,cause){const e=new Error(message,{cause});e.code=code;return e;}
function openDatabase(){
  return new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(storageError('当前浏览器暂不支持本地数据库，将尝试浏览器存储。','IDB_UNAVAILABLE'));return;}
    let request;
    try{request=indexedDB.open(DB_NAME,1);}catch(e){reject(e);return;}
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE_NAME))request.result.createObjectStore(STORE_NAME);};
    request.onerror=()=>reject(request.error||new Error('本地数据库未能打开。'));
    request.onblocked=()=>reject(storageError('另一个肌动页面正在使用旧版数据库，请关闭旧页面后重试。','DB_BLOCKED'));
    request.onsuccess=()=>resolve(request.result);
  });
}
async function readIndexedDB(){
  const db=await openDatabase();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_NAME,'readonly');
    const request=tx.objectStore(STORE_NAME).get(STATE_KEY);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}
async function writeIndexedDB(state){
  const db=await openDatabase();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_NAME,'readwrite');
    tx.objectStore(STORE_NAME).put(state,STATE_KEY);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error||new Error('这次记录还没有写入本地数据库。'));
    tx.onabort=()=>reject(tx.error||new Error('这次记录保存被中止，请重试。'));
  });}finally{db.close();}
}

/** 导出和导入共用同一真实对象；校验失败绝不替换当前工作台。 */
export function validateImport(input){
  const data=typeof input==='string'?JSON.parse(input):input;
  if(!data || typeof data!=='object' || data.version!==1)throw new Error('这份文件不是肌动第 1 版的数据，请选择肌动导出的 JSON 文件。');
  if(!Array.isArray(data.records)||!Array.isArray(data.media)||!Array.isArray(data.categories)||!Array.isArray(data.activities))throw new Error('文件缺少训练记录、相册、分类或活动，当前数据仍然保留。');
  const unique=(rows,label)=>{
    const ids=new Set();
    for(const row of rows){if(!row||typeof row.id!=='string'||!row.id||ids.has(row.id))throw new Error(`${label}中存在缺少编号或编号重复的内容，请检查导出文件。`);ids.add(row.id);}
    return ids;
  };
  const recordIds=unique(data.records,'训练志');
  const mediaIds=unique(data.media,'相册');
  unique(data.activities,'最近活动');
  const media=data.media.map(m=>{
    if(typeof m.src!=='string'||!(m.src.startsWith('/assets/')||/^data:(image\/(png|jpeg|jpg|webp|gif|svg\+xml)|audio\/[a-z0-9.+-]+|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet)|vnd\.ms-excel|json|octet-stream)|text\/(plain|csv));base64,/i.test(m.src)))throw new Error('相册里有不支持的图片或附件地址，请使用应用上传的本地素材。');
    if(!['image','file','audio'].includes(m.kind))throw new Error('相册附件的类型无法识别。');
    return {...m,title:String(m.title||'身体成长附件'),description:String(m.description||''),type:String(m.type||'training')};
  });
  const categories=[...new Set(data.categories.filter(c=>typeof c==='string'&&c.trim()).map(c=>c.trim()))];
  const state={...data,media,categories,records:data.records.map(r=>({...r,fields:{...(r.fields||{})}}))};
  const records=state.records.map(r=>{
    if(r.planId && (!recordIds.has(r.planId)||!state.records.some(p=>p.id===r.planId&&p.type==='plan')))throw new Error(`「${r.title}」的关联计划不存在，暂时无法恢复这份数据。`);
    if(r.fields?.sourceRecordId && !recordIds.has(r.fields.sourceRecordId))throw new Error(`「${r.title}」的来源记录缺失，暂时无法恢复。`);
    for(const ids of [r.fields?.sourceIds,r.fields?.report?.sourceRecordIds])if(ids!==undefined&&(!Array.isArray(ids)||ids.some(id=>!recordIds.has(id))))throw new Error(`「${r.title}」的报告来源缺失，暂时无法恢复。`);
    if(!Array.isArray(r.mediaIds)||r.mediaIds.some(id=>!mediaIds.has(id))||(r.coverId&&!mediaIds.has(r.coverId)))throw new Error(`「${r.title}」引用了不存在的图片，请检查导出文件。`);
    const checked=validateRecord(r,state);
    if(!categories.includes(checked.category))categories.push(checked.category);
    return checked;
  });
  const activities=data.activities.map(a=>{
    if(!recordIds.has(a.recordId))throw new Error('最近活动引用了已不存在的记录，暂时无法恢复。');
    if(typeof a.at!=='string'||Number.isNaN(Date.parse(a.at)))throw new Error('最近活动的时间无法识别。');
    return {...a,title:String(a.title||'身体记录已更新'),description:String(a.description||'')};
  });
  const settings={name:'林屿',waterGoal:2200,weeklyTrainingGoal:3,reminders:true,...(data.settings||{})};
  if(typeof settings.name!=='string'||!settings.name.trim())throw new Error('个人称呼不能为空。');
  if(!Number.isFinite(Number(settings.waterGoal))||Number(settings.waterGoal)<=0)throw new Error('每日饮水目标需要大于零。');
  if(!Number.isInteger(Number(settings.weeklyTrainingGoal))||Number(settings.weeklyTrainingGoal)<1||Number(settings.weeklyTrainingGoal)>7)throw new Error('每周训练目标请填写 1 到 7 次。');
  settings.waterGoal=Number(settings.waterGoal);settings.weeklyTrainingGoal=Number(settings.weeklyTrainingGoal);settings.reminders=Boolean(settings.reminders);
  return {...state,version:1,records,media,categories,activities,settings};
}

export async function loadState(){
  let databaseRaw, localRaw, databaseError;
  try{databaseRaw=await readIndexedDB();}
  catch(e){databaseError=e;console.warn('[肌动] 本地数据库暂不可用，正在尝试浏览器存储：',e.message);}
  try{localRaw=globalThis.localStorage?.getItem(LOCAL_KEY);}
  catch(e){if(databaseError)throw storageError('浏览器没有允许本地保存。请检查隐私模式或存储权限后重试。','STORAGE_UNAVAILABLE',e);}
  activeBackend=databaseError?'localStorage':'indexeddb';
  const snapshots=[];
  const corruptErrors=[];
  // 同时读取数据库与兼容备份，防止一次降级保存后又误读更旧的数据库。
  for(const [backend,raw] of [['indexeddb',databaseRaw],['localStorage',localRaw]]){
    if(raw===undefined||raw===null)continue;
    try{const state=validateImport(raw);snapshots.push({backend,state,at:Date.parse(state.savedAt||state.updatedAt||state.createdAt||'')||0});}
    catch(e){protectedBackends.add(backend);corruptErrors.push(e);console.error('[肌动] 一份本地快照未通过校验，原始内容已保留：',e.message);}
  }
  if(!snapshots.length){
    if(corruptErrors.length){overwriteProtection=true;throw storageError(`原有记录暂时无法读取：${corruptErrors[0].message} 肌动已保留原文件，不会自动覆盖。`,'STORAGE_CORRUPT',corruptErrors[0]);}
    return createInitialState();
  }
  snapshots.sort((a,b)=>b.at-a.at);
  activeBackend=snapshots[0].backend;
  return snapshots[0].state;
}

export async function saveState(input,options={}){
  if(overwriteProtection&&!options.replaceCorrupt)throw storageError('旧记录正在受保护。请先导出备份或明确选择恢复文件，再继续保存。','STORAGE_PROTECTED');
  let state;
  try{state={...validateImport(input),savedAt:new Date().toISOString()};}catch(e){console.error('[肌动] 保存前校验未通过：',e.message);throw e;}
  try{
    if(activeBackend==='indexeddb'){
      try{await writeIndexedDB(state);}
      catch(e){
        if(e?.name==='QuotaExceededError')throw storageError('本机可用空间不足，这次内容还没有保存。请导出备份、释放空间后重试。','STORAGE_FULL',e);
        console.warn('[肌动] 数据库写入未完成，尝试浏览器存储：',e.message);
        if(!globalThis.localStorage)throw e;
        if(protectedBackends.has('localStorage')&&!options.replaceCorrupt)throw storageError('兼容备份暂时无法读取，已保护原始内容。这次记录尚未保存，请恢复备份后重试。','STORAGE_PROTECTED');
        localStorage.setItem(LOCAL_KEY,JSON.stringify(state));
        activeBackend='localStorage';
      }
    }else{
      if(!globalThis.localStorage)throw new Error('浏览器存储不可用。');
      localStorage.setItem(LOCAL_KEY,JSON.stringify(state));
    }
    if(options.replaceCorrupt){
      overwriteProtection=false;
      protectedBackends.delete(activeBackend);
      // 用户已明确恢复：成功写入数据库后移除旧的兼容快照，避免下次重现损坏数据。
      if(activeBackend==='indexeddb'){try{globalThis.localStorage?.removeItem(LOCAL_KEY);protectedBackends.delete('localStorage');}catch{/* 新数据已安全写入数据库。 */}}
    }
    return state;
  }catch(e){console.error('[肌动] 这次记录未能保存，原有数据仍在：',e.message);throw storageError(e?.name==='QuotaExceededError'?'图片超过浏览器剩余存储空间，这次修改还没有保存。请减少图片大小后重试。':e.message||'这次笔记还没有存好，请稍后再试。',e.code||'SAVE_FAILED',e);}
}

export function exportData(state){
  const valid=validateImport(state);
  const json=JSON.stringify({...valid,exportedAt:new Date().toISOString()},null,2);
  if(typeof document==='undefined')return json;
  const blob=new Blob([json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=`肌动-身体成长备份-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  return json;
}

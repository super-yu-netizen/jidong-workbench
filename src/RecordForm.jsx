import React, {useEffect, useRef, useState} from 'react';
import Icon from './Icons.jsx';
import {TYPES} from './data.js';
import {Button, Field, FormError, Sheet} from './ui.jsx';
import './form.css';

const TYPE_DETAILS = [
  {id:'training',label:'训练记录',icon:'dumbbell',hint:'动作、组数与重量'},
  {id:'plan',label:'训练计划',icon:'plan',hint:'安排下一次进步'},
  {id:'exercise',label:'动作库',icon:'exercise',hint:'留住动作要领'},
  {id:'body',label:'体重体脂',icon:'body',hint:'记录晨起体测'},
  {id:'measure',label:'身体围度',icon:'measure',hint:'看见身体的变化'},
  {id:'meal',label:'饮食记录',icon:'meal',hint:'能量与蛋白质'},
  {id:'water',label:'饮水记录',icon:'water',hint:'一瓶水也算数'},
  {id:'sleep',label:'睡眠恢复',icon:'moon',hint:'恢复是训练的一部分'},
  {id:'record',label:'个人纪录',icon:'trophy',hint:'为新的突破留证'},
];
const TYPE_OPTIONS=TYPE_DETAILS.map(type=>({...type,...TYPES.find(t=>t.id===type.id),icon:type.icon}));
const TITLES={training:'上肢力量 · 自主训练',plan:'下次训练 · 全身力量',exercise:'哑铃划船 · 动作笔记',body:'晨起空腹体测',measure:'每周围度复测',meal:'训练日午餐',water:'午后补水一瓶',sleep:'昨夜睡眠与恢复',record:'哑铃卧推 · 新的突破'};
const uid=prefix=>`${prefix}-${globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`}`;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const initialFields=type=>({
  training:{duration:45,location:'小区健身房',exercises:[{name:'哑铃卧推',sets:[{weight:12,reps:10,done:false},{weight:12,reps:10,done:false},{weight:12,reps:10,done:false}]}]},
  plan:{duration:40,location:'小区健身房',exercises:[{name:'高脚杯深蹲',sets:[{weight:12,reps:12,done:false},{weight:12,reps:12,done:false},{weight:12,reps:12,done:false}]}]},
  exercise:{muscle:'背部',equipment:'哑铃',instructions:'保持脊柱中立，肘部向髋部拉近，下放时保持控制。'},
  body:{weight:77.4,fat:23.5},measure:{waist:87.5,hip:98,chest:101},meal:{calories:580,protein:38,mealType:'午餐'},water:{amount:350},sleep:{hours:7.5,quality:'良好'},record:{value:20,unit:'kg',achievement:'哑铃卧推单侧重量突破'},
}[type]||{});
const fallbackAsset={training:'dumbbell',plan:'dumbbell',exercise:'sequence',body:'body',measure:'body',meal:'meal',water:'water',sleep:'recovery',record:'dumbbell'};
const defaultCovers={plan:'media-hero',training:'media-dumbbell',exercise:'media-sequence',body:'media-body',measure:'media-body',meal:'media-meal',water:'media-water',sleep:'media-recovery',record:'media-dumbbell'};
const defaultCategories={plan:'力量训练',training:'力量训练',exercise:'动作学习',body:'身体测量',measure:'身体测量',meal:'日常饮食',water:'补水',sleep:'睡眠恢复',record:'个人纪录'};
const parseTags=text=>[...new Set(text.split(/[、,，#\s]+/).map(t=>t.trim()).filter(Boolean))].slice(0,10);
function draftFingerprint(draft,tagsText){
  const fields={...draft.fields},number=value=>value===''?'':Number(value);
  const keys={training:['duration'],plan:['duration'],body:['weight','fat'],measure:['waist','hip','chest'],meal:['calories','protein'],water:['amount'],sleep:['hours'],record:['value']}[draft.type]||[];
  keys.forEach(key=>fields[key]=number(fields[key]));
  if(fields.exercises)fields.exercises=fields.exercises.map(e=>({...e,name:e.name.trim(),sets:e.sets.map(s=>({...s,weight:number(s.weight),reps:number(s.reps),done:!!s.done}))}));
  const coverId=draft.coverId||defaultCovers[draft.type];
  return JSON.stringify({...draft,title:draft.title.trim(),notes:draft.notes.trim(),tags:parseTags(tagsText),fields,coverId,mediaIds:[...new Set([...draft.mediaIds,coverId])]});
}

/** 三步填写与媒体暂存都在本组件内完成，只有最终确认才写入统一数据源。 */
export default function RecordForm({record=null,initialType='training',initialDate,initialTemplate=null,data,onSave,onClose}){
  const existingMedia=Array.isArray(data?.media)?data.media:[];
  const categories=(data?.categories||[]).map(c=>typeof c==='string'?{id:c,name:c}:{...c,name:c.name||c.label||c.id});
  const source=record||initialTemplate||{};
  const typeSeed=TYPE_OPTIONS.some(t=>t.id===source.type)?source.type:initialType;
  // 模板只携带起始内容；一键训练始终创建新 id，不会覆盖动作库的来源记录。
  const [draft,setDraft]=useState(()=>({type:typeSeed,title:TITLES[typeSeed]||'',date:initialDate||today(),time:'18:30',status:typeSeed==='plan'?'planned':'active',category:defaultCategories[typeSeed]||categories[0]?.id||categories[0]?.name||'力量训练',tags:[],notes:'',coverId:'',mediaIds:[],planId:'',nextDate:'',...structuredClone(initialTemplate||{}),...structuredClone(record||{}),id:record?.id||uid('record'),fields:{...initialFields(typeSeed),...structuredClone(initialTemplate?.fields||{}),...structuredClone(record?.fields||{})}}));
  const [tagsText,setTagsText]=useState((source.tags||[]).join('、'));
  const [step,setStep]=useState(1),[error,setError]=useState(''),[saving,setSaving]=useState(false),[uploads,setUploads]=useState([]),[preview,setPreview]=useState(null),[dragging,setDragging]=useState(false),[statusNotice,setStatusNotice]=useState(''),[confirmDiscard,setConfirmDiscard]=useState(false);
  const uploadFiles=useRef(new Map()),fileInput=useRef(null),topRef=useRef(null),live=useRef(true),discardRef=useRef(null),returnFocus=useRef(null),closeState=useRef({});
  const initialFingerprint=useRef(draftFingerprint(draft,tagsText));
  const dirty=uploads.length>0||draftFingerprint(draft,tagsText)!==initialFingerprint.current;
  closeState.current={dirty,saving,preview,confirmDiscard};
  useEffect(()=>{live.current=true;return()=>{live.current=false}},[]);
  useEffect(()=>{topRef.current?.scrollIntoView?.({block:'start',behavior:'smooth'})},[step]);
  useEffect(()=>{if(confirmDiscard)discardRef.current?.focus()},[confirmDiscard]);
  function keepEditing(){setConfirmDiscard(false);requestAnimationFrame(()=>returnFocus.current?.focus?.())}
  function requestClose(){
    const current=closeState.current;
    if(current.saving)return;
    if(current.preview){setPreview(null);return}
    if(current.confirmDiscard){keepEditing();return}
    if(current.dirty){returnFocus.current=document.activeElement;setConfirmDiscard(true)}else onClose();
  }
  const typeInfo=TYPE_OPTIONS.find(t=>t.id===draft.type)||TYPE_OPTIONS[0];
  const completedUploads=uploads.filter(u=>u.state==='done');
  const allMedia=[...existingMedia,...completedUploads.map(u=>u.media)];
  const defaultMedia=existingMedia.find(m=>m.id===defaultCovers[draft.type])||existingMedia.find(m=>m.type===draft.type&&(!m.kind||m.kind==='image'))||existingMedia.find(m=>m.tags?.includes(draft.type)&&(!m.kind||m.kind==='image'))||existingMedia.find(m=>(m.src||'').includes(fallbackAsset[draft.type])&&(!m.kind||m.kind==='image'))||existingMedia.find(m=>!m.kind||m.kind==='image');
  const selectedCover=allMedia.find(m=>m.id===draft.coverId)||defaultMedia;
  const plans=(data?.records||[]).filter(r=>r.type==='plan'&&r.id!==draft.id);
  const activeUploading=uploads.some(u=>u.state==='reading');
  function update(key,value){setDraft(d=>({...d,[key]:value}));setError('')}
  function field(key,value){setDraft(d=>({...d,fields:{...d.fields,[key]:value}}));setError('')}
  function changeType(type){if(type===draft.type)return;setDraft(d=>({...d,type,title:d.title===TITLES[d.type]||!d.title?TITLES[type]:d.title,category:d.category===defaultCategories[d.type]?defaultCategories[type]:d.category,fields:initialFields(type),status:type==='plan'?'planned':d.status==='planned'?'active':d.status,coverId:'',mediaIds:record?.mediaIds||[]}));setError('')}
  function updateExercise(index,fn){field('exercises',draft.fields.exercises.map((ex,i)=>i===index?fn(ex):ex))}
  function setStatus(status){const count=draft.fields.exercises?.reduce((n,e)=>n+e.sets.length,0)||0;setStatusNotice(status==='done'&&count?`已将全部 ${count} 组标为完成。请核对实际训练；未完成的组可以在下方取消勾选。`:'');setDraft(d=>({...d,status,fields:{...d.fields,...(status==='done'&&d.fields.exercises?{exercises:d.fields.exercises.map(e=>({...e,sets:e.sets.map(s=>({...s,done:true}))}))}:{})}}))}
  const validNumber=(value,min,max)=>value!==''&&Number.isFinite(Number(value))&&Number(value)>=min&&Number(value)<=max;
  function validate(){
    if(draft.title.trim().length<2||draft.title.trim().length>70)return '给这次记录起一个 2–70 字的名字，日后更容易找回。';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)||Number.isNaN(new Date(`${draft.date}T12:00:00`).valueOf()))return '请选一个有效的记录日期。';
    if(!/^\d{2}:\d{2}$/.test(draft.time))return '请补上记录时间。';
    if(draft.nextDate&&draft.nextDate<draft.date)return '下一次提醒日期应在本次记录当天或之后。';
    const f=draft.fields;
    if(['training','plan'].includes(draft.type)){
      if(!validNumber(f.duration,1,300))return '训练时长请填写 1–300 分钟。';
      if(draft.type==='training'&&!f.exercises?.length)return '至少留下一项动作，才能记录这次训练的重量。';
      for(const e of f.exercises){if(!e.name?.trim())return '请为每项动作填写名称。';if(!e.sets?.length)return '每项动作至少需要一组。';for(const s of e.sets){if(!validNumber(s.weight,0,500)||!validNumber(s.reps,1,100)||!Number.isInteger(Number(s.reps)))return `${e.name} 的重量需为 0–500 kg，次数需为 1–100 的整数。`;}}
    }
    if(draft.type==='body'&&(!validNumber(f.weight,25,300)||!validNumber(f.fat,2,65)))return '体重请填写 25–300 kg，体脂率请填写 2–65%。';
    if(draft.type==='measure'&&['waist','hip','chest'].some(k=>!validNumber(f[k],40,250)))return '腰围、臀围和胸围请填写 40–250 cm。';
    if(draft.type==='meal'&&(!validNumber(f.calories,1,5000)||!validNumber(f.protein,0,300)))return '本餐能量请填写 1–5000 kcal，蛋白质为 0–300 g。';
    if(draft.type==='water'&&!validNumber(f.amount,10,5000))return '本次饮水量请填写 10–5000 ml。';
    if(draft.type==='sleep'&&!validNumber(f.hours,.25,24))return '睡眠时长请填写 0.25–24 小时。';
    if(draft.type==='exercise'&&(!f.muscle?.trim()||!f.equipment?.trim()||!f.instructions?.trim()))return '请补全目标肌群、器械与动作要领，下一次训练才能照着做。';
    if(draft.type==='record'&&(!validNumber(f.value,.01,100000)||!f.unit?.trim()||!String(f.achievement||'').trim()))return '请填写突破数值、单位，以及这次进步的具体内容。';
    return '';
  }
  function next(){const problem=step===2?validate():'';if(problem){setError(problem);return}setError('');setStep(s=>Math.min(3,s+1))}
  function addMediaId(id,asCover=false){setDraft(d=>({...d,mediaIds:[...new Set([...d.mediaIds,id])],...(asCover?{coverId:id}:{})}))}
  function removeUpload(id){uploadFiles.current.delete(id);setUploads(u=>u.filter(x=>x.id!==id));setDraft(d=>({...d,mediaIds:d.mediaIds.filter(x=>x!==id),coverId:d.coverId===id?'':d.coverId}))}
  function readUpload(id,file){
    setUploads(old=>old.map(x=>x.id===id?{...x,state:'reading',progress:0,error:''}:x));
    const reader=new FileReader();
    reader.onprogress=e=>{if(live.current&&uploadFiles.current.has(id)&&e.lengthComputable)setUploads(old=>old.map(x=>x.id===id?{...x,progress:Math.round(e.loaded/e.total*100)}:x))};
    reader.onerror=()=>{if(live.current)setUploads(old=>old.map(x=>x.id===id?{...x,state:'failed',error:'这份素材暂时没读进来，点重试再试一次。'}:x))};
    reader.onload=async()=>{
      if(!live.current||!uploadFiles.current.has(id))return;
      const kind=file.type.startsWith('image/')?'image':file.type.startsWith('audio/')?'audio':'file';
      if(kind==='image'){
        try{await new Promise((resolve,reject)=>{const picture=new Image();picture.onload=resolve;picture.onerror=reject;picture.src=String(reader.result)})}catch{if(live.current)setUploads(old=>old.map(x=>x.id===id?{...x,state:'failed',error:'这张图片无法打开，可能已损坏。请重新选择，或移除后继续记录。',reselect:true}:x));return}
      }
      if(!live.current||!uploadFiles.current.has(id))return;
      const media={id,src:String(reader.result),title:file.name.replace(/\.[^.]+$/,''),date:draft.date,description:`${draft.title} · ${kind==='image'?'本地上传照片':kind==='audio'?'语音记录':'训练资料'}`,kind,type:draft.type,filename:file.name,mime:file.type||'application/octet-stream',size:file.size};
      setUploads(old=>old.map(x=>x.id===id?{...x,state:'done',progress:100,media}:x));
      setDraft(d=>({...d,mediaIds:[...new Set([...d.mediaIds,id])],coverId:kind==='image'?id:d.coverId}));
    };
    try{reader.readAsDataURL(file)}catch{reader.onerror()}
  }
  function receiveFiles(fileList){
    const files=Array.from(fileList||[]);if(!files.length)return;setError('');
    let total=uploads.reduce((n,u)=>n+u.size,0);
    files.forEach(file=>{
      const id=uid('media');let fail='';
      const allowedImage=/^image\/(png|jpe?g|webp|gif|svg\+xml)$/i.test(file.type);
      const allowedOther=file.type.startsWith('audio/')||/\.(pdf|txt|doc|docx|csv|xlsx|json)$/i.test(file.name);
      if(!allowedImage&&!allowedOther)fail='这份格式还不能预览。请选择 JPG、PNG、WebP、GIF、SVG 图片，或录音、PDF、文档与表格。';
      else if(file.size>8*1024*1024)fail='单份素材最大 8 MB，请压缩后重新选择。';
      else if(total+file.size>30*1024*1024)fail='本次素材合计最多 30 MB，请移除部分素材再上传。';
      else if(file.size===0)fail='这份文件是空的，请重新选择。';
      if(fail){setUploads(old=>[...old,{id,name:file.name,size:0,state:'failed',progress:0,error:fail,reselect:true}]);return}
      total+=file.size;uploadFiles.current.set(id,file);
      setUploads(old=>[...old,{id,name:file.name,size:file.size,state:'reading',progress:0}]);readUpload(id,file);
    });
    if(fileInput.current)fileInput.current.value='';
  }
  async function save(){
    const problem=validate();if(problem){setError(problem);setStep(2);return}
    if(activeUploading){setError('素材还在读入，稍等一下再保存。');return}
    if(uploads.some(u=>u.state==='failed')){setError('有素材没有上传成功，请重试或移除后再保存。');return}
    setSaving(true);setError('');
    try{
      let cover=selectedCover,newMedia=completedUploads.map(u=>({...u.media,date:draft.date,type:draft.type,description:`${draft.title} · ${u.media.kind==='image'?'本地上传照片':u.media.kind==='audio'?'语音记录':'训练资料'}`}));
      if(!cover){cover={id:uid('media'),src:'/assets/empty.svg',title:`${typeInfo.label} · 训练日志插画`,date:draft.date,description:`${draft.title} 的原创训练日志封面`,kind:'image',type:draft.type,filename:'empty.svg',mime:'image/svg+xml'};newMedia.push(cover)}
      const mediaIds=[...new Set([...draft.mediaIds,cover.id])];
      const normalized={...draft,title:draft.title.trim(),tags:parseTags(tagsText),notes:draft.notes.trim(),coverId:cover.id,mediaIds,fields:{...draft.fields}};
      const numericKeys={training:['duration'],plan:['duration'],body:['weight','fat'],measure:['waist','hip','chest'],meal:['calories','protein'],water:['amount'],sleep:['hours'],record:['value']}[draft.type]||[];
      numericKeys.forEach(key=>normalized.fields[key]=Number(normalized.fields[key]));
      if(normalized.fields.exercises)normalized.fields.exercises=normalized.fields.exercises.map(e=>({...e,name:e.name.trim(),sets:e.sets.map(s=>({...s,weight:Number(s.weight),reps:Number(s.reps),done:!!s.done}))}));
      await onSave(normalized,newMedia.filter(m=>mediaIds.includes(m.id)));
    }catch(e){console.error('肌动：这条记录暂时未能写入本地存储',e);setError(e?.message||'这页进步还没存好，内容仍保留在这里。请再试一次。')}finally{if(live.current)setSaving(false)}
  }
  const numberInput=(key,{min=0,max=10000,step=1,placeholder}={})=><input type="number" inputMode="decimal" min={min} max={max} step={step} value={draft.fields[key]??''} placeholder={placeholder} onChange={e=>field(key,e.target.value)}/>;
  function renderCore(){const f=draft.fields;return <>
    {['training','plan'].includes(draft.type)&&<>
      <div className="field-grid"><Field label="训练时长 / 分钟" required>{numberInput('duration',{min:1,max:300})}</Field><Field label="训练地点"><input value={f.location||''} maxLength={60} onChange={e=>field('location',e.target.value)}/></Field></div>
      <div className="form-group-title"><h3>动作与训练组{draft.type==='plan'?' · 选填':''}</h3><span>重量按单侧 / 单件记录</span></div>
      <div className="exercise-editor">{(f.exercises||[]).map((exercise,ei)=><details open={ei===0} key={ei}><summary><span>{String(ei+1).padStart(2,'0')} · {exercise.name||'填写动作名称'}</span><span>{exercise.sets.length} 组</span></summary><div className="exercise-content"><div className="form-inline"><Field label="动作名称"><input value={exercise.name} maxLength={40} list="jidong-exercise-options" onChange={e=>updateExercise(ei,x=>({...x,name:e.target.value}))}/></Field><button type="button" className="form-remove" aria-label={`删除动作 ${exercise.name}`} disabled={f.exercises.length===1} onClick={()=>field('exercises',f.exercises.filter((_,i)=>i!==ei))}><Icon name="trash" size={18}/></button></div><div className="set-row set-heading"><span>组</span><span>重量 kg</span><span>次数</span><span>完成</span><span/></div>{exercise.sets.map((set,si)=><div className="set-row" key={si}><b>{si+1}</b><input aria-label={`${exercise.name} 第 ${si+1} 组重量`} type="number" inputMode="decimal" min="0" max="500" step="0.5" value={set.weight} onChange={e=>updateExercise(ei,x=>({...x,sets:x.sets.map((s,i)=>i===si?{...s,weight:e.target.value}:s)}))}/><input aria-label={`${exercise.name} 第 ${si+1} 组次数`} type="number" inputMode="numeric" min="1" max="100" value={set.reps} onChange={e=>updateExercise(ei,x=>({...x,sets:x.sets.map((s,i)=>i===si?{...s,reps:e.target.value}:s)}))}/><input aria-label={`${exercise.name} 第 ${si+1} 组已完成`} type="checkbox" checked={!!set.done} onChange={e=>{updateExercise(ei,x=>({...x,sets:x.sets.map((s,i)=>i===si?{...s,done:e.target.checked}:s)}));if(!e.target.checked&&draft.status==='done')update('status','active')}}/><button type="button" className="form-remove" aria-label={`删除第 ${si+1} 组`} disabled={exercise.sets.length===1} onClick={()=>updateExercise(ei,x=>({...x,sets:x.sets.filter((_,i)=>i!==si)}))}><Icon name="close" size={15}/></button></div>)}<button className="form-text-button" type="button" disabled={exercise.sets.length>=20} onClick={()=>updateExercise(ei,x=>({...x,sets:[...x.sets,{...x.sets.at(-1),done:false}]}))}><Icon name="plus" size={16}/>增加一组</button></div></details>)}</div>
      <datalist id="jidong-exercise-options">{[...new Set(['哑铃卧推','高脚杯深蹲','哑铃划船','罗马尼亚硬拉','站姿推举','俯卧撑',...(data?.records||[]).filter(r=>r.type==='exercise').map(r=>r.title)])].map(name=><option value={name} key={name}/>)}</datalist>
      <Button variant="secondary" icon="plus" disabled={(f.exercises||[]).length>=15} onClick={()=>field('exercises',[...f.exercises,{name:'',sets:[{weight:0,reps:10,done:false}]}])}>添加动作</Button>
    </>}
    {draft.type==='body'&&<><div className="field-grid"><Field label="体重 / kg" required>{numberInput('weight',{min:25,max:300,step:.1})}</Field><Field label="体脂率 / %" required>{numberInput('fat',{min:2,max:65,step:.1})}</Field></div><p className="form-note">尽量固定在晨起空腹、相近穿着时测量，变化更容易比较。</p></>}
    {draft.type==='measure'&&<><div className="field-grid"><Field label="腰围 / cm" required>{numberInput('waist',{min:40,max:250,step:.1})}</Field><Field label="臀围 / cm" required>{numberInput('hip',{min:40,max:250,step:.1})}</Field><Field label="胸围 / cm" required>{numberInput('chest',{min:40,max:250,step:.1})}</Field></div><p className="form-note">自然站立，软尺贴合皮肤；每次使用同一测量位置。</p></>}
    {draft.type==='meal'&&<><Field label="餐次"><select value={f.mealType} onChange={e=>field('mealType',e.target.value)}>{['早餐','午餐','晚餐','加餐'].map(x=><option key={x}>{x}</option>)}</select></Field><div className="field-grid"><Field label="能量 / kcal" required>{numberInput('calories',{min:1,max:5000})}</Field><Field label="蛋白质 / g" required>{numberInput('protein',{min:0,max:300,step:.1})}</Field></div></>}
    {draft.type==='water'&&<><Field label="本次饮水 / ml" required>{numberInput('amount',{min:10,max:5000,step:50})}</Field><div className="form-chips">{[200,350,500,750].map(v=><button className={Number(f.amount)===v?'selected':''} onClick={()=>field('amount',v)} key={v}>{v} ml</button>)}</div><p className="form-note">记录本次喝下的量；今日饮水会自动累加。</p></>}
    {draft.type==='sleep'&&<div className="field-grid"><Field label="实际睡眠 / 小时" required>{numberInput('hours',{min:.25,max:24,step:.25})}</Field><Field label="醒来感受"><select value={f.quality} onChange={e=>field('quality',e.target.value)}>{['充足','充沛','良好','一般','疲惫'].map(x=><option key={x}>{x}</option>)}</select></Field></div>}
    {draft.type==='exercise'&&<><div className="field-grid"><Field label="目标肌群" required><input value={f.muscle||''} maxLength={40} onChange={e=>field('muscle',e.target.value)} placeholder="如：背部、臀腿"/></Field><Field label="器械" required><input value={f.equipment||''} maxLength={40} onChange={e=>field('equipment',e.target.value)} placeholder="如：哑铃、自重"/></Field></div><Field label="动作要领" required><textarea value={f.instructions||''} maxLength={1500} rows={4} onChange={e=>field('instructions',e.target.value)}/></Field></>}
    {draft.type==='record'&&<><div className="field-grid"><Field label="突破数值" required>{numberInput('value',{min:.01,max:100000,step:.1})}</Field><Field label="单位" required><input value={f.unit||''} maxLength={12} onChange={e=>field('unit',e.target.value)} placeholder="kg / 次 / 分钟"/></Field></div><Field label="这次进步是什么" required><input value={typeof f.achievement==='string'?f.achievement:''} maxLength={100} onChange={e=>field('achievement',e.target.value)}/></Field></>}
  </>}
  return <Sheet wide title={record?'编辑这页进步':'留下一次进步'} subtitle={`${typeInfo.label} · ${record?'更新后，相关页面会一起改变':'三步写进你的身体档案'}`} onClose={requestClose} footer={<div className="form-footer">{step>1&&<Button variant="secondary" onClick={()=>{setError('');setStep(s=>s-1)}} disabled={saving}>上一步</Button>}<Button icon={step===3?'check':'arrow'} onClick={step===3?save:next} disabled={saving||activeUploading}>{saving?'正在收进身体档案…':step===3?(record?'保存这次调整':'保存这页进步'):'下一步'}</Button></div>}>
    <div className="record-form" ref={topRef}>
      <div className="form-steps" aria-label={`第 ${step} 步，共 3 步`}>{['选择记录','写下细节','留下证据'].map((label,i)=><div key={label} className={`form-step ${step===i+1?'current':''} ${step>i+1?'past':''}`}><span>{step>i+1?<Icon name="check" size={14}/>:i+1}</span><b>{label}</b></div>)}</div>
      <FormError>{error}</FormError>
      {step===1&&<><div className="form-intro"><h3>今天，想记下什么？</h3><p>训练与恢复，都是让身体向前的一步。</p></div><div className="type-grid">{TYPE_OPTIONS.map(type=><button key={type.id} className={`type-option ${draft.type===type.id?'selected':''}`} onClick={()=>changeType(type.id)}><Icon name={type.icon} size={26}/><strong>{type.label}</strong><small>{type.hint}</small>{draft.type===type.id&&<i><Icon name="check" size={13}/></i>}</button>)}</div><div className="form-template"><Icon name="book" size={22}/><div><b>{record?'接着写好已有的这一页':'已带入一份可调整的记录模板'}</b><p>下一步可以逐项修改，不需要从空白开始。</p></div></div></>}
      {step===2&&<><Field label="记录名称" required><input value={draft.title} maxLength={70} onChange={e=>update('title',e.target.value)} placeholder="给今天的进步一个具体名字"/></Field><div className="field-grid"><Field label="日期" required><input type="date" value={draft.date} onChange={e=>update('date',e.target.value)}/></Field><Field label="时间" required><input type="time" value={draft.time} onChange={e=>update('time',e.target.value)}/></Field></div><Field label="当前状态" hint={['training','plan'].includes(draft.type)?'选择已完成会勾选全部训练组；直接保存会保留每一组的实际勾选状态。':undefined}><select value={draft.status} onChange={e=>setStatus(e.target.value)}><option value="planned">待进行 · 安排好了</option><option value="active">进行中 · 正在积累</option><option value="done">已完成 · 留下证据</option></select></Field>{statusNotice&&<div className="form-status-notice" role="status"><Icon name="check" size={18}/><span>{statusNotice}</span></div>}<div className="form-core">{renderCore()}</div><details className="form-extra"><summary><span>分类、关联与补充</span><Icon name="chevron" size={17}/></summary><Field label="记录分类"><select value={draft.category} onChange={e=>update('category',e.target.value)}>{!categories.some(c=>c.id===draft.category||c.name===draft.category)&&<option value={draft.category}>{draft.category}</option>}{categories.map(c=><option value={c.id||c.name} key={c.id||c.name}>{c.name}</option>)}</select></Field><Field label="标签" hint="使用顿号、逗号或空格分隔，最多 10 个"><input value={tagsText} maxLength={200} onChange={e=>setTagsText(e.target.value)} placeholder="如：力量、下肢、晨起"/></Field>{draft.type!=='plan'&&<Field label="关联训练计划"><select value={draft.planId||''} onChange={e=>update('planId',e.target.value)}><option value="">不关联计划</option>{plans.map(p=><option key={p.id} value={p.id}>{p.date} · {p.title}</option>)}</select></Field>}<Field label="下一次提醒" hint="日程会根据这个日期显示下一次提醒；不填写则不提醒"><input type="date" min={draft.date} value={draft.nextDate||''} onChange={e=>update('nextDate',e.target.value)}/></Field><Field label="身体感受与备注"><textarea value={draft.notes||''} maxLength={1500} rows={3} onChange={e=>update('notes',e.target.value)} placeholder="动作感受、恢复情况，或下次想调整的一件事。"/></Field></details></>}
      {step===3&&<><div className="form-summary"><div className="form-summary-type"><Icon name={typeInfo.icon} size={25}/><span>{typeInfo.label}</span></div><h3>{draft.title}</h3><p>{draft.date} · {draft.time} · {{planned:'待进行',active:'进行中',done:'已完成'}[draft.status]}</p><small>{draft.status==='done'?'这次完成将同步到首页、日历和数据洞察。':'保存后，首页与日历会同步这条记录。'}</small></div><div className={`upload-zone ${dragging?'dragging':''}`} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);receiveFiles(e.dataTransfer.files)}}><Icon name="camera" size={29}/><strong>给进步留一份证据</strong><p>照片、录音或训练资料<br/>每份最多 8 MB，本次合计 30 MB</p><Button variant="secondary" icon="upload" onClick={()=>fileInput.current?.click()}>从设备选择素材</Button><input ref={fileInput} className="visually-hidden" type="file" multiple accept="image/*,audio/*,.pdf,.txt,.doc,.docx,.csv,.xlsx,.json" onChange={e=>receiveFiles(e.target.files)}/></div>
        {!!uploads.length&&<div className="upload-list">{uploads.map(u=><div key={u.id} className={`upload-item ${u.state}`}><div className="upload-preview">{u.media?.kind==='image'?<button onClick={()=>setPreview(u.media)} aria-label={`放大 ${u.name}`}><img src={u.media.src} alt={u.media.title}/></button>:<Icon name={u.media?.kind==='audio'?'volume':'file'} size={23}/>}</div><div className="upload-info"><b>{u.name}</b>{u.state==='reading'?<><small>正在读入 · {u.progress}%</small><progress max="100" value={u.progress}/></>:u.state==='failed'?<><small>{u.error}</small><button className="form-text-button" onClick={()=>u.reselect?(removeUpload(u.id),fileInput.current?.click()):readUpload(u.id,uploadFiles.current.get(u.id))}>重新上传</button></>:<><small>已准备好 · {(u.size/1024/1024).toFixed(2)} MB</small>{u.media.kind==='image'&&<button className="form-text-button" onClick={()=>addMediaId(u.id,true)}>{draft.coverId===u.id?'当前封面':'设为封面'}</button>}{u.media.kind==='audio'&&<audio controls src={u.media.src} preload="metadata"/>}</>}</div><button type="button" className="form-remove" onClick={()=>removeUpload(u.id)} aria-label={`移除素材 ${u.name}`}><Icon name="close" size={18}/></button></div>)}</div>}
        <div className="form-group-title"><h3>或使用相册里的场景图</h3><span>点选作为封面</span></div><div className="media-choice">{existingMedia.filter(m=>!m.kind||m.kind==='image').map(media=><button className={selectedCover?.id===media.id?'selected':''} key={media.id} onClick={()=>addMediaId(media.id,true)} aria-label={`选择封面：${media.title}`}><img src={media.src} alt={media.title} loading="lazy"/><span>{media.title}</span>{selectedCover?.id===media.id&&<i><Icon name="check" size={14}/></i>}</button>)}</div>{selectedCover&&<button className="form-cover-preview" onClick={()=>setPreview(selectedCover)}><Icon name="images" size={18}/><span>查看当前封面大图</span><Icon name="arrow" size={16}/></button>}<p className="form-note">素材会随这条记录进入「相册」，并保留关联入口。保存之前不会改动已有记录。</p></>}
    </div>
    {confirmDiscard&&<div className="form-discard-scrim" onClick={e=>{if(e.target===e.currentTarget)keepEditing()}}><section className="form-discard-dialog" ref={discardRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="form-discard-title" aria-describedby="form-discard-description" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();keepEditing()}if(e.key==='Tab'){const buttons=[...e.currentTarget.querySelectorAll('button')];if(e.shiftKey&&(document.activeElement===buttons[0]||document.activeElement===e.currentTarget)){e.preventDefault();buttons.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===buttons.at(-1)){e.preventDefault();buttons[0]?.focus()}}}}><Icon name="book" size={30}/><h3 id="form-discard-title">这页还没有保存</h3><p id="form-discard-description">离开后，这次填写、调整和新选的素材都会被放弃。已有记录与相册不会受到影响。</p><Button onClick={keepEditing}>保留并继续编辑</Button><button className="form-discard-action" onClick={()=>{uploadFiles.current.clear();onClose()}}>放弃这次改动</button></section></div>}
    {preview&&<div className="form-media-preview" role="dialog" aria-modal="true" aria-label={preview.title} onClick={()=>setPreview(null)}><button aria-label="关闭大图" onClick={()=>setPreview(null)}><Icon name="close"/></button><img src={preview.src} alt={preview.title}/><div><strong>{preview.title}</strong><p>{preview.date} · {preview.description}</p></div></div>}
  </Sheet>;
}

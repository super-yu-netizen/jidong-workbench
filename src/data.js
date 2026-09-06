/** 肌动的数据规则：页面只读取这里的同一份记录，不维护额外计数。 */
export const TYPES = [
  { id: 'plan', label: '训练计划', icon: 'calendar', unit: 'kg' },
  { id: 'training', label: '训练记录', icon: 'dumbbell', unit: 'kg' },
  { id: 'exercise', label: '动作库', icon: 'activity', unit: '组' },
  { id: 'body', label: '体重体脂', icon: 'body', unit: 'kg' },
  { id: 'measure', label: '身体围度', icon: 'measure', unit: 'cm' },
  { id: 'meal', label: '饮食记录', icon: 'meal', unit: 'kcal' },
  { id: 'water', label: '饮水记录', icon: 'water', unit: 'ml' },
  { id: 'sleep', label: '睡眠恢复', icon: 'moon', unit: 'h' },
  { id: 'record', label: '个人纪录', icon: 'award', unit: 'kg' },
];
export const STATUS = { planned: '计划中', active: '进行中', done: '已完成' };
const TYPE_IDS = new Set(TYPES.map(t => t.id));
const DEFAULT_CATEGORIES = ['力量训练', '动作学习', '身体测量', '日常饮食', '补水', '睡眠恢复', '个人纪录'];

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function dateOffset(days, base = today()) {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + Number(days));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function uid(prefix = 'r') {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`}`;
}
const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const round = (v, places = 1) => Number(v.toFixed(places));
const sortDate = (a, b) => `${a.date} ${a.time || '00:00'}`.localeCompare(`${b.date} ${b.time || '00:00'}`);
const sum = (rows, fn) => round(rows.reduce((a, r) => a + fn(r), 0));
const percent = (a, b) => b ? Math.round(a / b * 100) : 0;
function monday(date) {
  const d = new Date(`${date}T12:00:00`);
  return dateOffset(-((d.getDay() + 6) % 7), date);
}
function dateValid(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && dateOffset(0, value) === value;
}

/** 只累计明确打勾的训练组。计划不进入实际训练总量，记录状态不代替真实组数。 */
export function trainingVolume(record) {
  return sum(record?.fields?.exercises || [], ex => (ex.sets || []).reduce((v, s) =>
    v + (s.done ? num(s.weight) * num(s.reps) : 0), 0));
}
export function recordValue(r) {
  const f = r.fields || {};
  switch (r.type) {
    case 'plan': return f.exercises?.length ? sum(f.exercises, e => (e.sets || []).reduce((s, set) => s + num(set.weight) * num(set.reps), 0)) : num(f.duration);
    case 'training': return trainingVolume(r);
    case 'exercise': return num(f.recommendedSets || 3);
    case 'body': return num(f.weight);
    case 'measure': return num(f.waist);
    case 'meal': return num(f.calories);
    case 'water': return num(f.amount);
    case 'sleep': return num(f.hours);
    case 'record': return num(f.value);
    default: return 0;
  }
}
export function recordUnit(r) {
  if (r.type === 'plan' && !r.fields?.exercises?.length) return '分钟';
  return r.type === 'record' ? r.fields?.unit || 'kg' : TYPES.find(t => t.id === r.type)?.unit || '';
}

export function createInitialState(anchor = today()) {
  const day = n => dateOffset(n, anchor);
  const media = [
    { id: 'media-hero', src: '/assets/hero.png', title: '训练馆里的解剖笔记', date: day(0), description: '社区训练馆的训练日志、器械和肌肉解剖海报；关联今日上肢力量计划。', kind: 'image', type: 'training' },
    { id: 'media-dumbbell', src: '/assets/dumbbell.png', title: '哑铃与训练记录', date: day(-2), description: '社区训练馆哑铃区，哑铃和训练笔记对应下肢与全身训练记录。', kind: 'image', type: 'training' },
    { id: 'media-sequence', src: '/assets/sequence.png', title: '哑铃划船动作连拍', date: day(-3), description: '林屿复习哑铃划船的起始、拉起与回落三个阶段，对应动作学习记录。', kind: 'image', type: 'exercise' },
    { id: 'media-meal', src: '/assets/meal.png', title: '午餐：鸡胸肉杂粮餐盘', date: day(0), description: '家中餐桌上的鸡胸肉、杂粮饭和蔬菜，对应午餐的热量与蛋白质估算。', kind: 'image', type: 'meal' },
    { id: 'media-body', src: '/assets/body.svg', title: '三周晨起体测曲线', date: day(0), description: '78.6、78.1、77.8、77.4 kg 的四次晨起记录；详见身体记录，曲线数值以实时图表为准。', kind: 'image', type: 'body' },
    { id: 'media-water', src: '/assets/water.png', title: '随身补水瓶', date: day(0), description: '桌面上的刻度水瓶，对应今日分次饮水记录；每日目标 2,200 ml。', kind: 'image', type: 'water' },
    { id: 'media-recovery', src: '/assets/recovery.png', title: '训练后的安静恢复', date: day(-1), description: '卧室里的柔和晨光与恢复用品，对应睡眠时长记录和明日主动恢复计划。', kind: 'image', type: 'sleep' },
  ];
  const sets = (weight, reps, count = 3, done = true) => Array.from({ length: count }, () => ({ weight, reps, done }));
  const upper = (weight, done = true) => [
    { name: '哑铃卧推', sets: sets(weight, 10, 3, done) },
    { name: '单臂哑铃划船', sets: sets(20, 12, 3, done) },
    { name: '哑铃肩推', sets: sets(12, 10, 3, done) },
  ];
  const lower = weight => [
    { name: '杠铃深蹲', sets: sets(weight, 8, 3) },
    { name: '罗马尼亚硬拉', sets: sets(50, 10, 3) },
    { name: '哑铃提踵', sets: sets(20, 15, 3) },
  ];
  const records = [];
  const add = (id, type, title, offset, time, status, category, tags, notes, cover, fields, extras = {}) => {
    records.push({ id, type, title, date: day(offset), time, status, category, tags, notes, coverId: `media-${cover}`, mediaIds: [`media-${cover}`], fields, ...extras });
  };
  add('plan-foundation', 'plan', '第一阶段 · 规律力量训练', -20, '18:30', 'done', '力量训练', ['基础期', '每周三练'], '先建立可持续的节奏。每组保留约两次余力，记录实际重量。', 'dumbbell', { duration: 45, location: '邻里训练馆', exercises: upper(16) });
  add('train-0820', 'training', '上肢基础 · 找回动作节奏', -17, '18:40', 'done', '力量训练', ['上肢', '基础期'], '今天没有追重量，最后一组卧推稳定完成十次。哑铃重量按每只记录，训练量按记录重量计算。', 'dumbbell', { duration: 43, location: '邻里训练馆', exercises: upper(16) }, { planId: 'plan-foundation' });
  add('train-0823', 'training', '下肢力量 · 深蹲找稳重心', -14, '09:10', 'done', '力量训练', ['下肢', '基础期'], '深蹲 50 kg 三组，注意足底支撑。第二天正常肌肉酸胀。', 'dumbbell', { duration: 48, location: '邻里训练馆', exercises: lower(50) }, { planId: 'plan-foundation' });
  add('train-0826', 'training', '上肢进阶 · 卧推增加两公斤', -11, '19:00', 'done', '力量训练', ['上肢', '渐进训练'], '从每只 16 kg 进到 18 kg，三组十次全部完成。', 'dumbbell', { duration: 46, location: '邻里训练馆', exercises: upper(18) });
  add('train-0829', 'training', '下肢力量 · 稳定完成 55 kg', -8, '10:20', 'done', '力量训练', ['下肢', '渐进训练'], '深蹲上调到 55 kg，动作节奏比上周更稳定。', 'dumbbell', { duration: 50, location: '邻里训练馆', exercises: lower(55) });
  add('train-0831', 'training', '上肢巩固 · 把动作做扎实', -6, '18:50', 'done', '力量训练', ['上肢', '渐进训练'], '卧推保持 18 kg，划船停顿一秒，记录可重复的训练。', 'dumbbell', { duration: 45, location: '邻里训练馆', exercises: upper(18) });
  add('train-0902', 'training', '全身训练 · 本周第二次到馆', -4, '19:10', 'done', '力量训练', ['全身', '每周三练'], '深蹲和推拉交替，组间休息 90 秒。', 'dumbbell', { duration: 47, location: '邻里训练馆', exercises: [{ name: '杠铃深蹲', sets: sets(55, 8) }, { name: '哑铃卧推', sets: sets(18, 10) }, { name: '单臂哑铃划船', sets: sets(20, 12) }] });
  add('plan-today', 'plan', '上肢力量 · 胸背与肩', 0, '18:30', 'active', '力量训练', ['上肢', '每周三练'], '今天尝试哑铃卧推每只 20 kg。先热身 8 分钟；若肩部不适，降低重量并暂停疼痛动作。', 'hero', { duration: 45, location: '邻里训练馆', exercises: upper(20, false) }, { nextDate: day(0) });
  add('train-today', 'training', '上肢力量 · 第 7 次训练', 0, '18:30', 'active', '力量训练', ['上肢', '个人最佳挑战'], '训练准备完成。每完成一组就留下记录；哑铃重量按每只填写。', 'dumbbell', { duration: 45, location: '邻里训练馆', exercises: upper(20, false) }, { planId: 'plan-today', nextDate: day(0) });
  add('plan-recovery', 'plan', '主动恢复 · 轻走与肩背舒展', 1, '19:00', 'planned', '睡眠恢复', ['主动恢复', '肩背舒展'], '轻松步行 20 分钟，再做肩背舒展。以放松为目标，根据身体反馈调整。', 'recovery', { duration: 30, location: '社区绿道', exercises: [] }, { nextDate: day(1) });
  add('plan-lower', 'plan', '下肢力量 · 巩固深蹲', 2, '18:30', 'planned', '力量训练', ['下肢', '每周三练'], '沿用 55 kg，不急着加重。训练前检查昨晚的睡眠与腿部恢复情况。', 'dumbbell', { duration: 50, location: '邻里训练馆', exercises: lower(55).map(e => ({ ...e, sets: e.sets.map(s => ({ ...s, done: false })) })) }, { nextDate: day(2) });
  add('exercise-row', 'exercise', '单臂哑铃划船 · 三个动作瞬间', -3, '20:10', 'done', '动作学习', ['背部', '哑铃'], '连拍对应起始、拉起、回落。支撑手稳住躯干，肘部向髋部移动。', 'sequence', { muscle: '背阔肌、菱形肌', equipment: '哑铃、训练凳', recommendedSets: 3, instructions: '1. 一手一膝支撑，脊柱自然中立。\n2. 肘部朝髋部拉动，顶部短暂停留。\n3. 慢慢回落，不耸肩、不转动躯干。' });
  add('exercise-press', 'exercise', '哑铃卧推 · 今日热身笔记', 0, '17:50', 'active', '动作学习', ['胸部', '哑铃'], '以轻重量做两组热身，再进入工作组。图片为训练器械场景，动作要点记录于下方。', 'dumbbell', { muscle: '胸大肌、肱三头肌', equipment: '哑铃、平板凳', recommendedSets: 3, instructions: '1. 双脚稳定踩地，肩胛轻收。\n2. 下放时前臂接近竖直。\n3. 平稳推起，不弹震、不憋气硬顶。' });
  [[-20,78.6,24.3],[-13,78.1,24.0],[-6,77.8,23.7],[0,77.4,23.5]].forEach(([d,w,f],i) => add(`body-${i}`, 'body', ['起点体测 · 先留下真实的自己','第一周体测 · 节奏开始稳定','第二周体测 · 持续记录','晨起体测 · 第三周回看'][i], d, '07:20', 'done', '身体测量', ['晨起空腹', '同一台秤'], '起床、如厕后测量。家用秤体脂率仅作为个人趋势观察，不作医疗判断。', 'body', { weight:w, fat:f }));
  [[-20,89,99,101],[-6,88,98.5,101],[0,87.5,98,101]].forEach(([d,w,h,c],i) => add(`measure-${i}`, 'measure', ['起点围度 · 腰臀胸记录','第二周围度 · 放松自然呼吸','第三周围度 · 腰围 87.5 cm'][i], d, '07:30', 'done', '身体测量', ['腰围', '自然呼吸'], '站立放松，在相同位置测两次后记录。腰围取自然呼气结束时数值。', 'body', { waist:w, hip:h, chest:c }));
  add('meal-yesterday', 'meal', '训练日午餐 · 鸡肉杂粮饭', -2, '12:30', 'done', '日常饮食', ['午餐', '家常饭'], '熟鸡胸肉约 140 g，杂粮饭约 150 g，配两份蔬菜。热量为家庭份量估算。', 'meal', { calories:610, protein:43, mealType:'午餐' });
  add('meal-breakfast', 'meal', '早餐 · 小份鸡肉杂粮餐盘', 0, '08:05', 'done', '日常饮食', ['早餐', '家常饭'], '早起备好的鸡肉约 80 g、杂粮饭约 120 g、蔬菜约 200 g，搭配一杯牛奶。份量为估算。', 'meal', { calories:480, protein:27, mealType:'早餐' });
  add('meal-lunch', 'meal', '午餐 · 鸡胸肉杂粮餐盘', 0, '12:25', 'done', '日常饮食', ['午餐', '蛋白质'], '鸡胸肉约 150 g、杂粮饭约 150 g、时蔬约 250 g。搭配少量橄榄油，数值为估算。', 'meal', { calories:620, protein:45, mealType:'午餐' });
  add('meal-dinner', 'meal', '训练后晚餐 · 鸡肉杂粮餐盘', 0, '20:00', 'planned', '日常饮食', ['晚餐', '训练后'], '计划鸡胸肉、杂粮饭和时蔬，完成训练后用餐。完成后按实际份量修正。', 'meal', { calories:650, protein:42, mealType:'晚餐' }, { nextDate:day(0) });
  add('water-morning', 'water', '上午补水 · 两次喝完 600 ml', 0, '10:30', 'done', '补水', ['办公室', '分次补水'], '早餐后和工作间隙各 300 ml。', 'water', { amount:600 });
  add('water-noon', 'water', '午后补水 · 随身瓶 500 ml', 0, '14:00', 'done', '补水', ['办公室', '分次补水'], '从午饭后到下午两点分次喝完。', 'water', { amount:500 });
  add('water-current', 'water', '训练前补水 · 当前已喝 300 ml', 0, '16:30', 'active', '补水', ['训练前', '分次补水'], '这里记录已经喝下的量；补水后可继续加量，今天目标为 2,200 ml。', 'water', { amount:300 }, { nextDate:day(0) });
  add('water-previous', 'water', '昨日饮水 · 2,100 ml', -1, '21:00', 'done', '补水', ['全天', '分次补水'], '分次饮水，睡前没有集中补量。', 'water', { amount:2100 });
  add('sleep-two', 'sleep', '睡眠 · 晚间提前放下手机', -2, '07:10', 'done', '睡眠恢复', ['睡眠', '规律作息'], '23:30 入睡，06:48 起床，夜间醒来一次，时长按估计记录。', 'recovery', { hours:7.2, quality:'良好' });
  add('sleep-yesterday', 'sleep', '睡眠 · 周末安静恢复', -1, '07:35', 'done', '睡眠恢复', ['睡眠', '规律作息'], '昨晚没有熬夜，晨起精神比前一天更好。', 'recovery', { hours:7.8, quality:'充足' });
  add('sleep-today', 'sleep', '昨夜睡眠 · 7.4 小时', 0, '07:05', 'done', '睡眠恢复', ['睡眠', '晨起记录'], '23:35 入睡，07:00 起床。今天精力稳定，训练时仍按身体反馈调整强度。', 'recovery', { hours:7.4, quality:'良好' });
  add('record-squat', 'record', '深蹲新纪录 · 55 kg × 8 次', -8, '11:15', 'done', '个人纪录', ['深蹲', '个人最佳'], '来源于「下肢力量 · 稳定完成 55 kg」。先保证完整动作，再考虑下一次增加重量。', 'dumbbell', { value:55, unit:'kg', achievement:'杠铃深蹲', sourceRecordId:'train-0829', reps:8 });
  const seedActivityAt = (time, minutesAgo) => new Date(Math.min(new Date(`${anchor}T${time}`).getTime(), Date.now() - minutesAgo * 60000)).toISOString();
  const activities = [
    { id:'activity-body', recordId:'body-3', title:'留下第三周晨起体测', description:'77.4 kg · 比起点减少 1.2 kg', at:seedActivityAt('07:20:00',3), action:'save' },
    { id:'activity-lunch', recordId:'meal-lunch', title:'记下鸡胸肉杂粮午餐', description:'620 kcal · 蛋白质 45 g', at:seedActivityAt('12:25:00',2), action:'save' },
    { id:'activity-water', recordId:'water-current', title:'训练前又补水 300 ml', description:'今日已饮水 1,400 / 2,200 ml', at:seedActivityAt('16:30:00',1), action:'save' },
  ];
  return { version:1, records, media, categories:[...DEFAULT_CATEGORIES], activities:activities.reverse(), settings:{name:'林屿',waterGoal:2200,weeklyTrainingGoal:3,reminders:true}, createdAt:`${day(-20)}T07:20:00`, seededAt:anchor };
}

export function filterRecords(records, filters = {}) {
  const q = String(filters.q || '').trim().toLocaleLowerCase();
  const result = records.filter(r => {
    if (q && ![r.title,r.notes,r.category,...(r.tags || []),r.fields?.location,...(r.fields?.exercises || []).map(e => e.name)].filter(Boolean).join(' ').toLocaleLowerCase().includes(q)) return false;
    if (filters.type && filters.type !== 'all' && r.type !== filters.type) return false;
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false;
    if (filters.tag && filters.tag !== 'all' && !r.tags.includes(filters.tag)) return false;
    if (filters.category && filters.category !== 'all' && r.category !== filters.category) return false;
    if (filters.from && r.date < filters.from) return false;
    if (filters.to && r.date > filters.to) return false;
    return true;
  });
  return result.sort((a,b) => {
    switch(filters.sort) {
      case 'date-asc': return sortDate(a,b);
      case 'value-desc': return recordValue(b)-recordValue(a) || sortDate(b,a);
      case 'value-asc': return recordValue(a)-recordValue(b) || sortDate(b,a);
      default:return sortDate(b,a);
    }
  });
}

function calculateAchievements(all) {
  const trainings = all.filter(r => r.type === 'training' && r.status === 'done').sort(sortDate);
  const bests = new Map();
  for (const r of trainings) for (const e of r.fields.exercises || []) {
    for (const s of e.sets || []) {
      if (!s.done) continue;
      const weight = num(s.weight);
      const old = bests.get(e.name);
      if (!old || weight > old.value || (weight === old.value && num(s.reps) > old.reps)) {
        bests.set(e.name, { id:`best-${e.name}`, title:`${e.name} · ${weight} kg`, name:e.name, value:weight, unit:'kg', reps:num(s.reps), date:r.date, recordId:r.id, coverId:r.coverId, kind:'personal-best', description:`${weight} kg × ${num(s.reps)} 次，来自「${r.title}」` });
      }
    }
  }
  const achievements = [...bests.values()].sort((a,b) => b.date.localeCompare(a.date));
  if (trainings.length >= 5) {
    const r = trainings[4];
    achievements.unshift({id:'milestone-5',title:'五次出勤，力量初成',name:'规律训练',value:5,unit:'次',date:r.date,recordId:r.id,coverId:r.coverId,kind:'milestone',description:'累计完成 5 次力量训练，你已经有了可回看的证据。'});
  }
  const byWeek = new Map();
  for (const r of trainings) {
    const key=monday(r.date);
    byWeek.set(key,[...(byWeek.get(key)||[]),r]);
  }
  return { achievements, byWeek };
}

export function derive(state, from, to) {
  const now=today();
  const all=state.records || [];
  const allDates=all.map(r=>r.date).filter(Boolean).sort();
  const end=to || (from ? now : [now,allDates.at(-1)||now].sort().at(-1));
  const start=from || allDates[0] || now;
  const records=filterRecords(all,{from:start,to:end});
  const completed=records.filter(r => r.status==='done');
  const actual=records.filter(r => r.type==='training');
  const finished=actual.filter(r => r.status==='done');
  // 计划与其执行只计一次今日行动；动作库和个人纪录不当成每日待办。
  const actionable = all.filter(r => !['exercise','record'].includes(r.type) && !(r.type==='plan' && all.some(x => x.planId===r.id && x.date===r.date)));
  const todayRecords=actionable.filter(r => r.date===now).sort(sortDate);
  const todayDone=todayRecords.filter(r => r.status==='done').length;
  const dayTrainings=all.filter(r => r.type==='training' && r.status==='done' && r.date<=now);
  const trainingDays=new Set(dayTrainings.map(r => r.date));
  let streak=0;
  let cursor=trainingDays.has(now)?now:dateOffset(-1,now);
  while(trainingDays.has(cursor)){streak++;cursor=dateOffset(-1,cursor);}
  const weekTrainings=dayTrainings.filter(r => r.date>=monday(now));
  const waters=all.filter(r => r.type==='water' && r.date===now && r.status!=='planned');
  const bodies=records.filter(r => r.type==='body' && r.status==='done').sort(sortDate);
  const allBodies=all.filter(r => r.type==='body' && r.status==='done' && r.date<=end).sort(sortDate);
  const latestBody=allBodies.at(-1)||null;
  const weightTrend=bodies.map(r => ({date:r.date,value:num(r.fields.weight),fat:num(r.fields.fat),recordId:r.id,title:r.title}));
  const firstBody=bodies[0]||null;
  const lastBody=bodies.at(-1)||null;
  const countsByType=TYPES.map(t => { const rows=records.filter(r=>r.type===t.id);return {type:t.id,id:t.id,label:t.label,name:t.label,count:rows.length,value:rows.length,recordIds:rows.map(r=>r.id)}; });
  const countsByCategory=(state.categories||[]).map(category => { const rows=records.filter(r=>r.category===category);return {category,id:category,label:category,name:category,count:rows.length,value:rows.length,recordIds:rows.map(r=>r.id)}; });
  const days=[];
  // 最多展示一年，避免错误导入的极端日期造成无限迭代。
  for(let date=start,i=0;date<=end && i<366;date=dateOffset(1,date),i++)days.push(date);
  const completionTrend=days.map(date=>{const rows=actionable.filter(r=>r.date===date);const done=rows.filter(r=>r.status==='done').length;return {date,total:rows.length,done,value:percent(done,rows.length),completion:percent(done,rows.length),recordIds:rows.map(r=>r.id)};});
  const volumeTrend=days.map(date=>{const rows=finished.filter(r=>r.date===date);return {date,value:sum(rows,trainingVolume),recordIds:rows.map(r=>r.id)};});
  const {achievements}=calculateAchievements(all.filter(r=>r.date<=end));
  const weeklyGoal=num(state.settings?.weeklyTrainingGoal)||3;
  if(weekTrainings.length>=weeklyGoal){const r=weekTrainings.sort(sortDate)[weeklyGoal-1];achievements.unshift({id:`week-${monday(now)}`,title:'本周训练目标已达成',name:'每周到场',value:weekTrainings.length,unit:'次',date:r.date,recordId:r.id,coverId:r.coverId,kind:'weekly',description:`本周完成 ${weekTrainings.length} 次训练，计划中的努力已经成为记录。`});}
  const recentActivities=(state.activities||[]).filter(a=>all.some(r=>r.id===a.recordId)).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,12);
  const nextReminders=state.settings?.reminders===false?[]:all.filter(r=>r.nextDate && (r.status!=='done' || r.nextDate>r.date)).map(r=>({recordId:r.id,title:r.title,date:r.nextDate,time:r.time,status:r.status,days:Math.round((new Date(`${r.nextDate}T12:00:00`)-new Date(`${now}T12:00:00`))/86400000),overdue:r.nextDate<now})).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  return {
    from:start,to:end,total:records.length,done:completed.length,active:records.filter(r=>r.status==='active').length,planned:records.filter(r=>r.status==='planned').length,completion:percent(completed.length,records.length),
    today:{total:todayRecords.length,done:todayDone,completion:percent(todayDone,todayRecords.length),records:todayRecords,todos:todayRecords.filter(r=>r.status!=='done')},
    trainingCount:finished.length,trainingMinutes:sum(finished,r=>num(r.fields.duration)),trainingVolume:sum(finished,trainingVolume),trainingStreak:streak,
    weeklyTrainingCount:weekTrainings.length,weeklyTrainingGoal:weeklyGoal,weeklyProgress:Math.min(100,percent(weekTrainings.length,weeklyGoal)),
    waterToday:sum(waters,r=>num(r.fields.amount)),waterGoal:num(state.settings?.waterGoal)||2200,waterRecords:waters,
    latestBody,weightChange:firstBody&&lastBody?round(num(lastBody.fields.weight)-num(firstBody.fields.weight)):0,fatChange:firstBody&&lastBody?round(num(lastBody.fields.fat)-num(firstBody.fields.fat)):0,
    latestSleep:all.filter(r=>r.type==='sleep' && r.status==='done' && r.date<=end).sort(sortDate).at(-1)||null,
    calories:sum(records.filter(r=>r.type==='meal'&&r.status==='done'),r=>num(r.fields.calories)),protein:sum(records.filter(r=>r.type==='meal'&&r.status==='done'),r=>num(r.fields.protein)),
    countsByType,countsByCategory,completionTrend,weightTrend,volumeTrend,achievements,recentActivities,nextReminders,records,
    sourceIds:{training:finished.map(r=>r.id),weight:bodies.map(r=>r.id),water:waters.map(r=>r.id),completion:records.map(r=>r.id)},
  };
}

export function validateRecord(input, state) {
  if(!input || typeof input!=='object')throw new Error('这条训练笔记没有可读取的内容。');
  if(!TYPE_IDS.has(input.type))throw new Error('请选择一个有效的记录类型。');
  if(!String(input.title||'').trim())throw new Error('给这次努力写一个标题，再保存。');
  if(!dateValid(input.date))throw new Error('记录日期不完整，请重新选择年月日。');
  if(input.nextDate && !dateValid(input.nextDate))throw new Error('下一次提醒的日期不正确，请重新选择。');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time||'00:00'))throw new Error('时间请使用有效的小时和分钟。');
  if(!Object.hasOwn(STATUS,input.status))throw new Error('这条记录的状态无法识别。');
  const r={...input,id:input.id||uid(),title:String(input.title).trim(),time:input.time||'00:00',category:String(input.category||DEFAULT_CATEGORIES[0]).trim(),tags:Array.isArray(input.tags)?[...new Set(input.tags.map(String).map(s=>s.trim()).filter(Boolean))]:[],notes:String(input.notes||''),mediaIds:[...new Set(input.mediaIds||[])],fields:structuredClone(input.fields||{})};
  if(r.coverId && !r.mediaIds.includes(r.coverId))r.mediaIds.unshift(r.coverId);
  if(!r.coverId)r.coverId=r.mediaIds[0]||null;
  if(state && r.mediaIds.some(id=>!state.media.some(m=>m.id===id)))throw new Error('这张图片尚未保存，请重新选择封面。');
  if(r.planId && state && !state.records.some(x=>x.id===r.planId && x.type==='plan'))throw new Error('关联计划不存在，请重新选择。');
  const numberFields={body:['weight','fat'],measure:['waist','hip','chest'],meal:['calories','protein'],water:['amount'],sleep:['hours'],record:['value'],training:['duration'],plan:['duration']};
  for(const key of numberFields[r.type]||[])if(r.fields[key]!==undefined && (r.fields[key]==='' || !Number.isFinite(Number(r.fields[key])) || Number(r.fields[key])<0))throw new Error('记录中的数值请填写为零或正数。');
  if(r.type==='body' && num(r.fields.weight)<=0)throw new Error('体重需要大于零，请核对秤上的读数。');
  if(r.type==='body' && num(r.fields.fat)>100)throw new Error('体脂率请填写 0 到 100 之间的百分数。');
  if(r.type==='sleep' && num(r.fields.hours)>24)throw new Error('一天的睡眠时长不能超过 24 小时。');
  if(['training','plan'].includes(r.type)){
    if(r.fields.exercises!==undefined && !Array.isArray(r.fields.exercises))throw new Error('训练动作格式不完整，请重新选择动作。');
    r.fields.exercises=(r.fields.exercises||[]).map(e=>{
      if(!Array.isArray(e.sets))throw new Error('动作组数格式不完整。');
      return {...e,name:String(e.name||'').trim(),sets:e.sets.map(s=>{if(!Number.isFinite(Number(s.weight))||!Number.isFinite(Number(s.reps))||num(s.weight)<0||num(s.reps)<0)throw new Error('每组重量和次数需要是零或正数。');return {...s,weight:num(s.weight),reps:num(s.reps),done:Boolean(s.done)};})};
    });
  }
  return r;
}

function synchronizePlans(records) {
  return records.map(r=>{
    if(r.type!=='plan')return r;
    const executions=records.filter(x=>x.type==='training' && x.planId===r.id);
    if(!executions.length)return r;
    const status=executions.every(x=>x.status==='done')?'done':executions.some(x=>x.status!=='planned')?'active':'planned';
    return {...r,status,fields:{...r.fields,exercises:(r.fields.exercises||[]).map(e=>({...e,sets:e.sets.map(s=>({...s,done:status==='done'}))}))}};
  });
}

/** immutable transaction；UI 保存失败时保留原 state，即可完整回滚。 */
export function mutateRecord(state, input, action='save') {
  try {
    if(!['save','delete','status'].includes(action))throw new Error('无法识别这次记录操作。');
    const existing=state.records.find(r=>r.id===input.id);
    if(action==='delete'){
      if(!existing)throw new Error('这条记录已经不在训练志中了。');
      let records=state.records.filter(r=>r.id!==input.id).map(r=>{
        let result={...r};
        if(r.planId===input.id)delete result.planId;
        if(r.fields?.sourceRecordId===input.id){result.fields={...r.fields};delete result.fields.sourceRecordId;result.notes=`${r.notes || ''}\n来源训练已移出训练志，这里保留当时的个人纪录。`.trim();}
        const sourceArrays=[r.fields?.sourceIds,r.fields?.report?.sourceRecordIds];
        if(sourceArrays.some(ids=>Array.isArray(ids)&&ids.includes(input.id))){
          result.fields={...result.fields,sourceMissingCount:(result.fields.sourceMissingCount||0)+1};
          if(Array.isArray(r.fields.sourceIds))result.fields.sourceIds=r.fields.sourceIds.filter(id=>id!==input.id);
          if(r.fields.report)result.fields.report={...r.fields.report,sourceRecordIds:(r.fields.report.sourceRecordIds||[]).filter(id=>id!==input.id),achievements:(r.fields.report.achievements||[]).filter(a=>a.recordId!==input.id),sourceMissingCount:(r.fields.report.sourceMissingCount||0)+1};
          const originalNotes=String(r.notes||'').replace(/\n报告来源提示：[^\n]*/g,'');
          result.notes=`${originalNotes}\n报告来源提示：${result.fields.sourceMissingCount} 条来源记录已移除；报告数字保留生成时的快照。`.trim();
        }
        return result;
      });
      // 删除执行记录后，关联计划重新按剩余执行计算；最后一条被删除时退回计划中。
      if(existing.planId && !records.some(r=>r.type==='training' && r.planId===existing.planId))records=records.map(r=>r.id===existing.planId?{...r,status:'planned'}:r);
      records=synchronizePlans(records);
      const usedMedia=new Set(records.flatMap(r=>r.mediaIds||[]));
      return {...state,records,media:state.media.filter(m=>m.src?.startsWith('/assets/') || usedMedia.has(m.id)),activities:(state.activities||[]).filter(a=>a.recordId!==input.id),updatedAt:new Date().toISOString()};
    }
    const record=validateRecord(action==='status'?{...existing,...input,fields:{...(existing?.fields||{}),...(input.fields||{})}}:input,state);
    let records=existing?state.records.map(r=>r.id===record.id?record:r):[...state.records,record];
    if(action==='status' && record.type==='plan'){
      // 明确切换计划状态同步关联执行，但不替用户勾选尚未做完的组。
      records=records.map(r=>r.type==='training' && r.planId===record.id?{...r,status:record.status}:r);
    }
    if(record.type==='plan' && existing?.date!==record.date){
      // 移动计划不擅自改写已有执行日期；日历按每条记录自己的日期排列。
      records=records.map(r=>r.id===record.id && r.nextDate===existing?.date?{...r,nextDate:record.date}:r);
    }
    records=synchronizePlans(records);
    const completed=record.status==='done' && existing?.status!=='done';
    const activity={id:uid('activity'),recordId:record.id,title:completed?'这一笔努力，已成为证据':existing?'训练笔记已更新':'新的身体记录已收好',description:record.title,at:new Date().toISOString(),action:completed?'complete':action};
    const categories=state.categories.includes(record.category)?state.categories:[...state.categories,record.category];
    return {...state,records,categories,activities:[activity,...(state.activities||[])].slice(0,200),updatedAt:new Date().toISOString()};
  }catch(error){console.error('[肌动] 记录未保存：',error.message);throw error;}
}
export function setStatus(state,id,status){
  const record=state.records.find(r=>r.id===id);
  if(!record)throw new Error('这条记录已经不在训练志中了，请返回列表。');
  // 恢复进行中时保留已完成组；仅计划中重置所有组的完成标记。
  const fields=status==='planned'&&['training','plan'].includes(record.type)?{...record.fields,exercises:(record.fields.exercises||[]).map(e=>({...e,sets:e.sets.map(s=>({...s,done:false}))}))}:record.fields;
  return mutateRecord(state,{...record,status,fields},'status');
}

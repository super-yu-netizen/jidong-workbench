import React from 'react';

// 肌动的专属线性符号：训练器具、身体测量、日常恢复沿用同一笔触。
const paths = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/><path d="M9 7h6"/></>,
  book: <><path d="M6 3h14v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M7 3v18M3 17h17M11 7h5M11 11h5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M7 14h2m6 0h2m-10 4h2m6 0h2"/></>,
  chart: <><path d="M4 3v17h17M8 16l4-5 4 2 5-7"/><circle cx="12" cy="11" r="1"/><circle cx="16" cy="13" r="1"/></>,
  images: <><rect x="6" y="3" width="15" height="16" rx="2"/><path d="M3 7v14h14M7 15l4-4 4 4 3-3 3 3"/><circle cx="16" cy="7" r="1"/></>,
  user: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2M8 20h8"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  filter: <><path d="M3 6h18M6 12h12M9 18h6"/><circle cx="8" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, back: <path d="M20 12H4m6-6-6 6 6 6"/>, close: <path d="m6 6 12 12M18 6 6 18"/>, check: <path d="m4 12 5 5L20 6"/>,
  edit: <><path d="m14 4 6 6M4 20l5-1L21 7a2.1 2.1 0 0 0-4-4L5 15Z"/><path d="M13 21h8"/></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></>,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/></>, download: <><path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
  share: <><circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="m8 10 8-4m-8 8 8 4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>, play: <path d="m8 4 12 8-12 8Z"/>, pause: <><path d="M8 5v14m8-14v14" strokeWidth="4"/></>, reset: <><path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/></>,
  bell: <><path d="M4 17h16l-2-4V9A6 6 0 0 0 6 9v4ZM10 21h4M12 3V1"/></>,
  settings: <><path d="m10 3-.7 3-2.5 1L4 6l-2 4 2.5 2v2L2 16l2 4 2.8-1 2.5 1 .7 3h4l.7-3 2.5-1 2.8 1 2-4-2.5-2v-2L22 10l-2-4-2.8 1-2.5-1L14 3Z" transform="translate(1 -1) scale(.92)"/><circle cx="12" cy="12" r="3"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>, more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>, sort: <><path d="M7 3v18m-4-4 4 4 4-4M17 21V3m-4 4 4-4 4 4"/></>,
  water: <><path d="M9 2h6v4l2 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3ZM9 5h6M7 12h10M10 16h4"/></>,
  moon: <path d="M21 14A9 9 0 0 1 10 3a9 9 0 1 0 11 11Z"/>,
  dumbbell: <><path d="M7 12h10M2 9v6m3-9v12m14-12v12m3-9v6M2 9h3m-3 6h3M19 9h3m-3 6h3"/><rect x="5" y="6" width="3" height="12" rx=".6"/><rect x="16" y="6" width="3" height="12" rx=".6"/></>,
  body: <><circle cx="12" cy="4" r="2"/><path d="m5 11 3-3h8l3 3m-11-3 1 7-2 7m9-14-1 7 2 7m-8-7h6M12 9v5"/></>,
  measure: <><path d="M4 5h14a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H8a4 4 0 0 0 0 8h3" transform="translate(0 -2)"/><path d="M7 5v3m4-3v4m4-4v3m4 3v3M7 17v3m4-5v3m4-3v3"/></>,
  meal: <><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="3"/><path d="M2 3v6m2-6v6M2 7h2M3 9v12M22 3c-3 0-3 9 0 9v9"/></>,
  trophy: <><path d="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-5 1h10"/></>,
  plan: <><rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 4V2h6v2M8 10l1 1 2-3m2 2h4M8 16l1 1 2-3m2 2h4"/></>,
  training: <><path d="M4 14h16M3 10v8m4-10v12m10-12v12m4-10v8M9 4h6M12 2v4"/></>,
  exercise: <><circle cx="14" cy="3" r="2"/><path d="m4 8 6 1 3-3 3 4 5 1M11 8l-2 7-5 5m5-5 5 1 2 5M2 4h5m-4-2v4"/></>,
  sleep: <><path d="M3 4v17m0-5h18v5M3 9h6v7M9 11h9a3 3 0 0 1 3 3v2M14 3h5l-5 5h5"/></>,
  record: <><path d="M8 3h8l3 5-7 4-7-4ZM12 12v4"/><circle cx="12" cy="18" r="4"/><path d="m10 18 1 1 3-3"/></>,
  tag: <><path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1"/></>,
  location: <><path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  link: <><path d="m10 7 3-3a5 5 0 0 1 7 7l-3 3M7 10l-3 3a5 5 0 0 0 7 7l3-3m-6-1 8-8"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.2"/></>,
  undo: <><path d="M4 10h10a7 7 0 0 1 0 14" transform="translate(0 -3)"/><path d="m9 2-5 5 5 5"/></>,
  heart: <path d="M12 21 3.5 12.5a5.5 5.5 0 0 1 8-7.5l.5.5.5-.5a5.5 5.5 0 0 1 8 7.5Z"/>,
  flag: <><path d="M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0"/></>,
  volume: <><path d="M3 9h4l5-5v16l-5-5H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
  camera: <><path d="M8 5l2-3h4l2 3h4a2 2 0 0 1 2 2v13H2V7a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12" r="4"/></>,
  file: <><path d="M4 2h10l6 6v14H4ZM14 2v6h6M8 13h8m-8 4h6"/></>,
  warning: <><path d="m12 2 11 19H1Z"/><path d="M12 9v5m0 3v.2"/></>,
  logout: <><path d="M9 3H3v18h6m5-16 7 7-7 7M7 12h14"/></>,
};

export default function Icon({name, size = 24, strokeWidth = 1.8, ...props}) {
  const aliases={activity:'exercise',award:'trophy',refresh:'reset',expand:'images',chevronDown:'chevron',droplet:'water',save:'check',arrowRight:'arrow',arrowLeft:'back'};
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths[aliases[name]] || paths.info}</svg>;
}

// 「月」的两条横线取自训练日志；右侧「几」转化为肌束，朱橙斜线代表一次训练。
export function Logo({size = 40, ...props}) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="肌动原创标志" role="img" {...props}><g stroke="currentColor" strokeWidth="4.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 51V17a5 5 0 0 1 5-5h12v36a3 3 0 0 1-3 3h-5M13 25h15M13 38h15"/><path d="M36 51c5-7 6-17 6-29v-8h8v26c0 7 2 10 6 10"/></g><g stroke="#eb603c" strokeWidth="3.2" strokeLinecap="round"><path d="m35 22 8-5m-7 14 8-5m-8 14 8-5"/></g></svg>;
}

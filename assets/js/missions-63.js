/* Crack Total / Personal objectives. Derived from recorded local match history.
   No invented scores, server results, paid achievements or silent writes. */
(function () {
  'use strict';
  const missions = Object.freeze([
    {id:'d-play',period:'daily',title:'Entrá a la cancha',detail:'Jugá una partida hoy.',target:1,metric:'matches'},
    {id:'d-answers',period:'daily',title:'Pie fino',detail:'Acertá cinco respuestas hoy.',target:5,metric:'correct'},
    {id:'d-win',period:'daily',title:'Tres puntos',detail:'Conseguí una victoria hoy.',target:1,metric:'wins'},
    {id:'w-play',period:'weekly',title:'El que siempre está',detail:'Completá cinco partidas esta semana.',target:5,metric:'matches'},
    {id:'w-win',period:'weekly',title:'Mentalidad ganadora',detail:'Sumá tres victorias esta semana.',target:3,metric:'wins'},
    {id:'w-variety',period:'weekly',title:'Todoterreno',detail:'Probá tres juegos distintos esta semana.',target:3,metric:'games'}
  ]);
  function startOfDay(date) {
    const d=new Date(date);
    d.setHours(0,0,0,0);
    return d;
  }
  function startOfWeek(date) {
    const day=startOfDay(date);
    day.setDate(day.getDate()-(day.getDay()+6)%7);
    return day;
  }
  function evaluate(snapshot,now=new Date()) {
    const date=new Date(now);
    const midnight=startOfDay(date).getTime();
    const monday=startOfWeek(date).getTime();
    const history=snapshot && snapshot.history;
    const stored=history && Array.isArray(history.matches)?history.matches:[];
    const valid=stored.filter(m=>{
      const time=Date.parse(m?.at || '');
      return Number.isFinite(time)&&time<=date.getTime()&&time>=monday;
    });
    const daily=valid.filter(m=>Date.parse(m.at)>=midnight);
    const metric=(rows,key)=>{
      if(key==='matches')return rows.length;
      if(key==='wins')return rows.filter(m=>m.result==='victory').length;
      if(key==='correct')return rows.reduce((n,m)=>n+
        Math.min(10000,Math.max(0,Number(m.correctAnswers)||0)),0);
      if(key==='games')return new Set(rows.map(m=>m.gameId).filter(Boolean)).size;
      return 0;
    };
    return missions.map(task=>{
      const raw=metric(task.period==='daily'?daily:valid,task.metric);
      const value=Math.min(task.target,raw);
      return {...task,value,raw,done:value>=task.target};
    });
  }
  function mount(target,snapshot) {
    if(!target)return null;
    let root=target.querySelector('[data-ct-missions]');
    if(!root){
      root=document.createElement('section');
      root.dataset.ctMissions='true';
      root.className='ct63-missions';
      root.setAttribute('aria-label','Misiones personales');
      target.appendChild(root);
    }
    const heading=document.createElement('div');
    heading.className='ct63-missions-head';
    const header=document.createElement('div');
    const overline=document.createElement('span');
    overline.textContent='EN ESTE DISPOSITIVO / PLAN DE PARTIDOS';
    const title=document.createElement('h3');
    title.textContent='Misiones en curso';
    const subtitle=document.createElement('p');
    subtitle.textContent='Objetivos personales calculados con las partidas registradas aquí. No modifican el ranking online.';
    header.append(overline,title,subtitle);
    heading.appendChild(header);
    const data=evaluate(snapshot);
    const achieved=document.createElement('strong');
    achieved.className='ct63-missions-total';
    achieved.textContent=String(data.filter(x=>x.done).length)+' / 6';
    achieved.setAttribute('aria-label',data.filter(x=>x.done).length+' de seis misiones completadas');
    heading.appendChild(achieved);
    const grid=document.createElement('div');
    grid.className='ct63-missions-grid';
    for(const m of data){
      const card=document.createElement('article');
      card.className='ct63-mission'+(m.done?' is-complete':'');
      const top=document.createElement('div');
      top.className='ct63-mission-top';
      const label=document.createElement('span');
      label.textContent=m.period==='daily'?'HOY':'ESTA SEMANA';
      const check=document.createElement('span');
      check.className='ct63-mission-check';
      check.textContent=m.done?'HECHO ✓':'EN JUEGO';
      top.append(label,check);
      const name=document.createElement('h4');
      name.textContent=m.title;
      const detail=document.createElement('p');
      detail.textContent=m.detail;
      const progress=document.createElement('progress');
      progress.max=m.target;progress.value=m.value;
      progress.setAttribute('aria-label',m.title+': '+m.value+' de '+m.target);
      const result=document.createElement('small');
      result.textContent=m.value+' / '+m.target;
      card.append(top,name,detail,progress,result);
      grid.appendChild(card);
    }
    root.replaceChildren(heading,grid);
    return root;
  }
  window.CrackTotalMissions={evaluate,mount};
})();

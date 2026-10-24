/* CT7 player dossier — read-only view of locally saved, unverified solo XP. */
(function () {
  'use strict';
  var key='ct7:local-progress:v1';
  var $=function(id){return document.getElementById(id);};
  function stored() {
    try {
      var obj=JSON.parse(localStorage.getItem(key)||'null');
      if(obj&&obj.version===1&&Array.isArray(obj.history))return obj;
    } catch(e){}
    return {xp:0,correct:0,rounds:0,streak:0,history:[],achievements:[]};
  }
  function draw() {
    if(!$('ct7LocalProgress'))return;
    var p=stored();
    [['ct7ProfileXp',p.xp],['ct7ProfileCorrect',p.correct],
      ['ct7ProfileRounds',p.rounds],['ct7ProfileStreak',p.streak]].forEach(function(pair){
      var value=Number(pair[1]);$(pair[0]).textContent=Number.isFinite(value)&&value>=0?
        String(Math.floor(value)):'0';
    });
    var medals=Array.isArray(p.achievements)?p.achievements:[];
    $('ct7ProfileMedals').textContent=medals.length
      ? 'MEDALLAS LOCALES · '+medals.filter(function(a){return ['explorador','observador'].includes(a);})
          .map(function(a){return a==='explorador'?'Explorador':'Observador';}).join(' / ')
      : 'Sin medallas locales todavía. Completá tres rondas en un día para ganar Explorador.';
    var list=$('ct7ProfileHistory');list.replaceChildren();
    if(!p.history.length){
      var empty=document.createElement('li');empty.textContent='Todavía no jugaste estos dos modos.';list.appendChild(empty);return;
    }
    p.history.slice(0,6).forEach(function(h){
      var li=document.createElement('li');
      var title=document.createElement('strong');
      title.textContent=(h.mode==='career'?'Adiviná la carrera':'¿Quién soy?')+
        ' · '+(h.won?'Acertaste':'Sin respuesta');
      var meta=document.createElement('small');
      meta.textContent=String(h.date||'').slice(0,10)+' · '+
        (Number.isSafeInteger(h.points)&&h.points>=0?h.points:0)+' pts locales';
      li.append(title,meta);list.appendChild(li);
    });
  }
  function clear() {
    if(!window.confirm('¿Borrar la experiencia, las medallas y los resultados locales de estos dos juegos en este dispositivo? No afecta tu perfil ni tus partidas online.'))return;
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem('ct7:session:identity:v1');
      sessionStorage.removeItem('ct7:session:career:v1');
      $('ct7ProfileNotice').textContent='Progreso local borrado de este dispositivo.';
    } catch(e) {
      $('ct7ProfileNotice').textContent='No se pudo borrar el almacenamiento local.';
    }
    draw();
  }
  document.addEventListener('DOMContentLoaded',function(){
    if(!$('ct7LocalProgress'))return;
    $('ct7ClearLocal').addEventListener('click',clear);
    window.addEventListener('storage',function(event){if(event.key===key)draw();});
    draw();
  });
})();

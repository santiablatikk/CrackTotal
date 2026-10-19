/* Top 10 verified-only daily contract v2. Shared by the game and homepage.
 * Rotation file is immutable once published: edit only by creating a new version.
 */
(function(root,factory){
  const core = factory();
  if(typeof module === 'object' && module.exports) module.exports = core;
  if(root) root.CTTop10Verified = core;
})(typeof window !== 'undefined' ? window : null,function(){
  'use strict';
  const normalize = value => String(value == null ? '' : value).toLowerCase()
    .replace(/ø/g,'o').replace(/æ/g,'ae').replace(/œ/g,'oe')
    .replace(/ß/g,'ss').replace(/ł/g,'l').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ')
    .replace(/\s+/g,' ').trim();
  const UTC_DAY = /^\d{4}-\d{2}-\d{2}$/;
  function index(topic){
    const map = new Map();
    topic.answers.forEach((answer,i)=>{
      [answer,...(topic.aliases?.[answer] || [])].forEach(value=>{
        const key = normalize(value);
        if(key.length < 3) throw new Error('Alias muy corto en '+topic.id);
        if(map.has(key) && map.get(key) !== i) throw new Error('Alias ambiguo '+key+' en '+topic.id);
        map.set(key,i);
      });
    });
    return map;
  }
  function validate(topic){
    if(!topic || topic.audit_status!=='verified_official' ||
      typeof topic.id !== 'string' || !topic.id ||
      typeof topic.title !== 'string' || !topic.title ||
      typeof topic.source_url !== 'string' || !/^https:\/\//.test(topic.source_url) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(topic.verified_at || '') ||
      topic.metric !== 'Puntos en la clasificación final' || topic.unit !== 'pts' ||
      !Array.isArray(topic.answers) || topic.answers.length!==10 ||
      !Array.isArray(topic.metric_values) || topic.metric_values.length!==10) return false;
    if(topic.metric_values.some(v=>!Number.isInteger(v)||v<0)) return false;
    if(topic.metric_values.some((v,i,a)=>i>0&&v>a[i-1])) return false;
    if(new Set(topic.answers.map(normalize)).size!==10) return false;
    try{index(topic)}catch{return false}
    return true;
  }
  function pick(pool, day){
    if(!UTC_DAY.test(day)||!Number.isFinite(Date.parse(day+'T00:00:00Z'))) throw new Error('Invalid UTC day');
    if(!Array.isArray(pool)||!pool.length||!pool.every(validate)) throw new Error('Invalid verified Top 10 rotation');
    if(new Set(pool.map(p=>p.id)).size!==pool.length) throw new Error('Duplicate challenge ids');
    const ordinal = Math.floor(Date.parse(day+'T00:00:00Z')/86400000);
    return pool[((ordinal % pool.length)+pool.length)%pool.length];
  }
  function match(topic,value){
    return index(topic).get(normalize(value));
  }
  return {normalize,validate,pick,match};
});

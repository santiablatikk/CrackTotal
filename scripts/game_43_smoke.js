'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const get=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const games=[
 ['top10.html','assets/css/top10.css',['top10GameCard','startOverlay','startBtn','answersList','surnameInput','resultRanking','closeResultBtn']],
 ['pasalache.html','assets/css/pasalache.css',['lettersContainer','currentLetterText','questionText','timerCount','answerInput','pasapalabraButton']],
 ['wordle-futbol.html','assets/css/wordle.css',['board','row1','row2','row3','streakDisplay','wordleResultModal']],
 ['quiensabemas.html','assets/css/qsm-1v1.css',['lobbyContainer','gameArea','optionsGrid','qsmQuestionText','turnIndicator']],
 ['mentiroso.html','assets/css/mentiroso.css',['lobbySection','gameContentSection','challengeText','bidInput','submitBidButton','callMentirosoButton']]
];
for(const [page,cssPath,ids] of games){
 const html=get(page);
 const observed=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(observed.length,new Set(observed).size,'Duplicate DOM IDs in '+page);
 ids.forEach(id=>assert(html.includes('id="'+id+'"'),page+' missing essential ID '+id));
 assert(html.includes('prefers-reduced-motion')||(cssPath&&get(cssPath).includes('prefers-reduced-motion')),
    page+' must support reduced motion');
 if(cssPath)assert(html.includes(cssPath),page+' missing its stylesheet');
}
const top=get('top10.html'),topCss=get('assets/css/top10.css'),topJs=get('assets/js/top10.js');
assert(top.indexOf('id="startOverlay"')<top.indexOf('id="top10GameCard"'),'Start and game must be separate');
assert(top.includes('id="top10GameCard" aria-label="Desafío del día" hidden'));
assert(topJs.includes("document.getElementById('top10GameCard').hidden=false"),'Game must be made visible on start/reload');
assert(topJs.includes("verifiedCore.match(topic,value)"),'Validated answers must use the official exact matcher');
assert(topCss.includes('overflow-wrap:anywhere'),'Long club names must wrap');
assert(topCss.includes('.top10-play-panel{order:-1'),'Mobile input must precede the ranking');
assert(top.includes('id="closeResultBtn"')&&topJs.includes("getElementById('closeResultBtn')"),'Result must be dismissible');
assert(topJs.includes('renderBoard(true)'),'Reveal the complete official ranking after game');
assert(top.includes('top10-verified.js'));
assert(get('wordle-futbol.html').match(/game-shell\.css/g).length===1,'Do not load game-shell CSS twice');
assert(get('assets/css/qsm-1v1.css').includes('body.qsm-1v1-body .qsm-question'),'Quiz must retain readable question design in canonical stylesheet');
assert(get('assets/css/mentiroso.css').includes('body.mentiroso-body .mentiroso-challenge-text'),'Mentiroso must keep readable challenge design in canonical stylesheet');
for(const p of ['assets/js/top10.js','assets/js/top10-verified.js','assets/js/wordle-futbol.js','assets/js/pasalache.js']){
 new vm.Script(get(p),{filename:p});
}
console.log('Crack Total 4.3 game UX smoke PASS: 5 game screens, IDs, Top 10 flow, keyboard and responsive contracts');

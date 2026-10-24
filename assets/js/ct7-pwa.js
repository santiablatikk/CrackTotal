/* Instalación discreta y actualizaciones sin interrumpir partidas. */
(function(){
'use strict';
if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
let installEvent=null,registration=null,updating=false;
const root=document.createElement('aside');
root.className='ct7-app-prompt';
root.setAttribute('aria-live','polite');
root.hidden=true;
const message=document.createElement('span');
const action=document.createElement('button');action.type='button';
const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Cerrar';
dismiss.setAttribute('aria-label','Cerrar aviso de aplicación');
dismiss.className='ct7-app-prompt__close';
root.append(message,action,dismiss);
function hide(){root.hidden=true;}
dismiss.addEventListener('click',hide);
function show(label,button,fn){
  message.textContent=label;action.textContent=button;
  action.onclick=fn;root.hidden=false;
}
function updateAvailable(){
  if(!registration?.waiting||!navigator.serviceWorker.controller||updating)return;
  show('Hay una nueva versión disponible. Tus partidas no se van a interrumpir.',
    'Actualizar cuando quieras',()=>{
      if(!registration?.waiting)return;
      updating=true;action.disabled=true;
      registration.waiting.postMessage({type:'CT7_ACTIVATE_UPDATE'});
    });
}
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installEvent=event;
  if(registration?.waiting)return updateAvailable();
  show('Llevá Crack Total al inicio de tu teléfono.','Instalar',async()=>{
    const prompt=installEvent;
    if(!prompt)return hide();
    installEvent=null;hide();
    try{await prompt.prompt();await prompt.userChoice;}catch(err){console.warn('No se pudo abrir la instalación:',err);}
  });
});
window.addEventListener('appinstalled',()=>{installEvent=null;hide();});
navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(updating&&!sessionStorage.getItem('ct7:reload-upgrade')){
    sessionStorage.setItem('ct7:reload-upgrade','1');
    location.reload();
  }
});
window.addEventListener('pageshow',()=>{
  sessionStorage.removeItem('ct7:reload-upgrade');
});
document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(root));
window.addEventListener('load',()=>{
  navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'})
    .then(reg=>{
      registration=reg;updateAvailable();
      reg.addEventListener('updatefound',()=>{
        const worker=reg.installing;
        if(worker)worker.addEventListener('statechange',()=>{
          if(worker.state==='installed')updateAvailable();
        });
      });
    })
    .catch(err=>console.warn('Crack Total sin servicio offline:',err));
});
})();

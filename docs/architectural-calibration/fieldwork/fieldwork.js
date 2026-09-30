import {loadVisitState} from '../common-knowledge/core-onboarding-state.js';
import {getRestorationLens} from './lens-config.js';
import {readFieldworkSequence,saveFieldworkSequence} from './sequence-state.js';
const $=id=>document.getElementById(id);
// Explicit review URL only: never read or write the learner's saved journey.
const previewLens=getRestorationLens(new URLSearchParams(location.search).get('preview'));
const dialogue=['修復師。','你已經令一些模糊的歷史重新可讀。','但你修復過的，只是留下來的記錄。','有些答案，只有回到它留下痕跡的地方才能看見。'];
const crossing=['你已經修復過檔案中的歷史。','現在，帶着那些線索回到現場。','修復工作，進入下一階段。'];
let lens,progress,timer,pendingPatch,previousScene,initialized=false;
function schedule(callback,delay){clearTimeout(timer);if(!document.hidden)timer=setTimeout(callback,delay);}
function go(scene,line=0,extra={}){
 clearTimeout(timer);
 const patch={scene,line,...extra};
 if(previewLens){progress={...progress,...patch};render();return;}
 const result=saveFieldworkSequence(sessionStorage,lens.lensId,patch);
 $('storage-warning').hidden=result.ok;
 pendingPatch=result.ok?null:patch;
 if(!result.ok)return;
 progress=readFieldworkSequence(result.state);render();
}
function showOnly(ids,current){for(const id of ids)$(id).hidden=id!==current;}
function render(){
 clearTimeout(timer);
 const {scene,line}=progress,changed=previousScene!==scene;
 document.body.dataset.scene=scene;
 const area=scene.startsWith('f01')?'threshold':scene.startsWith('f02')?'look':scene==='f03-identity'||scene==='f03-lens'?'restoration-lens':scene==='f03-explore'?'exploration':'capture-placeholder';
 showOnly(['threshold','look','restoration-lens','exploration','capture-placeholder','recovery'],area);
 if(area==='threshold'){
  $('caretaker-dialogue').hidden=scene!=='f01-dialogue';$('door-scene').hidden=scene==='f01-dialogue';
  $('dialogue-line').textContent=dialogue[line];$('dialogue-next').textContent=line===3?'走近廟門 →':'繼續聆聽 →';
  $('enter-temple').hidden=scene!=='f01-door';$('crossing-copy').hidden=scene!=='f01-cross';
  if(scene==='f01-cross'){
   const heading=$('crossing-line');heading.textContent=crossing[line];heading.getAnimations().forEach(animation=>animation.cancel());
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)heading.animate([{opacity:0},{opacity:1,offset:.18},{opacity:1,offset:.85},{opacity:0}],{duration:5000,fill:'both'});
   schedule(()=>line<2?go(scene,line+1):go('f02-quiet'),5000);
  }
 }
 if(area==='look'){
  showOnly(['quiet-copy','principle-copy','look-away','return-copy'],{'f02-quiet':'quiet-copy','f02-principle':'principle-copy','f02-look':'look-away','f02-return':'return-copy'}[scene]);
  if(scene==='f02-quiet'){$('quiet-secondary').hidden=line<1;$('quiet-away').hidden=line<2;schedule(()=>line<2?go(scene,line+1):go('f02-principle'),line===2?5000:4000);}
  if(scene==='f02-principle')schedule(()=>go('f02-look',0,{lookStartedAt:Date.now()}),7000);
  if(scene==='f02-look'){
   const elapsed=Date.now()-(progress.lookStartedAt||Date.now()),remaining=Math.max(0,12000-elapsed);
   $('look-return').hidden=remaining>0;$('look-invitation').hidden=remaining===0;
   if(remaining>0)schedule(render,remaining);
  }
  if(scene==='f02-return')schedule(()=>go('f03-identity'),4000);
 }
 if(area==='restoration-lens'){
  $('identity-copy').hidden=scene!=='f03-identity';$('lens-copy').hidden=scene!=='f03-lens';
  if(scene==='f03-identity'){$('identity-second').hidden=line<1;$('identity-understanding').hidden=line<2;schedule(()=>line<2?go(scene,line+1):go('f03-lens'),line===2?6500:4500);}
  else{
   $('lens-title').textContent=lens.title;$('lens-question').textContent=lens.question;$('lens-prompt').textContent=lens.prompt;
   $('lens-common').hidden=lens.visualMode==='recognition';
   const fragment=lens.optionalPreFieldFragment;$('pre-field-fragment').hidden=!fragment;
   if(fragment){$('fragment-image').src=fragment.src;$('fragment-image').alt=fragment.alt;}
  }
 }
 $('exploration-title').textContent=lens.title;$('exploration-question').textContent=lens.shortQuestion;
 if(changed){
  window.scrollTo({top:0,behavior:'instant'});
  const focus=scene==='f01-door'?$('enter-temple'):$(area).querySelector('div:not([hidden]) h1:not([hidden])');
  focus?.focus({preventScroll:true});
 }
 previousScene=scene;
}
function load(){
 clearTimeout(timer);previousScene=null;
 if(previewLens){lens=previewLens;progress=readFieldworkSequence({});document.title=`預覽・${lens.title}｜文武廟現場考察`;render();return;}
 const state=loadVisitState(sessionStorage);lens=getRestorationLens(state.selectedFieldworkTheme);
 if(!lens||!state.fieldworkDeparted||!(state.etiquetteCompleted||state.ritualRehearsalCompleted)){
  document.body.dataset.scene='recovery';showOnly(['threshold','look','restoration-lens','exploration','capture-placeholder','recovery'],'recovery');return;
 }
 progress=readFieldworkSequence(state);document.title=`${lens.title}｜文武廟現場考察`;
 if(progress.scene==='f02-look'&&!progress.lookStartedAt){go('f02-look',0,{lookStartedAt:Date.now()});return;}
 render();
}
$('dialogue-next').onclick=()=>progress.line<3?go('f01-dialogue',progress.line+1):go('f01-door');
$('enter-temple').onclick=()=>go('f01-cross');
$('looked').onclick=()=>go('f02-return');
$('explore').onclick=()=>go('f03-explore');
// F04 attaches here; the placeholder requests no camera, input or permissions.
$('record-trace').onclick=()=>go('f04-placeholder');
$('return-exploration').onclick=()=>go('f03-explore');
$('retry-save').onclick=()=>pendingPatch&&go(pendingPatch.scene,pendingPatch.line,pendingPatch);
$('art-credit').onclick=()=>$('credits').showModal();$('close-credits').onclick=()=>$('credits').close();
// Pause narrative reading while away. The observation delay alone includes time
// away from the screen, so returning after looking never starts a fresh wait.
window.addEventListener('pagehide',()=>clearTimeout(timer));
window.addEventListener('pageshow',()=>{if(initialized)load();initialized=true;});
document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden&&progress&&!pendingPatch)render();});
load();

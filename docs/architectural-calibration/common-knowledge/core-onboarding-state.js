import {readPlaqueTracing} from './plaque-tracing-state.js';
import {getFieldworkTheme,themeFromLegacyQuestion} from './fieldwork-themes.js';
import {loadRestorationState,rubbingUnlocked} from './restoration-state.js';
// Keep the existing storage key so completed v2 runs migrate in place.
export const CORE_ONBOARDING_KEY = 'manmo-core-onboarding-v2';
const questionText = value => typeof value === 'string' && value.trim() ? value.trim().slice(0,500) : null;
function readSaved(storage) {
  try {const value=JSON.parse(storage.getItem(CORE_ONBOARDING_KEY)||'null');return value && value.version>=1 ? value : null;} catch{return null;}
}
function priorQuestion(storage,saved){
  if(questionText(saved?.selectedFieldworkQuestion))return questionText(saved.selectedFieldworkQuestion);
  for(const key of ['selectedFieldworkQuestion','manmo-photo-inquiry-v2','manmo-fieldwork-question']){
    try{const raw=storage.getItem(key);if(!raw)continue;let value;try{value=JSON.parse(raw);}catch{value=raw;}const q=questionText(typeof value==='string'?value:value?.selectedFieldworkQuestion);if(q)return q;}catch{}
  }
  return null;
}
export function loadCoreOnboardingState(storage,{portraitsComplete=false,questionStorage=null}={}){
  const saved=readSaved(storage);
  const mapCertified=!!(portraitsComplete&&(saved?.mapCertified===true||(saved?.version===1&&saved?.mapCompleted===true)));
  const photoCompleted=!!(mapCertified&&saved?.photoCompleted===true);
  const architectureCompleted=!!(photoCompleted&&saved?.architectureCompleted===true);
  const plaqueCompleted=!!(architectureCompleted&&saved?.plaqueCompleted===true);
  const etiquetteCompleted=!!(plaqueCompleted&&saved?.etiquetteCompleted===true);
  const selectedFieldworkQuestion=priorQuestion(storage,saved)||(questionStorage?priorQuestion(questionStorage,null):null);
  const selectedFieldworkTheme=getFieldworkTheme(saved?.selectedFieldworkTheme)?.id||themeFromLegacyQuestion(selectedFieldworkQuestion);
  const handoffCompleted=!!(etiquetteCompleted&&(selectedFieldworkTheme||selectedFieldworkQuestion)&&saved?.handoffCompleted===true);
  const result={...saved,version:3,mapCertified,photoCompleted,architectureCompleted,plaqueCompleted,etiquetteCompleted,handoffCompleted,corePreFieldworkComplete:handoffCompleted,selectedFieldworkQuestion,selectedFieldworkTheme,etiquetteBeat:plaqueCompleted?Math.max(0,Math.min(4,Number(saved?.etiquetteBeat)||0)):0,worshipChoice:saved?.worshipChoice==='participate'?'participate':saved?.worshipChoice==='observe'?'observe':null};
  // Preserve the original before a schema migration; never clear portrait or photo saves.
  if(saved&&saved.version<3){try{if(!storage.getItem(CORE_ONBOARDING_KEY+'-before-v3'))storage.setItem(CORE_ONBOARDING_KEY+'-before-v3',JSON.stringify(saved));storage.setItem(CORE_ONBOARDING_KEY,JSON.stringify(result));}catch{}}
  if(selectedFieldworkTheme&&!saved?.selectedFieldworkTheme){try{storage.setItem(CORE_ONBOARDING_KEY,JSON.stringify(result));}catch{}}
  return result;
}
export function saveCoreOnboardingState(storage,state){
  const clean={...state,version:3};clean.mapCertified=state?.mapCertified===true;clean.photoCompleted=clean.mapCertified&&state?.photoCompleted===true;clean.architectureCompleted=clean.photoCompleted&&state?.architectureCompleted===true;clean.plaqueCompleted=clean.architectureCompleted&&state?.plaqueCompleted===true;clean.etiquetteCompleted=clean.plaqueCompleted&&state?.etiquetteCompleted===true;
  clean.selectedFieldworkQuestion=questionText(state?.selectedFieldworkQuestion);clean.selectedFieldworkTheme=getFieldworkTheme(state?.selectedFieldworkTheme)?.id||null;clean.handoffCompleted=!!(clean.etiquetteCompleted&&(clean.selectedFieldworkTheme||clean.selectedFieldworkQuestion)&&state?.handoffCompleted===true);clean.corePreFieldworkComplete=clean.handoffCompleted;
  try{storage.setItem(CORE_ONBOARDING_KEY,JSON.stringify(clean));return {ok:true,state:clean};}catch(error){return {ok:false,error,state:clean};}
}
export function getGuidedStep({portraitsComplete=false,mapCertified=false,photoCompleted=false,architectureCompleted=false,plaqueCompleted=false,etiquetteCompleted=false,handoffCompleted=false,selectedFieldworkQuestion=null,selectedFieldworkTheme=null}={}){
  if(!portraitsComplete)return 'portraits';if(!mapCertified)return 'map';if(!photoCompleted)return 'photo';if(!architectureCompleted)return 'architecture';if(!plaqueCompleted)return 'plaque';if(!etiquetteCompleted)return 'etiquette';if(!handoffCompleted||!(getFieldworkTheme(selectedFieldworkTheme)||questionText(selectedFieldworkQuestion)))return 'handoff';return 'free';
}
export function markMapCompleted(state,{portraitsComplete=false}={}){return portraitsComplete?{...state,mapCertified:true}:state;}
export function markPhotoCompleted(state,{portraitsComplete=false}={}){return portraitsComplete&&state.mapCertified?{...state,photoCompleted:true}:state;}
export function markArchitectureCompleted(state,{portraitsComplete=false}={}){return portraitsComplete&&state.mapCertified&&state.photoCompleted?{...state,architectureCompleted:true}:state;}
export function advancePrevisit(state,event,data={}){
  if(!state.architectureCompleted)return state;
  if(event==='plaqueTracing')return {...state,plaqueTracing:readPlaqueTracing(data)};
  if(event==='plaque')return {...state,plaqueCompleted:true};
  if(!state.plaqueCompleted)return state;
  if(event==='etiquetteBeat')return {...state,etiquetteBeat:Math.max(state.etiquetteBeat||0,Math.min(4,data.beat||0)),worshipChoice:data.worshipChoice||state.worshipChoice};
  if(event==='etiquette'&&state.etiquetteBeat===4)return {...state,etiquetteCompleted:true};
  if(event==='question'&&state.etiquetteCompleted&&questionText(data.question))return {...state,selectedFieldworkQuestion:questionText(data.question)};
  if(event==='handoff'&&state.etiquetteCompleted&&questionText(data.question))return {...state,selectedFieldworkQuestion:questionText(data.question),handoffCompleted:true,corePreFieldworkComplete:true};
  return state;
}

// Both routes resolve the same portrait prerequisites and the same question store.
export function loadVisitState(storage, questionStorage=null) {
  const state=loadCoreOnboardingState(storage,{portraitsComplete:rubbingUnlocked(loadRestorationState(storage)),questionStorage});
  // One-way compatibility with the previous production rehearsal; no new flag writes.
  if(state.plaqueCompleted && !state.etiquetteCompleted && storage.getItem('manmo-previsit-ritual-complete')==='true') {
    const migrated={...state,etiquetteBeat:4,etiquetteCompleted:true};
    return saveCoreOnboardingState(storage,migrated).state;
  }
  return state;
}
export function readFieldworkQuestion(storage) {
  return priorQuestion(storage,readSaved(storage));
}
// Rehearsal completion is allowed for direct visitors too. It must never certify
// archive evidence that they have not actually read.
export function completeRehearsal(storage,{questionStorage=null,worshipChoice=null}={}) {
  let state=loadVisitState(storage,questionStorage);
  state={...state,ritualRehearsalCompleted:true,worshipChoice:worshipChoice||state.worshipChoice};
  if(state.plaqueCompleted) {
    state=advancePrevisit(state,'etiquetteBeat',{beat:4,worshipChoice});
    state=advancePrevisit(state,'etiquette');
    if(state.selectedFieldworkQuestion)state=advancePrevisit(state,'handoff',{question:state.selectedFieldworkQuestion});
  }
  return saveCoreOnboardingState(storage,state);
}

// A new question is chosen at the completed rehearsal, never during photo reading.
export function completeQuestionHandoff(storage,question) {
  let state=loadVisitState(storage);
  if(!(state.etiquetteCompleted||state.ritualRehearsalCompleted)||!questionText(question))return {ok:false,state};
  state={...state,selectedFieldworkQuestion:questionText(question)};
  if(state.etiquetteCompleted)state=advancePrevisit(state,'handoff',{question});
  return saveCoreOnboardingState(storage,state);
}

// Selection and departure are separate gestures. All routes share this one record.
export function selectFieldworkTheme(storage,id){
 const state=loadVisitState(storage);
 if(!(state.etiquetteCompleted||state.ritualRehearsalCompleted)||!getFieldworkTheme(id))return {ok:false,state};
 return saveCoreOnboardingState(storage,{...state,selectedFieldworkTheme:id,fieldworkDeparted:state.selectedFieldworkTheme===id&&state.fieldworkDeparted===true});
}
export function confirmFieldworkDeparture(storage){
 const state=loadVisitState(storage);
 if(!(state.etiquetteCompleted||state.ritualRehearsalCompleted)||!getFieldworkTheme(state.selectedFieldworkTheme))return {ok:false,state};
 return saveCoreOnboardingState(storage,{...state,fieldworkDeparted:true,handoffCompleted:state.etiquetteCompleted});
}

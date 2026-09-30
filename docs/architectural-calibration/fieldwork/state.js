import {loadVisitState,saveCoreOnboardingState} from '../common-knowledge/core-onboarding-state.js';
import {getFieldworkTheme,FIELDWORK_STAGES} from '../common-knowledge/fieldwork-themes.js';
const stages=['entry',...FIELDWORK_STAGES,'record'];
export function readFieldworkProgress(state,id=state.selectedFieldworkTheme){
 const saved=state.fieldwork?.[id]||{};
 return {stage:stages.includes(saved.stage)?saved.stage:'entry',notes:Object.fromEntries(FIELDWORK_STAGES.map(stage=>[stage,typeof saved.notes?.[stage]==='string'?saved.notes[stage].slice(0,8000):'']))};
}
export function saveFieldworkProgress(storage,id,patch){
 const state=loadVisitState(storage);
 if(!getFieldworkTheme(id)||id!==state.selectedFieldworkTheme||!state.fieldworkDeparted||!(state.etiquetteCompleted||state.ritualRehearsalCompleted))return {ok:false,state};
 const current=readFieldworkProgress(state,id);
 const updated={...state.fieldwork?.[id],stage:stages.includes(patch.stage)?patch.stage:current.stage,notes:{...current.notes}};
 for(const stage of FIELDWORK_STAGES)if(typeof patch.notes?.[stage]==='string')updated.notes[stage]=patch.notes[stage].slice(0,8000);
 return saveCoreOnboardingState(storage,{...state,fieldwork:{...state.fieldwork,[id]:updated}});
}

import {loadVisitState,saveCoreOnboardingState} from '../common-knowledge/core-onboarding-state.js';
import {getFieldworkTheme} from '../common-knowledge/fieldwork-themes.js';
const scenes={'f01-dialogue':3,'f01-door':0,'f01-cross':2,'f02-quiet':2,'f02-principle':0,'f02-look':0,'f02-return':0,'f03-identity':2,'f03-lens':0,'f03-explore':0,'f04-placeholder':0};
export function readFieldworkSequence(state,id=state.selectedFieldworkTheme){
 const saved=state.fieldwork?.[id]?.sequence||{};
 const scene=Object.hasOwn(scenes,saved.scene)?saved.scene:'f01-dialogue';
 return {version:1,scene,line:Math.max(0,Math.min(scenes[scene],Math.floor(Number(saved.line)||0))),lookStartedAt:Number.isFinite(saved.lookStartedAt)&&saved.lookStartedAt>0?saved.lookStartedAt:null};
}
export function saveFieldworkSequence(storage,id,patch){
 const state=loadVisitState(storage);
 if(!getFieldworkTheme(id)||id!==state.selectedFieldworkTheme||!state.fieldworkDeparted||!(state.etiquetteCompleted||state.ritualRehearsalCompleted))return {ok:false,state};
 const record=state.fieldwork?.[id]||{};
 const candidate={...readFieldworkSequence(state,id),...patch};
 const sequence=readFieldworkSequence({fieldwork:{[id]:{sequence:candidate}}},id);
 // Preserve legacy field notes, unrelated themes and future F04 data verbatim.
 return saveCoreOnboardingState(storage,{...state,fieldwork:{...state.fieldwork,[id]:{...record,sequence}}});
}

import {readFieldworkQuestion} from './core-onboarding-state.js';
// Only explicit evidence reading advances the guided sequence. Old timed reveals
// cannot certify the new observation contract.
export const PHOTO_KEY = 'manmo-photo-inquiry-v2';
export const emptyPhotoState = () => ({version:2, observationContractVersion:4, previousEvidenceAccepted:false, inscriptionInteractionVersion:1, lionRevealed:false, clues:{sign:false,street:false,lion:false,roof:false}, inscriptions:{date:false,donor:false}, judgement:false, recordSeen:false, completed:false,selectedFieldworkQuestion:null,roofRidgeDiscovered:false,architectureStudyCompleted:false});
export function observationComplete(s) {
  return s.clues.sign===true && s.clues.lion===true && s.clues.roof===true && ['date','donor'].every(k=>s.inscriptions[k]===true);
}
export function entranceObserved(s) {return s.clues.sign===true&&s.clues.lion===true&&['date','donor'].every(k=>s.inscriptions[k]===true);}
export function photoEvidenceComplete(s) {return entranceObserved(s)&&s.judgement===true&&s.recordSeen===true;}
export function loadPhotoState(storage) {
  const s=emptyPhotoState();
  try {
    const raw=JSON.parse(storage.getItem(PHOTO_KEY)||'null');
    if(raw?.version!==2)return s;
    for(const k of ['sign','street','lion','roof'])s.clues[k]=raw.clues?.[k]===true;
    // Old automatic reveals cannot stand in for a learner clicking the inscriptions.
    for(const k of ['date','donor'])s.inscriptions[k]=raw.inscriptionInteractionVersion===1 && raw.inscriptions?.[k]===true;
    s.lionRevealed=raw.lionRevealed===true||s.inscriptions.date||s.inscriptions.donor;
    s.clues.lion=s.clues.lion && s.inscriptions.date && s.inscriptions.donor;
    // A previously read documentary stage remains valid when its earlier lion-only
    // contract was completed. New visits require both the sign and the lion.
    const previousEvidence=((raw.observationContractVersion==null||raw.observationContractVersion<3)||raw.previousEvidenceAccepted===true)&&s.clues.lion&&raw.recordSeen===true&&raw.judgement===true;
    s.previousEvidenceAccepted=previousEvidence&&!observationComplete(s);
    s.judgement=(entranceObserved(s)||previousEvidence) && raw.judgement===true;
    s.recordSeen=s.judgement && raw.recordSeen===true;
    s.selectedFieldworkQuestion=readFieldworkQuestion(storage);
    s.roofRidgeDiscovered=raw.roofRidgeDiscovered===true||s.clues.roof;
    s.architectureStudyCompleted=raw.architectureStudyCompleted===true;
    s.clues.roof=s.architectureStudyCompleted;
    // Keep earlier documentary completion. New photo completion requires the
    // sign, lion inscriptions, source judgement and record, independently of roof/question.
    const legacyFinished=(raw.observationContractVersion<4||raw.observationContractVersion==null||raw.previousEvidenceAccepted===true) && raw.inscriptionInteractionVersion===1 && raw.completed===true && raw.recordSeen===true && raw.judgement===true && s.inscriptions.date && s.inscriptions.donor;
    s.completed=raw.completed===true && (photoEvidenceComplete(s)||Boolean(legacyFinished));
  } catch { /* A missing/corrupt save starts an honest observation. */ }
  return s;
}
export function savePhotoState(storage,state) {
  try {const {selectedFieldworkQuestion,...evidence}=state;
    // Preserve a legacy photo-only question until the core store has accepted it.
    let canonical=null;try{canonical=JSON.parse(storage.getItem('manmo-core-onboarding-v2')||'null')?.selectedFieldworkQuestion;}catch{}
    if(selectedFieldworkQuestion&&!canonical)evidence.selectedFieldworkQuestion=selectedFieldworkQuestion;
    storage.setItem(PHOTO_KEY,JSON.stringify(evidence));} catch { /* Keep this visit playable. */ }
}

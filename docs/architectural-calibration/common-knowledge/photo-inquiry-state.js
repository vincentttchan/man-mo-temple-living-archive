// Only explicit evidence reading advances the guided sequence. Old timed reveals
// cannot certify the new observation contract.
export const PHOTO_KEY = 'manmo-photo-inquiry-v2';
export const emptyPhotoState = () => ({version:2, observationContractVersion:3, previousEvidenceAccepted:false, inscriptionInteractionVersion:1, lionRevealed:false, clues:{sign:false,street:false,lion:false,roof:false}, inscriptions:{date:false,donor:false}, judgement:false, recordSeen:false, completed:false,selectedFieldworkQuestion:null,roofRidgeDiscovered:false,architectureStudyCompleted:false});
export function observationComplete(s) {
  return s.clues.sign===true && s.clues.lion===true && s.clues.roof===true && ['date','donor'].every(k=>s.inscriptions[k]===true);
}
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
    const previousEvidence=(raw.observationContractVersion!==2||raw.previousEvidenceAccepted===true)&&s.clues.lion&&raw.recordSeen===true&&raw.judgement===true;
    s.previousEvidenceAccepted=previousEvidence&&!observationComplete(s);
    s.judgement=(observationComplete(s)||previousEvidence) && raw.judgement===true;
    s.recordSeen=s.judgement && raw.recordSeen===true;
    s.selectedFieldworkQuestion=typeof raw.selectedFieldworkQuestion==='string'?raw.selectedFieldworkQuestion:null;
    s.roofRidgeDiscovered=raw.roofRidgeDiscovered===true||s.clues.roof;
    s.architectureStudyCompleted=raw.architectureStudyCompleted===true;
    s.clues.roof=s.architectureStudyCompleted;
    // A finished earlier visit remains finished; in-progress visits must read all
    // three photographic details under the new contract.
    const legacyFinished=(raw.observationContractVersion!==3||raw.previousEvidenceAccepted===true) && raw.inscriptionInteractionVersion===1 && raw.completed===true && raw.recordSeen===true && raw.judgement===true && typeof raw.selectedFieldworkQuestion==='string' && raw.selectedFieldworkQuestion.trim() && s.inscriptions.date && s.inscriptions.donor;
    s.completed=raw.completed===true && (observationComplete(s)||Boolean(legacyFinished));
  } catch { /* A missing/corrupt save starts an honest observation. */ }
  return s;
}
export function savePhotoState(storage,state) {
  try {storage.setItem(PHOTO_KEY,JSON.stringify(state));} catch { /* Keep this visit playable. */ }
}

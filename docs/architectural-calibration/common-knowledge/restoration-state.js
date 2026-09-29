const KEY = 'manmo-restoration-room-v1';
const legacy = { wen: 'manmo-faith-story-v24', wu: 'manmo-guandi-story-v25' };
const scenes = new Set(['hero', 'archive-entry', 'room', 'painting', 'free-exploration']);

export function loadRestorationState(storage) {
  let saved = {};
  try { saved = JSON.parse(storage.getItem(KEY) || '{}') || {}; } catch { /* Recover from story markers. */ }
  const read = {
    wen: saved.read?.wen === true || saved.repaired?.wen === true || storage.getItem(legacy.wen) === 'complete',
    wu: saved.read?.wu === true || saved.repaired?.wu === true || storage.getItem(legacy.wu) === 'complete',
  };
  // Understanding a story now restores its side automatically, including old saves.
  const repaired = { ...read };
  const complete = repaired.wen && repaired.wu;
  const introSeen = saved.introSeen === true || read.wen || read.wu;
  let scene = scenes.has(saved.scene) ? saved.scene : (introSeen ? 'painting' : 'hero');
  if (scene === 'free-exploration' && !complete) scene = 'painting';
  if (scene === 'hero' && introSeen) scene = 'painting';
  const completionAcknowledged = complete && saved.completionAcknowledged === true;
  return { introSeen, read, repaired, pendingPart: null, scene, completionAcknowledged };
}

export function saveRestorationState(storage, state) { storage.setItem(KEY, JSON.stringify(state)); }

export function markStoryRead(state, part) {
  if (!['wen', 'wu'].includes(part)) return state;
  const read = { ...state.read, [part]: true };
  const repaired = { ...state.repaired, [part]: true };
  const newlyComplete = repaired.wen && repaired.wu && !(state.repaired.wen && state.repaired.wu);
  return { ...state, introSeen: true, read, repaired, pendingPart: null, scene: 'painting', completionAcknowledged: newlyComplete ? false : state.completionAcknowledged };
}

export function markPortraitRestored(state, part) {
  if (!['wen', 'wu'].includes(part) || !state.read[part]) return state;
  return { ...state, repaired: { ...state.repaired, [part]: true }, pendingPart: null };
}

export function rubbingUnlocked(state) { return state.repaired.wen && state.repaired.wu; }

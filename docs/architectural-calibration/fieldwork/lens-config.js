import {ARCHITECTURE_SOURCE} from '../common-knowledge/architecture-source.js';
// IDs refer to the canonical pre-field theme; no second lens-selection store.
export const RESTORATION_LENSES = [
 {lensId:'community',title:'人與社群',question:'誰曾經參與這個地方？',prompt:'找一項讓你看見「人的痕跡」的地方。',shortQuestion:'誰曾經參與這個地方？',visualMode:'standard'},
 {lensId:'public-life',title:'公共生活',question:'文武廟除了宗教活動，還曾承載甚麼公共生活？',prompt:'找一項令你懷疑「這裏不只是一座廟」的痕跡。',shortQuestion:'這裏還承載過甚麼公共生活？',visualMode:'standard'},
 {lensId:'religion',title:'宗教信仰',question:'文武廟怎樣反映華人的宗教信仰？',prompt:'留意人、神明、儀式與空間之間的關係。',shortQuestion:'人如何與神明建立關係？',visualMode:'standard'},
 {lensId:'architecture',title:'建築特色',question:'文武廟的建築有哪些值得留意的特色？',prompt:'你見過它的一部分。\n現在，在真正的文武廟找到它。',shortQuestion:'你見過的細節，在現場哪裏？',visualMode:'recognition',optionalPreFieldFragment:ARCHITECTURE_SOURCE.available?{src:new URL('../common-knowledge/'+ARCHITECTURE_SOURCE.src,import.meta.url).href,alt:'04-A 曾經觀察的主脊陶塑研究圖',source:ARCHITECTURE_SOURCE.url}:null}
];
export const getRestorationLens=id=>RESTORATION_LENSES.find(lens=>lens.lensId===id)||null;

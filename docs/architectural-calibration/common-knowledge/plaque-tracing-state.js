export const PLAQUE_CHARACTERS=['神','威','普','佑'];
export function readPlaqueTracing(saved){
 const completed=[];
 if(saved?.version===1)for(const char of PLAQUE_CHARACTERS){if(saved.completed?.includes(char))completed.push(char);else break;}
 const strokes=Object.fromEntries(PLAQUE_CHARACTERS.map(char=>[char,Array.isArray(saved?.strokes?.[char])?saved.strokes[char].slice(-120).map(stroke=>Array.isArray(stroke)?stroke.slice(0,700).filter(point=>Array.isArray(point)&&point.length===2&&point.every(n=>Number.isFinite(n)&&n>=0&&n<=1)):[]).filter(stroke=>stroke.length>1):[]]));
 return {version:1,completed,strokes};
}
// Major letter-shape coverage, with no handwriting/OCR score or stroke-order rule.
export function tracingIsComplete({visited,total,length,strokes}){
 return total>0&&visited/total>=.58&&length>=1.5&&strokes>0;
}

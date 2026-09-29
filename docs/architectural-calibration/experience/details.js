import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Authored sculptural interpretation of TWGH reference photographs, not a scan.
export function addDetails(scene,env){
const group=new T.Group();scene.add(group);
const material=(color,metalness=0,roughness=.7)=>new T.MeshStandardMaterial({color,metalness,roughness,envMap:env,envMapIntensity:.25});
const wood=material(0x29170f),red=material(0x772b20),gold=material(0xac8143,.65,.42),skin=material(0x2a2520,.12,.55),beard=material(0x151410),green=material(0x23473b),ivory=material(0xd5c6a1),blue=material(0x294f72),ceramic=material(0xc1c5b4,.08,.3);
function mesh(g,m,x,y,z,parent=group){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function box(w,h,d,m,x,y,z,p=group){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);}
function ell(rx,ry,rz,m,x,y,z,p=group){const o=mesh(new T.SphereGeometry(1,20,16),m,x,y,z,p);o.scale.set(rx,ry,rz);return o;}
function rod(a,b,r,m,p=group){const av=new T.Vector3(...a),bv=new T.Vector3(...b);const o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),m,...av.clone().add(bv).multiplyScalar(.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
function line(points,r,m,p=group){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),40,r,5,false),m,0,0,0,p);}
function lathe(profile,m,x,y,z,p=group){return mesh(new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),24),m,x,y,z,p);}
function trim(w,h,x,y,z,p=group){for(const xx of [-w/2,w/2])box(.026,h,.03,gold,x+xx,y,z,p);for(const yy of [-h/2,h/2])box(w,.026,.03,gold,x,y+yy,z,p);}
// Main shrine: dark carved frame, tied-back red curtains and two seated deities.
box(3.4,2,.14,wood,0,2.86,-6.91);box(3.12,1.78,.035,red,0,2.87,-6.82);
for(const x of [-1.64,1.64]){box(.17,2.18,.25,wood,x,2.86,-6.39);trim(.15,2.12,x,2.86,-6.25);for(let i=0;i<9;i++){const a=i*.7;line([[x-.05,1.94+i*.23,-6.22],[x+.055,2.02+i*.23,-6.21],[x-.05,2.13+i*.23,-6.22]],.018,gold);}}
box(3.55,.23,.43,wood,0,3.96,-6.5);trim(3.48,.22,0,3.96,-6.26);
for(let i=0;i<13;i++){const x=(i-6)*.25;line([[x-.1,3.92,-6.23],[x,4.015,-6.21],[x+.1,3.92,-6.23]],.017,gold);}
for(const sign of [-1,1]){const verts=[],idx=[];for(let j=0;j<=12;j++){const t=j/12,xx=sign*(.2+1.3*t),yy=3.85-1.7*t;for(let k=0;k<=8;k++)verts.push(xx+sign*(k/8-.5)*(.45-.25*t),yy,-6.35+Math.sin(k/8*Math.PI*6)*.035);for(let k=0;k<8&&j<12;k++){const a=j*9+k;idx.push(a,a+9,a+1,a+1,a+9,a+10);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();const cloth=red.clone();cloth.side=T.DoubleSide;mesh(g,cloth,0,0,0);}

function robeMap(type){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=type==='mo'?'#315044':'#783527';ctx.fillRect(0,0,512,512);ctx.strokeStyle='#b99b56';ctx.lineWidth=1.3;ctx.globalAlpha=.72;
for(let row=0;row<8;row++)for(let col=0;col<8;col++){const x=col*64+(row%2)*32,y=row*64;ctx.beginPath();ctx.moveTo(x-22,y+20);ctx.bezierCurveTo(x-32,y-4,x-10,y-17,x,y-4);ctx.bezierCurveTo(x+13,y-28,x+35,y-2,x+20,y+17);ctx.bezierCurveTo(x+9,y+26,x+2,y+10,x+13,y+9);ctx.stroke();ctx.beginPath();ctx.arc(x,y+38,7,0,Math.PI);ctx.stroke();}
ctx.globalAlpha=.55;for(let x=0;x<512;x+=3){ctx.strokeStyle=x%6?'#0000000d':'#fff2cf0a';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function deity(x,type,scale=1,z=-6.4,y=1.9){const p=new T.Group();p.position.set(x,y,z);p.scale.setScalar(scale);group.add(p);const robe=(type==='mo'?green:red).clone();robe.map=robeMap(type);robe.color.set(0xffffff);
box(.61,.12,.5,wood,0,.03,0,p);box(.52,.85,.10,wood,0,.49,-.22,p);trim(.52,.85,0,.49,-.155,p);
lathe([[.27,0],[.36,.13],[.33,.3],[.27,.48],[.25,.72],[.2,.9],[.15,.97]],robe,0,.09,0,p);
// Robe side folds and narrow gold piping, authored decorative abstraction.
for(const sign of [-1,1]){ell(.16,.31,.16,robe,sign*.24,.69,.045,p);ell(.09,.06,.07,skin,sign*.15,.57,.22,p);line([[sign*.16,1,0],[sign*.23,.75,.14],[sign*.32,.28,.12]],.012,gold,p);}
for(let j=0;j<7;j++){const x=(j-3)*.082;line([[x*.45,.82,.19],[x*.9,.48,.29],[x,.17,.3]],.006,gold,p);}
ell(.143,.19,.127,skin,0,1.105,.012,p);ell(.027,.065,.035,skin,0,1.09,.139,p);
for(const sign of [-1,1]){ell(.048,.017,.013,beard,sign*.06,1.13,.128,p);line([[sign*.015,1.165,.128],[sign*.07,1.18,.116],[sign*.115,1.15,.092]],.013,beard,p);}
for(let j=0;j<5;j++){const x=(j-2)*.024;line([[x,1.01,.14],[x*.7,.87,.23],[x*.5,.68,.25]],.014,beard,p);}
lathe([[.15,0],[.17,.06],[.155,.18],[.10,.21]],gold,0,1.27,0,p);
if(type==='mo'){box(.4,.03,.26,gold,0,1.49,0,p);for(let j=0;j<7;j++){const x=(j-3)*.049;rod([x,1.49,.13],[x,1.28,.15],.004,gold,p);ell(.01,.011,.009,ivory,x,1.27,.15,p);}}
else {for(let j=0;j<7;j++){const a=j/6*Math.PI,xx=Math.cos(a)*.18;ell(.035,.041,.025,j%2?red:green,xx,1.45+Math.sin(a)*.14,.03,p);}for(const sign of [-1,1])line([[sign*.13,1.39,0],[sign*.3,1.62,-.08],[sign*.36,1.55,-.12]],.012,gold,p);}
// Circular embroidered medallion is decorative, not an invented historic inscription.
const ring=mesh(new T.TorusGeometry(.105,.008,5,24),gold,0,.6,.305,p);ell(.04,.045,.01,gold,0,.6,.315,p);
return p;}
deity(-.68,'mo');deity(.68,'man');
// Smaller figures visible in the reference are deliberately not assigned identities.
for(const [x,t] of [[-1.13,'mo'],[-.42,'mo'],[.42,'man'],[1.13,'man']])deity(x,t,.28,-6.04,1.88);
// Side shrine frames; the identities are documented but their sculpture has not been verified.
for(const x of [-3.6,3.6]){box(1.82,1.55,.1,wood,x,2.62,-6.89);trim(1.85,1.62,x,2.62,-6.78);for(const xx of [-.82,.82])box(.1,1.65,.18,red,x+xx,2.62,-6.48);box(1.95,.15,.32,wood,x,3.44,-6.62);}
// Offerings and brass lamp forms follow reference categories; arrangement is interpretive.
for(const x of [-1.1,1.1]){lathe([[.16,0],[.18,.04],[.06,.1],[.05,.35],[.1,.41],[.1,.44]],gold,x,1.47,-4.8);ell(.032,.072,.032,new T.MeshStandardMaterial({color:0xffdda0,emissive:0xffb54c,emissiveIntensity:1.5}),x,1.98,-4.8);}
for(const x of [-.62,.62]){lathe([[.19,0],[.12,.07],[.2,.1]],red,x,1.46,-4.66);const orange=material(0xbe711e);for(const dx of [-.085,.085])ell(.085,.085,.085,orange,x+dx,1.64,-4.66);ell(.085,.085,.085,orange,x,1.77,-4.66);}
for(const x of [-1.3,1.3]){lathe([[.11,0],[.17,.07],[.2,.28],[.10,.4],[.085,.52],[.12,.55]],ceramic,x,1.87,-6.05);for(let j=0;j<4;j++){rod([x,2.37,-6.05],[x+(j-1.5)*.11,2.85+(j%2)*.15,-6.07],.008,green);ell(.075,.15,.014,green,x+(j-1.5)*.07,2.63,-6.04);ell(.09,.045,.035,ivory,x+(j-1.5)*.11,2.85+(j%2)*.15,-6.07);}for(let j=0;j<3;j++){const o=mesh(new T.TorusGeometry(.17,.009,5,24),blue,x,1.99+j*.055,-6.05);o.rotation.x=Math.PI/2;}}
// Bell and drum occupy the right front side indicated in TWGH's plan; shapes are provisional.
for(const z of [3.15,4.25]){for(const x of [3.62,4.58])box(.09,1.6,.12,wood,x,.85,z);box(1.06,.12,.18,wood,4.1,1.65,z);}
lathe([[.32,0],[.31,.05],[.27,.17],[.22,.5],[.13,.6],[.08,.63]],gold,4.1,.9,3.15);
const drum=lathe([[.29,0],[.35,.1],[.36,.27],[.35,.44],[.29,.54]],red,4.37,1.07,4.25);drum.rotation.z=Math.PI/2;
for(const xx of [3.83,4.37]){const skinhead=mesh(new T.CylinderGeometry(.3,.3,.018,32),ivory,xx,1.07,4.25);skinhead.rotation.z=Math.PI/2;}
// Entrance plaque: verified text, ornamental border is a simplified authored interpretation.
const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#241915';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#9e793e';ctx.lineWidth=10;ctx.strokeRect(16,16,992,224);ctx.fillStyle='#c4a368';ctx.font='120px "Songti TC",serif';ctx.textAlign='center';ctx.textBaseline='middle';['佑','普','威','神'].forEach((c,i)=>ctx.fillText(c,160+i*235,136));const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(2.5,.63),new T.MeshStandardMaterial({map:tex,roughness:.75}),0,3.18,5.99);
// All detail meshes are static. Merge per material to keep tablet draw calls modest.
group.updateMatrixWorld(true);const buckets=new Map();group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});buckets.get(key).geometries.push(g.index?g.toNonIndexed():g);});group.clear();for(const {material,geometries} of buckets.values()){const combined=mergeGeometries(geometries,false);if(combined){const m=new T.Mesh(combined,material);m.castShadow=m.receiveShadow=true;group.add(m);}geometries.forEach(g=>g.dispose());}
return group;
}

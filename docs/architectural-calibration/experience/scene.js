import {addDetails} from './details.js';
import {makeMaterials,roofTiles} from '../materials/surfaces.js?v=3';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import * as THREE from 'three';
import {mapUV,makeAtmosphere} from '../materials/materials.js?v=3';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
// Dimensionless schematic units, NOT metres. Plan trace uses the 617 × 896 TWGH sketch.
export const scene=new THREE.Scene();scene.background=new THREE.Color('#15110e');
const host=document.querySelector('#canvas');let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){document.querySelector('#error').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;host.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,1,.1,100);const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.maxPolarAngle=Math.PI*.49;orbit.minDistance=7;orbit.maxDistance=42;
const ambient=new THREE.HemisphereLight(0xecdcc8,0x292019,.30);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xffe8c7,2.5);sun.position.set(-7,16,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=3;Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12});sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;scene.add(sun);
const entranceFill=new THREE.PointLight(0xffdfb5,6,9,2);entranceFill.position.set(-.6,2.8,4.8);scene.add(entranceFill);
const warmLights=[];for(const [x,y,z,power] of [[0,3.65,-5.55,7],[-3,2.5,-5.7,5],[3,2.5,-5.7,5],[0,3.6,.7,2.8]]){const light=new THREE.PointLight(0xffc894,power,9,2);light.position.set(x,y,z);scene.add(light);warmLights.push(light);}
const pmrem=new THREE.PMREMGenerator(renderer);const envRoom=new RoomEnvironment();const envTarget=pmrem.fromScene(envRoom,.04);scene.environment=envTarget.texture;scene.environmentIntensity=.10;envRoom.dispose();pmrem.dispose();
export const mat=makeMaterials();for(const material of Object.values(mat))material.envMap=envTarget.texture;mat.roof.side=THREE.FrontSide;mat.roof.shadowSide=THREE.DoubleSide;const soffit=mat.altar.clone();soffit.side=THREE.BackSide;
export const building=new THREE.Group(),roofs=new THREE.Group(),upperWalls=new THREE.Group();scene.add(building,roofs,upperWalls);
function mesh(geo,material,x,y,z,parent=building){const kind=Object.keys(mat).find(k=>mat[k]===material);if(kind)mapUV(geo,kind);const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(material===mat.roof){const inner=new THREE.Mesh(geo,soffit);inner.receiveShadow=true;m.add(inner);}return m;}
function box(w,h,d,x,y,z,m=mat.wall,parent=building){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.025,w/8,h/8,d/8)),m,x,y,z,parent);}
function cylinder(rt,rb,h,x,y,z,m=mat.stone){return mesh(new THREE.CylinderGeometry(rt,rb,h,32),m,x,y,z);}
// South/front at positive Z. The unscaled sketch is used for relationships, not a surveyed footprint.
box(11,.28,16,0,-.28,0,mat.stone);box(10,.2,14.5,0,-.05,0,mat.floor);
// Raised rear hall and three schematic risers: source confirms 'several', NOT their count or height.
box(10,.55,6.1,0,.25,-4.2,mat.floor);
for(let i=0;i<3;i++) box(3.9,.18,1.2-i*.3,0,.09+i*.18,-.65-i*.15,mat.stone);
for(const x of [-3.9,3.9])for(let i=0;i<3;i++)box(2,.18,1.05-i*.25,x,.09+i*.18,-.3-i*.12,mat.stone);
for(const x of [-4.9,4.9]){box(.2,.95,14.5,x,.475,0);box(.2,2.9,14.5,x,2.4,0,mat.wall,upperWalls);}
box(10,.95,.2,0,.475,-7.15);box(10,3,.2,0,2.45,-7.15,mat.wall,upperWalls);
// Front three bays: closed side bays with a central doorway.
for(const x of [-3.25,3.25]){box(3.3,.95,.25,x,.475,5.85);box(3.3,2.5,.25,x,2.2,5.85,mat.wall,upperWalls);}
box(3.2,.65,.25,0,3.2,5.85,mat.wall,upperWalls);
for(const x of [-1.65,1.65])box(.22,3.1,.35,x,1.55,5.8,mat.stone);
// Front screen-door zone shown as an open frame, not a conjectural decorated door.
for(const x of [-.9,.9])box(.12,2.5,.12,x,1.25,2.55,mat.altar);
box(1.92,.16,.15,0,2.45,2.55,mat.altar);
// Four courtyard granite columns, matched to the schematic courtyard corners.
for(const x of [-2.2,2.2])for(const z of [-1.15,2.3]){cylinder(.15,.18,3.8,x,1.9,z);box(.55,.17,.55,x,.1,z,mat.stone);}
for(const x of [-2.2,2.2])box(.2,.25,3.75,x,3.78,.575,mat.altar);
for(const z of [-1.15,2.3])box(4.6,.25,.2,0,3.78,z,mat.altar);
// Incense burners are schematic volumes, not replicas of the artefacts.
for(const z of [.1,1.4]){cylinder(.48,.32,.7,0,.65,z,mat.bronze);const rim=mesh(new THREE.TorusGeometry(.48,.055,10,40),mat.bronze,0,1.01,z);rim.rotation.x=Math.PI/2;for(const x of [-.28,.28])box(.12,.3,.12,x,.18,z,mat.altar);}
for(const x of [-1.92,1.92])cylinder(.37,.3,.65,x,.85,-1.45,mat.bronze);
// Ash and short incense sticks refine the existing burner surfaces without moving them.
const ashMat=mat.stone.clone();ashMat.color.set(0x746b59);ashMat.roughness=1;const stickMat=new THREE.MeshStandardMaterial({color:0x644332,roughness:1});
for(const z of [.1,1.4]){mesh(new THREE.CylinderGeometry(.42,.42,.008,48),ashMat,0,1.012,z);for(let i=0;i<7;i++){const a=i*2.4,r=.09+(i%3)*.04,h=.19+(i%3)*.035;mesh(new THREE.CylinderGeometry(.004,.005,h,5),stickMat,Math.cos(a)*r,1.02+h/2,z+Math.sin(a)*r);}}
// Rear altar group: centre Man/Mo; flanking shrines shown as blank volumes.
for(const [x,w] of [[-3.6,2],[0,3.2],[3.6,2]]){box(w,1.2,1,x,1.15,-6.5,mat.altar);box(w,.13,1.15,x,1.81,-6.5,mat.stone);}
for(const z of [-4.8,-3])box(3.1,.9,.65,0,1,-Math.abs(z),mat.altar);
// Paired granite drum platforms at the entrance, abstracted without decorative carvings.
for(const x of [-1.65,1.65]){box(.65,.35,.85,x,.18,6.35,mat.stone);const drum=cylinder(.33,.33,.25,x,.65,6.35);drum.rotation.z=Math.PI/2;}
function surface(vertices,indices,parent=roofs){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));for(let i=0;i<indices.length;i+=3){const a=new THREE.Vector3(...vertices[indices[i]]),b=new THREE.Vector3(...vertices[indices[i+1]]),c=new THREE.Vector3(...vertices[indices[i+2]]);if(b.sub(a).cross(c.sub(a)).y<0)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];}g.setIndex(indices);g.computeVertexNormals();return mesh(g,mat.roof,0,0,0,parent);}
function gable(w,d,z,eave,rise){surface([[-w/2,eave,z-d/2],[w/2,eave,z-d/2],[-w/2,eave+rise,z],[w/2,eave+rise,z],[-w/2,eave,z+d/2],[w/2,eave,z+d/2]],[0,2,1,1,2,3,2,4,3,3,4,5]);box(w,.13,.15,0,eave+rise,z,mat.roof,roofs);roofTiles(roofs,mat.roof,w,d,z,eave,rise);}
gable(10.45,3.8,4.3,3.6,1.65);gable(10.45,6.2,-4.2,4.2,1.9);
// Central double-eaved hip-and-gable canopy: simplified roof surfaces, curvature provisional.
function hip(w,d,z,y,h,ridge){surface([[-w/2,y,z-d/2],[w/2,y,z-d/2],[w/2,y,z+d/2],[-w/2,y,z+d/2],[-ridge/2,y+h,z],[ridge/2,y+h,z]],[0,4,1,1,4,5,1,5,2,2,5,3,3,5,4,3,4,0]);}
hip(5.35,4.1,.575,3.95,.85,3.25);
// Upper hip-and-gable roof is one continuous roof surface, not a third eave.
{const z=.575,y=4.9;surface([[-1.95,y,z-1.3],[1.95,y,z-1.3],[1.95,y,z+1.3],[-1.95,y,z+1.3],[-1.25,y+.45,z-.72],[1.25,y+.45,z-.72],[1.25,y+.45,z+.72],[-1.25,y+.45,z+.72],[-1.25,y+1,z],[1.25,y+1,z]],[0,4,1,1,4,5,3,2,7,2,6,7,0,3,4,3,7,4,1,5,2,2,5,6,4,8,5,5,8,9,7,6,8,6,9,8,4,7,8,5,9,6]);}
// Rolled roofs on flanking chambers: simple curved barrel surfaces.
for(const x of [-3.7,3.7]){const verts=[],idx=[];for(let j=0;j<=16;j++){const t=j/16*Math.PI;for(const z of [-1.45,2.7])verts.push([x+1.25*Math.cos(t),3.5+.55*Math.sin(t),z]);if(j<16){let a=j*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}surface(verts,idx);}
// A neutral plinth, not a reconstruction of the street or surrounding buildings.
export const ground=box(200,.15,200,0,-.55,0,new THREE.MeshStandardMaterial({color:0x241c15,roughness:1}),scene);
export const atmosphere=makeAtmosphere(scene);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const ao=new SSAOPass(scene,camera,640,640,8);ao.kernelRadius=.35;ao.minDistance=.002;ao.maxDistance=.10;composer.addPass(ao);composer.addPass(new OutputPass());const fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);

export const detailsGroup=addDetails(scene,envTarget.texture);
const presets={courtesy:{p:[1.1,2.5,3.3],t:[.35,1.75,-2.7],fov:65},courtyard:{p:[.7,2.5,4.9],t:[0,2.1,-1.7],fov:65},waiting:{p:[2.65,2.1,-.1],t:[0,2.3,-5.7],fov:66},entry:{p:[0,2.2,8.7],t:[0,2.5,4.3],fov:57},threshold:{p:[0,3.45,8.5],t:[0,.15,5.75],fov:54},smoke:{p:[1.1,1.9,3.65],t:[0,3.2,.6],fov:64},deities:{p:[.05,2.6,-3.5],t:[0,2.8,-6.4],fov:61},bell:{p:[1.5,1.9,3.8],t:[4.1,1.25,3.6],fov:55},plaque:{p:[0,2.7,8.3],t:[0,3.1,5.85],fov:50},overview:{p:[16,18,24],t:[0,1,0],fov:38},orientation:{p:[9.5,9.5,14],t:[0,2,0],fov:46},compound:{p:[28,19,31],t:[5,2,0],fov:44},compoundFront:{p:[19,13,32],t:[5,2,0],fov:44},compoundCraft:{p:[16,14,26],t:[4,3,1],fov:45},compoundStreet:{p:[21,11,31],t:[6,2,2],fov:46},compoundRoof:{p:[23,17,29],t:[5,3,0],fov:45}};
// The sill and footprints are a temporary teaching overlay, not surveyed fabric.
const thresholdGuide=new THREE.Group();scene.add(thresholdGuide);
const guideStone=new THREE.Mesh(new RoundedBoxGeometry(2.75,.09,.2,2,.025),new THREE.MeshStandardMaterial({color:0xd3b877,emissive:0x72531a,emissiveIntensity:.18,roughness:.75}));guideStone.position.set(0,.105,5.88);thresholdGuide.add(guideStone);
const footprintMat=new THREE.MeshBasicMaterial({color:0xe9d39c,transparent:true,opacity:.9,depthWrite:false});
for(const x of [-.43,.43]){const foot=new THREE.Group();for(const [w,h,z] of [[.22,.42,0],[.17,.14,-.24]]){const part=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),footprintMat);part.scale.set(w,.012,h);part.position.z=z;foot.add(part);}foot.position.set(x,.095,6.45);thresholdGuide.add(foot);}
export function showThreshold(on){thresholdGuide.visible=on;}
showThreshold(false);
// Anonymous participants and a waiting marker are teaching overlays, not historical fixtures.
const participants=new THREE.Group();scene.add(participants);
const visitor=new THREE.Group();visitor.position.set(.25,.54,-2.5);participants.add(visitor);
const visitorMat=new THREE.MeshStandardMaterial({color:0x8a9388,roughness:1});
const torso=new THREE.Mesh(new THREE.CylinderGeometry(.18,.23,.72,16),visitorMat);torso.position.y=.95;visitor.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),visitorMat);head.position.y=1.47;visitor.add(head);
for(const x of [-.11,.11]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.065,.07,.59,10),visitorMat);leg.position.set(x,.35,0);visitor.add(leg);}
const waitingSpot=new THREE.Mesh(new THREE.RingGeometry(.30,.34,40),new THREE.MeshBasicMaterial({color:0xc4ad79,transparent:true,opacity:.7,side:THREE.DoubleSide}));waitingSpot.rotation.x=-Math.PI/2;waitingSpot.position.set(2.65,.067,-.2);scene.add(waitingSpot);
export function setSituation(state){participants.visible=state==='visitor'||state==='wait'||state==='pray';waitingSpot.visible=state==='visitor'||state==='wait';torso.rotation.x=state==='pray'?-.15:0;}
setSituation('none');
let sceneActive=true;
export function setSceneActive(active){sceneActive=active;}
let moving=null,ready=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;orbit.enabled=false;orbit.enableDamping=false;
export function look(name,animate=true){const v=presets[name];moving={start:performance.now(),duration:animate&&!reduced?1600:0,p:camera.position.clone(),t:orbit.target.clone(),toP:new THREE.Vector3(...v.p),toT:new THREE.Vector3(...v.t),fromFov:camera.fov,fov:v.fov};}
export function explore(on){orbit.enabled=on;orbit.minDistance=.7;orbit.maxDistance=38;}
export function project(point){const p=new THREE.Vector3(...point).project(camera);return {x:(p.x+1)*host.clientWidth/2,y:(1-p.y)*host.clientHeight/2,visible:p.z<1&&p.z>-1&&Math.abs(p.x)<.92&&Math.abs(p.y)<.88,settled:!moving};}
let frameCallback=()=>{};export function onFrame(fn){frameCallback=fn;}
// Frame the existing camera view beside the dialogue while the scene fills the screen.
const guide=document.querySelector('.guide');
function frameScene(){
  const {width,height}=host.getBoundingClientRect();
  if(!width||!height)return;
  let x,y,w,h;
  if(width<=850&&width<height*1.2){
    const dialogueTop=guide.getBoundingClientRect().top;
    x=width*.04;y=Math.min(112,height*.15);w=width*.92;h=Math.max(height*.22,dialogueTop-y-14);
  }else{x=width*.41;y=height*.10;w=width*.56;h=height*.77;}
  camera.setViewOffset(w,h,-x,-y,width,height);
  camera.updateProjectionMatrix();
}
new ResizeObserver(()=>{const{width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);composer.setSize(width,height);ao.setSize(Math.round(width*.75),Math.round(height*.75));fxaa.material.uniforms.resolution.value.set(1/(width*renderer.getPixelRatio()),1/(height*renderer.getPixelRatio()));frameScene();}).observe(host);
new ResizeObserver(frameScene).observe(guide);
look('entry',false);
renderer.setAnimationLoop(time=>{if(!sceneActive)return;if(moving){const t=moving.duration?Math.min(1,(performance.now()-moving.start)/moving.duration):1,e=t*t*(3-2*t);camera.position.lerpVectors(moving.p,moving.toP,e);orbit.target.lerpVectors(moving.t,moving.toT,e);camera.fov=moving.fromFov+(moving.fov-moving.fromFov)*e;camera.updateProjectionMatrix();if(t===1)moving=null;}orbit.update();atmosphere.update(time);composer.render();frameCallback();if(!ready){ready=true;document.documentElement.dataset.ready='true';document.querySelector('#loading').hidden=true;window.dispatchEvent(new Event('temple-ready'));}});

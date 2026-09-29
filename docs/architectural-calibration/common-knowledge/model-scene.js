import * as THREE from 'three';
import {scene,building,roofs,upperWalls,ground,atmosphere,detailsGroup,mat,look,explore} from '../experience/scene.js';
import {mapUV} from '../materials/materials.js?v=3';

// This page reuses the checked Man Mo Temple model. The two neighbouring volumes
// indicate the compound relationship only; they are not measured reconstructions.
scene.background = new THREE.Color('#e7e6e0');
ground.material.color.set('#d9d6cb');
ground.material.roughness = 1;
atmosphere.group.visible = false;

const companion = new THREE.Group();
const massing = new THREE.Group();
const sketch = new THREE.Group();
scene.add(companion,massing,sketch);

const clay = new THREE.MeshStandardMaterial({color:0xe4e2d9,roughness:1});
const clayRoof = new THREE.MeshStandardMaterial({color:0xd7d8d2,roughness:1,side:THREE.DoubleSide});
const ink = new THREE.LineBasicMaterial({color:0x69726b,transparent:true,opacity:.74});

function addBox(parent,w,h,d,x,y,z,material){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function roof(parent,w,d,x,y,z,rise,material){
  const vertices=[[-w/2,0,-d/2],[w/2,0,-d/2],[-w/2,rise,0],[w/2,rise,0],[-w/2,0,d/2],[w/2,0,d/2]];
  const positions=[];for(const [a,b,c] of [[0,2,1],[1,2,3],[2,4,3],[3,4,5]])for(const index of [a,b,c])positions.push(...vertices[index]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  if(material===mat.roof)mapUV(geometry,'roof');
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  return mesh;
}
function sketchEdges(mesh){const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),ink);edges.position.copy(mesh.position);edges.rotation.copy(mesh.rotation);sketch.add(edges);}
function volume({x,w,d,frontY,rearY,back=false}){
  const centerZ=5.85-d/2;
  const block=addBox(massing,w,frontY,d,x,frontY/2,centerZ,clay);
  const front=roof(massing,w+.4,Math.min(4,d),x,frontY,5.85-Math.min(4,d)/2,1.18,clayRoof);
  sketchEdges(block);sketchEdges(front);
  if(back){const rear=roof(massing,w+.4,Math.min(4.5,d/2),x,rearY,5.85-d+2.2,1.3,clayRoof);sketchEdges(rear);}
}

volume({x:0,w:10,d:14.5,frontY:3.9,rearY:4.45,back:true});
volume({x:8.7,w:4.7,d:10.5,frontY:3.5,rearY:4.05,back:true});
volume({x:13.4,w:3.05,d:7.6,frontY:3.3,rearY:3.3,back:false});

function neighbour({x,w,d,h,roofRise,back}){
  const centerZ=5.85-d/2;
  addBox(companion,w,.25,d,x,-.06,centerZ,mat.stone);
  addBox(companion,w,h,d,x,h/2,centerZ,mat.wall);
  const front=5.85;
  addBox(companion,w-.7,h-.35,.15,x,(h-.35)/2,front+.09,mat.wall);
  addBox(companion,w*.40,h*.70,.08,x,h*.35,front+.19,mat.altar);
  for(const side of [-1,1]){
    addBox(companion,.12,h*.76,.23,x+side*w*.22,h*.38,front+.25,mat.altar);
    addBox(companion,.16,h*.87,.20,x+side*(w/2-.18),h*.44,front+.26,mat.stone);
  }
  addBox(companion,w*.78,.11,.25,x,h*.8,front+.28,mat.altar);
  roof(companion,w+.45,Math.min(d,4.4),x,h,front-Math.min(d,4.4)/2,roofRise,mat.roof);
  if(back)roof(companion,w+.35,4.2,x,h+.5,5.85-d+2.1,roofRise+.15,mat.roof);
  addBox(companion,w+.6,.08,.16,x,h+roofRise,front-Math.min(d,4.4)/2,mat.bronze);
}

neighbour({x:8.7,w:4.7,d:10.5,h:3.5,roofRise:1.2,back:true});
neighbour({x:13.4,w:3.05,d:7.6,h:3.3,roofRise:1.05,back:false});

// Two narrow passages separate the three building masses. The paving is a
// location cue, not a reconstruction of the present street surface.
for(const x of [5.82,11.5])addBox(companion,.46,.02,11,x,-.16,.35,mat.stone);

const modelGroups=[building,roofs,upperWalls,companion];
export function setModelState(stage,clue,finished){
  const outline=stage<0;
  const clayMode=stage===0&&clue!==1&&!finished;
  sketch.visible=outline;
  massing.visible=clayMode;
  for(const group of modelGroups)group.visible=!(outline||clayMode);
  detailsGroup.visible=stage>=1 || finished;
  atmosphere.group.visible=stage===1;
  if(outline){look('compound',false);explore(false);}
  else if(stage===0){look(clue===1?'compoundCraft':'compound');explore(true);}
  else if(stage===1){look('courtesy');explore(false);}
  else if(stage===2){look('compoundStreet');explore(true);}
  else if(stage===3){look('compoundRoof');explore(true);}
  else {look('compound');explore(true);}
}

setModelState(-1,-1,false);

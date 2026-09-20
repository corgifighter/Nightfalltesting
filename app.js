import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/loaders/GLTFLoader.js';
import {EffectComposer} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/UnrealBloomPass.js';
import {SSAOPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/SSAOPass.js';
import {OutputPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/OutputPass.js';
import {FXAAPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/FXAAPass.js';

const root=document.querySelector('#scene');
const captureMode=new URLSearchParams(location.search).get('capture')==='1';
const toast=document.querySelector('#toast');
const cinematic=document.querySelector('#cinematic');
const captureButton=document.querySelector('#capture');
let captureRequested=false;
function captureRealFrame(){
  const url=new URL('./capture.html',location.href);
  url.searchParams.set('capture','1');
  const win=window.open(url.href,'_blank','noopener');
  if(!win) location.href=url.href;
}
const autoCapture=new URLSearchParams(location.search).get('capture')==='1';
let autoCaptureArmed=autoCapture;
let captureReadyAt=0;
window.__HEARTHMERE_READY=false;
if(captureMode) document.body.dataset.captureMode='true';
const boot=document.querySelector('#boot');
const bootProgress=document.querySelector('#boot-progress');
const bootStatus=document.querySelector('#boot-status');
const bootSet=(n,msg)=>{bootProgress.style.width=Math.round(n*100)+'%';bootStatus.textContent=msg};
bootSet(.03,'Waking the crossing…');

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9aaea5);
scene.fog=new THREE.FogExp2(0x82958e,.00172);

const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.08,1800);
camera.position.set(27,18,25);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:captureMode});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));
renderer.info.autoReset=true;
const diagnosticsMode=new URLSearchParams(location.search).get('diagnostics')==='1';
const gl=renderer.getContext();
const rendererDiagnostics={
  threeRevision:THREE.REVISION,
  webglVersion:String(gl.getParameter(gl.VERSION)||''),
  shadingLanguage:String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION)||''),
  vendor:String(gl.getParameter(gl.VENDOR)||''),
  renderer:String(gl.getParameter(gl.RENDERER)||''),
  maxTextureSize:renderer.capabilities.maxTextureSize,
  maxTextures:renderer.capabilities.maxTextures,
  maxAttributes:renderer.capabilities.maxAttributes,
  maxVaryings:renderer.capabilities.maxVaryings,
  maxSamples:renderer.capabilities.maxSamples,
  precision:renderer.capabilities.precision,
  maxAnisotropy:renderer.capabilities.getMaxAnisotropy(),
  pixelRatio:renderer.getPixelRatio(),
  drawingBuffer:[renderer.domElement.width,renderer.domElement.height]
};
window.__HEARTHMERE_RENDERER_DIAGNOSTICS=rendererDiagnostics;
if(diagnosticsMode) console.table(rendererDiagnostics);
renderer.setSize(innerWidth,innerHeight);
const composer=new EffectComposer(renderer);
// Keep the post-processing buffers at the exact same capped device-pixel ratio as the renderer.
// EffectComposer owns its own render targets, so this is synchronized explicitly rather than
// relying on the constructor's one-time snapshot.
composer.setPixelRatio(renderer.getPixelRatio());
const renderPass=new RenderPass(scene,camera);
composer.addPass(renderPass);
// Depth-aware occlusion must precede bloom so bloom is applied to the final shaded image,
// rather than having the occlusion pass darken already-bloomed pixels.
const bloomPass=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.10,.42,.86);
// Stage 1 image-quality pass: restrained screen-space occlusion restores contact depth
// between architecture, props, terrain, and the character without changing world layout.
const ssaoPass=new SSAOPass(scene,camera,innerWidth,innerHeight);
ssaoPass.kernelRadius=10;
ssaoPass.minDistance=.0012;
ssaoPass.maxDistance=.14;
ssaoPass.output=SSAOPass.OUTPUT.Default;
composer.addPass(ssaoPass);
// SSAO is deliberately evaluated below the beauty-buffer resolution. Its output is
// composited back into the full-resolution chain, preserving the important contact
// shading while avoiding a second full-resolution depth/normal/AO workload.
const quality={
  pixelRatioCap:1.55,
  pixelRatioMin:1.00,
  ssaoScale:.75,
  level:0,
  frameCount:0,
  sampleStarted:performance.now()
};
function resizeSSAO(){
  const ratio=renderer.getPixelRatio();
  ssaoPass.setSize(
    Math.max(1,Math.floor(innerWidth*ratio*quality.ssaoScale)),
    Math.max(1,Math.floor(innerHeight*ratio*quality.ssaoScale))
  );
}
resizeSSAO();
composer.addPass(bloomPass);
const fxaaPass=new FXAAPass();
composer.addPass(fxaaPass);
// EffectComposer renders into an intermediate color space. OutputPass is the
// authoritative final presentation stage: it applies the renderer's configured
// tone mapping and output color-space conversion to the composited image.
const outputPass=new OutputPass();
composer.addPass(outputPass);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.98;
renderer.setClearColor(0x9aaea5,1);
// r155+ uses physically-correct lighting by default; the legacy/physicallyCorrectLights
// toggles are obsolete API surface and should not be carried in a r181 renderer.
renderer.sortObjects=true;
renderer.domElement.style.touchAction='none';
renderer.domElement.addEventListener('webglcontextlost',event=>{
  event.preventDefault();
  window.__HEARTHMERE_CONTEXT_LOST=true;
  if(bootStatus) bootStatus.textContent='Graphics context lost — waiting for recovery…';
});
renderer.domElement.addEventListener('webglcontextrestored',()=>{
  window.__HEARTHMERE_CONTEXT_LOST=false;
  location.reload();
});
root.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,0,0);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.06;
controls.minDistance=8;controls.maxDistance=58;controls.minPolarAngle=.38;controls.maxPolarAngle=1.20;controls.rotateSpeed=.24;

const hemi=new THREE.HemisphereLight(0xeaf5f1,0x30271f,1.12);scene.add(hemi);
const WORLD_BOUNDS={minX:-52,maxX:55,minZ:-58,maxZ:64};
const sun=new THREE.DirectionalLight(0xffd8ad,3.35);sun.position.set(-58,86,42);sun.castShadow=true;
// Size the orthographic shadow volume from the actual playable footprint rather than
// an arbitrary square. The diagonal is used because the shadow camera is rotated by
// the light direction, so axis-aligned world extents are not sufficient coverage.
const shadowHalfDiagonal=Math.hypot(WORLD_BOUNDS.maxX-WORLD_BOUNDS.minX,WORLD_BOUNDS.maxZ-WORLD_BOUNDS.minZ)*.5+10;
sun.shadow.mapSize.set(3072,3072);
sun.shadow.camera.left=-shadowHalfDiagonal;
sun.shadow.camera.right=shadowHalfDiagonal;
sun.shadow.camera.top=shadowHalfDiagonal;
sun.shadow.camera.bottom=-shadowHalfDiagonal;
sun.shadow.camera.near=1;
sun.shadow.camera.far=220;
sun.shadow.bias=-.00008;
sun.shadow.normalBias=.018;
sun.shadow.camera.updateProjectionMatrix();
scene.add(sun);
function setShadowMapSize(size){
  if(sun.shadow.mapSize.x===size && sun.shadow.mapSize.y===size)return;
  sun.shadow.mapSize.set(size,size);
  if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
  sun.shadow.needsUpdate=true;
}
const fill=new THREE.DirectionalLight(0x89afc2,.82);fill.position.set(45,34,-55);scene.add(fill);
const moon=new THREE.DirectionalLight(0x6682aa,.14);moon.position.set(30,50,-45);scene.add(moon);

const sky=new THREE.Mesh(new THREE.SphereGeometry(520,32,18),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x213e49)},mid:{value:new THREE.Color(0x78908c)},horizon:{value:new THREE.Color(0xcab98d)},sun:{value:new THREE.Color(0xffd39a)}},vertexShader:'varying vec3 vN;void main(){vN=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 top;uniform vec3 mid;uniform vec3 horizon;uniform vec3 sun;varying vec3 vN;void main(){float h=max(vN.y,0.0);vec3 c=mix(horizon,mid,smoothstep(0.0,.35,h));c=mix(c,top,smoothstep(.35,.92,h));float s=pow(max(dot(vN,normalize(vec3(-.38,.72,.45))),0.0),96.0);c+=sun*s*.72;gl_FragColor=vec4(c,1.0);}'}));
scene.add(sky);

// WORLD VISUAL OVERHAUL — environment reflections, distant terrain, and sky depth.
(function buildWorldEnvironment(){
  const c=document.createElement('canvas');c.width=768;c.height=384;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,384);
  g.addColorStop(0,'#16384a');g.addColorStop(.38,'#527b82');g.addColorStop(.63,'#b5b9a3');g.addColorStop(.78,'#e7c98e');g.addColorStop(1,'#6c7770');
  x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
  const sg=x.createRadialGradient(575,245,4,575,245,115);
  sg.addColorStop(0,'rgba(255,244,194,1)');sg.addColorStop(.16,'rgba(255,211,143,.72)');sg.addColorStop(1,'rgba(255,194,120,0)');
  x.fillStyle=sg;x.fillRect(450,120,250,250);
  const src=new THREE.CanvasTexture(c);src.colorSpace=THREE.SRGBColorSpace;src.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(src).texture;scene.environmentIntensity=.44;
  src.dispose();pmrem.dispose();
})();

function addMountainRidge(z,base,height,width,color,opacity=1){
  const geo=new THREE.BufferGeometry(),verts=[],indices=[],segments=18;
  for(let i=0;i<=segments;i++){
    const px=-width/2+(i/segments)*width;
    const peak=.72+.22*Math.sin(i*1.71)+.18*Math.sin(i*.47)+.12*Math.cos(i*.93);
    const py=base+height*Math.max(.18,peak);
    verts.push(px,base,0,px,py,0);
    if(i<segments){const a=i*2,b=a+1,c=a+2,d=a+3;indices.push(a,c,b,c,d,b);}
  }
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({color,roughness:1,metalness:0,transparent:opacity<1,opacity,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geo,m);scene.add(mesh);return mesh;
}
addMountainRidge(-118,-3,31,250,0x4b5c5b,.48);
addMountainRidge(-102,-2,23,220,0x526966,.68);
addMountainRidge(-88,-1,16,190,0x415750,.82);

function cloudTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,256,128);x.fillStyle='rgba(255,255,255,.72)';
  for(let i=0;i<12;i++){const px=20+i*19+(i%2)*9,py=67+Math.sin(i*1.8)*13,r=22+(i%4)*8;x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const cloudMap=cloudTexture(),clouds=[];
for(let i=0;i<14;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudMap,color:0xffffff,transparent:true,opacity:.13+.035*(i%4),depthWrite:false,fog:false}));sp.position.set(-95+i*16,42+(i%5)*7,-78-(i%4)*22);sp.scale.set(18+(i%3)*9,6+(i%2)*3,1);sp.userData.speed=.12+(i%3)*.035;scene.add(sp);clouds.push(sp);}
const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(5.5,20,20),new THREE.MeshBasicMaterial({color:0xffe6b1,transparent:true,opacity:.86}));
sunDisc.position.set(-152,112,-180);sunDisc.renderOrder=-1;scene.add(sunDisc);

const ASSET_BASE='https://raw.githubusercontent.com/corgifighter/Test-screen/main/';
const loader=new THREE.TextureLoader();
const MAX_TEXTURE_ANISOTROPY=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
function configureTexture(t,repeat=[1,1],colorSpace=THREE.SRGBColorSpace){
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace=colorSpace;
  t.anisotropy=MAX_TEXTURE_ANISOTROPY;
  t.needsUpdate=true;
  return t;
}
function tex(path,repeat,colorSpace=THREE.SRGBColorSpace){
  const t=loader.load(ASSET_BASE+path.replace('./assets/',''));
  return configureTexture(t,repeat,colorSpace);
}
const grass=tex('./assets/grass.png',[27,27]);
const cobble=tex('./assets/cobble.png',[5.5,5.5]);
const roof=tex('./assets/roof.png',[1.7,1.7]);
const grassNormal=tex('./assets/grass_normal.jpg',[27,27]);
const cobbleNormal=tex('./assets/cobble_normal.jpg',[5.5,5.5]);
const roofNormal=tex('./assets/roof_normal.jpg',[1.7,1.7]);
grassNormal.colorSpace=THREE.NoColorSpace;cobbleNormal.colorSpace=THREE.NoColorSpace;roofNormal.colorSpace=THREE.NoColorSpace;
function makeMeadowTexture(){
 const c=document.createElement('canvas');c.width=768;c.height=768;const x=c.getContext('2d');
 x.fillStyle='#263d22';x.fillRect(0,0,c.width,c.height);
 const grad=x.createRadialGradient(380,350,20,380,350,500);grad.addColorStop(0,'#4f6630');grad.addColorStop(.55,'#3e5929');grad.addColorStop(1,'#243b22');x.fillStyle=grad;x.fillRect(0,0,768,768);
 let seed=918273;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<5200;i++){const px=rnd()*768,py=rnd()*768;const r=1+rnd()*7;const palette=['rgba(91,112,45,.18)','rgba(31,55,28,.18)','rgba(133,130,65,.10)','rgba(177,151,79,.06)'];x.fillStyle=palette[i%palette.length];x.beginPath();x.ellipse(px,py,r,r*(.35+rnd()*.9),rnd()*Math.PI,0,Math.PI*2);x.fill();}
 x.lineCap='round';
 for(let i=0;i<1900;i++){const px=rnd()*768,py=rnd()*768,h=2+rnd()*9;x.strokeStyle=i%4===0?'rgba(143,151,73,.34)':'rgba(91,125,55,.38)';x.lineWidth=.6+rnd()*1.2;x.beginPath();x.moveTo(px,py);x.lineTo(px+(rnd()-.5)*2,py-h);x.stroke();}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3.8,3.8);t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return t;
}
const meadowTexture=makeMeadowTexture();
configureTexture(meadowTexture,[3.8,3.8]);


// High-fidelity CC0 material library integration.
// Remote maps are optional enhancement layers; local/procedural materials remain the fallback.
const cc0Loader=new THREE.TextureLoader();cc0Loader.setCrossOrigin('anonymous');
const cc0LoadStats={pending:0,loaded:0,failed:0,failedUrls:[]};
window.__HEARTHMERE_CC0_LOAD_STATS=cc0LoadStats;
function loadCC0Map(url,repeat=1,colorSpace=THREE.SRGBColorSpace){
  cc0LoadStats.pending++;
  const map=cc0Loader.load(url,()=>{configureTexture(map,[repeat,repeat],colorSpace);cc0LoadStats.loaded++;cc0LoadStats.pending--;},undefined,()=>{cc0LoadStats.failed++;cc0LoadStats.failedUrls.push(url);cc0LoadStats.pending--;});
  configureTexture(map,[repeat,repeat],colorSpace);
  return map;
}
const CC0={
  meadow:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/grass_ground/grass_ground_diff_2k.jpg',
  meadowNormal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/grass_ground/grass_ground_nor_gl_2k.jpg',
  wood:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/wood_planks/wood_planks_diff_2k.jpg',
  woodNormal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/wood_planks/wood_planks_nor_gl_2k.jpg',
  roof:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/roof_tiles/roof_tiles_diff_2k.jpg',
  roofNormal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/roof_tiles/roof_tiles_nor_gl_2k.jpg',
  stone:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/medieval_blocks_03/medieval_blocks_03_diff_2k.jpg',
  stoneNormal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/medieval_blocks_03/medieval_blocks_03_nor_gl_2k.jpg'
};
function applyCC0Materials(){
  const meadow=loadCC0Map(CC0.meadow,3.6),meadowN=loadCC0Map(CC0.meadowNormal,3.6,THREE.NoColorSpace);
  MAT.grass.map=meadow;MAT.grass.normalMap=meadowN;MAT.grass.needsUpdate=true;
  const wood=loadCC0Map(CC0.wood,1.35),woodN=loadCC0Map(CC0.woodNormal,1.35,THREE.NoColorSpace);
  [HD.timber,HD.timberLight].forEach(m=>{m.map=wood;m.normalMap=woodN;m.normalScale.set(.28,.28);m.needsUpdate=true;});
  const roof=loadCC0Map(CC0.roof,1.15),roofN=loadCC0Map(CC0.roofNormal,1.15,THREE.NoColorSpace);
  [HD.roof,HD.roofWarm].forEach(m=>{m.map=roof;m.normalMap=roofN;m.normalScale.set(.38,.38);m.needsUpdate=true;});
  const stone=loadCC0Map(CC0.stone,1.05),stoneN=loadCC0Map(CC0.stoneNormal,1.05,THREE.NoColorSpace);
  [HD.stone,HD.stoneDark].forEach(m=>{m.map=stone;m.normalMap=stoneN;m.normalScale.set(.42,.42);m.needsUpdate=true;});
}
const MAT={
 grass:new THREE.MeshStandardMaterial({map:meadowTexture,normalMap:grassNormal,normalScale:new THREE.Vector2(.48,.48),roughness:.96}),road:new THREE.MeshStandardMaterial({map:cobble,normalMap:cobbleNormal,normalScale:new THREE.Vector2(.55,.55),roughness:.94}),
 water:new THREE.MeshPhysicalMaterial({color:0x176270,roughness:.08,metalness:.04,transmission:.08,clearcoat:1,clearcoatRoughness:.10,transparent:true,opacity:.92}),
 rock:new THREE.MeshStandardMaterial({color:0x5e5a50,roughness:1}),
 foam:new THREE.MeshBasicMaterial({color:0xd6eee9,transparent:true,opacity:.23,depthWrite:false}),
 ember:new THREE.MeshBasicMaterial({color:0xff9a4b,transparent:true,opacity:.9,depthWrite:false})
};
// Terrain material pass: subtle macro variation keeps the meadow from reading as a tiled texture.
MAT.grass.onBeforeCompile=(shader)=>{
 shader.uniforms.uTime={value:0};
 shader.vertexShader='varying vec3 vWorldPos;\\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\n vWorldPos=(modelMatrix*vec4(transformed,1.0)).xyz;');
 shader.fragmentShader='varying vec3 vWorldPos;\\n'+shader.fragmentShader.replace('#include <map_fragment>',"#include <map_fragment>\\n float n1=sin(vWorldPos.x*.11)*sin(vWorldPos.z*.09);\\n float n2=sin(vWorldPos.x*.031+vWorldPos.z*.047)*.5;\\n float n3=sin(vWorldPos.x*.27-vWorldPos.z*.19)*.18;\\n float n=clamp((n1+n2+n3)*.5+.5,0.0,1.0);\\n vec3 meadowA=vec3(.16,.29,.14); vec3 meadowB=vec3(.30,.43,.19); vec3 meadowC=vec3(.42,.48,.24);\\n vec3 natural=mix(meadowA,meadowB,smoothstep(.18,.58,n)); natural=mix(natural,meadowC,smoothstep(.70,.96,n));\\n float fleck=fract(sin(dot(vWorldPos.xz,vec2(12.9898,78.233)))*43758.5453);\\n natural+=vec3(fleck*.025,fleck*.018,fleck*.008);\\n diffuseColor.rgb=mix(diffuseColor.rgb,natural,.34);");
 MAT.grass.userData.shader=shader;
};
MAT.water.onBeforeCompile=(shader)=>{
 shader.uniforms.uTime={value:0};
 shader.vertexShader='uniform float uTime;\n'+shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.y += sin(transformed.x*0.55 + uTime*1.7)*0.045 + cos(transformed.z*0.22 + uTime*1.15)*0.028;');
 MAT.water.userData.shader=shader;
};
function addMesh(g,m,pos=[0,0,0],rot=[0,0,0],cast=true){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.rotation.set(...rot);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
const worldLabels=[];
function label(text,pos,color='#efe6d2',scale=1){const c=document.createElement('canvas');c.width=640;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,640,128);x.font='700 31px Georgia';x.textAlign='center';x.fillStyle='rgba(5,9,8,.78)';x.roundRect(22,20,596,88,18);x.fill();x.fillStyle=color;x.fillText(text,320,76);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(6.8*scale,1.36*scale,1);s.position.set(...pos);s.userData.worldLabel=true;worldLabels.push(s);scene.add(s);return s}

// Ground: broad playable meadow with restrained sculpted undulation.
// MAJOR TERRAIN RECONSTRUCTION — macro landforms first, detail later.
// The settlement sits in a broad basin while the perimeter rises into rolling terrain.
function macroTerrainHeight(x,z){
  const settlement=Math.exp(-(x*x+z*z)/1850);
  const riverValley=Math.exp(-((x-31)*(x-31))/115);
  const southApproach=Math.exp(-((z+18)*(z+18))/900);
  const broad=(Math.sin(x*.030+z*.012)*1.75 + Math.cos(z*.034-x*.010)*1.35 + Math.sin((x-z)*.018)*1.05);
  const secondary=(Math.sin(x*.075)*.34 + Math.cos(z*.068)*.28);
  const relief=Math.max(.12,1.02-settlement*.88-riverValley*.72-southApproach*.30);
  return broad*relief + secondary*(.55+relief*.45);
}
const tg=new THREE.PlaneGeometry(230,230,160,160);const ta=tg.attributes.position;
for(let i=0;i<ta.count;i++){const x=ta.getX(i),z=ta.getY(i);ta.setZ(i,macroTerrainHeight(x,z))}
tg.rotateX(-Math.PI/2);tg.computeVertexNormals();addMesh(tg,MAT.grass,[0,0,0],undefined,false);

// Sculpted ground layers: soft meadow clearings and worn earth around the settlement.
function groundPatch(x,z,w,d,mat,rot=0){
 const g=new THREE.CircleGeometry(1,64);g.scale(w,d,1);
 const m=new THREE.Mesh(g,mat);m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,terrainHeight(x,z)+.035,z);m.receiveShadow=true;scene.add(m);return m;
}
const earthMat=new THREE.MeshStandardMaterial({color:0x765f43,roughness:1,transparent:true,opacity:.76});
const meadowMat=new THREE.MeshStandardMaterial({color:0x4e6631,roughness:.98,transparent:true,opacity:.34});
groundPatch(-13,-8,11,8,earthMat,-.12);groundPatch(-19,-1,8,6,meadowMat,.18);
groundPatch(-6,-18,12,5.5,earthMat,.06);groundPatch(2,-6,7,4,meadowMat,-.22);
groundPatch(-14,14,9,5,meadowMat,.15);groundPatch(17,-18,9,6,earthMat,.12);
groundPatch(-30,22,14,8,meadowMat,-.08);



// River with a shallow bank lip and moving highlights.
const river=addMesh(new THREE.PlaneGeometry(27,190,1,16),MAT.water,[31,.05,4],[-Math.PI/2,.02,.08],false);
const riverGlow=addMesh(new THREE.PlaneGeometry(26.2,188,1,1),new THREE.MeshBasicMaterial({color:0x2a8990,transparent:true,opacity:.10,depthWrite:false}),[31,.08,4],[-Math.PI/2,.02,.08],false);
const bankMat=new THREE.MeshStandardMaterial({color:0x5d654b,roughness:1});
addMesh(new THREE.PlaneGeometry(4.5,188,1,8),bankMat,[16.9,.16,4],[-Math.PI/2,.02,.08],false);
addMesh(new THREE.PlaneGeometry(4.5,188,1,8),bankMat,[45.1,.16,4],[-Math.PI/2,.02,.08],false);
const foam=[];for(let i=0;i<34;i++){const r=addMesh(new THREE.RingGeometry(.18,.34,12),MAT.foam,[27.3+Math.sin(i*1.7)*3.8,.22,-49+i*3.2],[-Math.PI/2,0,0],false);r.scale.set(1.5,.55,1);foam.push(r)}
// Irregular shoreline highlights visually connect the river to its banks.
const shorelineGlints=[];for(let i=0;i<46;i++){const z=-50+i*2.35;const side=i%2?-1:1;const x=31+side*(11.9+Math.sin(i*2.7)*.75);const g=addMesh(new THREE.PlaneGeometry(.7+.35*(i%3),.18),MAT.foam,[x,.22,z],[-Math.PI/2,0,(i%2)*.18],false);shorelineGlints.push(g)}
// River-edge transition detail: irregular wet soil, exposed stones, and reed clumps break the straight shoreline.
const wetBankMat=new THREE.MeshStandardMaterial({color:0x514b3d,roughness:.96});
const reedMat=new THREE.MeshStandardMaterial({color:0x536447,roughness:1});
for(let i=0;i<54;i++){
  const z=-51+i*1.92;
  const side=i%2?-1:1;
  const wav=Math.sin(i*1.91)*.72+Math.sin(i*.43)*.38;
  const edgeX=31+side*(11.65+wav);
  const mud=addMesh(new THREE.PlaneGeometry(.75+(i%4)*.18,.55+(i%3)*.14),wetBankMat,[edgeX+side*.34,.205,z],[-Math.PI/2,0,(i%5)*.23],false);
  mud.rotation.z+=(side<0?0:Math.PI);
  if(i%2===0){
    const stone=rockMesh(.16+(i%3)*.055);
    stone.position.set(edgeX+side*(.55+(i%3)*.12),.28,z+.32*Math.sin(i));
    stone.scale.y=.55;stone.rotation.y=i*.61;scene.add(stone);
  }
  if(i%5===0){
    for(let r=0;r<3;r++){
      const reed=box(.035,.55+(r%2)*.18,.035,reedMat,[edgeX+side*(.15+r*.10),.48,z+r*.12],(r-1)*.12);
      reed.rotation.z=(r-1)*.12;reed.castShadow=false;
    }
  }
}

function road(x,z,w,d,rot=0){return addMesh(new THREE.PlaneGeometry(w,d),MAT.road,[x,.10,z],[-Math.PI/2,0,rot],false)}
road(0,7,11.5,120);road(-13,-1,50,7.5);road(17,7,8,65,.18);road(31,7,9,18,.08);road(23,6,24,6.2,.02);

// Terrain-transition pass: roads should emerge from the meadow instead of ending at a hard texture seam.
function roadShoulder(x,z,w,d,rot=0){
  const g=new THREE.Group();g.position.set(x,.12,z);g.rotation.y=rot;
  const edgeMat=new THREE.MeshStandardMaterial({color:0x77705c,roughness:1});
  const soilMat=new THREE.MeshStandardMaterial({color:0x665b49,roughness:1});
  for(const side of [-1,1]){
    for(let i=0;i<18;i++){
      const t=i/17-.5;
      const px=t*w;
      const pz=side*(d*.5+.35+(i%3)*.18);
      const peb=box(.18+(i%3)*.07,.10+(i%2)*.05,.26+(i%4)*.06,edgeMat,[px,.05,pz],(i*1.7)%Math.PI,g);
      peb.scale.y=.65+(i%4)*.12;
    }
    for(let i=0;i<12;i++){
      const t=i/11-.5;
      const tuft=box(.07,.12+(i%3)*.06,.18,soilMat,[t*w, .08, side*(d*.5+.12)],(i%2)*.4,g);
      tuft.rotation.x=(i%2?-1:1)*.18;
    }
  }
  scene.add(g);return g;
}
roadShoulder(0,7,11.5,120);
roadShoulder(-13,-1,50,7.5);
roadShoulder(17,7,8,65,.18);
roadShoulder(23,6,24,6.2,.02);

const assetLoader=new GLTFLoader();
const assetCache=new Map();const assetPromises=new Map();const assetClips=new Map();
const assetLoadStats={requested:0,loaded:0,failed:0,failedNames:[]};
window.__HEARTHMERE_ASSET_LOAD_STATS=assetLoadStats;
let loadedCount=0;const assetQueue=['inn','forge','chapel','mill','watchtower','well','cart','fence','bench','crate','sign','lantern','rock','tree_oak','tree_pine','shrub','grass_clump','bridge','barrel','character','hero','chimney_detail','door_detail','window_detail','roof_ridge_detail','timber_brace_detail','stone_foundation_detail','eave_bracket_detail','roof_eave_trim_detail'];
async function loadAsset(name){
 if(assetPromises.has(name))return assetPromises.get(name);
 assetLoadStats.requested++;
 const p=assetLoader.loadAsync(ASSET_BASE+`${name}.glb`).then(gltf=>{
   gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=true;if(o.material){o.material=o.material.clone();o.material.roughness=Math.min(.94,Math.max(.34,o.material.roughness??.7));const n=(o.name||'').toLowerCase();if(n.includes('roof')||n.includes('ridge')){o.material.map=roof;o.material.normalMap=roofNormal;o.material.normalScale=new THREE.Vector2(.34,.34);o.material.needsUpdate=true;}if(n.includes('window')){o.material.emissive=new THREE.Color(0x6f4925);o.material.emissiveIntensity=.18;warmWindows.push(o);}
          if(n.includes('leaf')||n.includes('foliage')||n.includes('crown')||name.includes('tree')||name.includes('shrub')){
            o.material.roughness=.88;o.material.metalness=0;
            if(o.material.color){const lift=1+((o.id%11)-5)*.009;o.material.color.multiplyScalar(lift);}
            if('alphaTest' in o.material)o.material.alphaTest=Math.max(o.material.alphaTest||0,.02);
          }
          if(n.includes('stone')||n.includes('foundation')||name==='rock'){o.material.roughness=.92;o.material.metalness=0;}
          if(n.includes('wood')||n.includes('timber')||n.includes('beam')){o.material.roughness=.82;o.material.metalness=0;}
        }}});
   assetCache.set(name,gltf.scene);assetClips.set(name,gltf.animations||[]);loadedCount++;assetLoadStats.loaded++;bootSet(.08+.57*(loadedCount/assetQueue.length),'Loading '+name+'…');return {scene:gltf.scene,clips:gltf.animations||[]};
 }).catch(err=>{assetLoadStats.failed++;assetLoadStats.failedNames.push(name);console.warn('Asset failed',name,err);return null});
 assetPromises.set(name,p);return p;
}
async function placeAsset(name,x,z,scale=1,rotation=0,tint=null){const loaded=await loadAsset(name);if(!loaded)return null;const g=loaded.scene.clone(true);g.position.set(x,name==='bridge'?0.12:terrainHeight(x,z),z);g.scale.setScalar(scale);g.rotation.y=rotation;g.userData.assetName=name;g.userData.animations=loaded.clips;if(tint){g.traverse(o=>{if(o.isMesh&&o.material?.color){o.material=o.material.clone();o.material.color.lerp(new THREE.Color(tint),.18)}})}scene.add(g);return g}


// Hearthmere authored-detail pass: architectural trim, windows, doors, chimneys,
// market dressing and terrain-edge storytelling. These are modular scene details,
// not placeholder debug geometry.
const MAT_DETAIL={
 wood:new THREE.MeshStandardMaterial({color:0x4b3325,roughness:.82,metalness:0}),
 timber:new THREE.MeshStandardMaterial({color:0x2e211a,roughness:.9}),
 plaster:new THREE.MeshStandardMaterial({color:0xc2b69a,roughness:.95}),
 stone:new THREE.MeshStandardMaterial({color:0x67665d,roughness:.96}),
 iron:new THREE.MeshStandardMaterial({color:0x252a28,roughness:.5,metalness:.62}),
 glass:new THREE.MeshPhysicalMaterial({color:0x78a8a7,roughness:.12,metalness:.05,transmission:.2,transparent:true,opacity:.78}),
 flower:new THREE.MeshStandardMaterial({color:0x8e4d55,roughness:.9}),
 leaf:new THREE.MeshStandardMaterial({color:0x496b43,roughness:1})
};
function rockMesh(radius=0.25){
  const material=new THREE.MeshStandardMaterial({color:0x5e5a50,roughness:.98,metalness:0});
  const geometry=new THREE.SphereGeometry(radius,32,20);
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.rotation.set(Math.random()*1.7,Math.random()*Math.PI,Math.random()*1.4);
  return mesh;
}

function box(w,h,d,m,pos=[0,0,0],rotY=0,parent=null){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(...pos);q.rotation.y=rotY;q.castShadow=true;q.receiveShadow=true;(parent||scene).add(q);return q}
function cyl(r,h,m,pos=[0,0,0],rot=[0,0,0],parent=null){const q=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.94,h,10),m);q.position.set(...pos);q.rotation.set(...rot);q.castShadow=true;q.receiveShadow=true;(parent||scene).add(q);return q}
function windowUnit(x,y,z,rot=0,w=1.15,h=1.45){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;const warm=new THREE.MeshPhysicalMaterial({color:0xb7c7bd,roughness:.22,metalness:.02,transmission:.12,transparent:true,opacity:.84,emissive:0x2a1b10,emissiveIntensity:.18});warmWindows.push(warm);box(w,h,.10,warm,[0,0,0],0,g);box(.08,h+.12,.16,MAT_DETAIL.timber,[-w*.5,0,.08],0,g);box(.08,h+.12,.16,MAT_DETAIL.timber,[w*.5,0,.08],0,g);box(w+.12,.08,.16,MAT_DETAIL.timber,[0,-h*.5,.08],0,g);box(w+.12,.08,.16,MAT_DETAIL.timber,[0,h*.5,.08],0,g);box(.06,h,.18,MAT_DETAIL.timber,[0,0,.10],0,g);box(w,.06,.18,MAT_DETAIL.timber,[0,0,.10],0,g);scene.add(g);return g}
function doorUnit(x,y,z,rot=0,w=1.35,h=2.65){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;box(w,h,.16,MAT_DETAIL.wood,[0,0,0],0,g);for(let i=-1;i<=1;i++)box(.08,h*.92,.2,MAT_DETAIL.timber,[i*w*.28,0,.12],0,g);box(w+.08,.10,.2,MAT_DETAIL.timber,[0,h*.44,.12],0,g);cyl(.07,.12,MAT_DETAIL.iron,[w*.24,0,.18],[Math.PI/2,0,0],g);scene.add(g);return g}
function chimney(x,y,z,scale=1){const g=new THREE.Group();g.position.set(x,y,z);for(let i=0;i<4;i++)box(.58*scale,.72*scale,.58*scale,MAT_DETAIL.stone,[0,i*.62*scale,0]);box(.82*scale,.18*scale,.82*scale,MAT_DETAIL.stone,[0,2.45*scale,0]);scene.add(g);return g}
function flowerBed(x,z,rot=0){const g=new THREE.Group();g.position.set(x,terrainHeight(x,z)+.03,z);g.rotation.y=rot;box(2.8,.22,.8,MAT_DETAIL.wood,[0,.12,0],0,g);for(let i=0;i<8;i++){const px=-1.15+(i%4)*.75,pz=-.24+(i%2)*.48;cyl(.10,.28,i%3?MAT_DETAIL.flower:new THREE.MeshStandardMaterial({color:0xd0ad59,roughness:.9}),[px,.35,pz],[],g)}scene.add(g);return g}
function landmarkDetailPass(){
  // Inn: deep timber frame, warm windows and a projecting sign.
  windowUnit(-17.1,3.7,-13.0,.02,1.3,1.35);windowUnit(-10.9,3.7,-13.0,.02,1.3,1.35);
  doorUnit(-14,1.55,-9.75,Math.PI,1.45,2.7);chimney(-11.2,3.2,-15.0,.9);
  box(3.4,.22,.12,MAT_DETAIL.timber,[-14,5.1,-9.55],0);box(3.0,.12,.12,MAT_DETAIL.wood,[-14,4.75,-9.48],0);
  // Forge: heavy stone base, tall chimney, glowing furnace mouth.
  for(let i=0;i<5;i++)box(.85,.55,5.4,MAT_DETAIL.stone,[-1.9+i*.95,0.45,-7],0);
  chimney(2.9,2.7,-7.4,1.1);box(1.0,1.15,.18,new THREE.MeshStandardMaterial({color:0x6b2517,emissive:0x9c3219,emissiveIntensity:1.4,roughness:.7}),[1.2,1.05,-3.95],0);
  // Chapel: bell tower trim and rose-window motif.
  windowUnit(-14.1,4.4,10.2,.0,1.45,1.55);doorUnit(-12,1.45,14.5,0,1.3,2.7);chimney(-8.7,4.4,10.9,.65);
  // Mill: water-facing timber gallery and wheel hub.
  for(let i=0;i<5;i++)box(.18,3.0,.20,MAT_DETAIL.timber,[13.2+i*1.15,3.0,-19.8],0);
  cyl(2.5,.32,MAT_DETAIL.wood,[19.1,2.0,-19.0],[Math.PI/2,0,0]);
  cyl(.38,.48,MAT_DETAIL.iron,[19.1,2.0,-19.0],[Math.PI/2,0,0]);
  // Watch: crenellation and warm beacon.
  for(let i=0;i<7;i++)box(.48,.75,.62,MAT_DETAIL.stone,[11.2+i*1.55,7.4,10.0],0);
  cyl(.18,.8,new THREE.MeshStandardMaterial({color:0xe7a64c,emissive:0xb75c20,emissiveIntensity:1.5}),[16,8.2,10.0]);
  // Village dressing: beds, posts, market awnings, and a visible road threshold.
  flowerBed(-20,-7,.1);flowerBed(-4,8,-.25);flowerBed(7,-16,.3);
  for(const [x,z] of [[-25,-16],[-21,-16],[-17,-16]]){cyl(.11,2.1,MAT_DETAIL.timber,[x,1.05,z]);box(2.0,.65,.08,MAT_DETAIL.wood,[x,2.0,z]);}
}
function addRoadEdges(){
  for(let i=0;i<34;i++){const z=-50+i*3.15;const side=i%2?-1:1;const x=side*(5.9+(i%3)*.12);const r=box(.34,.24,.62,MAT_DETAIL.stone,[x,.28,z],(i%5)*.18);r.scale.y=.7}
  for(let i=0;i<18;i++){const z=-18+i*3.0;const x=-28-(i%2)*.7;box(.26,.22,.5,MAT_DETAIL.stone,[x,.25,z],i*.17)}
}

const landmarks={};
function landmarkAccent(g,type,x,z,scale=1){
  if(!g)return;
  const y=terrainHeight(x,z);
  const add=(o,px,py,pz,rot=0)=>{o.position.set(px,py,pz);o.rotation.y=rot;g.add(o);return o};
  if(type==='inn'){
    // Deep timber porch + hanging sign + stacked firewood make the inn read immediately from the road.
    add(box(5.6,.18,1.15,MAT_DETAIL.wood,[0,0,0],0),0,2.15,-4.1);
    for(const px of [-2.35,2.35]) add(cyl(.13,3.9,MAT_DETAIL.timber),px,1.15,-4.0);
    add(box(4.9,.08,.16,MAT_DETAIL.timber),0,4.05,-4.0);
    add(box(1.25,.10,.08,MAT_DETAIL.timber),0,3.25,-4.28);
    add(box(1.12,.82,.10,MAT_DETAIL.wood),0,2.83,-4.3);
    woodPile(x+4,z-3.8,.15);
    // Broad signboard with hanging supports makes the inn legible before the player reaches it.
    add(box(2.25,.82,.12,MAT_DETAIL.wood),0,3.45,-4.42);
    add(box(.09,1.0,.12,MAT_DETAIL.iron),-.95,3.55,-4.48);
    add(box(.09,1.0,.12,MAT_DETAIL.iron),.95,3.55,-4.48);
  } else if(type==='forge'){
    // Forge apron, heavy chimney collar and tool rack establish a working smithy silhouette.
    add(box(4.4,.18,2.0,MAT_DETAIL.stone),0,.15,-3.2);
    for(const px of [-1.7,0,1.7]) add(cyl(.09,1.65,MAT_DETAIL.timber),px,.9,-3.95);
    add(box(4.0,.12,.18,MAT_DETAIL.timber),0,1.72,-3.95);
    add(box(3.4,.14,.22,MAT_DETAIL.stone),0,4.65,.5);
    for(let i=0;i<4;i++) add(cyl(.035,.9,MAT_DETAIL.timber),-1.2+i*.8,1.25,-4.08,Math.PI/2);
    woodPile(x-3.7,z-3.0,-.35);
    // Smithy apron, anvil block and ore baskets sell the building's purpose at a glance.
    add(box(.9,.55,.7,MAT_DETAIL.stone),-2.2,.55,-4.05);
    add(box(.52,.22,.30,MAT_DETAIL.iron),-2.2,1.0,-4.05);
    add(cyl(.34,.45,MAT_DETAIL.iron),2.35,.42,-3.98);
    add(cyl(.38,.52,MAT_DETAIL.stone),3.05,.46,-3.55);
  } else if(type==='chapel'){
    // Buttress rhythm and a small entry canopy give the chapel a civic landmark profile.
    for(const px of [-3.1,-1.55,1.55,3.1]) add(box(.48,3.0,.62,MAT_DETAIL.stone),px,1.5,2.35);
    add(box(3.0,.16,1.0,MAT_DETAIL.wood),0,2.15,-3.55);
    for(const px of [-1.2,1.2]) add(cyl(.10,2.2,MAT_DETAIL.timber),px,1.05,-3.35);
    add(box(2.7,.10,.16,MAT_DETAIL.timber),0,2.15,-3.35);
    // Small bell gable and rose-window ring make the chapel's civic identity unmistakable.
    add(cyl(.48,.12,MAT_DETAIL.iron),0,5.25,2.52,[Math.PI/2,0,0]);
    add(cyl(.13,.18,MAT_DETAIL.timber),0,5.25,2.62,[Math.PI/2,0,0]);
    add(box(.16,1.25,.10,MAT_DETAIL.timber),0,5.9,2.54);
    add(box(.82,.12,.10,MAT_DETAIL.timber),0,5.9,2.54);
  } else if(type==='mill'){
    // Oversized timber braces and a readable wheel/axle accent reinforce the mill's function.
    for(const px of [-2.2,2.2]) add(box(.22,4.4,.26,MAT_DETAIL.timber),px,2.2,-3.0,.12);
    add(cyl(.16,2.0,MAT_DETAIL.stone),3.0,1.5,-3.7,[Math.PI/2][0]);
    const wheel=new THREE.Group(); wheel.position.set(3.05,1.55,-3.72); wheel.rotation.z=Math.PI/2;
    for(let i=0;i<10;i++){const a=i*Math.PI/5; const spoke=box(.10,1.75,.10,MAT_DETAIL.timber,[Math.cos(a)*.72,Math.sin(a)*.72,0],a); wheel.add(spoke);}
    wheel.add(cyl(.12,2.0,MAT_DETAIL.timber,[0,0,0],[Math.PI/2,0,0])); g.add(wheel);
    // Sluice channel and grain sacks visually connect the mill to the river's working edge.
    add(box(2.8,.18,1.25,MAT_DETAIL.wood),3.45,.28,-3.15,-.12);
    add(box(1.0,.65,.75,MAT_DETAIL.flower),-2.65,.42,-3.75);
    add(box(.82,.58,.62,MAT_DETAIL.flower),-3.25,.37,-3.35);
  } else if(type==='watchtower'){
    // Layered platform, braces and crenel accents make the tower read as defensive rather than generic.
    add(box(4.0,.24,4.0,MAT_DETAIL.stone),0,3.65,0);
    for(const px of [-1.55,1.55]) for(const pz of [-1.55,1.55]) add(box(.22,2.6,.22,MAT_DETAIL.timber),px,2.2,pz);
    for(const px of [-1.5,-.5,.5,1.5]) add(box(.55,.48,.38,MAT_DETAIL.stone),px,5.25,-1.7);
    for(const px of [-1.5,-.5,.5,1.5]) add(box(.55,.48,.38,MAT_DETAIL.stone),px,5.25,1.7);
    // External stair and beacon pennant give the tower a strong silhouette from the meadow.
    for(let i=0;i<6;i++) add(box(1.15,.16,.62,MAT_DETAIL.wood),-2.65+i*.34,1.0+i*.43,-.95-i*.28,-.38);
    add(cyl(.07,3.0,MAT_DETAIL.timber),0,7.0,0);
    const pennant=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:0x7d3d35,roughness:.9}));
    pennant.geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,7.8,0,1.0,7.48,0,0,7.12,0],3));pennant.geometry.computeVertexNormals();add(pennant,0,0,0);
  }
}
async function buildLandmarks(){
 const specs=[
  ['inn','THE WARM LANTERN',-14,-13,1.04,-.08,7.0],['forge','RIVERSIDE FORGE',1,-7,1.08,.04,6.1],['chapel','CHAPEL OF THE LAST BELL',-12,11,.86,.06,11.0],['mill','ASHWHEEL MILL',16,-17,.92,-.12,7.2],['watchtower','NORTH WATCH',16,14,.88,.12,12.2]
 ];
 for(const [asset,name,x,z,scale,rot,labelY] of specs){const g=await placeAsset(asset,x,z,scale,rot);landmarks[asset]=g;landmarkAccent(g,asset,x,z,scale);label(name,[x,labelY,z],'#f0e7d2',asset==='chapel'?1.0:.9)}
 const bridge=await placeAsset('bridge',31,6,2.05,.02);
  if(bridge) bridge.scale.set(2.05,.82,1.0);landmarks.bridge=bridge;
  landmarkDetailPass();
  addRoadEdges();
}

async function dressVillage(){
 const p=[['well',-20,-2,.95,.2],['cart',-22,-19,.95,.15],['bench',-9,-7,.9,-.35],['bench',-8,14,.9,.55],['sign',-6,-2,.8,.2],['lantern',-13,-8,.85,.15],['lantern',4,-12,.85,-.2],['lantern',15,-10,.85,.4],['crate',-17,-20,.8,.1],['crate',-14,-20,.7,-.2],['crate',3,-4,.65,.4]];
 const placed=await Promise.all(p.map(v=>placeAsset(...v)));
 villageWell=placed[0];
 const barrels=[];for(let i=0;i<12;i++)barrels.push(placeAsset('barrel',-24+(i%4)*2.7,-22+Math.floor(i/4)*2.7,.44+(i%3)*.04,(i%2)*.32));
 const fences=[];for(let i=0;i<13;i++)fences.push(placeAsset('fence',-31+i*5.0,-25,.85,0));
 const rocks=[];for(let i=0;i<18;i++)rocks.push(placeAsset('rock',-42+i*4.9,25+Math.sin(i*.8)*6,.40+(i%4)*.09,i*.21));
 await Promise.all([...barrels,...fences,...rocks]);
}

const foliage=[];async function buildFoliage(){
 const list=[];for(let i=0;i<100;i++){const side=i%2?-1:1;let x=side*(31+Math.random()*48),z=-58+Math.random()*112;if(Math.abs(z-6)<17&&Math.abs(x)<54)continue;list.push([i%3?'tree_oak':'tree_pine',x,z,.62+Math.random()*.68,(Math.random()-.5)*.55])}
 for(let i=0;i<26;i++)list.push([i%2?'tree_oak':'tree_pine',-45+Math.random()*92,31+Math.random()*31,.55+Math.random()*.55,(Math.random()-.5)*.6]);
 // Preserve deliberate sightlines to the village core and its major destinations.
 // Trees still form a dense perimeter, but they no longer randomly plug the authored approaches.
 const filtered=list.filter(v=>{
   const x=v[1], z=v[2];
   const centralApproach=Math.abs(x)<24 && z>-31 && z<25;
   const northApproach=Math.abs(x-16)<9 && z>-1 && z<13;
   const chapelApproach=Math.abs(x+12)<7 && z>3 && z<13;
   const millApproach=Math.abs(x-16)<8 && z>-25 && z<-10;
   return !(centralApproach||northApproach||chapelApproach||millApproach);
 });
 const gs=await Promise.all(filtered.map(v=>placeAsset(...v)));gs.forEach((g,i)=>{if(g){g.userData.windPhase=i*.73;g.userData.windStrength=.006+(i%5)*.0015;foliage.push(g)}});
 // Deliberate gateway clusters frame the approaches without blocking the destination silhouettes.
 const frames=[[-25,-30,-.18],[-25,-22,.12],[7,-28,.25],[25,24,-.22],[25,36,.18],[-27,25,.35]];
 for(const [x,z,r] of frames){
   const a=await placeAsset('tree_oak',x,z,1.05,r);
   const b=await placeAsset('tree_oak',x+(r>.0?2.4:-2.4),z+1.1,0.88,r+.3);
   if(a)foliage.push(a); if(b)foliage.push(b);
 }
}

// Major world cohesion pass: practical lights and atmospheric depth.
function buildLandscapeAnchors(){
  // Smooth, large-form terrain masses make the playable slice feel surrounded by land.
  const hillMat=new THREE.MeshStandardMaterial({color:0x445941,roughness:1,metalness:0});
  const ridgeMat=new THREE.MeshStandardMaterial({color:0x354b43,roughness:1,metalness:0,transparent:true,opacity:.92});
  const hills=[
    [-72,10,-58,38,12,20],[72,8,-42,42,14,24],[-76,4,30,46,12,28],[72,7,34,40,13,26],
    [-34,5,70,56,15,24],[36,6,72,58,16,26]
  ];
  hills.forEach(([x,y,z,sx,sy,sz])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,64,32),hillMat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;scene.add(m);});
  const ridge=new THREE.Mesh(new THREE.SphereGeometry(1,64,32),ridgeMat);ridge.position.set(0,9,116);ridge.scale.set(105,22,26);scene.add(ridge);
}
function buildWorldVisualPass(){
  sun.color.set(0xffd2a0);fill.color.set(0x7ea8bd);hemi.color.set(0xdbece6);hemi.groundColor.set(0x30251f);
  fill.intensity=.92;sun.intensity=3.55;
  const practicals=[[-14,-8,0xffb35c,2.2,11],[4,-12,0xffa14c,1.7,9],[15,-10,0xffb35c,1.6,9],[-4,-28,0xffc07a,1.5,8],[20,-24,0xffb15b,1.8,10]];
  practicals.forEach(([x,z,c,i,d])=>{const l=new THREE.PointLight(c,i,d,.8);l.position.set(x,2.3,z);scene.add(l);});
  const hazeMat=new THREE.MeshBasicMaterial({color:0xc8d5cc,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide});
  const haze=new THREE.Mesh(new THREE.PlaneGeometry(170,42),hazeMat);haze.position.set(0,23,-82);scene.add(haze);
}
async function buildNaturalDressing(){
 const specs=[];
 for(let i=0;i<42;i++){
  const x=-44+Math.random()*92,z=-49+Math.random()*104;
  if(Math.abs(x-31)<15) continue;
  if(Math.abs(z-7)<7 && x>-32 && x<25) continue;
  specs.push(['shrub',x,z,.45+Math.random()*.5,(Math.random()-.5)*.8]);
 }
 for(let i=0;i<68;i++){
  const x=-47+Math.random()*96,z=-53+Math.random()*110;
  if(Math.abs(x-31)<15) continue;
  specs.push(['grass_clump',x,z,.38+Math.random()*.48,Math.random()*Math.PI*2]);
 }
 await Promise.all(specs.map(v=>placeAsset(...v)));
}

// High-frequency environmental dressing: small authored clusters that break repetition
// and make the village read as inhabited rather than assembled from isolated landmarks.
function woodPile(x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,terrainHeight(x,z)+.02,z);g.rotation.y=rot;
 for(let i=0;i<5;i++){const log=cyl(.18,1.7,MAT_DETAIL.wood,[((i%2)*.34-.17),.22+Math.floor(i/2)*.30,0],[0,0,Math.PI/2],g);log.rotation.y=(i%2)*.18;}
 scene.add(g);return g;
}
function hayStack(x,z,s=1){const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);cyl(.7*s,1.25*s,MAT_DETAIL.flower,[0,.62*s,0]);cyl(.46*s,.22*s,MAT_DETAIL.timber,[0,1.28*s,0]);scene.add(g);return g}
function marketStall(x,z,rot=0){const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;
 box(2.8,.16,1.25,MAT_DETAIL.wood,[0,1.55,0],0,g);for(const px of [-1.15,1.15])cyl(.09,2.5,MAT_DETAIL.timber,[px,1.25,0],[0,0,0],g);
 box(3.0,.08,1.35,new THREE.MeshStandardMaterial({color:0x6e4f3e,roughness:.85}),[0,2.45,0],0,g);box(3.0,.06,.32,MAT_DETAIL.wood,[0,.72,0],0,g);scene.add(g);return g;
}
function reedPatch(x,z,rot=0){const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;for(let i=0;i<10;i++){const r=cyl(.018,.8+Math.random()*.65,new THREE.MeshStandardMaterial({color:0x60794a,roughness:1}),[(Math.random()-.5)*1.4,.4,(Math.random()-.5)*1.2],[0,(Math.random()-.5)*.5,(Math.random()-.5)*.25],g);r.userData.reed=true}scene.add(g);return g}
function stoneBorder(x,z,count=7,rot=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;for(let i=0;i<count;i++){const a=(i/(count-1)-.5)*5;const r=box(.45,.28,.34,MAT_DETAIL.stone,[a,.25,Math.sin(i*1.4)*.18],i*.21,g);r.scale.set(1+(i%3)*.15,.8,1)}scene.add(g);return g}
// Hearthmere residential quarter: three distinct cottage archetypes built from the same
// material language. The silhouettes, rooflines, porches and facade dressing deliberately vary
// so the village no longer reads as one repeated house dropped around the landmarks.
const cottageMats={
  stone:new THREE.MeshStandardMaterial({color:0x777269,roughness:.96}),
  timber:new THREE.MeshStandardMaterial({color:0x3a2920,roughness:.88}),
  plasterA:new THREE.MeshStandardMaterial({color:0xb9ad92,roughness:.94}),
  plasterB:new THREE.MeshStandardMaterial({color:0x9eaa96,roughness:.94}),
  plasterC:new THREE.MeshStandardMaterial({color:0xc3a987,roughness:.94}),
  roofA:new THREE.MeshStandardMaterial({color:0x4b4542,roughness:.92}),
  roofB:new THREE.MeshStandardMaterial({color:0x5c4034,roughness:.92}),
  roofC:new THREE.MeshStandardMaterial({color:0x3f514a,roughness:.92})
};
function roofRidge(g,w,d,h,m){
  const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.lineTo(-w/2,0);
  const ex=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});ex.rotateX(-Math.PI/2);ex.translate(0,0,-d/2);
  const r=new THREE.Mesh(ex,m);r.castShadow=true;r.receiveShadow=true;g.add(r);return r;
}
function cottage(x,z,variant=0,rot=0){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;
  const bodyMat=[cottageMats.plasterA,cottageMats.plasterB,cottageMats.plasterC][variant%3];
  const roofMat=[cottageMats.roofA,cottageMats.roofB,cottageMats.roofC][variant%3];
  const w=variant===1?5.7:variant===2?4.9:5.3, d=variant===1?4.7:4.4, h=3.4;
  box(w,h,d,bodyMat,[0,h/2,0],0,g);
  // Dark timber frame establishes the OSRS-readable silhouette while retaining richer materials.
  for(const px of [-w/2+.16,w/2-.16])box(.18,h+.1,.22,cottageMats.timber,[px,h/2,.02],0,g);
  box(w+.18,.18,.22,cottageMats.timber,[0,h-.16,.02],0,g);
  box(w*.72,.16,.22,cottageMats.timber,[0,h*.48,.02],0,g);
  roofRidge(g,w+1.0,d+.65,1.75,roofMat).position.y=h;
  box(w+.45,.16,.32,cottageMats.timber,[0,h-.04,-d/2-.08],0,g);
  // Front door, two windows, shutters and warm interior glow.
  doorUnit(0,1.35,d/2+.10,0,1.05,2.55); 
  windowUnit(-w*.29,2.05,d/2+.08,0,.92,1.12);windowUnit(w*.29,2.05,d/2+.08,0,.92,1.12);
  for(const px of [-w*.29,w*.29]){box(.14,1.22,.10,cottageMats.timber,[px-.56,2.05,d/2+.02],0,g);box(.14,1.22,.10,cottageMats.timber,[px+.56,2.05,d/2+.02],0,g)}
  chimney(-w*.24,3.35,-d*.16,.62);
  // Variant-specific porch/balcony treatment.
  if(variant===0){
    box(2.8,.16,1.15,cottageMats.timber,[0,.92,d/2+.62],0,g);for(const px of [-1.15,1.15])cyl(.08,1.85,cottageMats.timber,[px,.92,d/2+.96],[],g);
  } else if(variant===1){
    box(3.0,.18,.12,cottageMats.timber,[0,2.92,d/2+.14],0,g);for(const px of [-1.3,-.43,.43,1.3])box(.07,.55,.10,cottageMats.timber,[px,2.68,d/2+.12],0,g);
  } else {
    for(const px of [-1.55,-.78,0,.78,1.55])box(.06,.82,.12,cottageMats.timber,[px,1.85,d/2+.12],0,g);
    box(3.5,.08,.12,cottageMats.timber,[0,1.45,d/2+.12],0,g);
  }
  // Firewood and planter details ground the building in the terrain.
  woodPile(x+(variant-1)*1.15,z-d*.56,.3+variant*.4);
  flowerBed(x+(variant===2?1.0:-1.0),z+d*.60,rot);
  scene.add(g);return g;
}
async function buildResidentialQuarter(){
  // Distinct authored GLB homes replace the old runtime cottage blocks. Each house has a different
  // silhouette, facade treatment, roof, porch/awning and small lived-in details while sharing Hearthmere's material language.
  const homes=[
    ['cottage_A',-25,-4,1.0,.18],['cottage_B',-23,5,.96,-.22],['cottage_C',-20,15,1.0,.06],
    ['cottage_A',-8,20,.98,.52],['cottage_B',-1,22,.94,-.28],['cottage_C',7,17,.96,.12],
    ['cottage_B',-28,13,.93,.72],['cottage_A',10,-28,1.02,-.12]
  ];
  await Promise.all(homes.map(async ([asset,x,z,scale,rot])=>{
    const home=await placeAsset(asset,x,z,scale,rot);
    if(!home)return;
    // Architectural detailing pass: these pieces are children of each cottage so the facade details inherit its unique rotation/scale.
    const details=[
      ['door_detail',[0,0,-3.92],.72],
      ['window_detail',[-1.95,1.55,-3.88],.58],
      ['window_detail',[1.95,1.55,-3.88],.58],
      ['chimney_detail',[1.45,5.02,.25],.72],
      ['roof_ridge_detail',[0,5.15,0],.78],
      ['timber_brace_detail',[-2.45,.95,-4.00],.72],
      ['timber_brace_detail',[2.45,.95,-4.00],.72],
      ['stone_foundation_detail',[0,0,-3.98],.72],
      ['eave_bracket_detail',[-2.45,4.48,-3.88],.72],
      ['eave_bracket_detail',[0,4.62,-3.88],.72],
      ['eave_bracket_detail',[2.45,4.48,-3.88],.72],
      ['eave_bracket_detail',[-2.45,4.48,3.15],.72],
      ['eave_bracket_detail',[0,4.62,3.15],.72],
      ['eave_bracket_detail',[2.45,4.48,3.15],.72],
      ['roof_eave_trim_detail',[0,0,0],.78]
    ];
    for(const [name,pos,sc] of details){
      const a=await loadAsset(name);
      if(!a)continue;
      const d=a.scene.clone(true); d.position.set(pos[0],pos[1],pos[2]); d.scale.setScalar(sc); d.userData.assetName=name;
      // Give authored architectural trim a deliberate material language instead of inherited gray defaults.
      const detailMat = name.includes('foundation') ? MAT_DETAIL.stone :
        (name.includes('chimney') ? MAT_DETAIL.stone :
        (name.includes('window') ? MAT_DETAIL.glass :
        (name.includes('door') ? MAT_DETAIL.wood :
        (name.includes('roof_') || name.includes('eave_') || name.includes('timber') ? MAT_DETAIL.timber : MAT_DETAIL.wood))));
      d.traverse(o=>{if(o.isMesh){o.material=detailMat.clone();o.castShadow=true;o.receiveShadow=true;}});
      home.add(d);
    }
  }));
  // A narrow service lane, deliberately offset from the main road.
  road(-18,19,4.2,24,-.08);
  for(let i=0;i<7;i++){const z=8+i*3.0;box(.34,.18,.5,cottageMats.stone,[-20.1,.24,z],i*.23)}
}
function addVillageMicroDressing(){
 [[-24,-12,.18],[-8,-21,-.42],[4,-3,.75],[11,-13,-.3]].forEach(v=>woodPile(...v));
 [[-27,-7,1.0],[-20,-18,.75],[8,-24,.9]].forEach(v=>hayStack(...v));
 marketStall(-3,-14,-.04);marketStall(-7,-14,.02);
 stoneBorder(-19,-4,8,.1);stoneBorder(-3,6,9,-.18);
 [[28,-25],[29,-8],[28,20],[28,43]].forEach(v=>reedPatch(...v));
 // little footbridge approach posts / lantern hooks
 for(const [x,z,r] of [[24,3,.02],[37,3,.02],[24,10,.02],[37,10,.02]]){cyl(.10,2.1,MAT_DETAIL.timber,[x,1.05,z],[0,0,0]);cyl(.08,.35,MAT_DETAIL.iron,[x,2.05,z],[Math.PI/2,0,0]);}
}


// ============================================================================
// HEARTHMERE VISUAL REPLACEMENT PASS
// The legacy GLBs remain in the project as authored layout/collision references,
// but they are no longer used as the visible hero/world geometry. This pass
// replaces the visibly low-detail silhouettes with smooth, high-segment forms.
// ============================================================================

const HD={
  timber:new THREE.MeshStandardMaterial({color:0x3a271d,roughness:.78,metalness:0}),
  timberLight:new THREE.MeshStandardMaterial({color:0x62412b,roughness:.74,metalness:0}),
  plaster:new THREE.MeshStandardMaterial({color:0xb8ab91,roughness:.92,metalness:0}),
  plasterWarm:new THREE.MeshStandardMaterial({color:0xc9b99b,roughness:.9,metalness:0}),
  stone:new THREE.MeshStandardMaterial({color:0x77746b,roughness:.94,metalness:0}),
  stoneDark:new THREE.MeshStandardMaterial({color:0x4e4c47,roughness:.96,metalness:0}),
  roof:new THREE.MeshStandardMaterial({color:0x34322f,roughness:.82,metalness:0}),
  roofWarm:new THREE.MeshStandardMaterial({color:0x51443a,roughness:.84,metalness:0}),
  glass:new THREE.MeshPhysicalMaterial({color:0x88c6c5,roughness:.16,metalness:.05,transmission:.28,transparent:true,opacity:.86,clearcoat:1}),
  leaf:new THREE.MeshStandardMaterial({color:0x426b45,roughness:.96,metalness:0}),
  leafLight:new THREE.MeshStandardMaterial({color:0x5f8452,roughness:.95,metalness:0}),
  trunk:new THREE.MeshStandardMaterial({color:0x4a3323,roughness:.95,metalness:0}),
  dirt:new THREE.MeshStandardMaterial({color:0x735b40,roughness:1,metalness:0}),
  iron:new THREE.MeshStandardMaterial({color:0x292d2b,roughness:.48,metalness:.72}),
  warm:new THREE.MeshStandardMaterial({color:0xffb45c,emissive:0xff6b22,emissiveIntensity:1.6,roughness:.38}),
  water:new THREE.MeshPhysicalMaterial({color:0x2d8d98,roughness:.07,metalness:.05,transmission:.18,clearcoat:1,clearcoatRoughness:.08})
};

const hdBoxGeometryCache=new Map();
function hdBox(w,h,d,mat,pos,parent,rotX=0,rotY=0,rotZ=0,bevel){
  const b=bevel??Math.min(.12,Math.min(w,h,d)*.10);
  const key=[w.toFixed(3),h.toFixed(3),d.toFixed(3),b.toFixed(3)].join('|');
  let geo=hdBoxGeometryCache.get(key);
  if(!geo){
    const s=new THREE.Shape();
    s.moveTo(-w/2+b,-h/2);s.lineTo(w/2-b,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+b);
    s.lineTo(w/2,h/2-b);s.quadraticCurveTo(w/2,h/2,w/2-b,h/2);
    s.lineTo(-w/2+b,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-b);
    s.lineTo(-w/2,-h/2+b);s.quadraticCurveTo(-w/2,-h/2,-w/2+b,-h/2);
    geo=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:Math.min(b*.45,.055),bevelSize:Math.min(b*.55,.065),bevelSegments:2,curveSegments:3,steps:1});
    geo.translate(0,0,-d/2);geo.computeVertexNormals();hdBoxGeometryCache.set(key,geo);
  }
  const m=new THREE.Mesh(geo,mat);
  m.position.set(...pos);m.rotation.set(rotX,rotY,rotZ);m.castShadow=true;m.receiveShadow=true;
  (parent||scene).add(m);return m;
}
function hdCyl(r1,r2,h,mat,pos,parent,segments=24){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments,6),mat);
  m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;(parent||scene).add(m);return m;
}
function hdSphere(r,mat,pos,parent,scale=[1,1,1]){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,48,32),mat);
  m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;(parent||scene).add(m);return m;
}
function hdRoof(parent,w,d,y,mat,angle=.58){
  // Continuous, thick roof planes establish a believable architectural surface.
  // The restrained overlapping bands add depth without turning the roof into stacked boxes.
  const half=d*.48;
  const run=half/Math.cos(angle);
  const rise=half*Math.tan(angle);
  for(const side of [-1,1]){
    const panel=hdBox(w+.86, .16, run*2.0, mat,
      [0,y+rise*.50,side*half*.50],parent,side*angle,0,0,.035);
    panel.receiveShadow=true;
    // Raised fascia follows the lower eave and keeps the silhouette crisp.
    hdBox(w+1.02,.22,.24,HD.timber,[0,y+.01,side*half],parent,side*angle,0,0,.045);
    // Three shallow roof bands provide scale cues rather than chunky tile blocks.
    for(let i=0;i<3;i++){
      const t=(i+1)/4;
      const z=side*(half*t);
      const yy=y+rise*(1-t)+.07;
      hdBox(w+.94,.065,.075,HD.roof,[0,yy,z],parent,side*angle,0,0,.018);
    }
  }
  // Heavy ridge beam and cap unify both planes.
  hdBox(w+1.02,.26,.34,HD.timber,[0,y+rise+.08,0],parent,0,0,0,.055);
  hdBox(w+.34,.20,.28,mat,[0,y+rise+.18,0],parent,0,0,0,.035);
}

function hdWindow(parent,x,y,z,scale=1){
  const front = z >= 0 ? 1 : -1;
  const depth = .34*scale;
  // A real recess: cavity first, then jambs, sill, lintel and glazing set inside the wall.
  hdBox(1.22*scale,1.48*scale,depth,HD.stoneDark,[x,y,z],parent,0,0,0,.045);
  hdBox(.96*scale,1.20*scale,.08*scale,HD.timber,[x,y,z-front*.16*scale],parent,0,0,0,.025);
  hdBox(.78*scale,.98*scale,.035*scale,HD.glass,[x,y,z-front*.205*scale],parent,0,0,0,.018);
  const interior=hdBox(.68*scale,.88*scale,.018*scale,HD.warm,[x,y,z-front*.224*scale],parent,0,0,0,.012);
  interior.castShadow=false;
  interior.material.emissiveIntensity=.62;
  // Four independent frame members create depth instead of a floating rectangle.
  hdBox(.08*scale,1.22*scale,.09*scale,HD.timber,[x-.46*scale,y,z-front*.25*scale],parent,0,0,0,.018);
  hdBox(.08*scale,1.22*scale,.09*scale,HD.timber,[x+.46*scale,y,z-front*.25*scale],parent,0,0,0,.018);
  hdBox(1.00*scale,.08*scale,.09*scale,HD.timber,[x,y+.59*scale,z-front*.25*scale],parent,0,0,0,.018);
  hdBox(1.00*scale,.08*scale,.09*scale,HD.timber,[x,y-.59*scale,z-front*.25*scale],parent,0,0,0,.018);
  // Cross mullions catch the light and make the opening legible at mobile scale.
  hdBox(.055*scale,.98*scale,.065*scale,HD.timber,[x,y,z-front*.29*scale],parent,0,0,0,.012);
  hdBox(.78*scale,.055*scale,.065*scale,HD.timber,[x,y,z-front*.29*scale],parent,0,0,0,.012);
}
function hdDoor(parent,x,y,z,scale=1){
  const front = z >= 0 ? 1 : -1;
  hdBox(1.32*scale,2.48*scale,.42*scale,HD.stoneDark,[x,y,z],parent,0,0,0,.055);
  hdBox(1.08*scale,2.26*scale,.12*scale,HD.timber,[x,y,z-front*.22*scale],parent,0,0,0,.035);
  hdBox(.78*scale,1.92*scale,.045*scale,HD.timberLight,[x,y,z-front*.285*scale],parent,0,0,0,.025);
  hdBox(.58*scale,1.72*scale,.028*scale,HD.warm,[x,y,z-front*.31*scale],parent,0,0,0,.018).castShadow=false;
  hdBox(.07*scale,1.68*scale,.045*scale,HD.timber,[x,y,z-front*.335*scale],parent,0,0,0,.012);
  hdBox(.58*scale,.07*scale,.045*scale,HD.timber,[x,y+.82*scale,z-front*.335*scale],parent,0,0,0,.012);
  hdCyl(.055*scale,.055*scale,.10*scale,HD.iron,[x+.30*scale,y-.06*scale,z-front*.38*scale],parent,18).rotation.x=Math.PI/2;
}
function hdChimney(parent,x,z,height=1.7,baseY=4.15){
  const y=baseY+height/2;
  hdBox(.68,height,.68,HD.stone,[x,y,z],parent,0,0,0,.06);
  hdBox(.82,.16,.82,HD.stoneDark,[x,baseY+height+.05,z],parent,0,0,0,.055);
  hdBox(.46,.10,.46,HD.iron,[x,baseY+height+.135,z],parent,0,0,0,.025);
}
function hdGable(parent,w,h,d,mat,z,bevel=.04){
  const s=new THREE.Shape();
  s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.lineTo(-w/2,0);
  const geo=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:Math.min(bevel*.45,.035),bevelSize:Math.min(bevel,.055),bevelSegments:2,curveSegments:3});
  geo.translate(0,0,-d/2);
  const m=new THREE.Mesh(geo,mat);m.position.set(0,0,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function hdBuilding(type,x,z,scale=1,rot=0){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;g.scale.setScalar(scale);scene.add(g);
  const chapel=type==='chapel',inn=type==='inn',forge=type==='forge',mill=type==='mill',tower=type==='watchtower';
  const w=chapel?7.7:inn?8.8:forge?6.9:mill?7.5:tower?5.4:6.2;
  const d=chapel?9.5:inn?7.8:forge?6.7:mill?7.3:tower?5.4:5.9;
  const lowerH=chapel?3.45:tower?7.6:3.15, upperH=chapel?1.35:tower?1.0:1.15;
  const upperW=chapel?w*.92:tower?w*.78:w*.84, upperD=chapel?d*.93:tower?d*.78:d*.84;
  hdBox(w+.46,.72,d+.46,HD.stone,[0,.36,0],g,0,0,0,.18);
  // Irregular stepped base and a slightly offset upper mass create believable construction rather than a perfect block.
  hdBox(w,.18,d+.06,HD.stoneDark,[.04,.80,-.02],g,0,0,0,.07);
  hdBox(w,lowerH, d, chapel?HD.plasterWarm:HD.plaster,[0,.90+lowerH/2,0],g,0,0,0,.15);
  hdBox(upperW,upperH,upperD,HD.plasterWarm,[.10,.86+lowerH+upperH/2,-.04],g,0,0,0,.14);
  // Front and side structural timber are deliberately uneven in placement to avoid kit-bashed symmetry.
  for(const sx of [-1,1]){
    hdBox(.22,lowerH-.22,.26,HD.timber,[sx*(w*.43),.96+lowerH/2,d*.505],g,0,0,0,.055);
    hdBox(.18,upperH+.14,.24,HD.timber,[sx*(upperW*.43),.86+lowerH+upperH/2-.05,upperD*.505],g,0,0,0,.045);
  }
  for(const yy of [1.05,2.16,3.08]) if(yy<lowerH+.7) hdBox(w*.90,.15,.25,HD.timber,[.02,yy,d*.515],g,0,0,0,.045);
  for(const sx of [-1,1]){
    hdBox(.14,1.65,.22,HD.timber,[sx*w*.27,1.72,d*.535],g,0,0,sx*.46,.045);
    hdBox(.14,1.42,.22,HD.timber,[sx*w*.08,1.78,d*.535],g,0,0,-sx*.40,.045);
  }
  // Side-wall braces break the front facade from reading like a flat game asset.
  for(const sz of [-1,1]){
    hdBox(.13,1.45,.20,HD.timber,[w*.48,1.72,sz*d*.22],g,0,0,.42,.04);
    hdBox(.13,1.25,.20,HD.timber,[w*.48,2.35,sz*d*.42],g,0,0,-.34,.04);
  }
  // Recessed opening: dark reveal behind frame, then glass/door set back from the wall plane.
  const reveal=HD.stoneDark;
  hdBox(1.34,2.42,.18,reveal,[0,1.96,d*.525],g,0,0,0,.06);
  hdDoor(g,0,1.62,d*.64,.88);
  hdWindow(g,-w*.27,2.15,d*.535,.88);hdWindow(g,w*.27,2.15,d*.535,.88);
  hdWindow(g,-upperW*.25,3.72,upperD*.515,.64);hdWindow(g,upperW*.25,3.72,upperD*.515,.64);
  // Gabled roof is now a real architectural mass with thick eaves and a visible triangular end.
  const roofY=.92+lowerH+upperH;
  hdRoof(g,w+1.15,d+1.28,roofY,chapel?HD.roof:HD.roofWarm,chapel?.66:.57);
  // Integrated front gable: inset plaster field, timber triangle and roof-edge overlap.
  const gableZ=d*.505;
  hdGable(g,w*.92,1.52,.34,chapel?HD.stone:HD.plasterWarm,gableZ,.045);
  hdGable(g,w*.76,1.16,.055,HD.plaster,gableZ-.19,.025);
  hdBox(.16,1.25,.10,HD.timber,[-w*.19,roofY+.30,gableZ-.24],g,0,0,-.42,.02);
  hdBox(.16,1.25,.10,HD.timber,[w*.19,roofY+.30,gableZ-.24],g,0,0,.42,.02);
  hdBox(w+1.28,.22,.42,HD.timber,[0,roofY+.02,-(d+1.28)*.48],g,0,0,0,.055);
  hdBox(w+1.20,.18,.34,HD.timber,[0,roofY+.02,(d+1.28)*.48],g,0,0,0,.045);
  const chimneyBase=roofY+0.05;
  hdChimney(g,w*.24,-d*.16,forge?2.35:chapel?.95:1.7,chimneyBase);
  if(!chapel&&!tower)hdChimney(g,-w*.28,-d*.16,forge?2.0:1.3,chimneyBase);

  if(inn){
    // Offset two-storey entrance bay and deep porch make the inn read as a specific building.
    hdBox(3.35,2.55,1.02,HD.plasterWarm,[.12,2.02,d*.43],g,0,0,0,.12);
    hdBox(3.0,.22,1.70,HD.timber,[.12,1.03,d*.70],g,0,0,0,.07);
    for(const px of [-1.28,1.28])hdCyl(.09,.07,1.72,HD.timber,[.12+px,1.02,d*.74],g,28);
    hdRoof(g,3.55,1.72,3.30,HD.roofWarm,.48);
    hdBox(2.55,.72,.15,HD.timber,[.12,2.92,d*.555],g,0,0,0,.05);
    hdBox(2.12,.38,.04,HD.warm,[.12,2.92,d*.64],g,0,0,0,.02);
  }
  if(forge){
    hdBox(3.05,1.55,1.48,HD.stoneDark,[w*.31,1.58,-d*.28],g,0,0,0,.13);
    hdCyl(.42,.30,1.95,HD.iron,[w*.31,3.08,-d*.28],g,32);
    hdBox(3.55,.16,1.12,HD.timber,[-w*.18,2.42,d*.66],g,0,0,0,.05);
    hdBox(1.0,.30,.54,HD.iron,[w*.10,1.18,d*.57],g,0,0,-.08,.05);
  }
  if(mill){
    const wheel=new THREE.Group();wheel.position.set(w*.62,1.08,d*.56);g.add(wheel);
    hdCyl(1.48,1.48,.26,HD.timber,[0,0,0],wheel,56).rotation.x=Math.PI/2;
    for(let i=0;i<14;i++){const a=i*Math.PI/7;hdBox(.12,1.24,.12,HD.timber,[Math.cos(a)*.67,Math.sin(a)*.67,.15],wheel,0,0,a,.03);}
    hdCyl(.20,.20,.40,HD.iron,[0,0,.18],wheel,32).rotation.x=Math.PI/2;
    hdBox(3.0,.20,1.15,HD.stone,[w*.55,.42,d*.34],g,0,0,0,.06);
  }
  if(chapel){
    hdBox(1.70,4.55,1.72,HD.stone,[.04,3.05,d*.43],g,0,0,0,.13);
    hdRoof(g,2.08,2.10,5.22,HD.roof,.54);
    hdBox(.82,1.50,.10,HD.glass,[.04,3.02,d*.76],g,0,0,0,.025);
    hdBox(.30,.30,.20,HD.stoneDark,[.04,5.75,d*.48],g,0,0,0,.04);
  }
  if(tower){
    g.clear();
    hdBox(5.45,.72,5.45,HD.stone,[0,.36,0],g,0,0,0,.18);
    hdBox(4.25,7.85,4.25,HD.plaster,[0,4.58,0],g,0,0,0,.15);
    for(const y of [2.15,4.2,6.25])for(const sx of [-1,1])hdBox(.17,1.72,.22,HD.timber,[sx*1.36,y,2.08],g,0,0,sx*.40,.04);
    hdGable(g,4.05,1.85,.22,HD.plasterWarm,2.08,.045);
    hdRoof(g,5.80,5.80,8.55,HD.roof,.74);
    hdWindow(g,0,5.10,2.15,1.0);hdWindow(g,0,7.05,2.15,.82);
    hdChimney(g,0,0,1.0);
  }
  return g;
}
function hdTree(x,z,scale=1,pine=false){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.scale.setScalar(scale);scene.add(g);
  hdCyl(.34,.20,3.8,HD.trunk,[0,1.9,0],g,28);
  for(const [bx,by,bz,br] of [[-.45,1.8,0,.16],[.48,2.25,0,.14],[0,2.7,.38,.12]]){const b=hdCyl(br,br*.62,1.8,HD.trunk,[bx,by,bz],g,20);b.rotation.z=(bx>0?.52:-.52);}
  if(pine){
    hdCyl(2.0,1.15,2.0,HD.leaf,[0,3.25,0],g,32);
    hdCyl(1.62,.82,2.1,HD.leafLight,[0,4.65,0],g,32);
    hdCyl(1.15,.45,2.0,HD.leaf,[0,5.9,0],g,32);
  }else{
    hdSphere(1.55,HD.leaf,[0,3.65,0],g,[1.05,.88,1.02]);
    hdSphere(1.18,HD.leafLight,[-.95,4.0,.18],g,[1.05,.9,.92]);
    hdSphere(1.22,HD.leaf,[.88,4.05,-.12],g,[1.0,.92,1.0]);
    hdSphere(.98,HD.leafLight,[.05,4.85,.12],g,[1.05,.9,.95]);
  }
  return g;
}
function hdRock(x,z,scale=1){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z)+.08,z);g.scale.setScalar(scale);scene.add(g);
  const m=new THREE.Mesh(new THREE.SphereGeometry(.72,40,24),HD.stone);
  m.scale.set(1.35,.72,.96);m.rotation.set(.2,.7,.08);m.castShadow=true;m.receiveShadow=true;g.add(m);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.46,32,20),HD.stoneDark);cap.position.set(-.18,.32,.08);cap.scale.set(1.3,.34,.9);cap.castShadow=true;g.add(cap);
  return g;
}
function hdProp(name,x,z,scale=1,rot=0){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;g.scale.setScalar(scale);scene.add(g);
  if(name==='barrel'){hdCyl(.48,.48,1.0,HD.timber,[0,.5,0],g,28);for(const y of [.22,.5,.78])hdCyl(.53,.035,.04,HD.iron,[0,y,0],g,28).rotation.x=Math.PI/2;}
  else if(name==='crate'){hdBox(1,1,1,HD.timber,[0,.5,0],g);for(const a of [-.32,.32])hdBox(.09,1.05,.08,HD.timber,[a,.5,.53],g,0,0,a*.8);}
  else if(name==='bench'){hdBox(2.5,.18,.55,HD.timber,[0,.9,0],g);for(const x of [-.9,.9])hdBox(.12,.9,.12,HD.timber,[x,.45,0],g);}
  else if(name==='fence'){for(const x of [-.9,0,.9])hdCyl(.09,.09,1.25,HD.timber,[x,.62,0],g,20);hdBox(2.1,.10,.10,HD.timber,[0,.9,0],g);hdBox(2.1,.10,.10,HD.timber,[0,.55,0],g);}
  else if(name==='lantern'){hdCyl(.055,.07,2.2,HD.timber,[0,1.1,0],g,18);hdSphere(.16,HD.warm,[0,2.0,0],g,[1,.9,1]);}
  else if(name==='well'){hdCyl(1.35,1.35,.8,HD.stone,[0,.4,0],g,36);for(let i=0;i<18;i++){const a=i*Math.PI/9;hdBox(.38,.72,.22,HD.stone,[Math.cos(a)*1.12,.52,Math.sin(a)*1.12],g,0,a,0);}hdCyl(.08,.08,3.0,HD.timber,[0,1.85,0],g,20);}
  else {hdSphere(.28,HD.stone,[0,.28,0],g,[1.4,.7,1]);}
  return g;
}
function hdBridge(x,z,scale=1,rot=0){
  const g=new THREE.Group();g.position.set(x,.12,z);g.rotation.y=rot;g.scale.setScalar(scale);scene.add(g);
  // Wide timber deck with individually rounded-looking high-segment support geometry.
  for(let i=-8;i<=8;i++){const plank=hdBox(2.7,.18,.55,HD.timberLight,[i*1.0,1.15,0],g);plank.rotation.y=(i%3)*.008;}
  for(const x0 of [-8,8]){hdCyl(.38,.46,1.2,HD.stone,[x0,0,0],g,32);hdCyl(.30,.36,1.0,HD.stone,[x0,0,2.9],g,32);hdCyl(.30,.36,1.0,HD.stone,[x0,0,-2.9],g,32);}
  for(const z0 of [-3.1,3.1]){hdCyl(.16,.16,17,HD.timber,[0,2.0,z0],g,24).rotation.z=Math.PI/2;}
  for(const x0 of [-7,-3.5,0,3.5,7]){hdCyl(.09,.09,1.5,HD.timber,[x0,1.85,2.75],g,20);hdCyl(.09,.09,1.5,HD.timber,[x0,1.85,-2.75],g,20);}
  return g;
}
function hdCart(x,z,scale=1,rot=0){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;g.scale.setScalar(scale);scene.add(g);
  hdBox(2.5,.18,1.35,HD.timber,[0,.95,0],g);
  hdBox(1.9,.12,1.1,HD.timberLight,[0,1.65,0],g);
  for(const zz of [-.66,.66])hdCyl(.45,.45,.18,HD.iron,[0,.46,zz],g,32).rotation.x=Math.PI/2;
  hdCyl(.08,.08,2.1,HD.timber,[-1.0,1.15,0],g,20).rotation.z=Math.PI/2;
  return g;
}
function hdSign(x,z,scale=1,rot=0){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;g.scale.setScalar(scale);scene.add(g);
  hdCyl(.09,.12,2.4,HD.timber,[0,1.2,0],g,24);
  hdBox(1.8,.72,.12,HD.timberLight,[0,2.15,0],g);
  hdBox(1.48,.44,.035,HD.warm,[0,2.15,.08],g);
  return g;
}
function hdCharacter(root,isPlayer=false){
  const g=new THREE.Group();g.position.set(0,0,0);root.add(g);
  const cloth=isPlayer?new THREE.MeshStandardMaterial({color:0x40586a,roughness:.82}):new THREE.MeshStandardMaterial({color:0x5b493e,roughness:.88});
  const leather=new THREE.MeshStandardMaterial({color:0x3a271d,roughness:.9});
  const skin=new THREE.MeshStandardMaterial({color:0xc89472,roughness:.88});
  const metal=new THREE.MeshStandardMaterial({color:0x6b706d,metalness:.72,roughness:.28});
  // A smooth, proportioned humanoid silhouette. High segment counts eliminate the faceted mannequin look.
  hdCyl(.52,.42,1.35,cloth,[0,1.62,0],g,32);
  hdSphere(.42,skin,[0,2.55,0],g,[1,1.05,.95]);
  hdSphere(.22,cloth,[0,2.84,0],g,[1.7,.42,1.35]);
  for(const side of [-1,1]){
    const arm=hdCyl(.18,.14,1.25,cloth,[side*.62,1.72,0],g,24);arm.rotation.z=side*.12;
    hdSphere(.18,skin,[side*.66,1.08,0],g,[1,.95,1]);
    hdCyl(.20,.15,1.22,leather,[side*.25,.67,0],g,24);
    hdCyl(.22,.17,.34,leather,[side*.25,.12,0.05],g,24);
  }
  if(isPlayer){
    hdCyl(.045,.055,1.75,metal,[.78,1.72,.05],g,18).rotation.z=-.55;
    hdBox(.12,.12,.72,metal,[.38,2.48,.03],g,0,.0,-.55);
  }else{
    hdBox(1.05,.13,.20,leather,[0,1.16,.35],g);
  }
  return g;
}

function replaceLegacyVisuals(){
  const hideNames=new Set(['tree_oak','tree_pine','shrub','grass_clump','rock','cottage_A','cottage_B','cottage_C','inn','forge','chapel','mill','watchtower','bridge','well','barrel','bench','cart','crate','fence','lantern','sign','hero','character']);
  const legacy=[];
  scene.traverse(o=>{if(o.userData?.assetName && hideNames.has(o.userData.assetName))legacy.push(o);});
  legacy.forEach(g=>g.traverse(o=>{if(o.isMesh)o.visible=false;}));

  const buildingNames=new Set(['inn','forge','chapel','mill','watchtower']);
  legacy.filter(g=>buildingNames.has(g.userData.assetName)).forEach(g=>{
    hdBuilding(g.userData.assetName,g.position.x,g.position.z,g.scale.x,g.rotation.y);
  });
  legacy.filter(g=>['cottage_A','cottage_B','cottage_C'].has?.(g.userData.assetName)).forEach(g=>{});
  legacy.filter(g=>g.userData.assetName?.startsWith('cottage_')).forEach(g=>{
    const variant=g.userData.assetName==='cottage_A'?0:g.userData.assetName==='cottage_B'?1:2;
    const h=hdBuilding('cottage',g.position.x,g.position.z,g.scale.x,g.rotation.y);
    // Three genuinely different cottage silhouettes, not merely scaled copies.
    if(variant===1){
      h.scale.y*=1.12;
      hdBox(2.45,2.15,2.1,HD.plasterWarm,[1.72,1.35,-.15],h,0,0,0,.12);
      hdRoof(h,2.8,2.45,2.42,HD.roofWarm,.50);
      hdWindow(h,1.72,1.45,1.02,.72);
    }
    if(variant===2){
      h.scale.x*=1.12; h.scale.z*=.90;
      hdBox(1.72,2.55,2.0,HD.plasterWarm,[-1.48,1.60,.05],h,0,0,0,.10);
      hdRoof(h,2.05,2.35,2.88,HD.roof,.56);
      hdWindow(h,-1.48,1.52,1.08,.70);
      hdBox(1.9,.16,.26,HD.timber,[-1.48,2.72,1.08],h,0,0,0,.03);
    }
  });
  legacy.filter(g=>g.userData.assetName==='tree_oak'||g.userData.assetName==='tree_pine').forEach(g=>{
    const x=g.position.x,z=g.position.z,sc=g.scale.x;hdTree(x,z,sc,g.userData.assetName==='tree_pine');
  });
  legacy.filter(g=>g.userData.assetName==='rock').forEach(g=>hdRock(g.position.x,g.position.z,g.scale.x));
  legacy.filter(g=>['shrub','grass_clump'].includes(g.userData.assetName)).forEach(g=>{
    const x=g.position.x,z=g.position.z,sc=g.scale.x;const h=hdSphere(.48,g.userData.assetName==='shrub'?HD.leafLight:HD.leaf,[x,terrainHeight(x,z)+.3*sc,z],scene,[1.7*sc,.55*sc,1.15*sc]);
  });
  const propNames=new Set(['well','barrel','bench','fence','lantern','crate']);
  legacy.filter(g=>propNames.has(g.userData.assetName)).forEach(g=>hdProp(g.userData.assetName,g.position.x,g.position.z,g.scale.x,g.rotation.y));
  legacy.filter(g=>g.userData.assetName==='bridge').forEach(g=>hdBridge(g.position.x,g.position.z,g.scale.x,g.rotation.y));
  legacy.filter(g=>g.userData.assetName==='cart').forEach(g=>hdCart(g.position.x,g.position.z,g.scale.x,g.rotation.y));
  legacy.filter(g=>g.userData.assetName==='sign').forEach(g=>hdSign(g.position.x,g.position.z,g.scale.x,g.rotation.y));
  legacy.filter(g=>g.userData.assetName==='hero'||g.userData.assetName==='character').forEach(g=>{
    g.traverse(o=>{if(o.isMesh)o.visible=false;});
    hdCharacter(g,g.userData.assetName==='hero');
  });
}

let villageWell=null;
const interactables=[];
const gameState={quest:0, gathered:0, gold:24, inventory:{wood:12,stone:8,herb:6,fish:7}, lastInteraction:null};
function interact(obj,name,msg,action=null){if(!obj)return obj;obj.userData.interaction={name,msg,action};interactables.push(obj);return obj}
async function buildInteractions(){
 interact(landmarks.forge,'Riverside Forge','Mara: The bell rang by itself before dawn. Something moved in the old mill.',()=>advanceQuest(1));
 interact(landmarks.mill,'Ashwheel Mill','The wheel turns even when the river wind dies.',()=>advanceQuest(2));
 interact(landmarks.watchtower,'North Watch','Rowan watches the tree line. The road feels quieter than it should.',()=>advanceQuest(3));
 interact(villageWell,'Village Well','Cold water. The rope is still wet, though nobody remembers drawing it.',()=>say('You fill a flask with cold spring water.'));
}

const characters=[];let player=null;
function characterDetail(g,role){
 const cloakMat=new THREE.MeshStandardMaterial({color:role==='smith'?0x6b3027:role==='watch'?0x405c4a:0x35404a,roughness:.9});
 const leather=new THREE.MeshStandardMaterial({color:0x33251d,roughness:.92});
 const metal=new THREE.MeshStandardMaterial({color:0x4d514c,metalness:.7,roughness:.34});
 // Distinct silhouettes: each named villager gets role-specific equipment rather than a tinted clone.
 if(role==='smith'){
   const apron=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.35,.10),leather);apron.position.set(0,1.42,.43);apron.castShadow=true;g.add(apron);
   const hammer=cyl(.075,1.15,metal,[.78,1.65,.18],[0,0,.22],g);hammer.rotation.z=.22;
   const belt=box(1.18,.11,.16,leather,[0,1.03,.34],0,g);
   const boots=new THREE.MeshStandardMaterial({color:0x231914,roughness:.95});box(.30,.22,.34,boots,[-.29,.18,.02],0,g);box(.30,.22,.34,boots,[.29,.18,.02],0,g);
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(.38,.46,.20,10),cloakMat);cap.position.set(0,3.02,.01);cap.castShadow=true;g.add(cap);
 } else if(role==='watch'){
   const cloak=new THREE.Mesh(new THREE.CylinderGeometry(.62,.82,1.65,8,1,true),cloakMat);cloak.position.set(0,1.55,-.05);cloak.castShadow=true;g.add(cloak);
   const spear=cyl(.045,2.9,leather,[.82,1.65,0],[0,0,.02],g);cyl(.09,.38,metal,[.82,3.10,0],[0,0,0],g);
   const boots=new THREE.MeshStandardMaterial({color:0x20231f,roughness:.96});box(.30,.22,.34,boots,[-.29,.18,.02],0,g);box(.30,.22,.34,boots,[.29,.18,.02],0,g);
   const hood=new THREE.Mesh(new THREE.ConeGeometry(.43,.42,10),cloakMat);hood.position.set(0,3.00,.01);hood.scale.y=.55;hood.castShadow=true;g.add(hood);
 } else if(role==='player'){
   // Hero equipment pass: a restrained, readable kit that gives the player a strong
   // silhouette at the game's normal isometric distance without obscuring the base mesh.
   const steelBlue=new THREE.MeshStandardMaterial({color:0x566a73,metalness:.72,roughness:.30});
   const brass=new THREE.MeshStandardMaterial({color:0xb38a43,metalness:.62,roughness:.34});
   const cloth=new THREE.MeshStandardMaterial({color:0x35565a,roughness:.88});
   const leatherDark=new THREE.MeshStandardMaterial({color:0x2b211b,roughness:.94});
   const shoulder=new THREE.Mesh(new THREE.BoxGeometry(1.42,.18,.38),steelBlue);shoulder.position.set(0,2.25,.02);shoulder.castShadow=true;g.add(shoulder);
   // Neck guard and collar break the head/body seam and read well in silhouette.
   cyl(.27,.18,brass,[0,2.28,.04],[0,0,0],g);
   box(1.08,.12,.18,leatherDark,[0,1.15,.39],0,g);
   // Two small utility pouches make the waist feel equipped rather than decorative.
   box(.28,.28,.20,leatherDark,[-.50,1.15,.48],-.10,g);box(.28,.28,.20,leatherDark,[.50,1.15,.48],.10,g);
   // A compact kite shield sits behind the off hand; the boss gives it a readable highlight.
   const shield=new THREE.Group();shield.position.set(-.68,1.55,.12);shield.rotation.set(.08,.16,-.10);g.add(shield);
   const shieldMat=new THREE.MeshStandardMaterial({color:0x38555a,metalness:.48,roughness:.48});
   const shieldFace=new THREE.Mesh(new THREE.CylinderGeometry(.48,.38,.12,6),shieldMat);shieldFace.rotation.x=Math.PI/2;shieldFace.scale.y=1.22;shield.add(shieldFace);
   const boss=new THREE.Mesh(new THREE.SphereGeometry(.105,10,8),brass);boss.position.set(0,0,.09);shield.add(boss);
   const rim=new THREE.Mesh(new THREE.TorusGeometry(.39,.035,6,6),brass);rim.rotation.x=Math.PI/2;rim.scale.y=1.2;shield.add(rim);
   g.userData.heroShield=shield;
   // Sword is mounted as a believable sidearm rather than a floating blade.
   const sheath=cyl(.095,1.42,leatherDark,[.72,1.43,.27],[0,0,-.24],g);
   const blade=cyl(.055,1.22,steelBlue,[.72,1.76,.23],[0,0,-.24],g);
   const guard=box(.58,.09,.14,brass,[.72,2.03,.20],0,g);
   const pommel=new THREE.Mesh(new THREE.SphereGeometry(.10,8,6),brass);pommel.position.set(.72,2.14,.19);g.add(pommel);
   g.userData.heroBlade=blade;
   // Short shoulder cape adds a controlled secondary motion layer.
   const cape=new THREE.Mesh(new THREE.CylinderGeometry(.46,.66,.72,8,1,true,0,Math.PI),cloth);cape.position.set(0,1.62,-.28);cape.rotation.x=Math.PI/2;cape.scale.set(1,.92,.72);cape.castShadow=true;g.add(cape);g.userData.heroCape=cape;
   // Final silhouette polish: boots, gloves, hairline and a small shoulder clasp make the hero read as a finished character rather than a dressed primitive.
   const bootMat=new THREE.MeshStandardMaterial({color:0x211914,roughness:.96});
   const gloveMat=new THREE.MeshStandardMaterial({color:0x49372a,roughness:.88});
   const hairMat=new THREE.MeshStandardMaterial({color:0x241b17,roughness:.94});
   box(.34,.24,.42,bootMat,[-.30,.20,.04],0,g);box(.34,.24,.42,bootMat,[.30,.20,.04],0,g);
   box(.22,.24,.20,gloveMat,[-.67,1.48,.05],0,g);box(.22,.24,.20,gloveMat,[.67,1.48,.05],0,g);
   const hair=new THREE.Mesh(new THREE.SphereGeometry(.435,12,8,0,Math.PI*2,0,Math.PI*.48),hairMat);hair.position.set(0,2.92,.02);hair.scale.set(1,.62,1);hair.castShadow=true;g.add(hair);g.userData.heroHair=hair;
   const clasp=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.045,10),brass);clasp.rotation.x=Math.PI/2;clasp.position.set(0,2.18,-.30);g.add(clasp);
 }
}
async function spawnCharacter(x,z,cloth,name,role='villager'){
 const source=role==='player'?'hero':'character'; const g=await placeAsset(source,x,z,role==='player'?1.16:1,0,cloth);if(!g)return null;
 g.userData.baseY=0;g.userData.phase=Math.random()*Math.PI*2;g.userData.walking=false;g.userData.name=name;g.userData.role=role;
 g.userData.parts={arms:[],legs:[],cloak:null,body:g};g.userData.restRotationZ=g.rotation.z;g.userData.home=new THREE.Vector3(x,0,z);g.userData.wanderTarget=null;g.userData.nextWander=performance.now()+1800+Math.random()*4200;
 g.traverse(o=>{if(o.name)o.name=o.name.replace(/-?\d+$/,'');});
 g.traverse(o=>{if(o.name.startsWith('Arm_'))g.userData.parts.arms.push(o); if(o.name.startsWith('Leg_'))g.userData.parts.legs.push(o); if(o.name==='Cloak')g.userData.parts.cloak=o;});
 if(role!=='player') characterDetail(g,role);
 // Hero presentation: layered equipment pieces are kept separate so the idle/walk pass can breathe without a skinned rig.
 if(role==='player'){g.userData.heroMeshes=[];g.traverse(o=>{if(o.isMesh)g.userData.heroMeshes.push(o);});}
 label(name,[x,5.15,z],'#f0e7d2',.58);characters.push(g);return g;
}
async function buildCharacters(){
 player=await spawnCharacter(0,30,0x60746e,'YOU','player');
 const mara=await spawnCharacter(5,-10,0x8b5144,'MARA','smith');
 const rowan=await spawnCharacter(14,13,0x506e4b,'ROWAN','watch');
 interact(mara,'Mara','The bell rang by itself. I heard footsteps on the mill roof after midnight.');
 interact(rowan,'Rowan','Keep to the road after dusk. The trees have been moving where there is no wind.');
}

// Small authored environmental effects.
const fireLights=[];const embers=[];
const warmWindows=[];
function fire(x,z){const core=addMesh(new THREE.IcosahedronGeometry(.42,1),new THREE.MeshBasicMaterial({color:0xff6f31,transparent:true,opacity:.82}),[x,.85,z],undefined,false);const l=new THREE.PointLight(0xff7a32,5.5,15);l.position.set(x,2,z);scene.add(l);fireLights.push(l);for(let i=0;i<8;i++){const e=addMesh(new THREE.SphereGeometry(.055,6,6),MAT.ember,[x+(Math.random()-.5)*.6,1+Math.random()*2,z+(Math.random()-.5)*.6],undefined,false);e.userData.phase=Math.random()*6.28;embers.push(e)}}
fire(5,-10);fire(-4,-28);fire(20,-24);
const falls=addMesh(new THREE.PlaneGeometry(9,13),new THREE.MeshBasicMaterial({color:0xbbe8e4,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false}),[45,7,33],[0,.42,0],false);


// Distant ruin silhouette: a low-poly landmark beyond the playable village, giving the horizon a destination.
function buildDistantRuin(){
 const g=new THREE.Group();g.position.set(-31,.15,48);
 for(let i=0;i<7;i++){const h=3.5+(i%3)*1.1;box(1.3,h,1.1,MAT_DETAIL.stone,[-4+i*1.35,h/2,0],(i%2)*.08,g)}
 box(10,.65,1.0,MAT_DETAIL.stone,[0,4.2,0],0,g);box(7,.45,.8,MAT_DETAIL.timber,[0,5.0,0],0,g);scene.add(g);label('THE OLD RUINS',[-31,8.2,48],'#d6c49a',.65);
}
buildDistantRuin();

// Named destination dressing: each secondary location gets a visual grammar of its own.
// The goal is immediate recognition from the meadow/road, not another anonymous prop cluster.
function buildFarmArrival(){
  // Designed arrival corridor: the old road narrows at the farm gate, then opens toward Hearthmere's core.
  const gx=-31.5,gz=-18.5;
  // Gate posts and a simple timber crossbeam establish a memorable threshold.
  for(const x of [gx-2.3,gx+2.3]){
    const post=cyl(.14,2.35,MAT_DETAIL.timber,[x,1.18,gz]); post.rotation.z=(x<gx?-.025:.025);
    cyl(.19,.22,MAT_DETAIL.stone,[x,.12,gz]);
  }
  box(4.9,.16,.18,MAT_DETAIL.timber,[gx,2.25,gz]);
  // Farm track shoulders taper into the village road rather than ending abruptly.
  for(let i=0;i<11;i++){
    const t=i/10, x=-38.5+t*8.0, z=-18.5+t*2.2;
    const r=box(.28,.10,.20,MAT_DETAIL.stone,[x,-.01,z],t*.7);
    r.scale.set(1+(i%3)*.35,1,1+(i%2)*.25);
  }
  // Low fencing leads the eye through the gate; gaps keep the arrival readable.
  for(let i=0;i<7;i++){
    const x=-39+i*1.45;
    if(i===3) continue;
    cyl(.08,1.15,MAT_DETAIL.timber,[x,.58,-16.0]);
    if(i<6) box(1.45,.09,.10,MAT_DETAIL.wood,[x+.72,.85,-16.0]);
  }
  // A small roadside sign faces the incoming player and points toward the village.
  const sign=new THREE.Group(); sign.position.set(-30.0,terrainHeight(-30,-14)+.02,-14); sign.rotation.y=-.35; scene.add(sign);
  cyl(.075,1.65,MAT_DETAIL.timber,[0,.82,0],[],sign);
  box(1.55,.42,.10,MAT_DETAIL.wood,[0,1.55,0],0,sign);
  label('HEARTHMERE',[gx,3.05,gz],'#e4c878',.55);

  // Arrival storytelling: cultivated land gives way to the lived-in village edge.
  // The dressing is asymmetric so the approach has a deliberate visual rhythm.
  const fieldX=-35.5, fieldZ=-24.0;
  for(let row=0;row<6;row++){
    const rowZ=fieldZ+row*.78;
    for(let i=0;i<13;i++){
      const stem=box(.055,.34,.055,MAT_DETAIL.flower,[fieldX-5.0+i*.76,.17,rowZ],(i%4)*.12);
      stem.scale.y=.72+(i%5)*.08;
    }
  }
  // A weathered handcart marks the farm side of the threshold.
  const cartX=-38.8,cartZ=-17.0;
  box(2.15,.12,1.15,MAT_DETAIL.wood,[cartX,.82,cartZ],-.08);
  box(1.65,.10,.12,MAT_DETAIL.timber,[cartX,1.28,cartZ],-.08);
  for(const z of [cartZ-.62,cartZ+.62]) cyl(.38,.16,MAT_DETAIL.stone,[cartX-.48,.42,z],[Math.PI/2,0,0]);
  for(const x of [cartX-.82,cartX+.82]) cyl(.06,1.15,MAT_DETAIL.timber,[x,1.02,cartZ],[],scene);
  // Low milestone creates a readable transition point without becoming a gameplay blocker.
  const mileX=-28.0,mileZ=-14.2;
  box(.48,.95,.34,MAT_DETAIL.stone,[mileX,.48,mileZ],-.12);
  box(.58,.08,.40,MAT_DETAIL.stone,[mileX,.97,mileZ],-.12);
  // Two warm lantern posts begin the village lighting language before the first houses.
  for(const [lx,lz] of [[-27.0,-12.8],[-24.4,-11.7]]){
    cyl(.065,1.75,MAT_DETAIL.timber,[lx,.88,lz]);
    const glow=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),new THREE.MeshStandardMaterial({color:0xffd27a,emissive:0xff9a32,emissiveIntensity:2.2,roughness:.35}));
    glow.position.set(lx,1.68,lz);scene.add(glow);
  }

  // Arrival reveal: a compact, irregular village apron gives the player a physical
  // threshold before the road dissolves into Hearthmere's lived-in core.
  const apron=new THREE.Group(); apron.position.set(-25.4,0,-10.9); scene.add(apron);
  for(let i=0;i<19;i++){
    const a=(i/19)*Math.PI*2, r=3.1+(i%4)*.34;
    const px=Math.cos(a)*r, pz=Math.sin(a)*r*.62;
    const stone=box(.72+(i%3)*.18,.045,.54+(i%2)*.12,MAT_DETAIL.stone,[px,.025,pz],a*.17,apron);
    stone.scale.y=.8+(i%3)*.08;
  }
  // Two asymmetrical hedge/brush masses frame the first view into the village,
  // leaving the central sightline open to the landmark cluster.
  for(const [bx,bz,sc] of [[-29.3,-9.2,1.25],[-22.2,-8.0,1.05],[-29.0,-6.8,.82]]){
    const bush=new THREE.Group(); bush.position.set(bx,terrainHeight(bx,bz),bz); scene.add(bush);
    for(let j=0;j<5;j++){
      const q=new THREE.Mesh(new THREE.IcosahedronGeometry(.58*sc*(.8+(j%3)*.12),1),MAT_DETAIL.leaf);
      q.position.set((j-2)*.32,.42+(j%2)*.18,(j%3)*.28-.28); q.scale.y=.72; q.castShadow=true; bush.add(q);
    }
  }
  // A pair of low wheel-rut stones visually continues the farm track into town.
  for(let i=0;i<8;i++){
    const t=i/7, z=-13.7+t*3.1, x=-27.2+t*1.4;
    for(const off of [-.72,.72]){
      const rut=box(.34,.035,.62,MAT_DETAIL.cobble,[x+off,.018,z],-.08+(i%2)*.03);
      rut.scale.x=.78+(i%3)*.08;
    }
  }
}

function buildImportantLocations(){
  // Hearthmere Farm — orderly crop rows, gate posts, hay and a little tool shed.
  const farmX=-36,farmZ=-20;
  for(let row=0;row<5;row++){
    for(let i=0;i<9;i++){
      const crop=box(.10,.38,.10,MAT_DETAIL.flower,[farmX-3.2+i*.82,.20,farmZ-2.6+row*1.25],0);
      crop.scale.y=.65+(i%3)*.12;
    }
  }
  for(const x of [farmX-4.2,farmX+4.2]) cyl(.13,2.0,MAT_DETAIL.timber,[x,1,farmZ],[],scene);
  box(8.6,.08,.10,MAT_DETAIL.wood,[farmX,2.0,farmZ]);
  hayStack(farmX+5.4,farmZ+1.5,1.15);hayStack(farmX+5.0,farmZ+3.0,.82);
  const shed=box(3.0,2.0,2.4,MAT_DETAIL.wood,[farmX+4.7,1,farmZ-3.0]);shed.castShadow=true;
  roofRidge(new THREE.Group(),3.6,3.0,1.0,MAT_DETAIL.timber);
  label('HEARTHMERE FARM',[farmX,5.0,farmZ],'#e4c878',.62);

  // Old mine — timber-framed stone portal, spoil heap and ore carts immediately signal a mine.
  const mineX=-43,mineZ=12;
  const portal=new THREE.Group();portal.position.set(mineX,terrainHeight(mineX,mineZ),mineZ);scene.add(portal);
  for(const x of [-2.0,2.0]) box(.75,3.8,1.0,MAT_DETAIL.stone,[x,1.9,0],0,portal);
  box(4.7,.85,1.0,MAT_DETAIL.stone,[0,4.0,0],0,portal);
  box(3.7,.22,.28,MAT_DETAIL.timber,[0,3.25,.55],0,portal);
  for(const x of [-1.45,0,1.45]) box(.18,3.0,.22,MAT_DETAIL.timber,[x,1.65,.58],0,portal);
  for(let i=0;i<7;i++) box(.55,.24,.42,MAT_DETAIL.stone,[-4.0+i*.55,.25,1.8+(i%2)*.38],i*.2);
  box(1.7,.22,1.0,MAT_DETAIL.wood,[-5.0,.28,2.8],-.08);
  label('OLD IRON MINE',[mineX,6.0,mineZ],'#d6c49a',.62);

  // Fisher's bend — dock posts, a small jetty, reeds and hanging nets create a water-specific identity.
  const fx=26,fz=-2;
  for(const x of [fx-2,fx,fx+2]) cyl(.10,2.0,MAT_DETAIL.timber,[x,1,fz+1.7]);
  box(4.7,.16,1.15,MAT_DETAIL.wood,[fx,.62,fz+1.7],0,scene);
  for(let i=0;i<5;i++) box(.12,.12,1.05,MAT_DETAIL.timber,[fx-1.8+i*.9,.82,fz+1.7],0,scene);
  reedPatch(29,-3,.2);reedPatch(30,0,-.4);
  const net=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.2,5,4),new THREE.MeshStandardMaterial({color:0x6c746b,transparent:true,opacity:.55,side:THREE.DoubleSide,roughness:1}));
  net.position.set(fx-2.8,1.4,fz+1.2);net.rotation.set(0,.2,-.18);scene.add(net);
  label('FISHER\'S BEND',[fx,3.7,fz],'#b9d8c8',.60);
  // Fisher's Bend landing: a lived-in west-bank work edge, with a skiff pulled above the reeds.
  const lx=17.15,lz=-2.6;
  const landing=new THREE.Group(); landing.position.set(lx,terrainHeight(lx,lz)+.03,lz); scene.add(landing);
  for(let i=0;i<6;i++){
    const stone=box(.62,.18,.42,MAT_DETAIL.stone,[-1.65+i*.66,.09,(i%2)*.12],i*.12,landing);
    stone.scale.set(1+(i%3)*.16,.8,1+(i%2)*.14);
  }
  // A small hauled-up skiff adds a strong silhouette without occupying the walking route.
  const boat=new THREE.Group(); boat.position.set(lx+2.1,terrainHeight(lx+2.1,lz+.9)+.10,lz+.9); boat.rotation.y=-.25; scene.add(boat);
  const hull=new THREE.Mesh(new THREE.CapsuleGeometry(.62,2.5,4,10),MAT_DETAIL.wood); hull.scale.set(.62,.22,1); hull.rotation.z=Math.PI/2; hull.castShadow=true; boat.add(hull);
  box(2.0,.07,.08,MAT_DETAIL.timber,[0,.30,0],0,boat);
  for(const zoff of [-.42,.42]) box(1.25,.06,.08,MAT_DETAIL.timber,[0,.34,zoff],0,boat);
  cyl(.035,1.65,MAT_DETAIL.timber,[.18,.88,0],[0,0,0],boat);
  const crateMat=new THREE.MeshStandardMaterial({color:0x70513a,roughness:.9});
  for(let i=0;i<3;i++) box(.62,.48,.58,crateMat,[4.0+i*.72,.28,-.45+(i%2)*.62],(i%2)*.12,landing);
  // A low net-drying frame and fish baskets make the location read as a working shoreline.
  for(const xoff of [3.25,5.0]) cyl(.06,1.65,MAT_DETAIL.timber,[xoff,.82,.75],[],landing);
  box(1.9,.06,.06,MAT_DETAIL.timber,[4.12,1.55,.75],0,landing);
  const smallNet=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.95,5,3),new THREE.MeshStandardMaterial({color:0x687269,transparent:true,opacity:.48,side:THREE.DoubleSide,roughness:1}));
  smallNet.position.set(4.12,1.02,.78); smallNet.rotation.set(.08,.05,.12); landing.add(smallNet);

  // Moonwood clearing — a ring of deliberate standing stones and a central fire scar.
  const cx=36,cz=34;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const r=4.8;const s=box(.75,1.15,.62,MAT_DETAIL.stone,[cx+Math.cos(a)*r,.58,cz+Math.sin(a)*r],a*.15);s.scale.y=.7+(i%3)*.18;}
  for(let i=0;i<9;i++) cyl(.16,.7,MAT_DETAIL.wood,[cx+(Math.random()-.5)*1.7,.35,cz+(Math.random()-.5)*1.7],[0,Math.random()*Math.PI,Math.PI/2]);
  label('MOONWOOD CLEARING',[cx,3.0,cz],'#c8d1b2',.58);

  // Old road ruins — broken masonry, a fallen lintel and a lone marker make the distant destination tangible.
  const rx=-31,rz=48;
  for(let i=0;i<8;i++){const a=i%4;box(.65+.2*(i%2),.55+.25*(i%3),.55,MAT_DETAIL.stone,[rx-5+a*2.8,.35,rz-2+Math.floor(i/4)*4],i*.18)}
  box(7.0,.55,.75,MAT_DETAIL.stone,[rx,2.5,rz+3],.16);
  cyl(.12,2.7,MAT_DETAIL.timber,[rx+6,1.35,rz+1.5]);
  label('THE OLD ROAD RUINS',[rx,7.0,rz],'#d6c49a',.60);
}
buildImportantLocations();

// Soft atmospheric motes over the village. Sparse by design for mobile performance.
const motes=[];const moteMat=new THREE.SpriteMaterial({color:0xf1d9a0,transparent:true,opacity:.18,depthWrite:false});
for(let i=0;i<70;i++){const sp=new THREE.Sprite(moteMat.clone());sp.position.set(-45+Math.random()*90,1+Math.random()*9,-40+Math.random()*90);sp.scale.setScalar(.035+Math.random()*.055);sp.userData.phase=Math.random()*6.28;scene.add(sp);motes.push(sp)}

// Minimap
const mini=document.createElement('canvas');mini.id='minimap';mini.width=220;mini.height=160;mini.style.cssText='position:fixed;right:18px;top:95px;width:220px;height:160px;border:1px solid rgba(228,200,120,.24);border-radius:12px;background:rgba(9,14,13,.72);box-shadow:0 12px 35px #0008;backdrop-filter:blur(8px);pointer-events:none';document.body.appendChild(mini);const mx=mini.getContext('2d');
function minimap(){mx.clearRect(0,0,220,160);mx.fillStyle='#15201d';mx.fillRect(0,0,220,160);mx.strokeStyle='#28757b';mx.lineWidth=20;mx.beginPath();mx.moveTo(170,0);mx.lineTo(150,160);mx.stroke();mx.strokeStyle='#79664e';mx.lineWidth=9;mx.beginPath();mx.moveTo(110,160);mx.lineTo(110,0);mx.stroke();mx.fillStyle='#8a755b';for(const p of [[62,35],[155,55],[55,100],[155,119],[112,24]])mx.fillRect(p[0],p[1],22,15);if(player){mx.fillStyle='#e4c878';mx.beginPath();mx.arc(110+(player.position.x/80)*70,80+(player.position.z/80)*65,4.5,0,Math.PI*2);mx.fill()}}

// Gameplay layer: small, tactile gathering loop and quest progression.
const resourceNodes=[];
function advanceQuest(step){
 if(step<=gameState.quest){say('You have already searched this place.');return;}
 gameState.quest=step;
 const texts={1:'Objective updated — inspect the Ashwheel Mill.',2:'Objective updated — ask Rowan what he saw from the watch.',3:'Objective complete — the crossing is listening.'};
 say(texts[step]||'Objective updated.');
 const q=document.querySelector('.quest');
 if(q){const title=q.querySelector('b'),desc=q.querySelector('span');
  if(step===1){title.textContent='Smoke on the Water';desc.textContent='Inspect the Ashwheel Mill and find out why the wheel turns without wind.'}
  if(step===2){title.textContent='A Quiet Watch';desc.textContent='Speak with Rowan at North Watch. Something is moving beyond the trees.'}
  if(step===3){title.textContent='The Listening Road';desc.textContent='The first mystery is solved. Follow the old road when the bells ring again.'}
 }
}
async function buildResourceNodes(){
 const specs=[];
 for(let i=0;i<14;i++) specs.push(['tree_oak',-40+Math.random()*18,-36+Math.random()*70,.42+Math.random()*.16]);
 for(let i=0;i<9;i++) specs.push(['rock',20+Math.random()*22,-36+Math.random()*68,.36+Math.random()*.12]);
 for(const [asset,x,z,scale] of specs){const g=await placeAsset(asset,x,z,scale,Math.random()*Math.PI*2);if(!g)continue;g.userData.resource={type:asset==='rock'?'stone':'wood',amount:1};interact(g,asset==='rock'?'Stone outcrop':'Young oak',asset==='rock'?'Gather a piece of clean river stone.':'Gather a fallen branch.',()=>gather(g));resourceNodes.push(g)}
}
function gather(g){const r=g.userData.resource;if(!r)return;if(!g.visible)return;say(r.type==='wood'?'You gather useful wood.':'You collect a smooth stone.');gameState.gathered++;gameState.inventory[r.type]=(gameState.inventory[r.type]||0)+r.amount;g.visible=false;setTimeout(()=>{g.visible=true},6500);}

// Movement and targeting
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let dest=null;let cinematicMode=false;let hovered=null;
function setHover(o){if(hovered===o)return;if(hovered?.traverse)hovered.traverse(m=>{if(m.isMesh&&m.material?.emissive)m.material.emissive.setHex(m.userData.baseEmissive||0x000000)});hovered=o;if(hovered?.traverse)hovered.traverse(m=>{if(m.isMesh&&m.material?.emissive){m.userData.baseEmissive=m.material.emissive.getHex();m.material.emissive.lerp(new THREE.Color(0x9d7b39),.35)}})}
renderer.domElement.addEventListener('pointermove',e=>{mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(interactables,true);let o=hits[0]?.object||null;while(o&&!o.userData.interaction)o=o.parent;setHover(o)});
const destinationMarker=new THREE.Mesh(new THREE.RingGeometry(.34,.52,28),new THREE.MeshBasicMaterial({color:0xe7cb76,transparent:true,opacity:.86,side:THREE.DoubleSide,depthWrite:false}));destinationMarker.rotation.x=-Math.PI/2;destinationMarker.position.y=.18;destinationMarker.visible=false;scene.add(destinationMarker);
function terrainHeight(x,z){return macroTerrainHeight(x,z);}
function traversable(x,z){const riverBlocked=Math.abs(x-31)<13.4;const bridge=Math.abs(x-31)<6.2&&z>-2&&z<14;return !riverBlocked||bridge}
function say(s){toast.textContent=s;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),2600)}
function pick(e){mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(interactables,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.interaction)o=o.parent;if(o){say(`${o.userData.interaction.name} — ${o.userData.interaction.msg}`);if(o.userData.interaction.action)o.userData.interaction.action();return}}const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),p=new THREE.Vector3();if(ray.ray.intersectPlane(plane,p)){p.x=THREE.MathUtils.clamp(p.x,WORLD_BOUNDS.minX,WORLD_BOUNDS.maxX);p.z=THREE.MathUtils.clamp(p.z,WORLD_BOUNDS.minZ,WORLD_BOUNDS.maxZ);if(!traversable(p.x,p.z)){say('The river is too deep here. Cross at the stone bridge.');return}dest=p.clone();destinationMarker.position.set(p.x,.2,p.z);destinationMarker.visible=true}}
renderer.domElement.addEventListener('pointerdown',pick);
captureButton?.addEventListener('click',captureRealFrame);
cinematic.addEventListener('click',()=>{cinematicMode=!cinematicMode;document.body.classList.toggle('cinematic',cinematicMode);cinematic.textContent=cinematicMode?'RETURN':'CINEMATIC';say(cinematicMode?'Cinematic world view':'Interactive world view')});
const hudMenu=document.querySelector('#hud-menu');
const inventoryPanel=document.querySelector('.panel');
hudMenu?.addEventListener('click',()=>{const open=inventoryPanel.classList.toggle('mobile-open');hudMenu.textContent=open?'CLOSE':'MENU';});
addEventListener('keydown',e=>{if(e.key==='Escape'){dest=null;destinationMarker.visible=false;cinematicMode=false;document.body.classList.remove('cinematic');cinematic.textContent='CINEMATIC'}if(e.key.toLowerCase()==='m')say('Map — Ashenvale Crossing')});

// Living atmosphere: soft smoke columns and distant birds keep the scene from feeling static.
const smoke=[];
function smokeColumn(x,z){for(let i=0;i<7;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({color:0xb8b2a2,transparent:true,opacity:.055,depthWrite:false}));sp.position.set(x+(Math.random()-.5)*.4,.9+i*.65,z+(Math.random()-.5)*.4);sp.scale.setScalar(.35+Math.random()*.28);sp.userData.phase=Math.random()*6.28;smoke.push(sp);scene.add(sp)}}
smokeColumn(5,-10);smokeColumn(-4,-28);smokeColumn(20,-24);
const birds=[];const birdMat=new THREE.MeshBasicMaterial({color:0x1e2825,side:THREE.DoubleSide});
for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.PlaneGeometry(.7,.22),birdMat);b.position.set(-30+i*11,13+i*.7,15+i*9);b.userData.phase=i*1.7;scene.add(b);birds.push(b)}
let last=performance.now(),time=0;
const perfStats={frames:0,frameMs:0,minFrameMs:Infinity,maxFrameMs:0,drawCalls:0,triangles:0,geometries:0,textures:0,qualityLevel:0,updatedAt:0};
window.__HEARTHMERE_PERF=perfStats;
const tmpTarget=new THREE.Vector3();
const tmpMove=new THREE.Vector3();
const tmpNext=new THREE.Vector3();
const tmpWanderDelta=new THREE.Vector3();

// Hero readability pass: a soft selection disc, grounded shadow, and stronger layered motion.
const heroRing=new THREE.Mesh(new THREE.RingGeometry(.52,.68,32),new THREE.MeshBasicMaterial({color:0xe5c66e,transparent:true,opacity:.34,side:THREE.DoubleSide,depthWrite:false}));
heroRing.rotation.x=-Math.PI/2;heroRing.position.y=.035;heroRing.visible=false;scene.add(heroRing);
function updateHeroPresentation(){
  if(!player)return;
  heroRing.visible=true;heroRing.position.set(player.position.x,.035,player.position.z);heroRing.scale.setScalar(1+Math.sin(time*2.8)*.035);
  const walking=player.userData.walking?1:0, ph=time*(walking?9.5:2.1)+player.userData.phase;
  if(player.userData.parts.arms.length){player.userData.parts.arms.forEach((a,j)=>{a.rotation.z=Math.sin(ph)*(walking?.34:.025)*(j?-1:1);a.rotation.x=walking?Math.cos(ph)*.08:Math.sin(time*1.4+ j)*.012;});}
  if(player.userData.parts.legs.length){player.userData.parts.legs.forEach((l,j)=>l.rotation.x=Math.sin(ph)*(walking?.48:.018)*(j?-1:1));}
  if(player.userData.parts.cloak){player.userData.parts.cloak.rotation.x=Math.sin(time*2.2+player.userData.phase)*.035;player.userData.parts.cloak.rotation.y=Math.sin(time*1.7+player.userData.phase)*.028;}
  if(player.userData.heroCape){const amp=walking?.055:.018;player.userData.heroCape.rotation.z=Math.sin(ph*.72)*amp;player.userData.heroCape.rotation.y=-.08+Math.sin(ph*.51)*amp*.7;}
  if(player.userData.heroShield){player.userData.heroShield.rotation.z=-.10+Math.sin(ph)*.018*walking;player.userData.heroShield.position.y=1.55+Math.sin(ph)*.012*walking;}
  if(player.userData.heroBlade){player.userData.heroBlade.rotation.z=-.24+Math.sin(ph)*.012*walking;}
}

function updateVillager(g,t,dt){
 if(g===player)return;
 const now=t;
 if(!g.userData.wanderTarget && now>g.userData.nextWander){
   const a=Math.random()*Math.PI*2,r=2.5+Math.random()*5.5;
   const tx=g.userData.home.x+Math.cos(a)*r,tz=g.userData.home.z+Math.sin(a)*r;
   if(traversable(tx,tz)){g.userData.wanderTarget=new THREE.Vector3(tx,0,tz);g.userData.walking=true;}
   g.userData.nextWander=now+6500+Math.random()*6500;
 }
 const target=g.userData.wanderTarget;if(!target)return;
 const d=tmpWanderDelta.copy(target).sub(g.position);d.y=0;const len=d.length();
 if(len<.28){g.userData.wanderTarget=null;g.userData.walking=false;return;}
 d.normalize();g.position.x+=d.x*dt*1.15;g.position.z+=d.z*dt*1.15;g.position.y=terrainHeight(g.position.x,g.position.z)+.02;
 g.rotation.y=THREE.MathUtils.lerp(g.rotation.y,Math.atan2(d.x,d.z),Math.min(1,dt*7));
}
function updatePerformanceStats(now,frameMs){
  perfStats.frames++;
  perfStats.frameMs+=frameMs;
  perfStats.minFrameMs=Math.min(perfStats.minFrameMs,frameMs);
  perfStats.maxFrameMs=Math.max(perfStats.maxFrameMs,frameMs);
  if(perfStats.frames<60)return;
  perfStats.frameMs/=perfStats.frames;
  perfStats.drawCalls=renderer.info.render.calls;
  perfStats.triangles=renderer.info.render.triangles;
  perfStats.geometries=renderer.info.memory.geometries;
  perfStats.textures=renderer.info.memory.textures;
  perfStats.qualityLevel=quality.level;
  perfStats.updatedAt=now;
  if(diagnosticsMode) console.table(perfStats);
  perfStats.frames=0;perfStats.frameMs=0;perfStats.minFrameMs=Infinity;perfStats.maxFrameMs=0;
}
function updateAdaptiveQuality(now){
  if(captureMode) return;
  quality.frameCount++;
  if(quality.frameCount<90) return;
  const elapsed=now-quality.sampleStarted;
  const avgFrameMs=elapsed/quality.frameCount;
  quality.frameCount=0;quality.sampleStarted=now;
  let next=quality.level;
  if(avgFrameMs>24 && quality.level<3) next=quality.level+1;
  else if(avgFrameMs<15 && quality.level>0) next=quality.level-1;
  if(next===quality.level) return;
  quality.level=next;
  quality.pixelRatioCap=[1.55,1.40,1.25,1.10][quality.level];
  quality.ssaoScale=[.75,.70,.64,.58][quality.level];
  setShadowMapSize([3072,2560,2048,1536][quality.level]);
  const pixelRatio=Math.min(devicePixelRatio,quality.pixelRatioCap);
  renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight);
  composer.setPixelRatio(pixelRatio);resizeSSAO();
  rendererDiagnostics.pixelRatio=pixelRatio;rendererDiagnostics.qualityLevel=quality.level;rendererDiagnostics.averageFrameMs=avgFrameMs;
}
function frame(t){const rawDt=Math.max(0,t-last)/1000;const dt=Math.min(.05,rawDt);last=t;time+=dt;
 if(MAT.water.userData.shader)MAT.water.userData.shader.uniforms.uTime.value=time;
 if(dest&&player){const d=tmpMove.copy(dest).sub(player.position);d.y=0;const len=d.length();if(len<.25){dest=null;player.userData.walking=false;destinationMarker.visible=false}else{d.normalize();const next=tmpNext.copy(player.position).addScaledVector(d,dt*5.5);if(traversable(next.x,next.z)){player.position.copy(next);player.position.y=terrainHeight(next.x,next.z)+.02;player.rotation.y=Math.atan2(d.x,d.z);player.userData.walking=true}else{dest=null;player.userData.walking=false;destinationMarker.visible=false;say('You cannot cross the river here.')}}}
 characters.forEach((g,i)=>{
  updateVillager(g,t,dt);
  const walk=g.userData.walking?1:0; const phase=time*9+g.userData.phase; const swing=Math.sin(phase)*(.48*walk+.06*(1-walk));
  if(g.userData.parts.arms.length){g.userData.parts.arms.forEach((a,j)=>a.rotation.z=(j?swing:-swing));}
  if(g.userData.parts.legs.length){g.userData.parts.legs.forEach((l,j)=>l.rotation.x=(j?-swing:swing)*.7);}
  // Current character source is unskinned; subtle root motion keeps the silhouette alive.
  g.position.y+=(walk?Math.sin(phase)*.028:Math.sin(time*2+g.userData.phase)*.012);
  g.rotation.z=THREE.MathUtils.lerp(g.rotation.z,Math.sin(phase*.5)*(.018*walk),.12);
  if(g.userData.parts.cloak)g.userData.parts.cloak.position.z=.38+Math.sin(time*3.1+g.userData.phase)*.025;
  if(g===player&&g.userData.heroMeshes){const breathe=Math.sin(time*2.15)*.012;g.userData.heroMeshes.forEach((m,j)=>{m.rotation.z+=Math.sin(time*1.7+j*.37)*.0007;m.scale.y=1+breathe*(j%3===0?1:.35)});}
  if(g.userData.mixer)g.userData.mixer.update(dt);if(g===player){g.position.y=terrainHeight(g.position.x,g.position.z)+.02+Math.sin(time*7)*.018}else{g.position.y=terrainHeight(g.position.x,g.position.z)+.02+Math.sin(time*1.7+(g.userData.phase||0))*.035;g.rotation.y+=Math.sin(time*.65+(g.userData.phase||0))*dt*.018}});
 foliage.forEach((g,i)=>{const ph=g.userData.windPhase??i*.71;const st=g.userData.windStrength??.008;g.rotation.z=Math.sin(time*.48+ph)*st;g.rotation.x=Math.cos(time*.42+ph*.61)*st*.72});
 shorelineGlints.forEach((g,i)=>{g.material.opacity=.10+.11*(Math.sin(time*1.35+i*.63)+1)/2;g.scale.x=.82+.32*(Math.sin(time*1.1+i)+1)/2});
 if(MAT.grass.userData.shader)MAT.grass.userData.shader.uniforms.uTime.value=time;
 updateHeroPresentation();
 foam.forEach((r,i)=>{r.position.z+=dt*(.65+(i%4)*.1);r.scale.x=1.5+Math.sin(time*1.8+i)*.22;r.material.opacity=.16+.10*(Math.sin(time*1.4+i)+1);if(r.position.z>62)r.position.z=-52;r.position.x=27+Math.sin(time*.7+i*1.8)*3.8});
 embers.forEach((e,i)=>{e.position.y+=dt*(.35+Math.sin(i)*.08);e.position.x+=Math.sin(time*2+i)*dt*.025;if(e.position.y>3)e.position.y=.9;e.material.opacity=.35+.5*(Math.sin(time*6+i)+1)/2});
 fireLights.forEach((l,i)=>l.intensity=5.1+Math.sin(time*7+i)*.75+Math.sin(time*13)*.3);warmWindows.forEach((m,i)=>m.emissiveIntensity=.10+.055*(Math.sin(time*.9+i*.73)+1)/2);
 smoke.forEach((s,i)=>{s.position.y+=dt*(.22+.025*i);s.position.x+=Math.sin(time*.65+s.userData.phase)*dt*.018;s.material.opacity=.035+.025*(Math.sin(time*.8+s.userData.phase)+1)/2;if(s.position.y>6){s.position.y=.9;s.position.x+=((i%2)-.5)*.3}});
 clouds.forEach((c,i)=>{c.position.x+=dt*c.userData.speed;if(c.position.x>120)c.position.x=-120;});
birds.forEach((b,i)=>{b.position.x+=dt*(1.2+i*.15);b.position.z+=Math.sin(time*.8+b.userData.phase)*dt*.12;b.rotation.z=Math.sin(time*7+b.userData.phase)*.16;if(b.position.x>55)b.position.x=-55});
 motes.forEach((m,i)=>{m.position.y+=dt*(.018+Math.sin(i)*.006);m.position.x+=Math.sin(time*.25+m.userData.phase)*dt*.012;m.material.opacity=.08+.12*(Math.sin(time*.7+m.userData.phase)+1)/2;if(m.position.y>10)m.position.y=1});
 const day=(Math.sin(time*.014)+1)/2;scene.fog.density=.00158+.00052*(1-day);sun.position.x=-58+Math.sin(time*.018)*18;sun.position.z=42+Math.cos(time*.014)*14;sun.intensity=1.85+2.15*day;moon.intensity=.08+.32*(1-day);hemi.intensity=.94+.54*day;renderer.toneMappingExposure=.94+.10*day;scene.environmentIntensity=.30+.12*day;
 if(player){
  const oldTargetX=controls.target.x,oldTargetZ=controls.target.z;
  tmpTarget.set(player.position.x,0,player.position.z);
  controls.target.lerp(tmpTarget,.11);
  const dx=controls.target.x-oldTargetX,dz=controls.target.z-oldTargetZ;
  camera.position.x+=dx;camera.position.z+=dz;
  if(!camera.userData.followInit){camera.position.set(controls.target.x+27,18,controls.target.z+25);camera.userData.followInit=true;}
}
for(const labelMesh of worldLabels) labelMesh.visible=!cinematicMode;
controls.update();composer.render();const frameMs=rawDt*1000;updatePerformanceStats(t,frameMs);updateAdaptiveQuality(t);destinationMarker.scale.setScalar(1+Math.sin(time*5)*.08);minimap();if(autoCaptureArmed && player && window.__HEARTHMERE_READY && cc0LoadStats.pending===0 && performance.now()-captureReadyAt>1200 && renderer.info.render.calls>0){autoCaptureArmed=false;captureRequested=true;}if(captureRequested){captureRequested=false;renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hearthmere-real-game-frame.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)},'image/png')}}
renderer.setAnimationLoop(frame);

(async()=>{bootSet(.10,'Assembling the village…');await buildLandmarks();bootSet(.69,'Dressing Hearthmere…');await dressVillage();await buildResidentialQuarter();addVillageMicroDressing();bootSet(.79,'Growing the woodland…');await buildFoliage();bootSet(.82,'Finishing woodland dressing…');await buildNaturalDressing();buildLandscapeAnchors();buildWorldVisualPass();buildFarmArrival();bootSet(.86,'Placing gathering sites…');await buildResourceNodes();bootSet(.91,'Calling the villagers…');await buildCharacters();replaceLegacyVisuals();applyCC0Materials();await buildInteractions();bootSet(.975,'Preparing materials and shaders…');await renderer.compileAsync(scene,camera);bootSet(1,'The lanterns are lit.');window.__HEARTHMERE_READY=true;captureReadyAt=performance.now();setTimeout(()=>{boot.style.opacity='0';setTimeout(()=>boot.remove(),650)},420)})().catch(err=>{console.error(err);bootStatus.textContent='Runtime error: '+(err?.message||String(err));});

document.querySelectorAll('.tabs button').forEach((btn,i)=>btn.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const bodies=['INVENTORY — 15 carried items','SKILLS — Combat 1 · Gathering 1 · Crafting 1','EQUIPMENT — Iron blade · Traveller cloak · Field boots','MAP — Ashenvale Crossing'];say(bodies[i]||'Hearthmere');}));
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const pixelRatio=Math.min(devicePixelRatio,quality.pixelRatioCap);renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(pixelRatio);resizeSSAO();rendererDiagnostics.pixelRatio=pixelRatio;rendererDiagnostics.drawingBuffer=[renderer.domElement.width,renderer.domElement.height];mini.style.right=innerWidth<600?'10px':'18px';mini.style.top=innerWidth<600?'58px':'95px'});

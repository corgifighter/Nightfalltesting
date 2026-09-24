import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/loaders/GLTFLoader.js';
import {EffectComposer} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/UnrealBloomPass.js';
import {SSAOPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/SSAOPass.js';
import {OutputPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/OutputPass.js';
import {FXAAPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/FXAAPass.js';
import {ShaderPass} from 'https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/ShaderPass.js';

const root=document.querySelector('#scene');
// Stage 2 engineering foundation: deterministic world generation.
// Visual iteration must be reproducible so screenshots, performance samples, and bug reports
// describe the same authored world instead of a new random layout on every reload.
const WORLD_SEED=0x6e696768; // "nigh" — fixed art-direction seed
let worldRngState=WORLD_SEED>>>0;
function worldRandom(){
  worldRngState=(worldRngState+0x6D2B79F5)>>>0;
  let t=worldRngState;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
}
const captureMode=new URLSearchParams(location.search).get('capture')==='1';
const params=new URLSearchParams(location.search);
const forensicMode=params.get('forensic')||'';
const hideClouds=params.get('clouds')==='0';
const rawRender=params.get('raw')==='1';
const rawNormal=params.get('normal')==='1';
const rawBasic=params.get('basic')==='1';
const rawBasicDirect=params.get('basicdirect')==='1';
const rawDepth=params.get('depth')==='1';
const rawNormalDirect=params.get('normaldirect')==='1';
const rawUncompiled=params.get('uncompiled')==='1';
const rawLambertDirect=params.get('lambertdirect')==='1';
const rawFlatDirect=params.get('flatdirect')==='1';
const rawFrameDirect=params.get('framedirect')==='1';
const rawMaterialProbe=params.get('materialprobe')==='1';
const rawWorldProbe=params.get('worldprobe')==='1';
window.__HEARTHMERE_FORENSIC_WORLD_PROBE=false;
function runPostBuildWorldProbe(){
  if(!rawWorldProbe)return;
  // BUILD 108 FORENSIC WORLD-FRAME TEST.
  // The previous probe proved the direct path with the red anchor, but a uniform
  // white override cannot tell us whether world meshes are actually in the current
  // camera frustum. This diagnostic therefore uses vivid per-mesh colors, disables
  // depth testing/culling, excludes the sky from the bounds calculation, and keeps
  // the diagnostic branch active for every raw frame.
  const prior=[];let meshes=0;let visibleBefore=0;const bounds=new THREE.Box3();
  const center=new THREE.Vector3();let colored=0;
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{
    if(o===scene)return;
    if(o===sky){if(o.visible===false){prior.push([o,o.visible]);o.visible=true;}return;}
    if(o.isMesh&&o.geometry){
      meshes++;
      if(o.visible)visibleBefore++;
      prior.push([o,o.visible,o.material,o.frustumCulled]);
      o.visible=true;o.frustumCulled=false;
      const c=new THREE.Color().setHSL((colored++%17)/17,.82,.56);
      o.material=new THREE.MeshBasicMaterial({color:c,fog:false,side:THREE.DoubleSide,depthTest:false,depthWrite:false});
      o.updateWorldMatrix(true,false);
      const b=new THREE.Box3().setFromObject(o);if(!b.isEmpty())bounds.union(b);
    }else if(o.visible===false){prior.push([o,o.visible]);o.visible=true;}
  });
  scene.visible=true;sky.visible=false;
  bounds.getCenter(center);
  window.__HEARTHMERE_FORENSIC_WORLD_PROBE_STATS={
    meshes,visibleBefore,sceneRootChildren:scene.children.length,
    boundsEmpty:bounds.isEmpty(),boundsMin:bounds.min.toArray(),boundsMax:bounds.max.toArray(),
    boundsCenter:center.toArray(),camera:camera.position.toArray(),target:controls.target.toArray()
  };
  const marker=new THREE.Mesh(
    new THREE.BoxGeometry(3,3,3),
    new THREE.MeshBasicMaterial({color:0xff3030,fog:false,depthTest:false,depthWrite:false})
  );
  marker.position.copy(controls.target);marker.name='WORLD_PROBE_ANCHOR';scene.add(marker);
  renderer.setClearColor(0x202428,1);
  window.__HEARTHMERE_FORENSIC_WORLD_PROBE=true;
  // Leave the diagnostic materials and visibility active. The render loop sees the
  // forensic flag and renders this scene directly on every frame, so composer or
  // later animation frames cannot overwrite the probe result.
}

const renderPassOnly=forensicMode==='renderpass';
window.__HEARTHMERE_FORENSIC_RAW_RENDER=rawRender;
window.__HEARTHMERE_FORENSIC_MODE=forensicMode||'baseline';
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
window.__HEARTHMERE_READY_STATE={
  bootStartedAt:performance.now(),
  requiredAssetsReady:false,
  visualWorldReady:false,
  shadersReady:false,
  firstFrameRendered:false,
  readyAt:0
};
const runtimeDiagnostics={errors:[],unhandledRejections:[],contextLost:false,contextRestoreCount:0,visibilityState:document.visibilityState};
window.__HEARTHMERE_RUNTIME_DIAGNOSTICS=runtimeDiagnostics;
function recordRuntimeIssue(kind,payload){const entry={time:performance.now(),...payload};runtimeDiagnostics[kind].push(entry);if(runtimeDiagnostics[kind].length>24)runtimeDiagnostics[kind].shift();}
addEventListener('error',e=>recordRuntimeIssue('errors',{message:e.message||'Unknown runtime error',source:e.filename||'',line:e.lineno||0,column:e.colno||0}));
addEventListener('unhandledrejection',e=>recordRuntimeIssue('unhandledRejections',{message:e.reason?.message||String(e.reason||'Unknown rejection')}));
if(captureMode) document.body.dataset.captureMode='true';
const boot=document.querySelector('#boot');
const bootProgress=document.querySelector('#boot-progress');
const bootStatus=document.querySelector('#boot-status');
const bootSet=(n,msg)=>{bootProgress.style.width=Math.round(n*100)+'%';bootStatus.textContent=msg};
bootSet(.03,'Waking the crossing…');

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fa49e);
scene.fog=new THREE.FogExp2(0x66776f,.00118);

const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.08,1800);
camera.position.set(14.6,8.2,14.8);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:captureMode});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));
renderer.info.autoReset=false;
const diagnosticsMode=new URLSearchParams(location.search).get('diagnostics')==='1';
const gl=renderer.getContext();
const rendererDiagnostics={
  threeRevision:THREE.REVISION,
  webgl2:!!renderer.capabilities.isWebGL2,
  webglVersion:String(gl.getParameter(gl.VERSION)||''),
  shadingLanguage:String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION)||''),
  vendor:String(gl.getParameter(gl.VENDOR)||''),
  renderer:String(gl.getParameter(gl.RENDERER)||''),
  maxRenderbufferSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)||0,
  contextAttributes:renderer.getContextAttributes(),
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
// Initialize the post-processing render targets at the real viewport size before the first frame.
// EffectComposer starts with a 1x1 target; setting only the pixel ratio does not size its
// internal buffers. On mobile that produced the severe full-screen blur visible in the first
// capture frame because a 1x1 shaded image was being upscaled to the device viewport.
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(innerWidth,innerHeight);
const renderPass=new RenderPass(scene,camera);
composer.addPass(renderPass);
// Depth-aware occlusion must precede bloom so bloom is applied to the final shaded image,
// rather than having the occlusion pass darken already-bloomed pixels.
const bloomPass=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.145,.48,.82);
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
  ssaoScale:1.00,
  level:0,
  frameCount:0,
  frameSamples:[],
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
// Native MSAA is enabled on the renderer; a second FXAA pass would soften the mobile image.
// GRAPHICS MASTER PRESENTATION — restrained final image grade before OutputPass.
const cinematicGradePass=new ShaderPass(new THREE.ShaderMaterial({
  uniforms:{tDiffuse:{value:null},uSaturation:{value:1.055},uContrast:{value:1.045},uWarmth:{value:0.0},uVignette:{value:.065}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform sampler2D tDiffuse;uniform float uSaturation;uniform float uContrast;uniform float uWarmth;uniform float uVignette;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,uSaturation);c=(c-.5)*uContrast+.5;c*=vec3(1.0+uWarmth,1.0,uWarmth*-0.55);float d=distance(vUv,vec2(.5));c*=1.0-smoothstep(.30,.82,d)*uVignette;gl_FragColor=vec4(max(c,0.0),1.0);}'
}));
composer.addPass(cinematicGradePass);
// EffectComposer renders into an intermediate color space. OutputPass is the
// authoritative final presentation stage: it applies the renderer's configured
// tone mapping and output color-space conversion to the composited image.
const outputPass=new OutputPass();
composer.addPass(outputPass);
if(renderPassOnly){
  ssaoPass.enabled=false;
  bloomPass.enabled=false;
  cinematicGradePass.enabled=false;
  outputPass.enabled=false;
  renderPass.renderToScreen=true;
  window.__HEARTHMERE_FORENSIC_RENDERPASS_ONLY=true;
}

// FORENSIC FINAL-OUTPUT ISOLATION.
// ?forensic=final replaces only the final OutputPass with a raw screen copy.
// This deliberately removes the final tone-mapping/output-color conversion stage
// while leaving world lighting, materials, fog, clouds, SSAO, bloom and cinematic grade intact.
// It is a reversible diagnostic; normal launches remain completely unchanged.
let forensicFinalPass=null;
if(forensicMode==='final'){
  forensicFinalPass=new ShaderPass(new THREE.ShaderMaterial({
    uniforms:{tDiffuse:{value:null}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){gl_FragColor=texture2D(tDiffuse,vUv);}'
  }));
  forensicFinalPass.renderToScreen=true;
  outputPass.enabled=false;
  composer.addPass(forensicFinalPass);
  window.__HEARTHMERE_FORENSIC_FINAL_OUTPUT=true;
}
let postProcessingFailed=false;
let postProcessingError=null;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.02;
renderer.setClearColor(0x8fa49e,1);
// r155+ uses physically-correct lighting by default; the legacy/physicallyCorrectLights
// toggles are obsolete API surface and should not be carried in a r181 renderer.
renderer.sortObjects=true;
renderer.domElement.style.touchAction='none';
renderer.domElement.addEventListener('webglcontextcreationerror',event=>{
  const message=event.statusMessage||'WebGL context creation failed';
  recordRuntimeIssue('errors',{message,source:'webglcontextcreationerror',line:0,column:0});
  if(bootStatus) bootStatus.textContent='Graphics initialization failed — reload to retry.';
});
renderer.domElement.addEventListener('webglcontextlost',event=>{
  event.preventDefault();
  window.__HEARTHMERE_CONTEXT_LOST=true;runtimeDiagnostics.contextLost=true;
  recordRuntimeIssue('errors',{message:'WebGL context lost',source:'webglcontextlost',line:0,column:0});
  if(bootStatus) bootStatus.textContent='Graphics context lost — waiting for recovery…';
});
renderer.domElement.addEventListener('webglcontextrestored',()=>{
  window.__HEARTHMERE_CONTEXT_LOST=false;runtimeDiagnostics.contextLost=false;runtimeDiagnostics.contextRestoreCount++;location.reload();
});
root.appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,0,0);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.06;
controls.minDistance=5.5;controls.maxDistance=40;controls.minPolarAngle=.40;controls.maxPolarAngle=1.02;controls.rotateSpeed=.24;

const hemi=new THREE.HemisphereLight(0xeaf5f1,0x30271f,.88);scene.add(hemi);
const WORLD_BOUNDS={minX:-52,maxX:55,minZ:-58,maxZ:64};
const sun=new THREE.DirectionalLight(0xfff0dc,2.55);sun.position.set(-58,86,42);sun.castShadow=true;
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
const fill=new THREE.DirectionalLight(0x9ab7c9,.52);fill.position.set(45,34,-55);scene.add(fill);
const moon=new THREE.DirectionalLight(0x6682aa,.10);moon.position.set(30,50,-45);scene.add(moon);

const sky=new THREE.Mesh(new THREE.SphereGeometry(520,32,18),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x213e49)},mid:{value:new THREE.Color(0x78908c)},horizon:{value:new THREE.Color(0xa8b3aa)},sun:{value:new THREE.Color(0xffe2c2)}},vertexShader:'varying vec3 vN;void main(){vN=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 top;uniform vec3 mid;uniform vec3 horizon;uniform vec3 sun;varying vec3 vN;void main(){float h=max(vN.y,0.0);vec3 c=mix(horizon,mid,smoothstep(0.0,.35,h));c=mix(c,top,smoothstep(.35,.92,h));float s=pow(max(dot(vN,normalize(vec3(-.38,.72,.45))),0.0),96.0);c+=sun*s*.72;gl_FragColor=vec4(c,1.0);}'}));
scene.add(sky);

// Shared geometry cache must exist before world-environment construction can call rockMesh().
// The environment is built immediately during module evaluation, so this declaration
// intentionally precedes that construction rather than living beside the helper itself.
const rockGeometryCache=new Map();

// WORLD VISUAL OVERHAUL — environment reflections, distant terrain, and sky depth.
(function buildWorldEnvironment(){
  const c=document.createElement('canvas');c.width=768;c.height=384;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,384);
  g.addColorStop(0,'#16384a');g.addColorStop(.38,'#527b82');g.addColorStop(.63,'#aeb8ad');g.addColorStop(.78,'#c8cfc2');g.addColorStop(1,'#68766f');
  x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
  const sg=x.createRadialGradient(575,245,4,575,245,115);
  sg.addColorStop(0,'rgba(255,246,225,.82)');sg.addColorStop(.16,'rgba(224,235,231,.42)');sg.addColorStop(1,'rgba(200,220,215,0)');
  x.fillStyle=sg;x.fillRect(450,120,250,250);
  const src=new THREE.CanvasTexture(c);src.colorSpace=THREE.SRGBColorSpace;src.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(src).texture;scene.environmentIntensity=.22;
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
if(forensicMode==='clouds'||hideClouds){clouds.forEach(o=>o.visible=false);window.__HEARTHMERE_FORENSIC_CLOUDS=true;}
const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(5.5,20,20),new THREE.MeshBasicMaterial({color:0xfff0d9,transparent:true,opacity:.72}));
sunDisc.position.set(-152,112,-180);sunDisc.renderOrder=-1;scene.add(sunDisc);

// Transitional production asset source: the reference repository is public and already contains the full core GLB/texture set.
// Keep distilled CC0 replacements local; core authored assets load from a stable raw GitHub origin until they are vendored into Nightfalltesting.
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
const cc0ReadyPromises=[];
window.__HEARTHMERE_CC0_LOAD_STATS=cc0LoadStats;
function loadCC0Map(url,repeat=1,colorSpace=THREE.SRGBColorSpace){
  cc0LoadStats.pending++;
  let settle;cc0ReadyPromises.push(new Promise(resolve=>{settle=resolve}));
  const map=cc0Loader.load(url,()=>{
    configureTexture(map,[repeat,repeat],colorSpace);
    try{renderer.initTexture(map)}catch(err){recordRuntimeIssue('errors',{message:err?.message||String(err),source:'renderer.initTexture',line:0,column:0})}
    cc0LoadStats.loaded++;cc0LoadStats.pending--;settle();
  },undefined,()=>{cc0LoadStats.failed++;cc0LoadStats.failedUrls.push(url);cc0LoadStats.pending--;settle()});
  configureTexture(map,[repeat,repeat],colorSpace);return map;
}
async function waitForCC0Textures(){await Promise.all(cc0ReadyPromises);}
const CC0={
  meadow:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/grass_ground/grass_ground_diff_2k.jpg',
  meadowNormal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/grass_ground/grass_ground_nor_gl_2k.jpg',
  wood:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/medieval_wood/medieval_wood_diff_2k.jpg',
  woodNormal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/medieval_wood/medieval_wood_nor_gl_2k.jpg',
  roof:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/roof_slates_03/roof_slates_03_diff_2k.jpg',
  roofNormal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/roof_slates_03/roof_slates_03_nor_gl_2k.jpg',
  stone:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/medieval_wall_01/medieval_wall_01_diff_2k.jpg',
  stoneNormal:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/medieval_wall_01/medieval_wall_01_nor_gl_2k.jpg'
};

// ============================================================================
// GRAPHICS QUALITY FOUNDATION — materials, surface response, foliage, and
// lighting are upgraded independently of world layout. This pass is deliberately
// global so every subsequent environment build inherits the higher visual bar.
// ============================================================================
function addBeautyShader(mat,seed=1,edge=.08){
  const prior=mat.onBeforeCompile;
  mat.onBeforeCompile=(shader,renderer)=>{
    if(prior)prior(shader,renderer);
    const s=Number(seed)||1, e=Number(edge)||.08;
    const seedA=(1.71+s*.03).toFixed(4), seedB=(1.23+s*.021).toFixed(4), seedC=(s*1.7).toFixed(4), edgeLit=e.toFixed(4);
    shader.vertexShader='varying vec3 vBeautyWorld; varying vec3 vBeautyNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vBeautyWorld=(modelMatrix*vec4(transformed,1.0)).xyz; vBeautyNormal=normalize(mat3(modelMatrix)*objectNormal);');
    shader.fragmentShader='varying vec3 vBeautyWorld; varying vec3 vBeautyNormal;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n float b1=sin(vBeautyWorld.x*'+seedA+'+vBeautyWorld.z*'+seedB+'); float b2=sin(vBeautyWorld.x*4.7-vBeautyWorld.z*3.9+'+seedC+'); float grain=b1*.035+b2*.012; diffuseColor.rgb+=grain; float edgeLight=pow(1.0-max(dot(normalize(vBeautyNormal),normalize(-vViewPosition)),0.0),2.3); diffuseColor.rgb+=edgeLight*'+edgeLit+';');
  };
}
async function applyCC0Materials(){
  const meadow=loadCC0Map(CC0.meadow,3.6),meadowN=loadCC0Map(CC0.meadowNormal,3.6,THREE.NoColorSpace);
  MAT.grass.map=meadow;MAT.grass.normalMap=meadowN;MAT.grass.needsUpdate=true;
  const wood=loadCC0Map(CC0.wood,1.35),woodN=loadCC0Map(CC0.woodNormal,1.35,THREE.NoColorSpace);
  [HD.timber,HD.timberLight,ARCH.timber,ARCH.timberLight].forEach(m=>{m.map=wood;m.normalMap=woodN;m.normalScale.set(.28,.28);m.needsUpdate=true;});
  const roof=loadCC0Map(CC0.roof,1.15),roofN=loadCC0Map(CC0.roofNormal,1.15,THREE.NoColorSpace);
  [HD.roof,HD.roofWarm,ARCH.roofA,ARCH.roofB,ARCH.roofC].forEach(m=>{m.map=roof;m.normalMap=roofN;m.normalScale.set(.38,.38);m.needsUpdate=true;});
  const stone=loadCC0Map(CC0.stone,1.05),stoneN=loadCC0Map(CC0.stoneNormal,1.05,THREE.NoColorSpace);
  [HD.stone,HD.stoneDark,ARCH.stoneA,ARCH.stoneB,ARCH.mortar].forEach(m=>{m.map=stone;m.normalMap=stoneN;m.normalScale.set(.42,.42);m.needsUpdate=true;});
  await waitForCC0Textures();
  // Give authored architecture the same material-resolution floor as the terrain.
  [ARCH.timber,ARCH.timberLight].forEach(m=>{m.map=wood;m.normalMap=woodN;m.normalScale.set(.34,.34);m.needsUpdate=true;});
  [ARCH.stoneA,ARCH.stoneB,ARCH.mortar,HD.stone,HD.stoneDark].forEach(m=>{m.map=stone;m.normalMap=stoneN;m.normalScale.set(.34,.34);m.needsUpdate=true;});
  [ARCH.roofA,ARCH.roofB,ARCH.roofC,HD.roof,HD.roofWarm].forEach(m=>{m.map=roof;m.normalMap=roofN;m.normalScale.set(.30,.30);m.needsUpdate=true;});
  addBeautyShader(ARCH.plasterA,41.2,.075);addBeautyShader(ARCH.plasterB,44.7,.075);addBeautyShader(ARCH.plasterC,48.1,.065);
  addBeautyShader(HD.plaster,52.4,.07);addBeautyShader(HD.plasterWarm,55.9,.07);
}
const MAT={
 grass:new THREE.MeshStandardMaterial({map:meadowTexture,normalMap:grassNormal,color:0x536b3f,normalScale:new THREE.Vector2(.48,.48),roughness:.96}),road:new THREE.MeshStandardMaterial({map:cobble,normalMap:cobbleNormal,color:0x8a7458,normalScale:new THREE.Vector2(.55,.55),roughness:.94}),
 water:new THREE.MeshPhysicalMaterial({color:0x176270,roughness:.08,metalness:.04,transmission:.08,clearcoat:1,clearcoatRoughness:.10,transparent:true,opacity:.92}),
 rock:new THREE.MeshStandardMaterial({color:0x5e5a50,roughness:1}),
 foam:new THREE.MeshBasicMaterial({color:0xd6eee9,transparent:true,opacity:.23,depthWrite:false}),
 ember:new THREE.MeshBasicMaterial({color:0xff9a4b,transparent:true,opacity:.9,depthWrite:false})
};
// Terrain material pass: subtle macro variation keeps the meadow from reading as a tiled texture.
MAT.grass.onBeforeCompile=(shader)=>{
 shader.uniforms.uTime={value:0};
 shader.vertexShader='varying vec3 vWorldPos;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vWorldPos=(modelMatrix*vec4(transformed,1.0)).xyz;');
 shader.fragmentShader='varying vec3 vWorldPos;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n float n1=sin(vWorldPos.x*.11)*sin(vWorldPos.z*.09);\n float n2=sin(vWorldPos.x*.031+vWorldPos.z*.047)*.5;\n float n3=sin(vWorldPos.x*.27-vWorldPos.z*.19)*.18;\n float n=clamp((n1+n2+n3)*.5+.5,0.0,1.0);\n vec3 meadowA=vec3(.16,.29,.14); vec3 meadowB=vec3(.30,.43,.19); vec3 meadowC=vec3(.42,.48,.24);\n vec3 natural=mix(meadowA,meadowB,smoothstep(.18,.58,n)); natural=mix(natural,meadowC,smoothstep(.70,.96,n));\n float fleck=fract(sin(dot(vWorldPos.xz,vec2(12.9898,78.233)))*43758.5453);\n natural+=vec3(fleck*.025,fleck*.018,fleck*.008);\n float biome=sin(vWorldPos.x*.017+vWorldPos.z*.011)*.5+sin(vWorldPos.z*.031-vWorldPos.x*.009)*.3;\n float domain=sin((vWorldPos.x+sin(vWorldPos.z*.021)*6.5)*.026+(vWorldPos.z+cos(vWorldPos.x*.018)*5.0)*.017);\n vec3 soil=vec3(.23,.18,.115);\n vec3 richMeadow=vec3(.18,.32,.115);\n vec3 meadowBright=vec3(.31,.46,.18);\n natural=mix(soil,richMeadow,smoothstep(-.48,.42,biome));\n natural=mix(natural,meadowBright,smoothstep(.48,.92,biome));\n natural=mix(natural,vec3(.15,.25,.105),smoothstep(.72,1.0,abs(domain))*.18);\n float slope=1.0-clamp(dot(normalize(vNormal),vec3(0.0,1.0,0.0)),0.0,1.0);\n natural=mix(natural,vec3(.22,.19,.145),smoothstep(.24,.78,slope)*.16);\n float elevation=clamp((vWorldPos.y+2.0)/8.0,0.0,1.0);\n natural*=mix(.94,1.025,elevation);\n float riverWet=1.0-smoothstep(5.0,17.0,abs(vWorldPos.x-31.0));\n natural=mix(natural,vec3(.18,.27,.13),riverWet*.12);\n float pathWear=1.0-smoothstep(2.8,7.0,abs(vWorldPos.x));\n pathWear*=smoothstep(-52.0,58.0,vWorldPos.z);\n natural=mix(natural,vec3(.27,.23,.16),pathWear*.055);');
 MAT.grass.userData.shader=shader;
};
MAT.water.onBeforeCompile=(shader)=>{
 shader.uniforms.uTime={value:0};
 shader.vertexShader='uniform float uTime; varying vec3 vWaterWorld; varying vec3 vWaterNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWaterWorld=(modelMatrix*vec4(transformed,1.0)).xyz; vWaterNormal=normalize(mat3(modelMatrix)*objectNormal); transformed.y += sin(transformed.x*0.55 + uTime*1.7)*0.045 + cos(transformed.z*0.22 + uTime*1.15)*0.028;');
 shader.fragmentShader='uniform float uTime; varying vec3 vWaterWorld; varying vec3 vWaterNormal;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float ripple=sin(vWaterWorld.x*.75+vWaterWorld.z*.38+uTime*1.5)*.5+sin(vWaterWorld.x*.19-vWaterWorld.z*.62-uTime*.7)*.5; diffuseColor.rgb*=mix(.88,1.12,ripple*.5+.5); float fresnel=pow(1.0-max(dot(normalize(vWaterNormal),normalize(-vViewPosition)),0.0),3.0); float sunSpark=pow(max(dot(reflect(normalize(-vViewPosition),normalize(vWaterNormal)),normalize(vec3(-.52,.74,.42))),0.0),72.0); diffuseColor.rgb+=vec3(1.0,.78,.48)*sunSpark*.20; diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.50,.82,.82),fresnel*.48);');
 MAT.water.userData.shader=shader;
};
function addMesh(g,m,pos=[0,0,0],rot=[0,0,0],cast=true){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.rotation.set(...rot);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o}
const worldLabels=[];
function label(text,pos,color='#efe6d2',scale=1){const c=document.createElement('canvas');c.width=640;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,640,128);x.font='700 31px Georgia';x.textAlign='center';x.fillStyle='rgba(5,9,8,.78)';x.roundRect(22,20,596,88,18);x.fill();x.fillStyle=color;x.fillText(text,320,76);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(6.8*scale,1.36*scale,1);s.position.set(...pos);s.userData.worldLabel=true;worldLabels.push(s);scene.add(s);return s}

// Ground: broad playable meadow with restrained sculpted undulation.
// MAJOR TERRAIN RECONSTRUCTION — macro landforms first, detail later.
// The settlement sits in a broad basin while the perimeter rises into rolling terrain.
function macroTerrainHeight(x,z){
  // Deep authored landform field: warped ridges around a low settlement basin,
  // with a broad river valley and a gentler southern approach.
  const wx=x+Math.sin(z*.021)*6.5+Math.sin(z*.057)*1.8;
  const wz=z+Math.cos(x*.018)*5.0+Math.sin(x*.041)*1.4;
  const settlement=Math.exp(-(wx*wx+wz*wz)/2100);
  const riverValley=Math.exp(-((wx-31)*(wx-31))/105);
  const southApproach=Math.exp(-((wz+18)*(wz+18))/1100);
  const eastMeadow=Math.exp(-(((wx-8)*(wx-8))/1700+((wz+7)*(wz+7))/2400));
  const ridgeA=Math.sin(wx*.026+wz*.017)*1.75;
  const ridgeB=Math.cos(wz*.041-wx*.013)*1.28;
  const ridgeC=Math.sin((wx+wz)*.019)*.92;
  const ridgeD=Math.sin(wx*.085+wz*.031)*.28;
  const ridgeE=Math.cos(wz*.073-wx*.052)*.22;
  const relief=Math.max(.16,1.10-settlement*.92-riverValley*.80-southApproach*.34);
  return (ridgeA+ridgeB+ridgeC)*relief+(ridgeD+ridgeE)*(.65+relief*.55)+Math.sin(wx*.11+wz*.07)*.12*relief-eastMeadow*.18;
}
const tg=new THREE.PlaneGeometry(230,230,192,192);
const ta=tg.attributes.position;
for(let i=0;i<ta.count;i++){const x=ta.getX(i),z=ta.getY(i);ta.setZ(i,macroTerrainHeight(x,z))}
tg.rotateX(-Math.PI/2);tg.computeVertexNormals();tg.computeBoundingSphere();addMesh(tg,MAT.grass,[0,0,0],undefined,false);

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



// ============================================================================
// DEEP RIVER RECONSTRUCTION — WATERWAY AS LANDSCAPE
// The river is no longer a rectangular blue strip. Its centerline, width, banks,
// wet soil and vegetation are all authored from one shared path field.
// ============================================================================
function riverCenterX(z){
  return 31+Math.sin(z*.058)*1.75+Math.sin(z*.17+1.4)*.48;
}
function riverHalfWidth(z){
  return 13.2+Math.sin(z*.043-.7)*1.05+Math.sin(z*.11)*.42;
}
function riverRibbonGeometry(depth=0,edgeInset=0,segments=96){
  const verts=[],indices=[];
  for(let j=0;j<=segments;j++){
    const t=j/segments,z=-55+t*120;
    const cx=riverCenterX(z),hw=Math.max(4,riverHalfWidth(z)-edgeInset);
    for(let i=0;i<=4;i++){
      const across=(i/4*2-1)*hw;
      const x=cx+across;
      const bankBlend=Math.abs(across)/hw;
      const y=depth+Math.sin(z*.17+across*.08)*.012+bankBlend*.025;
      verts.push(x,y,z);
    }
  }
  for(let j=0;j<segments;j++)for(let i=0;i<4;i++){
    const a=j*5+i,b=a+1,c=a+5,d=c+1;indices.push(a,c,b,b,c,d);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
function riverBankRibbon(side,segments=96){
  const verts=[],indices=[];
  for(let j=0;j<=segments;j++){
    const t=j/segments,z=-55+t*120,cx=riverCenterX(z),hw=riverHalfWidth(z);
    const inner=cx+side*hw,outer=cx+side*(hw+4.6+Math.sin(z*.09+side)*.55);
    verts.push(inner,.10,z,outer,macroTerrainHeight(outer,z)+.055,z);
  }
  for(let j=0;j<segments;j++){
    const a=j*2,b=a+1,c=a+2,d=c+2;indices.push(a,c,b,b,c,d);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
const river=addMesh(riverRibbonGeometry(.055,.25),MAT.water,[0,0,0],undefined,false);
river.userData.waterway=true;
const riverGlowMat=new THREE.MeshBasicMaterial({color:0x3aa5a5,transparent:true,opacity:.12,depthWrite:false});
const riverGlow=addMesh(riverRibbonGeometry(.09,1.05),riverGlowMat,[0,0,0],undefined,false);
const bankMat=new THREE.MeshStandardMaterial({color:0x4d5942,roughness:.98});
for(const side of [-1,1]){
  const bank=addMesh(riverBankRibbon(side),bankMat,[0,0,0],undefined,false);
  bank.userData.riverBank=true;
}
const bankSoil=new THREE.MeshStandardMaterial({color:0x5b4b37,roughness:1});
const wetBankMat=new THREE.MeshStandardMaterial({color:0x413d31,roughness:.98});
const riverStones=[];
for(let i=0;i<74;i++){
  const z=-53+worldRandom()*116,side=i%2?-1:1,cx=riverCenterX(z),hw=riverHalfWidth(z);
  const x=cx+side*(hw+.35+worldRandom()*3.2);
  const y=macroTerrainHeight(x,z);
  const mud=new THREE.Mesh(new THREE.CircleGeometry(.55+worldRandom()*.72,20),wetBankMat);
  mud.scale.set(1.5+worldRandom()*.8,.72,1);mud.rotation.x=-Math.PI/2;mud.rotation.z=worldRandom()*Math.PI;
  mud.position.set(x,y+.065,z);mud.receiveShadow=true;scene.add(mud);
  if(i%2===0){
    const stone=rockMesh(.18+worldRandom()*.30);
    stone.position.set(x-side*(.35+worldRandom()*.55),Math.max(.12,macroTerrainHeight(x,z)+.10),z+(.2+worldRandom()*.65)*(i%3?-1:1));
    stone.scale.y=.52+worldRandom()*.42;scene.add(stone);riverStones.push(stone);
  }
}
const foam=[];
for(let i=0;i<54;i++){
  const z=-52+i*2.05,side=i%2?-1:1,cx=riverCenterX(z),hw=riverHalfWidth(z);
  const x=cx+side*(hw-.55+Math.sin(i*1.8)*.45);
  const r=addMesh(new THREE.RingGeometry(.15,.30,14),MAT.foam,[x,.16,z],[-Math.PI/2,0,worldRandom()*Math.PI],false);
  r.scale.set(1.8+worldRandom()*.8,.5+worldRandom()*.3,1);foam.push(r);
}
const shorelineGlints=[];
for(let i=0;i<66;i++){
  const z=-53+i*1.82,side=i%2?-1:1,cx=riverCenterX(z),hw=riverHalfWidth(z);
  const x=cx+side*(hw-.28+Math.sin(i*2.7)*.42);
  const g=addMesh(new THREE.PlaneGeometry(.55+worldRandom()*.5,.12+worldRandom()*.16),MAT.foam,[x,.18,z],[-Math.PI/2,0,worldRandom()*Math.PI],false);
  shorelineGlints.push(g);
}
const reedMat=new THREE.MeshStandardMaterial({color:0x4f6747,roughness:1});
for(let i=0;i<32;i++){
  const z=-48+worldRandom()*105,side=i%2?-1:1,cx=riverCenterX(z),hw=riverHalfWidth(z);
  const x=cx+side*(hw+.10+worldRandom()*1.4);
  const y=macroTerrainHeight(x,z);
  for(let r=0;r<4;r++){
    const reed=box(.025,.65+worldRandom()*.75,.025,reedMat,[x+(worldRandom()-.5)*.45,y+.38,z+(worldRandom()-.5)*.45],[(worldRandom()-.5)*.35]);
    reed.rotation.z=(worldRandom()-.5)*.24;reed.castShadow=false;
  }
}

function terrainRibbonGeometry(x,z,w,d,rot=0,segments=64){
 const verts=[],indices=[],c=Math.cos(rot),si=Math.sin(rot);
 for(let j=0;j<=segments;j++){
   const v=j/segments-.5;
   for(let i=0;i<=2;i++){
     const u=(i/2-.5)*w,lx=u,lz=v*d;
     const wx=x+lx*c-lz*si,wz=z+lx*si+lz*c;
     verts.push(wx,macroTerrainHeight(wx,wz)+.075,wz);
   }
 }
 for(let j=0;j<segments;j++)for(let i=0;i<2;i++){
   const a=j*3+i,b=a+1,c0=a+3,d0=c0+1;indices.push(a,c0,b,b,c0,d0);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
function road(x,z,w,d,rot=0){
 const geo=terrainRibbonGeometry(x,z,w,d,rot,Math.max(24,Math.round(d/2.2)));
 const m=addMesh(geo,MAT.road,[0,0,0],undefined,false);m.userData.terrainRoad=true;return m;
}
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
const assetLoadStats={requested:0,pending:0,loaded:0,failed:0,failedNames:[]};
window.__HEARTHMERE_ASSET_LOAD_STATS=assetLoadStats;
window.__HEARTHMERE_ASSET_FAILURES=assetLoadStats.failedNames;
let loadedCount=0;const assetQueue=['inn','forge','chapel','mill','watchtower','well','cart','fence','bench','crate','sign','lantern','rock','tree_oak','tree_pine','shrub','grass_clump','bridge','barrel','character','hero','chimney_detail','door_detail','window_detail','roof_ridge_detail','timber_brace_detail','stone_foundation_detail','eave_bracket_detail','roof_eave_trim_detail'];
async function loadAsset(name){
 if(assetPromises.has(name))return assetPromises.get(name);
 assetLoadStats.requested++;assetLoadStats.pending++;
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
   assetCache.set(name,gltf.scene);assetClips.set(name,gltf.animations||[]);loadedCount++;assetLoadStats.loaded++;assetLoadStats.pending--;bootSet(.08+.57*(loadedCount/assetQueue.length),'Loading '+name+'…');return {scene:gltf.scene,clips:gltf.animations||[]};
 }).catch(err=>{assetLoadStats.failed++;assetLoadStats.pending--;assetLoadStats.failedNames.push(name);console.warn('Asset failed',name,err);return null});
 assetPromises.set(name,p);return p;
}
async function placeAsset(name,x,z,scale=1,rotation=0,tint=null){const loaded=await loadAsset(name);if(!loaded)return null;const g=loaded.scene.clone(true);g.position.set(x,name==='bridge'?0.12:terrainHeight(x,z),z);g.scale.setScalar(scale);g.rotation.y=rotation;g.userData.assetName=name;g.userData.animations=loaded.clips;if(tint){g.traverse(o=>{if(o.isMesh&&o.material?.color){o.material=o.material.clone();o.material.color.lerp(new THREE.Color(tint),.18)}})}scene.add(g);return g}

// ============================================================================
// DISTILLED EXTERNAL-ASSET PIPELINE
// Selected CC0 source models are vendored locally after an explicit mobile-first
// distillation decision. They are not runtime CDN dependencies and are used as
// high-information replacements for the weakest procedural silhouettes.
// ============================================================================
const DISTILLED_ASSETS=Object.freeze({
  rock:'./assets/cc0/polyhaven/rock_moss_set_01.glb',
  shrub:'./assets/cc0/polyhaven/shrub_02.glb',
  shrubAlt:'./assets/cc0/polyhaven/shrub_04.glb',
  scrub:'./assets/cc0/polyhaven/wild_rooibos_bush.glb',
  fern:'./assets/cc0/polyhaven/fern_02.glb',
  grass:'./assets/cc0/polyhaven/grass_medium_01.glb'
});
const distilledAssetPromises=new Map();
const distilledAssetCache=new Map();
const distilledLoadStats={pending:0,loaded:0,failed:0,failedKeys:[]};
window.__HEARTHMERE_DISTILLED_LOAD_STATS=distilledLoadStats;
async function loadDistilledAsset(key){
  if(distilledAssetPromises.has(key))return distilledAssetPromises.get(key);
  const url=DISTILLED_ASSETS[key];
  if(!url)return null;
  distilledLoadStats.pending++;
  const p=assetLoader.loadAsync(url).then(gltf=>{
    gltf.scene.traverse(o=>{
      if(!o.isMesh)return;
      o.castShadow=true;o.receiveShadow=true;o.frustumCulled=true;
      if(o.material){
        o.material=o.material.clone();
        o.material.roughness=Math.min(.96,Math.max(.38,o.material.roughness??.82));
        o.material.metalness=0;
        if(o.material.color)o.material.color.multiplyScalar(.98);
        if(key==='shrub'||key==='shrubAlt'||key==='scrub'||key==='fern'||key==='grass'){
          o.material.transparent=false;
          o.material.alphaTest=Math.max(o.material.alphaTest||0,.38);
          o.material.side=THREE.DoubleSide;
          o.material.depthWrite=true;
          o.material.shadowSide=THREE.DoubleSide;
          // Micro foliage does not cast a full shadow-map silhouette; shrubs/scrub remain
          // important shadow contributors while grass/ferns stay cheap.
          o.castShadow=!(key==='grass'||key==='fern');
          o.receiveShadow=true;
        }
      }
    });
    distilledAssetCache.set(key,gltf.scene);
    distilledLoadStats.loaded++;distilledLoadStats.pending--;
    return gltf.scene;
  }).catch(err=>{
    distilledLoadStats.failed++;distilledLoadStats.failedKeys.push(key);distilledLoadStats.pending--;console.warn('Distilled asset failed',key,err);return null;
  });
  distilledAssetPromises.set(key,p);
  return p;
}
const distilledVariantCache=new Map();
function distilledVariants(source,key){
  if(distilledVariantCache.has(key))return distilledVariantCache.get(key);
  const roots=source.children.length?source.children.filter(o=>o.visible!==false):[source];
  const variants=roots.map(root=>{
    const g=root.clone(true);
    g.updateMatrixWorld(true);
    const bb=new THREE.Box3().setFromObject(g);
    if(bb.isEmpty())return null;
    const center=bb.getCenter(new THREE.Vector3());
    const holder=new THREE.Group();
    holder.add(g);
    holder.position.set(-center.x,-bb.min.y,-center.z);
    holder.updateMatrixWorld(true);
    return holder;
  }).filter(Boolean);
  distilledVariantCache.set(key,variants);
  return variants;
}
async function placeDistilledVariant(key,x,z,scale=1,rotation=0,variant=0){
  const source=await loadDistilledAsset(key);if(!source)return null;
  const variants=distilledVariants(source,key);
  if(!variants.length)return null;
  const g=variants[variant%variants.length].clone(true);
  g.position.set(x,terrainHeight(x,z)+.015,z);
  g.scale.setScalar(scale);
  g.rotation.y=rotation;
  g.userData.assetName='distilled_'+key;g.userData.distilled=true;g.userData.variant=variant%variants.length;
  scene.add(g);return g;
}



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
  const key=radius.toFixed(3);
  let geometry=rockGeometryCache.get(key);
  if(!geometry){
    geometry=new THREE.SphereGeometry(radius,32,20);
    geometry.computeVertexNormals();
    rockGeometryCache.set(key,geometry);
  }
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.rotation.set(worldRandom()*1.7,worldRandom()*Math.PI,worldRandom()*1.4);
  return mesh;
}

function box(w,h,d,m,pos=[0,0,0],rotY=0,parent=null){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);q.position.set(...pos);q.rotation.y=rotY;q.castShadow=true;q.receiveShadow=true;(parent||scene).add(q);return q}
function cyl(r,h,m,pos=[0,0,0],rot=[0,0,0],parent=null){const q=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.94,h,10),m);q.position.set(...pos);q.rotation.set(...rot);q.castShadow=true;q.receiveShadow=true;(parent||scene).add(q);return q}
function windowUnit(x,y,z,rot=0,w=1.15,h=1.45){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;
  const cavity=new THREE.MeshStandardMaterial({color:0x151a18,roughness:1,metalness:0});
  const warm=new THREE.MeshPhysicalMaterial({color:0xb7c7bd,roughness:.20,metalness:.02,transmission:.12,transparent:true,opacity:.82,emissive:0x4b2814,emissiveIntensity:.24});
  warmWindows.push(warm);
  box(w+.16,h+.16,.16,cavity,[0,0,-.025],0,g);box(w,h,.10,warm,[0,0,.055],0,g);
  box(.08,h+.12,.16,MAT_DETAIL.timber,[-w*.5,0,.08],0,g);box(.08,h+.12,.16,MAT_DETAIL.timber,[w*.5,0,.08],0,g);
  box(w+.12,.08,.16,MAT_DETAIL.timber,[0,-h*.5,.08],0,g);box(w+.12,.08,.16,MAT_DETAIL.timber,[0,h*.5,.08],0,g);
  box(.06,h,.18,MAT_DETAIL.timber,[0,0,.10],0,g);box(w,.06,.18,MAT_DETAIL.timber,[0,0,.10],0,g);
  box(w+.18,.10,.28,MAT_DETAIL.stone,[0,-h*.53,.16],0,g);
  scene.add(g);
  const spill=new THREE.PointLight(0xffb36b,.18,4.8,2);
  spill.position.set(x,y*.98,z+.14);scene.add(spill);windowSpillLights.push(spill);
  return g;
}
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
 const list=[];for(let i=0;i<100;i++){const side=i%2?-1:1;let x=side*(31+worldRandom()*48),z=-58+worldRandom()*112;if(Math.abs(z-6)<17&&Math.abs(x)<54)continue;list.push([i%3?'tree_oak':'tree_pine',x,z,.62+worldRandom()*.68,(worldRandom()-.5)*.55])}
 for(let i=0;i<26;i++)list.push([i%2?'tree_oak':'tree_pine',-45+worldRandom()*92,31+worldRandom()*31,.55+worldRandom()*.55,(worldRandom()-.5)*.6]);
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

  // Atmospheric depth is layered from near woodland to distant ridges. The far trees
  // deliberately remain visually subordinate, while still giving the eye a believable
  // forest horizon instead of a hard map boundary.
  addMountainRidge(-74,-1,11,190,0x3f554d,.58);
  addMountainRidge(-63,-1,8,170,0x4b6055,.42);
  const farTrees=[];
  for(let i=0;i<26;i++){
    const x=-58+(i/25)*116+Math.sin(i*2.3)*2.8;
    const z=76+(i%5)*5.4+Math.sin(i*.71)*2.0;
    const scale=1.15+(i%4)*.18;
    const tree=hdTree(x,z,scale,i%5===0);
    tree.userData.staticVisual=true;
    tree.userData.vegetationTier='far_horizon';
    farTrees.push(tree);
  }

  // Horizon depth comes from fog, sky gradient and distant geometry.
}
function buildWorldVisualPass(){
  sun.color.set(0xffd2a0);fill.color.set(0x7ea8bd);hemi.color.set(0xdbece6);hemi.groundColor.set(0x30251f);
  fill.intensity=.62;sun.intensity=2.55;
  const practicals=[[-14,-8,0xffb35c,2.2,11],[4,-12,0xffa14c,1.7,9],[15,-10,0xffb35c,1.6,9],[-4,-28,0xffc07a,1.5,8],[20,-24,0xffb15b,1.8,10]];
  practicals.forEach(([x,z,c,i,d])=>{const l=new THREE.PointLight(c,i,d,.8);l.position.set(x,2.3,z);scene.add(l);});
  // Atmospheric depth is handled by scene fog and distant geometry. Do not use a large
  // transparent camera-facing sheet here: on a perspective/mobile camera it becomes a
  // giant translucent rectangle across the playable scene and destroys depth readability.
  scene.fog.color.set(0x66776f);
  scene.fog.density=.00088;
}

const cinematicSpots=[];
const lightingTargets=[];
function buildCinematicLighting(){
  // A small authored local-light rig creates hierarchy: warm human light around
  // inhabited buildings, cool fill in the river corridor, and a controlled rim
  // around the major silhouettes.
  const specs=[
    [-14,6,-7,0xffb66a,22,17],
    [1,6,-1,0xff9a4d,18,14],
    [16,6,-12,0xffc174,20,15],
    [-12,7,12,0xffd08a,16,14],
    [16,8,12,0xd6e7e5,9,16]
  ];
  for(const [x,y,z,color,intensity,distance] of specs){
    const light=new THREE.SpotLight(color,intensity,distance,Math.PI*.30,.72,2);
    light.position.set(x,y,z);
    const target=new THREE.Object3D();
    target.position.set(x+(x>0?-1.8:1.4),1.0,z+(z>0?-1.5:1.8));
    scene.add(target);scene.add(light);light.target=target;
    light.castShadow=false;
    cinematicSpots.push(light);lightingTargets.push(target);
  }
  // A broad cool river fill separates the water corridor from the warm settlement.
  const riverFill=new THREE.DirectionalLight(0x6ca4ae,.22);
  riverFill.position.set(48,24,-4);scene.add(riverFill);
  // Slightly stronger environment response on architecture keeps shadowed facades from
  // collapsing into a single dark value while preserving the sun as the primary key.
  scene.environmentIntensity=.30;
}
async function buildNaturalDressing(){
 const specs=[];
 for(let i=0;i<34;i++){const x=-44+worldRandom()*92,z=-49+worldRandom()*104;if(Math.abs(x-31)<15)continue;if(Math.abs(z-7)<7&&x>-32&&x<25)continue;specs.push(['shrub',x,z,.42+worldRandom()*.46,(worldRandom()-.5)*Math.PI]);}
 for(let i=0;i<22;i++){const x=-44+worldRandom()*92,z=-49+worldRandom()*104;if(Math.abs(x-31)<15)continue;specs.push(['shrubAlt',x,z,.40+worldRandom()*.42,(worldRandom()-.5)*Math.PI]);}
 for(let i=0;i<16;i++){const x=-46+worldRandom()*94,z=-51+worldRandom()*108;if(Math.abs(x-31)<15)continue;specs.push(['scrub',x,z,.36+worldRandom()*.48,(worldRandom()-.5)*Math.PI]);}
 for(let i=0;i<88;i++){const x=-47+worldRandom()*96,z=-53+worldRandom()*110;if(Math.abs(x-31)<15)continue;specs.push(['grass',x,z,.30+worldRandom()*.42,worldRandom()*Math.PI*2]);}
 await Promise.all(specs.map(v=>placeDistilledVariant(...v)));
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
function reedPatch(x,z,rot=0){const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;for(let i=0;i<10;i++){const r=cyl(.018,.8+worldRandom()*.65,new THREE.MeshStandardMaterial({color:0x60794a,roughness:1}),[(worldRandom()-.5)*1.4,.4,(worldRandom()-.5)*1.2],[0,(worldRandom()-.5)*.5,(worldRandom()-.5)*.25],g);r.userData.reed=true}scene.add(g);return g}
function stoneBorder(x,z,count=7,rot=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;for(let i=0;i<count;i++){const a=(i/(count-1)-.5)*5;const r=box(.45,.28,.34,MAT_DETAIL.stone,[a,.25,Math.sin(i*1.4)*.18],i*.21,g);r.scale.set(1+(i%3)*.15,.8,1)}scene.add(g);return g}
// Hearthmere residential quarter: three distinct cottage archetypes built from the same
// material language. The silhouettes, rooflines, porches and facade dressing deliberately vary
// so the village no longer reads as one repeated house dropped around the landmarks.
const cottageMats={
  stone:new THREE.MeshPhysicalMaterial({color:0x777269,roughness:.92,metalness:0,sheen:.08}),
  timber:new THREE.MeshPhysicalMaterial({color:0x3a2920,roughness:.82,metalness:0,clearcoat:.08,clearcoatRoughness:.48}),
  plasterA:new THREE.MeshPhysicalMaterial({color:0xb9ad92,roughness:.88,metalness:0,sheen:.04}),
  plasterB:new THREE.MeshPhysicalMaterial({color:0x9eaa96,roughness:.88,metalness:0,sheen:.04}),
  plasterC:new THREE.MeshPhysicalMaterial({color:0xc3a987,roughness:.88,metalness:0,sheen:.04}),
  roofA:new THREE.MeshPhysicalMaterial({color:0x4b4542,roughness:.82,metalness:0,clearcoat:.12,clearcoatRoughness:.52}),
  roofB:new THREE.MeshPhysicalMaterial({color:0x5c4034,roughness:.82,metalness:0,clearcoat:.12,clearcoatRoughness:.52}),
  roofC:new THREE.MeshPhysicalMaterial({color:0x3f514a,roughness:.82,metalness:0,clearcoat:.12,clearcoatRoughness:.52})
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
  // Strong authored facade language: diagonal braces, a stone plinth, deep eaves
  // and a slightly irregular roof cap keep cottages from reading as textureless boxes.
  for(const side of [-1,1]){
    const brace=box(.13,2.65,.20,cottageMats.timber,[side*w*.30,2.0,d/2+.03],side>0?-.34:.34,g);
    brace.scale.x=1.0;
  }
  box(w+.72,.20,.42,cottageMats.timber,[0,h+.02,d/2+.12],0,g);
  box(w+.72,.20,.42,cottageMats.timber,[0,h+.02,-d/2-.12],0,g);
  // Gable framing and a small ridge cap create a more intentional roof silhouette.
  box(.14,1.55,.20,cottageMats.timber,[0,h+.72,d/2-.02],0,g);
  box(w*.52,.13,.20,cottageMats.timber,[-w*.23,h+.52,d/2-.02],-.18,g);
  box(w*.52,.13,.20,cottageMats.timber,[w*.23,h+.52,d/2-.02],.18,g);
  cyl(.10,w+.95,cottageMats.timber,[0,h+1.78,0],[0,0,Math.PI/2],g);
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

// Foliage is deliberately treated as a hero material: soft response, controlled
// transmission and subtle clearcoat prevent the current faceted green masses from
// reading as painted geometry.
HD.leaf=new THREE.MeshPhysicalMaterial({color:0x3f7044,roughness:.88,metalness:0,clearcoat:.08,clearcoatRoughness:.72,sheen:.12,sheenColor:new THREE.Color(0x7eaa72),sheenRoughness:.72});
HD.leafLight=new THREE.MeshPhysicalMaterial({color:0x679052,roughness:.86,metalness:0,clearcoat:.06,clearcoatRoughness:.74,sheen:.14,sheenColor:new THREE.Color(0xa4c28e),sheenRoughness:.70});
HD.trunk=new THREE.MeshPhysicalMaterial({color:0x4a3323,roughness:.91,metalness:0,clearcoat:.04,clearcoatRoughness:.82});

function addSurfaceVariation(mat,seed=1,contrast=.12){
  mat.onBeforeCompile=(shader)=>{
    shader.vertexShader='varying vec3 vSurfaceWorld;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vSurfaceWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader='varying vec3 vSurfaceWorld;\n'+shader.fragmentShader
      .replace('#include <map_fragment>','#include <map_fragment>\n float sv1=sin(vSurfaceWorld.x*(.37+'+seed*.013+')+vSurfaceWorld.z*(.29+'+seed*.009+'))*sin(vSurfaceWorld.z*.19+vSurfaceWorld.x*.07+'+seed+'); float sv2=sin(vSurfaceWorld.x*2.8+vSurfaceWorld.z*2.1+'+seed*1.7+')*.22; float surfaceNoise=clamp(.5+sv1*.42+sv2,0.0,1.0); diffuseColor.rgb*=1.0+(surfaceNoise-.5)*'+contrast+';')
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=clamp(roughnessFactor+(surfaceNoise-.5)*.10,.18,1.0);');
  };
}


addSurfaceVariation(HD.timber,1.7,.16);
addSurfaceVariation(HD.timberLight,3.1,.13);
addSurfaceVariation(HD.stone,5.4,.12);
addSurfaceVariation(HD.stoneDark,7.8,.10);
addSurfaceVariation(HD.roof,9.2,.13);
addSurfaceVariation(HD.roofWarm,11.6,.14);
addSurfaceVariation(HD.trunk,13.4,.11);
function addPlasterVariation(mat,a,b){
  mat.onBeforeCompile=(shader)=>{
    shader.vertexShader='varying vec3 vPlasterWorld;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vPlasterWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader='varying vec3 vPlasterWorld;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n float p1=sin(vPlasterWorld.x*0.72+'+a+')*sin(vPlasterWorld.z*0.61-'+a+'); float p2=sin(vPlasterWorld.x*2.7+vPlasterWorld.z*1.9+'+b+')*.22; float p3=sin(vPlasterWorld.y*3.4+vPlasterWorld.x*.31)*.16; float plasterNoise=clamp(.5+.34*p1+p2+p3,0.0,1.0); vec3 plasterWarm=mix(vec3(.66,.60,.50),vec3(.95,.88,.72),plasterNoise); diffuseColor.rgb*=mix(vec3(1.0),plasterWarm,.24); roughnessFactor=clamp(roughnessFactor+(plasterNoise-.5)*.10,.45,1.0);');
  };
}
addPlasterVariation(HD.plaster,1.15,1.96);
addPlasterVariation(HD.plasterWarm,3.35,5.69);

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
const hdCylGeometryCache=new Map();
function hdCyl(r1,r2,h,mat,pos,parent,segments=24){
  const key=[r1.toFixed(3),r2.toFixed(3),h.toFixed(3),segments].join('|');
  let geo=hdCylGeometryCache.get(key);
  if(!geo){
    geo=new THREE.CylinderGeometry(r1,r2,h,segments,6);
    geo.computeVertexNormals();
    hdCylGeometryCache.set(key,geo);
  }
  const m=new THREE.Mesh(geo,mat);
  m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;(parent||scene).add(m);return m;
}
const hdSphereGeometryCache=new Map();
function hdSphere(r,mat,pos,parent,scale=[1,1,1]){
  const key=r.toFixed(3);
  let geo=hdSphereGeometryCache.get(key);
  if(!geo){
    geo=new THREE.SphereGeometry(r,48,32);
    geo.computeVertexNormals();
    hdSphereGeometryCache.set(key,geo);
  }
  const m=new THREE.Mesh(geo,mat);
  m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;(parent||scene).add(m);return m;
}
function hdRoof(parent,w,d,y,mat,angle=.58){
  // Layered shingle construction: the roof remains efficient, but its silhouette and
  // visible courses read as individually built rather than as two dark slabs.
  const half=d*.50;
  const run=half/Math.cos(angle);
  const rise=half*Math.tan(angle);
  const courses=7;
  for(const side of [-1,1]){
    const under=hdBox(w+1.02,.18,run*2.0,mat,
      [0,y+rise*.50,side*half*.50],parent,side*angle,0,0,.04);
    under.receiveShadow=true;
    for(let i=0;i<courses;i++){
      const t=(i+.5)/courses;
      const z=side*(half*(1-t*.94));
      const yy=y+rise*(1-t*.94)+.08;
      const shingleW=w+1.12-(i%2)*.10;
      const shingleD=run/courses*1.32;
      const row=hdBox(shingleW,.075,shingleD,mat,[0,yy,z],parent,side*angle,0,0,.022);
      row.receiveShadow=true;
      // A timber/metallic edge gives each course a readable break at mobile distance.
      hdBox(shingleW*.98,.025,.045,HD.timber,[0,yy+.055,z-side*.025],parent,side*angle,0,0,.01);
    }
    hdBox(w+1.30,.25,.28,HD.timber,[0,y+.02,side*half],parent,side*angle,0,0,.045);
  }
  hdBox(w+1.30,.28,.38,HD.timber,[0,y+rise+.10,0],parent,0,0,0,.06);
  hdBox(w+.48,.18,.30,mat,[0,y+rise+.28,0],parent,0,0,0,.035);
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
// ============================================================================
// HERO ARCHITECTURE RECONSTRUCTION — PASS 4
// This is intentionally a full architectural system replacement, not a trim pass.
// The buildings are composed as authored structures: masonry courses, projecting
// floors, timber framing, arched openings, dormers, porches, roof layers, braces,
// shutters and functional appendages. The goal is to eliminate the "primitive box"
// read at normal camera distance while keeping the existing gameplay footprint.
// ============================================================================

const ARCH={
  mortar:new THREE.MeshStandardMaterial({color:0x6a6255,roughness:.98,metalness:0}),
  stoneA:new THREE.MeshStandardMaterial({color:0x777269,roughness:.96,metalness:0}),
  stoneB:new THREE.MeshStandardMaterial({color:0x5d5a53,roughness:.98,metalness:0}),
  timber:new THREE.MeshStandardMaterial({color:0x34231a,roughness:.82,metalness:0}),
  timberLight:new THREE.MeshStandardMaterial({color:0x65452f,roughness:.78,metalness:0}),
  iron:new THREE.MeshStandardMaterial({color:0x252824,roughness:.42,metalness:.76}),
  plasterA:new THREE.MeshStandardMaterial({color:0xb9ac91,roughness:.93,metalness:0}),
  plasterB:new THREE.MeshStandardMaterial({color:0xcbb997,roughness:.91,metalness:0}),
  plasterC:new THREE.MeshStandardMaterial({color:0x9eaa97,roughness:.94,metalness:0}),
  roofA:new THREE.MeshStandardMaterial({color:0x403a35,roughness:.88,metalness:0}),
  roofB:new THREE.MeshStandardMaterial({color:0x57463a,roughness:.86,metalness:0}),
  roofC:new THREE.MeshStandardMaterial({color:0x35453f,roughness:.9,metalness:0}),
  warm:new THREE.MeshStandardMaterial({color:0xffb95e,emissive:0xff6b20,emissiveIntensity:1.45,roughness:.35})
};

addSurfaceVariation(ARCH.timber,21.1,.17);
addSurfaceVariation(ARCH.timberLight,23.4,.13);
addSurfaceVariation(ARCH.stoneA,25.2,.11);
addSurfaceVariation(ARCH.stoneB,27.7,.10);
addSurfaceVariation(ARCH.roofA,29.3,.12);
addSurfaceVariation(ARCH.roofB,31.8,.14);
addSurfaceVariation(ARCH.roofC,34.1,.12);

function archPanel(parent,w,h,d,mat,x,y,z,rotZ=0){
  const shape=new THREE.Shape();
  shape.moveTo(-w*.5,0);
  shape.lineTo(-w*.5,h*.62);
  shape.quadraticCurveTo(-w*.5,h,0,h);
  shape.quadraticCurveTo(w*.5,h,w*.5,h*.62);
  shape.lineTo(w*.5,0);
  shape.lineTo(-w*.5,0);
  const geo=new THREE.ExtrudeGeometry(shape,{
    depth:d,bevelEnabled:true,bevelThickness:Math.min(.035,d*.16),
    bevelSize:Math.min(.045,w*.035),bevelSegments:2,curveSegments:8,steps:1
  });
  geo.translate(0,0,-d*.5);
  const m=new THREE.Mesh(geo,mat);
  m.position.set(x,y,z);m.rotation.z=rotZ;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}

function archWindow(parent,x,y,z,s=1,side=1){
  // Arched reveal, inset glazing, deep sill, timber surround and working shutters.
  archPanel(parent,1.22*s,1.55*s,.30*s,ARCH.stoneB,x,y,z);
  archPanel(parent,.91*s,1.28*s,.055*s,HD.glass,x,y+.02,z-side*.18*s);
  hdBox(.085*s,1.28*s,.075*s,ARCH.timber,[x-.47*s,y+.02,z-side*.25*s],parent,0,0,0,.018);
  hdBox(.085*s,1.28*s,.075*s,ARCH.timber,[x+.47*s,y+.02,z-side*.25*s],parent,0,0,0,.018);
  hdBox(.98*s,.085*s,.075*s,ARCH.timber,[x,y+.61*s,z-side*.25*s],parent,0,0,0,.018);
  hdBox(.98*s,.085*s,.075*s,ARCH.timber,[x,y-.61*s,z-side*.25*s],parent,0,0,0,.018);
  hdBox(.055*s,1.08*s,.055*s,ARCH.timber,[x,y,z-side*.29*s],parent,0,0,0,.012);
  hdBox(.82*s,.055*s,.055*s,ARCH.timber,[x,y,z-side*.29*s],parent,0,0,0,.012);
  hdBox(1.42*s,.13*s,.42*s,ARCH.stoneA,[x,y-.82*s,z-side*.03*s],parent,0,0,0,.025);
  for(const sx of [-1,1]){
    const shutter=hdBox(.20*s,1.12*s,.10*s,ARCH.timberLight,[x+sx*.72*s,y,z-side*.02*s],parent,0,0,sx*.025,.018);
    shutter.rotation.y=side*sx*.10;
    for(let i=0;i<4;i++)hdBox(.045*s,.16*s,.06*s,ARCH.timber,[x+sx*(.72-.09)*s,y-.40*s+i*.27*s,z-side*.075*s],parent,0,0,0,.008);
  }
}

function archDoor(parent,x,y,z,s=1,side=1){
  const reveal=archPanel(parent,1.55*s,2.72*s,.38*s,ARCH.stoneB,x,y,z);
  reveal.position.z+=side*.01;
  archPanel(parent,1.22*s,2.42*s,.075*s,ARCH.timber,x,y+.03,z-side*.22*s);
  archPanel(parent,.94*s,2.12*s,.04*s,ARCH.timberLight,x,y+.04,z-side*.285*s);
  hdBox(.07*s,1.98*s,.055*s,ARCH.timber,[x,y+.02,z-side*.33*s],parent,0,0,0,.012);
  hdBox(.84*s,.07*s,.055*s,ARCH.timber,[x,y+.84*s,z-side*.33*s],parent,0,0,0,.012);
  hdBox(1.38*s,.16*s,.46*s,ARCH.stoneA,[x,y-1.39*s,z-side*.04*s],parent,0,0,0,.03);
  hdCyl(.06*s,.06*s,.10*s,ARCH.iron,[x+.31*s,y-.05*s,z-side*.38*s],parent,18).rotation.x=Math.PI/2;
}

function archMasonryBase(parent,w,d,h=.72,variant=0){
  // Individual foundation stones deliberately break the continuous slab silhouette.
  const rows=2;
  for(let row=0;row<rows;row++){
    const yy=.22+row*.31;
    const count=Math.ceil(w/1.05);
    for(let i=0;i<count;i++){
      const len=Math.min(1.15,w/count+.12);
      const xx=-w*.5+len*.5+i*(w/count);
      const jitter=Math.sin((i+variant)*2.17)*.055;
      hdBox(len,.27,.46,(i+row+variant)%3?ARCH.stoneA:ARCH.stoneB,
        [xx+jitter,yy,d*.515],parent,0,0,(i%3-1)*.018,.035);
      hdBox(len,.27,.46,(i+row+variant+1)%3?ARCH.stoneB:ARCH.stoneA,
        [xx-jitter,yy,-d*.515],parent,0,0,(i%4-1.5)*.016,.035);
    }
    const sideCount=Math.ceil(d/1.15);
    for(let i=1;i<sideCount;i++){
      const zz=-d*.5+i*(d/sideCount);
      hdBox(.46,.27,.98,(i+row+variant)%2?ARCH.stoneA:ARCH.stoneB,
        [-w*.515,yy,zz],parent,0,(i%3-1)*.018,0,.035);
      hdBox(.46,.27,.98,(i+row+variant+1)%2?ARCH.stoneB:ARCH.stoneA,
        [w*.515,yy,zz],parent,0,(i%4-1.5)*.016,0,.035);
    }
  }
  hdBox(w+.18,.10,d+.18,ARCH.mortar,[0,.10,0],parent,0,0,0,.025);
}

function archFrame(parent,w,d,h,z,variant=0){
  // A deliberately asymmetric timber frame gives each facade a hand-built rhythm.
  const verticals=[-.46,-.23,.02,.27,.47].map(v=>v*w);
  verticals.forEach((xx,i)=>{
    const lean=(i%2?-1:1)*(.015+(variant%3)*.012);
    hdBox(.20,h,.25,ARCH.timber,[xx,.82+h*.5,z],parent,0,0,lean,.025);
  });
  for(const yy of [.86,2.05,3.10]){
    if(yy<h+.82)hdBox(w*.92,.17,.28,ARCH.timber,[0,yy,z],parent,0,0,0,.025);
  }
  // Deep diagonal braces are the strongest visual cue that this is constructed timber architecture.
  const braces=[
    [-.36,1.10,-.20,.46],[-.12,2.20,.18,-.43],[.15,1.16,.19,.42],[.39,2.20,-.18,-.44]
  ];
  braces.forEach(([bx,by,rz,sgn],i)=>{
    const b=hdBox(.16,1.72,.22,i%2?ARCH.timberLight:ARCH.timber,[bx*w,by,z],parent,0,0,rz,.022);
    b.rotation.z=sgn*.52;
  });
  // Side-wall braces make the building read as volumetric when the camera orbits.
  for(const side of [-1,1]){
    const sx=side*w*.505;
    hdBox(.18,1.72,.20,ARCH.timber,[sx,1.65,-d*.18],parent,0,0,side*.38,.02);
    hdBox(.18,1.42,.20,ARCH.timberLight,[sx,2.28,d*.17],parent,0,0,-side*.34,.02);
  }
}

function archDormer(parent,x,y,z,s=1,roofMat=ARCH.roofB){
  const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
  hdBox(1.52*s,1.25*s,.66*s,HD.plasterWarm,[0,.62,0],g,0,0,0,.08);
  hdGable(g,1.66*s,.92*s,.70*s,HD.plasterWarm,.34*s,.035);
  archWindow(g,0,.76,.70*s,.58*s,1);
  hdRoof(g,1.92*s,1.08*s,1.27*s,roofMat,.48);
  hdBox(1.82*s,.13*s,.20*s,ARCH.timber,[0,1.27*s,.54*s],g,0,0,0,.02);
  return g;
}

function archPorch(parent,w,d,y,side=1,roofMat=ARCH.roofB){
  const z=side*d*.57;
  hdBox(w*.55,.20,1.55,ARCH.timber,[0,y,z],parent,0,0,0,.045);
  for(const x of [-w*.23,w*.23])hdCyl(.105,.075,2.55,ARCH.timber,[x,y+1.20,z+side*.28],parent,28);
  hdBox(w*.60,.15,.16,ARCH.timber,[0,y+2.43,z+side*.28],parent,0,0,0,.025);
  hdRoof(parent,w*.66,1.72,y+2.50,roofMat,.43);
  hdBox(w*.72,.12,.24,ARCH.timber,[0,y+2.50,z+side*.55],parent,0,0,0,.025);
}

function archEave(parent,w,d,y){
  for(const side of [-1,1]){
    hdBox(w+1.55,.22,.38,ARCH.timber,[0,y,side*(d*.5+.53)],parent,0,0,0,.045);
    for(let i=0;i<5;i++){
      const x=-w*.42+i*w*.21;
      hdBox(.13,.55,.22,ARCH.timberLight,[x,y-.22,side*(d*.5+.35)],parent,0,0,(i%2?-.18:.18),.02);
    }
  }
}

function archRoofCrest(parent,w,d,y,mat){
  hdBox(w+1.35,.30,.38,ARCH.timber,[0,y,0],parent,0,0,0,.05);
  hdBox(w+1.12,.16,.32,mat,[0,y+.23,0],parent,0,0,0,.035);
  for(let i=-4;i<=4;i++){
    hdBox(.12,.12,.54,ARCH.timberLight,[i*(w/9),y+.16,0],parent,0,0,0,.018);
  }
}

function archGableTrim(parent,w,y,z,scale=1){
  hdGable(parent,w,1.62*scale,.30,HD.plasterWarm,z,.045);
  hdBox(.15,1.46*scale,.12,ARCH.timber,[w*.25,y+0.62*scale,z-.20],parent,0,0,-.43,.018);
  hdBox(.15,1.46*scale,.12,ARCH.timber,[w*.03,y+0.78*scale,z-.20],parent,0,0,.08,.018);
  hdBox(.15,1.46*scale,.12,ARCH.timber,[-w*.25,y+0.62*scale,z-.20],parent,0,0,.43,.018);
  hdBox(w*.72,.13,.12,ARCH.timber,[0,y+.10,z-.22],parent,0,0,0,.018);
}

function hdBuilding(type,x,z,scale=1,rot=0){
  const g=new THREE.Group();
  g.position.set(x,terrainHeight(x,z),z);
  g.rotation.y=rot;g.scale.setScalar(scale);g.userData.staticVisual=true;g.userData.architectureTier='hero';
  scene.add(g);

  const chapel=type==='chapel',inn=type==='inn',forge=type==='forge',mill=type==='mill',tower=type==='watchtower',cottage=type==='cottage';
  const w=chapel?8.4:inn?9.6:forge?7.5:mill?8.2:tower?5.9:5.35;
  const d=chapel?10.4:inn?8.6:forge?7.4:mill?7.9:tower?5.9:4.55;
  const lowerH=chapel?3.75:tower?7.8:cottage?3.15:3.25;
  const upperH=chapel?1.55:tower?1.0:cottage?1.05:1.35;
  const upperW=chapel?w*.92:tower?w*.78:cottage?w*.88:w*.86;
  const upperD=chapel?d*.93:tower?d*.78:cottage?d*.88:d*.86;
  const plaster=inn?ARCH.plasterB:mill?ARCH.plasterC:cottage?ARCH.plasterA:ARCH.plasterA;
  const roofMat=forge?ARCH.roofA:chapel?ARCH.roofC:cottage?ARCH.roofB:ARCH.roofB;

  // Primary masses: offset upper floor + deep plinth + roof overhang establish a real silhouette.
  archMasonryBase(g,w+0.32,d+0.32,.72,Math.round(x+z));
  hdBox(w,.18,d+.08,ARCH.stoneB,[.03,.80,-.02],g,0,0,0,.055);
  hdBox(w,lowerH,d,plaster,[0,.90+lowerH/2,0],g,0,0,0,.18);
  hdBox(upperW,upperH,upperD,HD.plasterWarm,[.12,.88+lowerH+upperH/2,-.10],g,0,0,0,.16);

  // Slightly proud first floor and irregular timber frame stop the "single slab" read.
  if(!tower){
    hdBox(w*.98,.20,d*.96,ARCH.timberLight,[.03,.88+lowerH,-.04],g,0,0,0,.035);
    archFrame(g,w,d,lowerH,d*.515,Math.abs(Math.round(x*3+z)));
    archFrame(g,upperW,upperD,upperH,upperD*.515,Math.abs(Math.round(z*2+x))+1);
  }

  // Crafted arched openings replace the repeated rectangular panel language.
  const front=d*.515;
  archDoor(g,0,1.02,front,cottage?.84:.96,1);
  archWindow(g,-w*.29,cottage?1.98:2.12,front,cottage?.70:.92,1);
  archWindow(g,w*.28,cottage?2.02:2.18,front,cottage?.68:.88,1);
  if(!cottage){
    archWindow(g,-upperW*.26,3.78,upperD*.515,.70,1);
    archWindow(g,upperW*.25,3.72,upperD*.515,.66,1);
  }

  // Side openings make the architecture survive an orbiting camera instead of being a facade.
  for(const side of [-1,1]){
    archWindow(g,side*w*.505,2.12,-d*.08,.72,side);
    archWindow(g,side*w*.505,3.72,d*.18,.55,side);
  }

  const roofY=.92+lowerH+upperH;
  const roofAngle=chapel?.66:cottage?.56:.60;
  hdRoof(g,w+1.42,d+1.52,roofY,roofMat,roofAngle);
  archEave(g,w,d,roofY-.02);
  archRoofCrest(g,w,d,roofY+(d*.50)*Math.tan(roofAngle)+.26,roofMat);
  archGableTrim(g,w*.96,roofY+.05,front,cottage?.78:.98);

  // Three dormers on the largest residential/civic roofs create a genuinely inhabited roofline.
  if(inn||mill){
    archDormer(g,-w*.29,roofY-.08,front*.72,.82,roofMat);
    archDormer(g,w*.22,roofY-.04,front*.72,.68,roofMat);
  }
  if(cottage){
    // Cottage archetype: a projecting porch, asymmetrical lean-to and a smaller dormer
    // turn the replacement into a home rather than a scaled-down civic building.
    archPorch(g,3.05,1.05,.94,1,ARCH.roofB);
    archDormer(g,w*.18,roofY-.06,front*.72,.48,roofMat);
    hdBox(2.25,1.85,2.05,plaster,[w*.28,1.72,-d*.08],g,0,0,0,.13);
    hdRoof(g,2.75,2.42,3.04,ARCH.roofA,.48);
    for(const side of [-1,1]){
      hdBox(.16,1.95,.20,ARCH.timber,[side*w*.38,1.92,d*.515],g,0,0,side*.10,.018);
    }
    archWindow(g,w*.27,1.72,d*.515+.03,.58,1);
  }
  if(chapel){
    archDormer(g,-w*.22,roofY-.10,front*.72,.66,roofMat);
    archDormer(g,w*.20,roofY-.06,front*.72,.58,roofMat);
  }

  // Chimneys are now structurally tied to the roof plane and capped.
  const chimneyBase=roofY+.10;
  if(!tower){
    hdChimney(g,w*.24,-d*.16,forge?2.55:chapel?1.12:1.82,chimneyBase);
    if(inn||mill)hdChimney(g,-w*.27,-d*.14,forge?2.15:1.42,chimneyBase);
  }

  // Function-specific architecture — each landmark gets a different composition, not a recolor.
  if(inn){
    hdBox(3.65,2.65,1.18,HD.plasterWarm,[.08,2.05,d*.43],g,0,0,0,.14);
    archPorch(g,5.2,1.1,1.00,1,ARCH.roofB);
    hdBox(2.45,.78,.16,ARCH.timber,[.08,3.05,d*.59],g,0,0,0,.045);
    hdBox(2.05,.42,.04,ARCH.warm,[.08,3.05,d*.68],g,0,0,0,.018);
    // Hanging lanterns and a projecting timber sign give the inn a strong focal silhouette.
    for(const sx of [-1,1]){
      hdCyl(.045,.04,.70,ARCH.iron,[sx*1.28,3.42,d*.66],g,16).rotation.x=Math.PI/2;
      hdSphere(.11,ARCH.warm,[sx*1.28,3.04,d*.70],g,[1,.85,1]);
    }
    hdBox(4.6,.20,2.0,ARCH.timber,[0,.94,-d*.58],g,0,0,0,.04);
    for(const sx of [-1,1])hdCyl(.11,.075,2.0,ARCH.timber,[sx*1.9,1.0,-d*.67],g,24);
  }

  if(forge){
    // Forge gets a stone workshop wing, oversized stack, covered work yard and ore storage.
    hdBox(3.7,2.0,2.3,ARCH.stoneB,[w*.30,1.42,-d*.27],g,0,0,0,.16);
    hdRoof(g,4.15,2.7,2.44,ARCH.roofA,.46);
    hdCyl(.46,.30,2.25,ARCH.iron,[w*.30,3.35,-d*.27],g,32);
    hdBox(3.8,.18,1.35,ARCH.timber,[-w*.18,2.36,d*.66],g,0,0,0,.045);
    for(let i=0;i<5;i++)hdCyl(.035,.035,.95,ARCH.iron,[-1.2+i*.58,1.30,d*.69],g,12).rotation.z=Math.PI/2;
    hdBox(1.15,.30,.58,ARCH.iron,[w*.12,1.10,d*.59],g,0,0,-.08,.05);
    hdCyl(.38,.30,.46,ARCH.iron,[w*.34,1.15,d*.57],g,28);
  }

  if(mill){
    // Mill receives a timber gallery, water-facing wheel and projecting grain loft.
    hdBox(3.0,2.45,1.20,HD.plasterWarm,[w*.27,1.90,d*.39],g,0,0,0,.12);
    archPorch(g,3.9,1.35,1.00,-1,ARCH.roofB);
    const wheel=new THREE.Group();wheel.position.set(w*.64,1.34,d*.61);g.add(wheel);
    hdCyl(1.68,1.68,.28,ARCH.timber,[0,0,0],wheel,64).rotation.x=Math.PI/2;
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8;
      hdBox(.10,1.46,.12,ARCH.timberLight,[Math.cos(a)*.72,Math.sin(a)*.72,.16],wheel,0,0,a,.02);
    }
    hdCyl(.20,.20,.42,ARCH.iron,[0,0,.18],wheel,32).rotation.x=Math.PI/2;
    for(const sx of [-1,1])hdBox(.18,4.25,.24,ARCH.timber,[sx*w*.46,2.25,-d*.40],g,0,0,sx*.12,.025);
    hdBox(3.2,.18,1.30,ARCH.stoneB,[w*.54,.42,d*.28],g,0,0,0,.05);
    hdBox(3.1,.14,1.15,ARCH.timber,[w*.38,3.05,d*.36],g,0,0,0,.035);
  }

  if(chapel){
    // Chapel: taller nave, buttress rhythm, rose window and bell tower.
    hdBox(1.85,4.9,1.95,ARCH.stoneB,[.05,3.15,d*.43],g,0,0,0,.15);
    for(const sx of [-1,1])for(const zz of [d*.27,d*.49]){
      hdBox(.52,3.55,.72,ARCH.stoneA,[sx*(w*.40),1.95,zz],g,0,0,0,.08);
    }
    hdRoof(g,2.30,2.34,5.55,ARCH.roofC,.56);
    // Rose window: recessed dark ring + warm interior glazing.
    const roseBack=new THREE.Mesh(new THREE.CircleGeometry(.64,40),HD.stoneB);roseBack.position.set(.05,3.34,d*.78);roseBack.rotation.y=Math.PI;g.add(roseBack);
    const rose=new THREE.Mesh(new THREE.RingGeometry(.42,.64,40),ARCH.timberLight);rose.position.set(.05,3.34,d*.805);rose.rotation.y=Math.PI;g.add(rose);
    const roseGlass=new THREE.Mesh(new THREE.CircleGeometry(.39,32),HD.glass);roseGlass.position.set(.05,3.34,d*.81);roseGlass.rotation.y=Math.PI;g.add(roseGlass);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      hdBox(.055,.68,.055,ARCH.timber,[.05+Math.cos(a)*.25,3.34+Math.sin(a)*.25,d*.83],g,0,0,a,.01);
    }
    // Bell crown.
    hdBox(1.35,.22,1.35,ARCH.stoneB,[.05,6.05,d*.43],g,0,0,0,.04);
    hdCyl(.32,.26,.62,ARCH.iron,[.05,6.46,d*.43],g,28);
    hdBox(.12,1.0,.12,ARCH.timber,[.05,7.02,d*.43],g,0,0,0,.015);
    hdBox(.62,.08,.12,ARCH.timber,[.05,7.25,d*.43],g,0,0,0,.015);
  }

  if(tower){
    // Watchtower is intentionally the one masonry-dominant silhouette.
    g.clear();
    archMasonryBase(g,5.65,5.65,.86,4);
    hdBox(4.55,7.95,4.55,ARCH.plasterC,[0,4.58,0],g,0,0,0,.17);
    for(const y of [2.0,4.15,6.30])for(const sx of [-1,1]){
      hdBox(.18,1.76,.24,ARCH.timber,[sx*1.46,y,2.25],g,0,0,sx*.40,.025);
    }
    for(const side of [-1,1]){
      hdBox(1.05,.18,4.70,ARCH.stoneB,[side*2.30,3.9,0],g,0,0,0,.035);
    }
    hdRoof(g,6.15,6.15,8.62,ARCH.roofC,.73);
    archRoofCrest(g,5.7,5.7,11.20,ARCH.roofC);
    archWindow(g,0,5.15,2.29,1.0,1);
    archWindow(g,0,7.10,2.29,.82,1);
    // External stair and beacon create a distinctive defensive profile.
    for(let i=0;i<7;i++){
      hdBox(1.20,.16,.72,ARCH.timber,[-2.85+i*.40,.92+i*.43,-1.05-i*.27],g,0,0,-.38,.025);
    }
    hdCyl(.075,.055,3.0,ARCH.timber,[0,7.0,0],g,18);
    hdSphere(.13,ARCH.warm,[0,8.35,0],g,[1,.85,1]);
  }

  // Every hero building ends with a deliberate ground relationship: stones, wood piles,
  // planters and small projecting details so it cannot float on the meadow.
  for(const sx of [-1,1]){
    hdBox(.24,.58,.70,ARCH.stoneB,[sx*w*.40,.86,-d*.56],g,0,0,sx*.08,.025);
  }
  g.userData.architectureComplete=true;
  return g;
}
const hdTreeCanopyGeometryCache=new Map();
function hdTreeCanopyGeometry(radius,height,pine=false){
  const key=[radius.toFixed(3),height.toFixed(3),pine?'pine':'broadleaf'].join('|');
  const cached=hdTreeCanopyGeometryCache.get(key);
  if(cached)return cached;
  const geo=new THREE.SphereGeometry(1,64,40);
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const az=Math.atan2(z,x),ring=Math.sqrt(x*x+z*z);
    const wave=Math.sin(az*3.0+1.7)*.075+Math.sin(az*7.0-.6)*.045+Math.cos(y*5.0+az*2.0)*.035;
    if(pine){
      const taper=.24+.76*((y+1)/2);
      const r=Math.max(.001,(ring+wave)*taper);
      if(ring<1e-5)p.setXYZ(i,0,y,0);
      else p.setXYZ(i,x/ring*r,y*height,z/ring*r);
    }else{
      const r=Math.max(.001,radius*(ring+wave)*(1+.12*Math.sin((y+1)*Math.PI)));
      if(ring<1e-5)p.setXYZ(i,0,y*height,0);
      else p.setXYZ(i,x/ring*r,y*height*(.92+.08*(1-Math.abs(y))),z/ring*r);
    }
  }
  geo.computeVertexNormals();
  hdTreeCanopyGeometryCache.set(key,geo);
  return geo;
}
const TREE_LEAF_MATS=[
  new THREE.MeshPhysicalMaterial({color:0x294d31,roughness:.86,metalness:0,clearcoat:.08,clearcoatRoughness:.72,sheen:.18,sheenColor:new THREE.Color(0x6f9665),sheenRoughness:.72}),
  new THREE.MeshPhysicalMaterial({color:0x3d6840,roughness:.84,metalness:0,clearcoat:.07,clearcoatRoughness:.74,sheen:.20,sheenColor:new THREE.Color(0x86aa76),sheenRoughness:.70}),
  new THREE.MeshPhysicalMaterial({color:0x5a7f49,roughness:.82,metalness:0,clearcoat:.06,clearcoatRoughness:.76,sheen:.22,sheenColor:new THREE.Color(0x9dbb83),sheenRoughness:.68}),
  new THREE.MeshPhysicalMaterial({color:0x6f8f55,roughness:.84,metalness:0,clearcoat:.06,clearcoatRoughness:.74,sheen:.20,sheenColor:new THREE.Color(0xb0c58d),sheenRoughness:.70})
];
function upgradeFoliageMaterial(mat,phase){
  const prior=mat.onBeforeCompile;
  mat.onBeforeCompile=(shader)=>{
    if(prior)prior(shader);
    shader.uniforms.uFoliageTime={value:0};
    shader.uniforms.uFoliagePhase={value:phase};
    shader.vertexShader='uniform float uFoliageTime; uniform float uFoliagePhase; varying vec3 vFoliageWorld;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vFoliageWorld=(modelMatrix*vec4(transformed,1.0)).xyz; float sway=sin(uFoliageTime*1.25+uFoliagePhase+transformed.y*1.7+transformed.x*1.1)*.035; transformed.x+=sway*max(0.0,transformed.y); transformed.z+=cos(uFoliageTime*1.05+uFoliagePhase+transformed.y*1.3)*.018*max(0.0,transformed.y);');
    shader.fragmentShader='varying vec3 vFoliageWorld;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float leafNoise=fract(sin(dot(vFoliageWorld.xz,vec2(17.13,41.77)))*43758.5453); diffuseColor.rgb*=mix(.93,1.07,leafNoise);');
    mat.userData.foliageShader=shader;
  };
}
TREE_LEAF_MATS.forEach((m,i)=>upgradeFoliageMaterial(m,i*.83));

function hdTree(x,z,scale=1,pine=false){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.scale.setScalar(scale);scene.add(g);
  const trunkH=pine?6.4:5.4;
  hdCyl(pine?.30:.42,pine?.17:.24,trunkH,HD.trunk,[0,trunkH*.5,0],g,28);
  const branches=pine?[[ -.46,2.65,.04,1.70,-.52],[.44,3.18,-.05,1.48,.48],[-.30,3.72,.04,1.28,-.38],[.26,4.25,-.03,1.02,.31],[0,4.62,.02,.78,.16]]:[[ -.62,2.25,.05,1.90,-.56],[.58,2.65,.10,1.78,.50],[-.42,3.12,.02,1.52,-.40],[.38,3.55,-.04,1.32,.34],[-.18,3.88,.06,1.08,-.24],[.22,4.12,-.02,.92,.20]];
  for(const [bx,by,bz,len,lean] of branches){const b=hdCyl(pine?.13:.16,pine?.055:.065,len,HD.trunk,[bx,by,bz],g,22);b.rotation.z=lean;b.rotation.x=bz*.55;}
  const clusters=pine?[[0,5.55,0,1.55,1.28,1.45,1],[-.62,4.95,.08,1.35,1.02,1.28,0],[.66,4.78,-.02,1.30,.98,1.22,2],[-.42,5.92,.12,1.10,.92,1.08,2],[.48,5.78,.05,1.02,.88,1.04,1],[0,6.45,0,.88,.76,.92,3]]:[[0,5.28,0,1.58,1.34,1.48,1],[-.76,4.82,.12,1.30,1.02,1.24,2],[.78,4.72,-.08,1.34,1.00,1.22,0],[-.48,5.55,.10,1.20,1.04,1.18,0],[.48,5.62,.08,1.18,.98,1.14,2],[-.16,6.10,-.02,1.05,.90,1.04,1],[.24,6.28,.04,.92,.82,.94,3]];
  for(const [cx,cy,cz,sx,sy,sz,mi] of clusters){const leaf=hdSphere(.86,TREE_LEAF_MATS[mi],[cx,cy,cz],g,[sx,sy,sz]);leaf.rotation.set(Math.sin((cx+1.3)*3.1)*.12,Math.atan2(cz,cx)+Math.PI*.12,Math.cos((cz+1.1)*2.7)*.10);leaf.castShadow=true;leaf.receiveShadow=true;}
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const root=hdCyl(.19,.05,.92,HD.trunk,[Math.cos(a)*.32,.18,Math.sin(a)*.32],g,18);root.rotation.z=Math.cos(a)*.34;root.rotation.x=Math.sin(a)*.16;}
  return g;
}
function hdRock(x,z,scale=1){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z)+.08,z);g.scale.setScalar(scale);g.userData.staticVisual=true;scene.add(g);
  const m=hdSphere(.72,HD.stone,[0,0,0],g,[1.35,.72,.96]);m.rotation.set(.2,.7,.08);
  hdSphere(.46,HD.stoneDark,[-.18,.32,.08],g,[1.3,.34,.9]);
  return g;
}
function hdProp(name,x,z,scale=1,rot=0){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;g.scale.setScalar(scale);g.userData.staticVisual=true;scene.add(g);
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
  const g=new THREE.Group();g.position.set(x,.12,z);g.rotation.y=rot;g.scale.setScalar(scale);g.userData.staticVisual=true;scene.add(g);
  // Wide timber deck with individually rounded-looking high-segment support geometry.
  for(let i=-8;i<=8;i++){const plank=hdBox(2.7,.18,.55,HD.timberLight,[i*1.0,1.15,0],g);plank.rotation.y=(i%3)*.008;}
  for(const x0 of [-8,8]){hdCyl(.38,.46,1.2,HD.stone,[x0,0,0],g,32);hdCyl(.30,.36,1.0,HD.stone,[x0,0,2.9],g,32);hdCyl(.30,.36,1.0,HD.stone,[x0,0,-2.9],g,32);}
  for(const z0 of [-3.1,3.1]){hdCyl(.16,.16,17,HD.timber,[0,2.0,z0],g,24).rotation.z=Math.PI/2;}
  for(const x0 of [-7,-3.5,0,3.5,7]){hdCyl(.09,.09,1.5,HD.timber,[x0,1.85,2.75],g,20);hdCyl(.09,.09,1.5,HD.timber,[x0,1.85,-2.75],g,20);}
  return g;
}
function hdCart(x,z,scale=1,rot=0){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;g.scale.setScalar(scale);g.userData.staticVisual=true;scene.add(g);
  hdBox(2.5,.18,1.35,HD.timber,[0,.95,0],g);
  hdBox(1.9,.12,1.1,HD.timberLight,[0,1.65,0],g);
  for(const zz of [-.66,.66])hdCyl(.45,.45,.18,HD.iron,[0,.46,zz],g,32).rotation.x=Math.PI/2;
  hdCyl(.08,.08,2.1,HD.timber,[-1.0,1.15,0],g,20).rotation.z=Math.PI/2;
  return g;
}
function hdSign(x,z,scale=1,rot=0){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.rotation.y=rot;g.scale.setScalar(scale);g.userData.staticVisual=true;scene.add(g);
  hdCyl(.09,.12,2.4,HD.timber,[0,1.2,0],g,24);
  hdBox(1.8,.72,.12,HD.timberLight,[0,2.15,0],g);
  hdBox(1.48,.44,.035,HD.warm,[0,2.15,.08],g);
  return g;
}
function hdCharacter(root,isPlayer=false){
  const g=new THREE.Group();g.position.set(0,0,0);root.add(g);
  const parts={arms:[],legs:[],cloak:null,body:g};g.userData.parts=parts;g.userData.replacementVisual=true;

  const cloth=isPlayer?new THREE.MeshStandardMaterial({color:0x40586a,roughness:.84}):new THREE.MeshStandardMaterial({color:0x5b493e,roughness:.90});
  const clothLight=isPlayer?new THREE.MeshStandardMaterial({color:0x60798a,roughness:.82}):new THREE.MeshStandardMaterial({color:0x725b4c,roughness:.88});
  const leather=new THREE.MeshStandardMaterial({color:0x35241b,roughness:.94});
  const skin=new THREE.MeshStandardMaterial({color:0xb9785c,roughness:.88});
  const skinLight=new THREE.MeshStandardMaterial({color:0xd09575,roughness:.84});
  const metal=new THREE.MeshStandardMaterial({color:0x737976,metalness:.72,roughness:.30});
  const darkMetal=new THREE.MeshStandardMaterial({color:0x363b39,metalness:.68,roughness:.34});
  const hairMat=new THREE.MeshStandardMaterial({color:isPlayer?0x2b211d:0x3b2921,roughness:.96});
  const bootMat=new THREE.MeshStandardMaterial({color:0x211713,roughness:.97});

  // Layered torso: undershirt, shaped tunic, belt and hem. The proportions are intentionally
  // grounded and readable rather than the old cylinder-man silhouette.
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.47,.88,8,32),cloth);
  torso.position.set(0,1.58,0);torso.scale.set(1,.98,.82);torso.castShadow=true;torso.receiveShadow=true;g.add(torso);
  const chest=new THREE.Mesh(new THREE.CapsuleGeometry(.39,.54,8,28),clothLight);
  chest.position.set(0,1.76,.10);chest.scale.set(1.08,.92,.72);chest.castShadow=true;g.add(chest);
  const hem=new THREE.Mesh(new THREE.CylinderGeometry(.54,.61,.46,32,1),cloth);
  hem.position.set(0,1.08,0);hem.scale.z=.78;hem.castShadow=true;g.add(hem);
  hdCyl(.045,.055,1.12,leather,[0,1.34,.41],g,20).rotation.x=Math.PI/2;
  hdBox(1.05,.12,.20,leather,[0,1.08,.37],g,0,0,0,.018);

  // Neck and head have a separate jaw/neck transition so the character no longer reads as
  // one smooth sphere attached to one smooth cylinder.
  hdCyl(.20,.17,.30,skin,[0,2.30,0],g,28);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.42,32,24),skinLight);
  head.position.set(0,2.67,0);head.scale.set(.96,1.10,.90);head.castShadow=true;head.receiveShadow=true;g.add(head);
  const jaw=new THREE.Mesh(new THREE.SphereGeometry(.34,28,20),skin);
  jaw.position.set(0,2.50,.07);jaw.scale.set(.92,.58,.86);jaw.castShadow=true;g.add(jaw);
  // Hairline and back hair provide a strong silhouette without requiring a full skinned head.
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.44,32,20,0,Math.PI*2,0,Math.PI*.56),hairMat);
  hair.position.set(0,2.86,.01);hair.scale.set(1.02,.72,.98);hair.castShadow=true;g.add(hair);g.userData.heroHair=hair;
  for(const side of [-1,1]){
    const lock=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),hairMat);
    lock.position.set(side*.33,2.68,-.03);lock.scale.set(.7,1.35,.72);lock.castShadow=true;g.add(lock);
  }
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),skin);
  nose.position.set(0,2.61,.39);nose.scale.set(.65,.9,.8);g.add(nose);
  for(const side of [-1,1]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.028,10,8),darkMetal);
    eye.position.set(side*.13,2.72,.382);g.add(eye);
  }

  // Articulated arms: upper arm, elbow, forearm and glove are grouped so the animation pass
  // can move the whole limb naturally.
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.56,1.91,0);arm.rotation.z=side*.10;g.add(arm);
    const upper=hdCyl(.17,.135,.70,cloth,[0,-.30,0],arm,28);
    upper.rotation.z=side*.035;
    const elbow=hdSphere(.145,skin,[0,-.67,0],arm,[1,.92,1]);
    const fore=hdCyl(.145,.115,.58,clothLight,[0,-.96,.01],arm,26);
    const glove=hdSphere(.15,leather,[0,-1.29,.02],arm,[1,.85,1]);
    parts.arms.push(arm);
  }

  // Two-piece legs with knees and substantial boots improve the lower silhouette and grounding.
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.25,1.02,0);g.add(leg);
    const thigh=hdCyl(.20,.16,.66,clothLight,[0,-.34,0],leg,28);
    const knee=hdSphere(.17,leather,[0,-.70,.02],leg,[1,.82,1]);
    const shin=hdCyl(.16,.135,.58,leather,[0,-.98,.01],leg,28);
    const boot=hdCyl(.22,.17,.38,bootMat,[0,-1.39,.08],leg,28);
    boot.scale.z=1.18;parts.legs.push(leg);
  }

  // A split-tail tunic and rear cloak give the silhouette a vertical, wind-responsive rhythm.
  for(const side of [-1,1]){
    const panel=new THREE.Mesh(new THREE.CylinderGeometry(.30,.42,.72,24,1,true),clothLight);
    panel.position.set(side*.20,1.10,-.04);panel.rotation.z=side*.06;panel.scale.z=.72;panel.castShadow=true;g.add(panel);
  }
  const cloakMat=isPlayer?new THREE.MeshStandardMaterial({color:0x304b53,roughness:.91}):new THREE.MeshStandardMaterial({color:0x3f3531,roughness:.94});
  const cloak=new THREE.Mesh(new THREE.CylinderGeometry(.42,.76,1.52,32,1,true,0,Math.PI*1.15),cloakMat);
  cloak.position.set(0,1.48,-.28);cloak.rotation.x=Math.PI/2;cloak.scale.set(1,.95,.72);cloak.castShadow=true;g.add(cloak);parts.cloak=cloak;
  const clasp=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),metal);clasp.position.set(0,2.14,-.32);clasp.castShadow=true;g.add(clasp);

  if(isPlayer){
    // HERO PRODUCTION PRESENTATION: layered PBR equipment, fur collar, shield,
    // shoulder armor, belt hardware and a readable heraldic silhouette.
    const heroCloth=new THREE.MeshPhysicalMaterial({color:0x304d62,roughness:.78,clearcoat:.10,clearcoatRoughness:.68,sheen:.16,sheenColor:new THREE.Color(0x7d9caf),sheenRoughness:.72});
    const heroLeather=new THREE.MeshPhysicalMaterial({color:0x302019,roughness:.82,clearcoat:.16,clearcoatRoughness:.58});
    const heroMetal=new THREE.MeshPhysicalMaterial({color:0x7c817d,metalness:.82,roughness:.24,clearcoat:.28,clearcoatRoughness:.24});
    const heroFur=new THREE.MeshPhysicalMaterial({color:0x9a8b72,roughness:.96,sheen:.28,sheenColor:new THREE.Color(0xd0c4a4),sheenRoughness:.86});
    // Replace the simple cloth read with a richer layered chest panel.
    const chestPlate=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.56,8,24),heroCloth);
    chestPlate.position.set(0,1.76,.23);chestPlate.scale.set(1.08,.92,.62);chestPlate.castShadow=true;g.add(chestPlate);
    for(const side of [-1,1]){
      const pauldron=new THREE.Mesh(new THREE.SphereGeometry(.25,20,14),heroMetal);
      pauldron.position.set(side*.57,2.02,.03);pauldron.scale.set(1.18,.62,.92);pauldron.rotation.z=side*.12;pauldron.castShadow=true;g.add(pauldron);
      const bracer=new THREE.Mesh(new THREE.CylinderGeometry(.13,.17,.48,24),heroMetal);
      bracer.position.set(side*.70,1.18,.02);bracer.rotation.z=side*.10;bracer.castShadow=true;g.add(bracer);
    }
    const collar=new THREE.Mesh(new THREE.TorusGeometry(.43,.105,10,36),heroFur);
    collar.position.set(0,2.20,.01);collar.rotation.x=Math.PI/2;collar.scale.set(1.02,.86,1);collar.castShadow=true;g.add(collar);
    const belt=new THREE.Mesh(new THREE.TorusGeometry(.50,.055,8,32),heroLeather);
    belt.position.set(0,1.18,0);belt.rotation.x=Math.PI/2;belt.scale.set(1,.72,1);g.add(belt);
    const buckle=new THREE.Mesh(new THREE.BoxGeometry(.17,.17,.055),heroMetal);
    buckle.position.set(0,1.19,.46);g.add(buckle);
    for(const side of [-1,1]){
      const pouch=new THREE.Mesh(new THREE.BoxGeometry(.24,.25,.14),heroLeather);
      pouch.position.set(side*.48,1.16,.30);pouch.rotation.z=side*.08;pouch.castShadow=true;g.add(pouch);
    }
    // Round shield with layered rim, boss and simple Hearthmere leaf heraldry.
    const shield=new THREE.Group();shield.position.set(-.42,1.60,-.34);shield.rotation.set(.06,.15,.08);g.add(shield);
    const shieldFace=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.12,40),heroCloth);shieldFace.rotation.x=Math.PI/2;shieldFace.castShadow=true;shield.add(shieldFace);
    const shieldRim=new THREE.Mesh(new THREE.TorusGeometry(.47,.055,10,40),heroMetal);shieldRim.rotation.x=Math.PI/2;shield.add(shieldRim);
    const boss=new THREE.Mesh(new THREE.SphereGeometry(.09,18,12),heroMetal);boss.position.set(0,0,.10);shield.add(boss);
    for(const s of [-1,1]){const leaf=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.25,5,12),heroFur);leaf.position.set(s*.075,.10,.12);leaf.rotation.z=s*.55;leaf.rotation.x=Math.PI/2;shield.add(leaf);}
    const shieldStem=new THREE.Mesh(new THREE.CapsuleGeometry(.028,.25,5,12),heroFur);shieldStem.position.set(0,.02,.12);shieldStem.rotation.x=Math.PI/2;shield.add(shieldStem);
    // Sword: bright blade, wrapped grip, guard and pommel.
    const blade=new THREE.Mesh(new THREE.CylinderGeometry(.045,.075,1.82,6),heroMetal);
    blade.position.set(.78,1.72,.05);blade.rotation.z=-.55;blade.castShadow=true;g.add(blade);g.userData.baseBlade=blade;
    const guard=new THREE.Mesh(new THREE.BoxGeometry(.13,.08,.62),heroMetal);guard.position.set(.38,2.48,.03);guard.rotation.z=-.55;g.add(guard);
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.38,16),heroLeather);grip.position.set(.25,2.63,.03);grip.rotation.z=-.55;g.add(grip);
    const pommel=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),heroMetal);pommel.position.set(.14,2.80,.03);g.add(pommel);
    // Beard/eyebrows give the face a stronger authored silhouette at mobile scale.
    const beardMat=new THREE.MeshPhysicalMaterial({color:0x3a2922,roughness:.93,sheen:.12,sheenColor:new THREE.Color(0x765644),sheenRoughness:.88});
    const beard=new THREE.Mesh(new THREE.SphereGeometry(.26,20,14),beardMat);beard.position.set(0,2.48,.30);beard.scale.set(.92,.66,.60);g.add(beard);
    for(const side of [-1,1]){const brow=new THREE.Mesh(new THREE.BoxGeometry(.16,.035,.035),beardMat);brow.position.set(side*.13,2.77,.395);brow.rotation.z=side*.08;g.add(brow);}
    g.userData.heroPresentation=true;
  }else{
    hdBox(1.05,.13,.20,leather,[0,1.12,.36],g,0,0,0,.018);
  }
  return g;
}

async function replaceLegacyVisuals(){
  const hideNames=new Set(['tree_oak','tree_pine','shrub','grass_clump','rock','cottage_A','cottage_B','cottage_C','inn','forge','chapel','mill','watchtower','bridge','well','barrel','bench','cart','crate','fence','lantern','sign','hero','character']);
  const legacy=[];
  scene.traverse(o=>{if(o.userData?.assetName && hideNames.has(o.userData.assetName))legacy.push(o);});
  legacy.forEach(g=>g.traverse(o=>{if(o.isMesh){o.visible=false;o.userData.legacyVisual=true;}}));

  const buildingNames=new Set(['inn','forge','chapel','mill','watchtower']);
  legacy.filter(g=>buildingNames.has(g.userData.assetName)).forEach(g=>{
    const replacement=hdBuilding(g.userData.assetName,g.position.x,g.position.z,g.scale.x,g.rotation.y);
    landmarks[g.userData.assetName]=replacement;
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
  const legacyRocks=legacy.filter(g=>g.userData.assetName==='rock');
  await Promise.all(legacyRocks.map(async (g,i)=>{
    const h=await placeDistilledVariant('rock',g.position.x,g.position.z,g.scale.x*.92,g.rotation.y,i%6);
    if(!h)hdRock(g.position.x,g.position.z,g.scale.x);
  }));
  const legacyShrubs=legacy.filter(g=>g.userData.assetName==='shrub');
  await Promise.all(legacyShrubs.map(async (g,i)=>{
    const h=await placeDistilledVariant('shrub',g.position.x,g.position.z,g.scale.x*.82,g.rotation.y,i%4);
    if(!h)hdSphere(.48,HD.leaf,[g.position.x,terrainHeight(g.position.x,g.position.z)+.3*g.scale.x,g.position.z],scene,[1.7*g.scale.x,.55*g.scale.x,1.15*g.scale.x]);
  }));
  const legacyGrass=legacy.filter(g=>g.userData.assetName==='grass_clump');
  await Promise.all(legacyGrass.map(async (g,i)=>{
    const h=await placeDistilledVariant('grass',g.position.x,g.position.z,g.scale.x*.52,g.rotation.y,i%3);
    if(!h)hdSphere(.38,HD.leaf,[g.position.x,terrainHeight(g.position.x,g.position.z)+.22*g.scale.x,g.position.z],scene,[1.9*g.scale.x,.30*g.scale.x,1.35*g.scale.x]);
  }));
  const propNames=new Set(['well','barrel','bench','fence','lantern','crate']);
  legacy.filter(g=>propNames.has(g.userData.assetName)).forEach(g=>{
    const replacement=hdProp(g.userData.assetName,g.position.x,g.position.z,g.scale.x,g.rotation.y);
    if(g.userData.assetName==='well')villageWell=replacement;
  });
  legacy.filter(g=>g.userData.assetName==='bridge').forEach(g=>{
    const replacement=hdBridge(g.position.x,g.position.z,g.scale.x,g.rotation.y);
    landmarks.bridge=replacement;
  });
  legacy.filter(g=>g.userData.assetName==='cart').forEach(g=>hdCart(g.position.x,g.position.z,g.scale.x,g.rotation.y));
  legacy.filter(g=>g.userData.assetName==='sign').forEach(g=>hdSign(g.position.x,g.position.z,g.scale.x,g.rotation.y));
  legacy.filter(g=>g.userData.assetName==='hero'||g.userData.assetName==='character').forEach(g=>{
    hdCharacter(g,g.userData.assetName==='hero');
    g.userData.parts={...g.userData.parts};
    g.userData.heroMeshes=[];
    g.traverse(o=>{if(o.isMesh&&o.userData.replacementVisual!==true&&o.userData.legacyVisual)o.userData.legacyVisual=true;if(o.isMesh&&o.userData.replacementVisual===true)g.userData.heroMeshes.push(o);});
  });
  const legacyCharacterRoots=legacy.filter(g=>g.userData.assetName==='hero'||g.userData.assetName==='character');
  legacyCharacterRoots.forEach(g=>{
    const stale=[];
    g.traverse(o=>{if(o.isMesh&&o.userData.legacyVisual)stale.push(o);});
    stale.forEach(o=>o.removeFromParent());
  });
  const legacyRoots=legacy.filter(g=>g.userData.assetName!=='hero'&&g.userData.assetName!=='character');
  legacyRoots.forEach(g=>g.removeFromParent());
  const disposeSceneResources=(root)=>{
    root.traverse(o=>{
      if(!o.isMesh)return;
      if(o.geometry?.dispose)o.geometry.dispose();
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{if(m?.dispose)m.dispose();});
    });
  };
  assetCache.forEach(source=>disposeSceneResources(source));
  assetCache.clear();assetClips.clear();assetPromises.clear();
  warmWindows.length=0;
}

async function buildDistilledNature(){
  // Additional high-information foliage is concentrated near the water, paths and
  // village edge where it is large enough to change the image rather than becoming
  // expensive background noise.
  const fernSpots=[
    [27.2,-22.5,.48,.12],[28.4,-18.8,.42,-.22],[27.6,-12.4,.46,.31],[28.8,-7.8,.40,-.12],
    [27.1,-2.4,.44,.26],[34.7,2.6,.48,-.18],[35.6,6.9,.43,.34],[36.8,11.2,.40,-.28],
    [26.4,17.8,.46,.18],[27.8,22.2,.41,-.34],[25.9,27.1,.45,.25],[37.0,29.0,.42,-.15],
    [-21.8,-8.4,.34,.44],[-17.5,-6.6,.30,-.21],[-7.4,-5.8,.32,.16],[3.6,-7.1,.31,-.27]
  ];
  await Promise.all(fernSpots.map((v,i)=>placeDistilledVariant('fern',v[0],v[1],v[2],v[3],i%4)));
}

// ============================================================================
// DEEP VEGETATION RECONSTRUCTION — ECOLOGICAL LAYERS
// Vegetation is treated as an ecosystem: hero trees establish silhouette,
// understory fills negative space, river vegetation responds to moisture,
// and meadow species create irregular density gradients. This is deliberately
// additive to the authored tree layout rather than another random scatter pass.
// ============================================================================
async function buildVegetationBiomes(){
  const heroGroves=[
    [-33,-31,1.42,false],[-27,-25,1.18,false],[-18,-28,1.30,true],
    [23,-31,1.48,false],[29,-27,1.20,true],[43,-24,1.36,false],
    [-37,28,1.38,true],[-31,34,1.25,false],[-22,31,1.42,false],
    [39,29,1.52,false],[45,38,1.30,true],[24,42,1.24,false]
  ];
  for(let i=0;i<heroGroves.length;i++){
    const [x,z,scale,pine]=heroGroves[i];
    const tree=hdTree(x,z,scale,pine);
    tree.userData.vegetationTier='hero';
    tree.userData.windPhase=i*.83;
    tree.userData.windStrength=.0035;
    // A second, smaller companion creates a natural canopy transition rather than isolated trees.
    const side=i%2?-1:1;
    const companion=hdTree(x+side*(2.0+(i%3)*.45),z+1.4+(i%2)*.7,scale*(.56+(i%3)*.06),!pine&&i%4===0);
    companion.userData.vegetationTier='hero_companion';
    companion.userData.windPhase=i*.91+.4;
    companion.userData.windStrength=.0042;
    foliage.push(tree,companion);
  }

  const shrubZones=[
    // wet woodland edge
    [25,-48,38,98,.76,'shrub'],[38,-46,18,100,.82,'shrubAlt'],
    // western woodland edge
    [-49,-43,18,96,.68,'scrub'],[-40,-46,16,100,.74,'shrub'],
    // northern meadow/forest transition
    [-34,31,74,30,.82,'shrubAlt'],[18,32,58,29,.76,'scrub'],
    // village outskirts — controlled density, leaving authored sightlines open
    [-31,-26,62,18,.54,'shrub'],[18,-28,38,17,.56,'scrub']
  ];
  const placements=[];
  for(const [cx,cz,w,d,density,key] of shrubZones){
    const count=Math.round(w*density);
    for(let i=0;i<count;i++){
      const x=cx+(worldRandom()-.5)*w;
      const z=cz+(worldRandom()-.5)*d;
      const nearRiver=Math.abs(x-31)<15;
      const central= Math.abs(x)<23 && z>-27 && z<25;
      const nearRoad=Math.abs(x)<7 && z>-50 && z<54;
      if(central&&worldRandom()<.72)continue;
      if(nearRoad&&worldRandom()<.58)continue;
      if(nearRiver&&worldRandom()<.18)continue;
      placements.push([key,x,z,.34+worldRandom()*.62,worldRandom()*Math.PI*2,i%4]);
    }
  }
  await Promise.all(placements.map(v=>placeDistilledVariant(...v)));

  // Ferns are concentrated where moisture and shade would naturally support them.
  const fernPlacements=[];
  for(let i=0;i<58;i++){
    const side=i%2?-1:1;
    const x=31+side*(9.8+worldRandom()*8.2);
    const z=-46+worldRandom()*96;
    fernPlacements.push(['fern',x,z,.28+worldRandom()*.48,(worldRandom()-.5)*Math.PI,i%4]);
  }
  for(let i=0;i<26;i++){
    const x=-36+worldRandom()*70,z=22+worldRandom()*30;
    fernPlacements.push(['fern',x,z,.25+worldRandom()*.42,worldRandom()*Math.PI,i%4]);
  }
  await Promise.all(fernPlacements.map(v=>placeDistilledVariant(...v)));

  // Meadow grasses are clustered, not evenly sprinkled. This creates visible density
  // gradients at the edge of clearings and around structures.
  const grassPlacements=[];
  for(let i=0;i<110;i++){
    const x=-46+worldRandom()*92,z=-50+worldRandom()*104;
    const central=Math.abs(x)<22&&z>-30&&z<25;
    if(central&&worldRandom()<.76)continue;
    const roadCut=Math.abs(x)<7&&z>-49&&z<55;
    if(roadCut&&worldRandom()<.84)continue;
    grassPlacements.push(['grass',x,z,.24+worldRandom()*.42,worldRandom()*Math.PI*2,i%3]);
  }
  await Promise.all(grassPlacements.map(v=>placeDistilledVariant(...v)));

  // A final irregular under-canopy layer uses small rocks to interrupt the repeated
  // green silhouette and make the forest floor read as material rather than paint.
  for(let i=0;i<34;i++){
    const side=i%2?-1:1;
    const x=31+side*(12+worldRandom()*20),z=-44+worldRandom()*94;
    const rock=hdRock(x,z,.20+worldRandom()*.30);
    rock.userData.vegetationTier='forest_floor';
  }
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
 g.userData.baseY=0;g.userData.phase=worldRandom()*Math.PI*2;g.userData.walking=false;g.userData.name=name;g.userData.role=role;
 g.userData.parts={arms:[],legs:[],cloak:null,body:g};g.userData.restRotationZ=g.rotation.z;g.userData.home=new THREE.Vector3(x,0,z);g.userData.wanderTarget=null;g.userData.nextWander=performance.now()+1800+worldRandom()*4200;
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
const warmWindows=[];const windowSpillLights=[];
function fire(x,z){const core=addMesh(new THREE.IcosahedronGeometry(.42,1),new THREE.MeshBasicMaterial({color:0xff6f31,transparent:true,opacity:.82}),[x,.85,z],undefined,false);const l=new THREE.PointLight(0xff7a32,5.5,15);l.position.set(x,2,z);scene.add(l);fireLights.push(l);for(let i=0;i<8;i++){const e=addMesh(new THREE.SphereGeometry(.055,6,6),MAT.ember,[x+(worldRandom()-.5)*.6,1+worldRandom()*2,z+(worldRandom()-.5)*.6],undefined,false);e.userData.phase=worldRandom()*6.28;embers.push(e)}}
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


// ============================================================================
// DEEP ENVIRONMENTAL STORYTELLING — FUNCTIONAL SCENES
// Major locations receive authored activity zones rather than isolated decorative
// props. Each scene has a material palette, physical logic and a readable silhouette.
// ============================================================================
function storyGroup(x,z){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);g.userData.staticVisual=true;g.userData.storyScene=true;scene.add(g);return g;
}
function buildStoryScenes(){
  // Warm Lantern — public frontage: tables, benches, barrels, flower planters and stacked fuel.
  {
    const g=storyGroup(-14,-13);
    for(const x of [-3.1,3.1])hdBox(2.6,.16,1.05,ARCH.timber,[x,1.00,-4.15],g,0,0,0,.035);
    for(const x of [-4.0,-2.2,2.2,4.0])hdCyl(.10,.075,1.0,ARCH.timber,[x,.50,-4.15],g,24);
    for(const x of [-3.6,3.6])hdCyl(.46,.46,.78,ARCH.timber,[x,.39,-2.65],g,28).rotation.x=Math.PI/2;
    for(const x of [-4.3,-3.4,3.4,4.3])hdCyl(.13,.09,.95,ARCH.iron,[x,.48,-2.95],g,20);
    for(let i=0;i<5;i++)hdCyl(.18,.15,1.55,ARCH.timber,[-4.2+i*.24,.32,-5.0],g,18).rotation.z=Math.PI/2;
    for(const x of [-4.7,4.7]){hdBox(.72,.48,.72,ARCH.stone,[x,.28,-3.0],g,0,0,0,.08);hdSphere(.10,ARCH.warm,[x,.64,-3.0],g,[1,.8,1]);}
  }
  // Riverside Forge — ore, fuel, work surface and tool rack establish an active workshop.
  {
    const g=storyGroup(1,-7);
    hdBox(2.9,.32,1.2,ARCH.stone,[3.0,.18,-3.75],g,0,0,0,.05);
    hdBox(1.25,.24,.58,ARCH.iron,[3.0,.48,-3.75],g,0,0,-.06,.04);
    for(let i=0;i<7;i++)hdCyl(.12,.10,.95,ARCH.timber,[-3.7+i*.52,.30,-3.9],g,18).rotation.z=Math.PI/2;
    for(let i=0;i<5;i++)hdBox(.52,.38,.46,ARCH.stone,[-3.9+(i%2)*.62,.20,-2.8+Math.floor(i/2)*.52],g,0,0,(i%2)*.12,.04);
    for(let i=0;i<4;i++){const tool=hdCyl(.035,.72, .72,ARCH.iron,[-1.2+i*.62,1.25,-4.0],g,14);tool.rotation.z=Math.PI/2;}
    for(const x of [-2.2,-1.3])hdCyl(.20,.18,.82,ARCH.timber,[x,.41,-2.45],g,24);
  }
  // Chapel yard — low wall, grave rhythm and warm candles create a civic/religious threshold.
  {
    const g=storyGroup(-12,11);
    for(let i=0;i<9;i++){
      const x=-4.1+i*.95;
      hdBox(.54,.85,.18,ARCH.stoneA,[x,.44,3.0+(i%2)*.42],g,0,(i%3)*.08,(i%2?-.08:.08),.035);
      hdBox(.18,.16,.18,ARCH.stoneB,[x,.88,3.0+(i%2)*.42],g,0,0,0,.025);
    }
    for(let i=0;i<8;i++)hdBox(1.0,.32,.34,ARCH.stoneB,[-4.2+i*1.05,.18,4.15],g,0,0,(i%2)*.08,.04);
    for(const x of [-3.8,0,3.7]){hdCyl(.035,.035,.55,ARCH.iron,[x,.55,3.75],g,12);hdSphere(.07,ARCH.warm,[x,.88,3.75],g,[1,.7,1]);}
  }
  // Ashwheel Mill — sacks, grain bins and a timber loading frame connect the building to production.
  {
    const g=storyGroup(16,-17);
    for(let i=0;i<6;i++){
      const sack=hdSphere(.34,HD.plasterWarm,[12.8+(i%3)*.62,.35,-20.7+Math.floor(i/3)*.52],g,[1,.92,.82]);
      sack.rotation.z=(i%2?-.08:.06);
    }
    for(let i=0;i<4;i++)hdBox(.70,.62,.68,ARCH.timber,[13.0+(i%2)*.85,.32,-17.1+Math.floor(i/2)*.76],g,0,0,(i%2)*.08,.05);
    for(const x of [12.2,15.4,18.0])hdCyl(.075,.06,2.6,ARCH.timber,[x,1.30,-20.3],g,20);
    hdBox(6.2,.10,.12,ARCH.timber,[15.1,2.55,-20.3],g,0,0,0,.02);
  }
  // North Watch — defensive clutter, signal flags and a fire beacon turn the landmark into a post.
  {
    const g=storyGroup(16,14);
    for(let i=0;i<6;i++)hdBox(.72,.34,.72,ARCH.stone,[10.2+(i%3)*.9,.24,11.0+Math.floor(i/3)*.72],g,0,0,(i%2)*.14,.05);
    for(let i=0;i<5;i++)hdCyl(.07,.06,1.5,ARCH.timber,[13.2+i*.62,.75,11.0],g,18);
    hdBox(4.2,.10,.12,ARCH.timber,[14.45,1.50,11.0],g,0,0,0,.02);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.72,5,3),new THREE.MeshStandardMaterial({color:0x7c3e3a,roughness:.9,side:THREE.DoubleSide}));
    flag.position.set(16,7.8,14);flag.rotation.y=.15;flag.userData.windFlag=true;g.add(flag);
  }
  // River work edge — ropes, baskets and a pulled-up skiff make the waterway feel inhabited.
  {
    const g=storyGroup(24,-4);
    hdBox(4.8,.14,1.15,ARCH.timber,[0,.65,8.7],g,0,0,0,.035);
    for(let i=0;i<6;i++)hdBox(.10,.12,1.0,ARCH.timber,[-2.0+i*.8,.82,8.7],g,0,0,0,.015);
    for(const x of [-1.9,1.9])hdCyl(.08,.07,1.6,ARCH.timber,[x,1.1,9.35],g,20);
    for(let i=0;i<3;i++)hdCyl(.34,.28,.44,ARCH.timber,[2.8+i*.58,.25,8.5+(i%2)*.5],g,24);
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
  for(let i=0;i<9;i++) cyl(.16,.7,MAT_DETAIL.wood,[cx+(worldRandom()-.5)*1.7,.35,cz+(worldRandom()-.5)*1.7],[0,worldRandom()*Math.PI,Math.PI/2]);
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
for(let i=0;i<70;i++){const sp=new THREE.Sprite(moteMat.clone());sp.position.set(-45+worldRandom()*90,1+worldRandom()*9,-40+worldRandom()*90);sp.scale.setScalar(.035+worldRandom()*.055);sp.userData.phase=worldRandom()*6.28;scene.add(sp);motes.push(sp)}

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
 for(let i=0;i<14;i++) specs.push(['tree_oak',-40+worldRandom()*18,-36+worldRandom()*70,.42+worldRandom()*.16]);
 for(let i=0;i<9;i++) specs.push(['rock',20+worldRandom()*22,-36+worldRandom()*68,.36+worldRandom()*.12]);
 for(const [asset,x,z,scale] of specs){const g=await placeAsset(asset,x,z,scale,worldRandom()*Math.PI*2);if(!g)continue;g.userData.resource={type:asset==='rock'?'stone':'wood',amount:1};interact(g,asset==='rock'?'Stone outcrop':'Young oak',asset==='rock'?'Gather a piece of clean river stone.':'Gather a fallen branch.',()=>gather(g));resourceNodes.push(g)}
}
function gather(g){const r=g.userData.resource;if(!r)return;if(!g.visible)return;say(r.type==='wood'?'You gather useful wood.':'You collect a smooth stone.');gameState.gathered++;gameState.inventory[r.type]=(gameState.inventory[r.type]||0)+r.amount;g.visible=false;setTimeout(()=>{g.visible=true},6500);}

// Movement and targeting
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
const interactionRoots=[];
let dest=null;let cinematicMode=false;let hovered=null;
window.__HEARTHMERE_INTERACTION_TARGETS=interactionRoots;
function registerInteractionRoot(o){if(o&&!interactionRoots.includes(o))interactionRoots.push(o);return o}
function setHover(o){if(hovered===o)return;if(hovered?.traverse)hovered.traverse(m=>{if(m.isMesh&&m.material?.emissive)m.material.emissive.setHex(m.userData.baseEmissive||0x000000)});hovered=o;if(hovered?.traverse)hovered.traverse(m=>{if(m.isMesh&&m.material?.emissive){m.userData.baseEmissive=m.material.emissive.getHex();m.material.emissive.lerp(new THREE.Color(0x9d7b39),.35)}})}
renderer.domElement.addEventListener('pointermove',e=>{mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(interactionRoots,true);let o=hits[0]?.object||null;while(o&&!o.userData.interaction)o=o.parent;setHover(o)});
const destinationMarker=new THREE.Mesh(new THREE.RingGeometry(.34,.52,28),new THREE.MeshBasicMaterial({color:0xe7cb76,transparent:true,opacity:.86,side:THREE.DoubleSide,depthWrite:false}));destinationMarker.rotation.x=-Math.PI/2;destinationMarker.position.y=.18;destinationMarker.visible=false;scene.add(destinationMarker);
function terrainHeight(x,z){return macroTerrainHeight(x,z);}
const NAV={
  river:{centerX:31,halfWidth:13.4},
  bridge:{centerX:31,halfWidth:6.2,minZ:-2,maxZ:14}
};
function traversable(x,z){
  const riverBlocked=Math.abs(x-NAV.river.centerX)<NAV.river.halfWidth;
  const bridge=Math.abs(x-NAV.bridge.centerX)<NAV.bridge.halfWidth&&z>NAV.bridge.minZ&&z<NAV.bridge.maxZ;
  return !riverBlocked||bridge;
}
window.__HEARTHMERE_NAV=NAV;
function say(s){toast.textContent=s;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),2600)}
function pick(e){mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(interactionRoots,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.interaction)o=o.parent;if(o){say(`${o.userData.interaction.name} — ${o.userData.interaction.msg}`);if(o.userData.interaction.action)o.userData.interaction.action();return}}const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),p=new THREE.Vector3();if(ray.ray.intersectPlane(plane,p)){p.x=THREE.MathUtils.clamp(p.x,WORLD_BOUNDS.minX,WORLD_BOUNDS.maxX);p.z=THREE.MathUtils.clamp(p.z,WORLD_BOUNDS.minZ,WORLD_BOUNDS.maxZ);if(!traversable(p.x,p.z)){say('The river is too deep here. Cross at the stone bridge.');return}dest=p.clone();destinationMarker.position.set(p.x,.2,p.z);destinationMarker.visible=true}}
renderer.domElement.addEventListener('pointerdown',pick);
captureButton?.addEventListener('click',captureRealFrame);
cinematic.addEventListener('click',()=>{cinematicMode=!cinematicMode;document.body.classList.toggle('cinematic',cinematicMode);cinematic.textContent=cinematicMode?'RETURN':'CINEMATIC';say(cinematicMode?'Cinematic world view':'Interactive world view')});
const hudMenu=document.querySelector('#hud-menu');
const inventoryPanel=document.querySelector('.panel');
hudMenu?.addEventListener('click',()=>{const open=inventoryPanel.classList.toggle('mobile-open');hudMenu.textContent=open?'CLOSE':'MENU';});
addEventListener('keydown',e=>{if(e.key==='Escape'){dest=null;destinationMarker.visible=false;cinematicMode=false;document.body.classList.remove('cinematic');cinematic.textContent='CINEMATIC'}if(e.key.toLowerCase()==='m')say('Map — Ashenvale Crossing')});

// Living atmosphere: soft smoke columns and distant birds keep the scene from feeling static.
const smoke=[];
function smokeColumn(x,z){for(let i=0;i<7;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({color:0xb8b2a2,transparent:true,opacity:.055,depthWrite:false}));sp.position.set(x+(worldRandom()-.5)*.4,.9+i*.65,z+(worldRandom()-.5)*.4);sp.scale.setScalar(.35+worldRandom()*.28);sp.userData.phase=worldRandom()*6.28;smoke.push(sp);scene.add(sp)}}
smokeColumn(5,-10);smokeColumn(-4,-28);smokeColumn(20,-24);
const birds=[];const birdMat=new THREE.MeshBasicMaterial({color:0x1e2825,side:THREE.DoubleSide});
for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.PlaneGeometry(.7,.22),birdMat);b.position.set(-30+i*11,13+i*.7,15+i*9);b.userData.phase=i*1.7;scene.add(b);birds.push(b)}

// ============================================================================
// DEEP LIFE/VFX RECONSTRUCTION — AMBIENT MOTION
// Small moving elements are distributed with intent: leaves in woodland air,
// fireflies around damp edges, and river mist near the waterline. They exist to
// give the world temporal depth without turning the scene into particle noise.
// ============================================================================
const ambientLeaves=[];
const leafMat=new THREE.MeshBasicMaterial({color:0x7f9b5d,transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide});
for(let i=0;i<34;i++){
  const leaf=new THREE.Mesh(new THREE.PlaneGeometry(.12+.04*(i%3),.07+.025*(i%2)),leafMat.clone());
  leaf.position.set(-48+worldRandom()*96,1.2+worldRandom()*6,-44+worldRandom()*92);
  leaf.rotation.set(worldRandom()*Math.PI,worldRandom()*Math.PI,worldRandom()*Math.PI);
  leaf.userData.phase=worldRandom()*Math.PI*2;
  leaf.userData.speed=.16+worldRandom()*.22;
  leaf.userData.wind=worldRandom()-.5;
  scene.add(leaf);ambientLeaves.push(leaf);
}
const fireflies=[];
const fireflyMat=new THREE.MeshBasicMaterial({color:0xffd98b,transparent:true,opacity:0,depthWrite:false});
for(let i=0;i<26;i++){
  const f=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),fireflyMat.clone());
  f.position.set(17+(worldRandom()-.5)*30,.8+worldRandom()*3,8+(worldRandom()-.5)*42);
  f.userData.phase=worldRandom()*Math.PI*2;f.userData.radius=.4+worldRandom()*1.2;
  scene.add(f);fireflies.push(f);
}
const riverMist=[];
const mistMat=new THREE.SpriteMaterial({color:0xd9eee9,transparent:true,opacity:.055,depthWrite:false});
for(let i=0;i<16;i++){
  const m=new THREE.Sprite(mistMat.clone());
  const z=-42+worldRandom()*86,x=riverCenterX(z)+(worldRandom()-.5)*14;
  m.position.set(x,.55+worldRandom()*1.6,z);m.scale.set(1.2+worldRandom()*1.5,.45+worldRandom()*.65,1);
  m.userData.phase=worldRandom()*Math.PI*2;m.userData.baseY=m.position.y;
  scene.add(m);riverMist.push(m);
}
let last=performance.now(),time=0;
const perfStats={
  frames:0,frameMs:0,minFrameMs:Infinity,maxFrameMs:0,lastFrameMs:0,geometryBytes:0,textureBytes:0,programs:0,
  drawCalls:0,triangles:0,geometries:0,textures:0,
  visibleMeshes:0,shadowCasters:0,transparentMeshes:0,lights:0,
  qualityLevel:0,updatedAt:0,drawCallsAccum:0,trianglesAccum:0,
  shadowPolicyDisabledTiny:0
};
const sceneBudget={visibleMeshes:0,shadowCasters:0,transparentMeshes:0,lights:0};
const textureBudget={count:0,estimatedBaseBytes:0,largest:[]};
window.__HEARTHMERE_PERF=perfStats;
window.__HEARTHMERE_TEXTURE_BUDGET=textureBudget;
window.__HEARTHMERE_SCENE_BUDGET=sceneBudget;
function collectSceneBudget(){
  let visibleMeshes=0,shadowCasters=0,transparentMeshes=0,lights=0;
  const textures=new Map();
  scene.traverseVisible(o=>{
    if(o.isLight){lights++;return;}
    if(!o.isMesh)return;
    visibleMeshes++;
    if(o.castShadow)shadowCasters++;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    if(mats.some(m=>m?.transparent||m?.opacity<.999))transparentMeshes++;
    for(const m of mats){
      if(!m)continue;
      for(const k of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap']){
        const t=m[k];
        if(t?.isTexture)textures.set(t.uuid,t);
      }
    }
  });
  sceneBudget.visibleMeshes=visibleMeshes;
  sceneBudget.shadowCasters=shadowCasters;
  sceneBudget.transparentMeshes=transparentMeshes;
  sceneBudget.lights=lights;
  let estimatedBaseBytes=0;
  const largest=[];
  textures.forEach(t=>{
    const w=t.image?.width||t.source?.data?.width||0;
    const h=t.image?.height||t.source?.data?.height||0;
    if(w&&h){
      const bytes=w*h*4;
      estimatedBaseBytes+=bytes;
      largest.push({name:t.name||t.uuid,width:w,height:h,estimatedBaseBytes:bytes});
    }
  });
  largest.sort((a,b)=>b.estimatedBaseBytes-a.estimatedBaseBytes);
  textureBudget.count=textures.size;
  textureBudget.estimatedBaseBytes=estimatedBaseBytes;
  textureBudget.largest=largest.slice(0,12);
}
const shadowPolicy={examined:0,castersBefore:0,castersAfter:0,disabledTiny:0};
let shadowRefreshFrame=0;
renderer.shadowMap.autoUpdate=false;sun.shadow.needsUpdate=true;
/* GRAPHICS PASS 8 — world life, landmark atmosphere, and frame-loop hardening.
   This pass works across the authored slice: living landmarks, role-readable NPC
   motion, practical-light animation, interaction focus, and hot-path cleanup.
*/
const worldLife={smoke:[],windFlags:[],practicalLights:[],roleRigs:[],interactionPulse:null};
function buildWorldLifeAndInteractionPass(){
  if(window.__HEARTHMERE_WORLD_LIFE?.version===1)return;
  scene.traverse(o=>{if(o.userData?.windFlag)worldLife.windFlags.push(o);});
  const smokeTexture=(()=>{const c=document.createElement('canvas');c.width=96;c.height=96;const x=c.getContext('2d');const g=x.createRadialGradient(48,48,3,48,48,44);g.addColorStop(0,'rgba(230,225,205,.24)');g.addColorStop(.42,'rgba(205,202,190,.12)');g.addColorStop(1,'rgba(180,185,180,0)');x.fillStyle=g;x.fillRect(0,0,96,96);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
  const smokeSpecs=[[-11.2,-15.0,5.0,.85],[2.9,-7.4,5.1,.72],[19.1,-19.0,5.4,.62]];
  smokeSpecs.forEach(([x,z,y,scale])=>{for(let i=0;i<5;i++){const m=new THREE.SpriteMaterial({map:smokeTexture,color:0xc9c7bc,transparent:true,opacity:0,depthWrite:false});const p=new THREE.Sprite(m);p.name='LandmarkSmoke';p.position.set(x+(i%2-.5)*.22,y+i*.22,z+(i%3-.5)*.18);p.scale.setScalar(scale*(.65+i*.11));p.userData.smoke={baseX:p.position.x,baseY:p.position.y,baseZ:p.position.z,phase:worldRandom()*Math.PI*2,speed:.18+worldRandom()*.10,life:worldRandom()};scene.add(p);worldLife.smoke.push(p);}});
  scene.traverse(o=>{if(!o.isPointLight)return;const n=(o.name||'').toLowerCase();if(/lamp|fire|lantern|forge|practical|graphicsrim/.test(n)){o.userData.practicalLight=true;o.userData.baseIntensity=o.intensity;o.userData.flickerPhase=worldRandom()*Math.PI*2;worldLife.practicalLights.push(o);}});
  characters.forEach(g=>{if(!g||g===player)return;const role=g.userData.role;const rig={g,role,phase:g.userData.phase||0,hammer:null,spear:null};g.traverse(o=>{const n=(o.name||'').toLowerCase();if(role==='smith'&&!rig.hammer&&n.includes('cylinder'))rig.hammer=o;if(role==='watch'&&!rig.spear&&n.includes('cylinder'))rig.spear=o;});worldLife.roleRigs.push(rig);});
  const pulse=new THREE.Mesh(new THREE.RingGeometry(.48,.58,32),new THREE.MeshBasicMaterial({color:0xf0c86b,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));pulse.rotation.x=-Math.PI/2;pulse.name='InteractionFocusPulse';scene.add(pulse);worldLife.interactionPulse=pulse;
  window.__HEARTHMERE_WORLD_LIFE={version:1,smokePuffs:worldLife.smoke.length,windFlags:worldLife.windFlags.length,practicalLights:worldLife.practicalLights.length,roleRigs:worldLife.roleRigs.length,interactionFocus:true};
  window.__HEARTHMERE_FRAME_OPTIMIZATION={version:1,cachedWindFlags:worldLife.windFlags.length,sceneTraversalRemoved:true};
}
function updateWorldLife(dt){
  const banners=window.__HEARTHMERE_BANNERS?.banners||[];
  banners.forEach((b,i)=>{
    const p=b.userData.bannerPhase||i;
    b.rotation.y=Math.PI+Math.sin(time*1.55+p)*.055;
    b.rotation.z=Math.sin(time*1.9+p)*.035;
    b.scale.y=.98+Math.sin(time*1.25+p)*.025;
  });

  const t=time;
  worldLife.windFlags.forEach((o,i)=>{o.rotation.z=Math.sin(t*.85+i*.37)*.055;o.rotation.x=Math.cos(t*.57+i*.29)*.025});
  worldLife.smoke.forEach((p,i)=>{const q=p.userData.smoke;const phase=(q.life+t*q.speed)%1;p.position.y=q.baseY+phase*2.15;p.position.x=q.baseX+Math.sin(t*.35+q.phase)*(.18+.25*phase);p.position.z=q.baseZ+Math.cos(t*.29+q.phase)*(.12+.18*phase);p.material.opacity=Math.sin(Math.PI*phase)*.18*(1-phase*.35);p.scale.setScalar((1+phase*.9)*(.55+i%3*.08));});
  worldLife.practicalLights.forEach((l,i)=>{const base=l.userData.baseIntensity??l.intensity;l.intensity=base*(.965+.035*Math.sin(t*5.4+(l.userData.flickerPhase||i)));});
  worldLife.roleRigs.forEach(r=>{const g=r.g,p=t*1.8+r.phase;if(r.role==='smith'&&r.hammer)r.hammer.rotation.z=.20+Math.sin(p*1.7)*.18;if(r.role==='watch'&&r.spear)r.spear.rotation.y=Math.sin(t*.42+r.phase)*.08;g.scale.y=1+Math.sin(t*1.35+r.phase)*.012;});
  const pulse=worldLife.interactionPulse;
  if(pulse){const target=window.__HEARTHMERE_ACTIVE_INTERACTION;if(target?.position){pulse.visible=true;pulse.position.set(target.position.x,terrainHeight(target.position.x,target.position.z)+.045,target.position.z);const a=.5+.5*Math.sin(t*3.4);pulse.material.opacity=.16+.14*a;pulse.scale.setScalar(1+.12*a);}else pulse.visible=false;}
}

function freezeStaticVisuals(){
  let frozen=0;
  scene.traverse(o=>{
    if(!o.userData?.staticVisual || o.userData?.vegetationTier)return;
    o.updateMatrix();
    o.matrixAutoUpdate=false;
    o.updateMatrixWorld(true);
    o.traverse(child=>{
      if(child===o)return;
      if(child.userData?.windFlag){child.matrixAutoUpdate=true;return;}
      child.updateMatrix();
      child.matrixAutoUpdate=false;
      frozen++;
    });
  });
  window.__HEARTHMERE_STATIC_FROZEN=frozen;
}

window.__HEARTHMERE_SHADOW_POLICY=shadowPolicy;
function applyShadowPolicy(){
  shadowPolicy.examined=0;shadowPolicy.castersBefore=0;shadowPolicy.castersAfter=0;shadowPolicy.disabledTiny=0;
  scene.traverseVisible(o=>{
    if(!o.isMesh)return;
    shadowPolicy.examined++;
    if(!o.castShadow)return;
    shadowPolicy.castersBefore++;
    const critical=o.userData.shadowCritical===true || o.userData.assetName==='hero' || o.userData.role==='player';
    if(critical)return;
    const geo=o.geometry;if(!geo)return;
    if(!geo.boundingSphere)geo.computeBoundingSphere();
    const localRadius=geo.boundingSphere?.radius||0;
    const scale=o.getWorldScale(new THREE.Vector3());
    const worldRadius=localRadius*Math.max(scale.x,scale.y,scale.z);
    if(worldRadius<.22){o.castShadow=false;shadowPolicy.disabledTiny++;}
  });
  scene.traverseVisible(o=>{if(o.isMesh&&o.castShadow)shadowPolicy.castersAfter++;});
}

// ============================================================================
// MASTER ART-DIRECTION CONSTRUCTION PASS
// Macro composition first: civic space, streets, arrival, river edge,
// vegetation masses, and a coherent lighting hierarchy.
// ============================================================================
const MASTER={
  plaza:new THREE.MeshStandardMaterial({color:0x827766,roughness:.88,metalness:.02}),
  plazaDark:new THREE.MeshStandardMaterial({color:0x5b5147,roughness:.94}),
  curb:new THREE.MeshStandardMaterial({color:0x69665e,roughness:.96}),
  timber:new THREE.MeshStandardMaterial({color:0x4b3022,roughness:.82}),
  timberLight:new THREE.MeshStandardMaterial({color:0x765038,roughness:.78}),
  plaster:new THREE.MeshStandardMaterial({color:0xbcae91,roughness:.9}),
  roof:new THREE.MeshStandardMaterial({color:0x403833,roughness:.84}),
  banner:new THREE.MeshStandardMaterial({color:0x7d3d38,roughness:.88,side:THREE.DoubleSide}),
  brass:new THREE.MeshStandardMaterial({color:0xa98243,roughness:.34,metalness:.7}),
  glass:new THREE.MeshPhysicalMaterial({color:0x9ac9c4,roughness:.12,metalness:.04,transmission:.22,transparent:true,opacity:.9,clearcoat:1}),
  green:new THREE.MeshStandardMaterial({color:0x4f7045,roughness:.96}),
  flower:new THREE.MeshStandardMaterial({color:0xb9875e,roughness:.92})
};
function masterLamp(x,z,scale=1){
  const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);
  cyl(.075,2.7,MASTER.timber,[0,1.35,0],[],g);box(.46,.12,.46,MASTER.brass,[0,2.58,0],0,g);
  const glow=new THREE.Mesh(new THREE.OctahedronGeometry(.20,2),new THREE.MeshBasicMaterial({color:0xffbd6c,transparent:true,opacity:.92}));
  glow.position.set(0,2.30,0);g.add(glow);
  const light=new THREE.PointLight(0xffa451,1.15,7.5,.85);light.position.set(0,2.25,0);g.add(light);
  g.scale.setScalar(scale);scene.add(g);return g;
}
function masterBanner(x,z,rot=0,h=4.2){
  const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;
  cyl(.075,h,MASTER.timber,[0,h/2,0],[],g);box(1.05,.08,.08,MASTER.brass,[0,h-.18,0]);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.45,3,4),MASTER.banner.clone());
  flag.position.set(.48,h-.82,0);flag.rotation.y=Math.PI/2;flag.userData.windFlag=true;g.add(flag);scene.add(g);return g;
}
function masterArch(x,z,w=8,h=5.8){
  const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);
  box(1.0,h,1.0,MASTER.curb,[-w/2,h/2,0],0,g);box(1.0,h,1.0,MASTER.curb,[w/2,h/2,0],0,g);
  box(w+1.1,.72,1.05,MASTER.timberLight,[0,h-.15,0],0,g);box(w+.25,.22,.42,MASTER.timber,[0,h-.75,0],0,g);
  for(const px of [-w*.34,-w*.12,w*.12,w*.34])box(.16,.75,.48,MASTER.timber,[px,h-.68,0],0,g);
  scene.add(g);masterLamp(x-w/2-.9,z,.9);masterLamp(x+w/2+.9,z,.9);return g;
}
function masterPlaza(x,z,r=10){
  addMesh(new THREE.CircleGeometry(r,72),MASTER.plaza,[x,terrainHeight(x,z)+.045,z],[-Math.PI/2,0,0],false);
  addMesh(new THREE.CircleGeometry(r*.78,72),MASTER.plazaDark,[x,terrainHeight(x,z)+.052,z],[-Math.PI/2,0,0],false);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,px=x+Math.cos(a)*r*.84,pz=z+Math.sin(a)*r*.84;box(.9,.18,.42,MASTER.curb,[px,terrainHeight(px,pz)+.16,pz],a);}
  for(let i=0;i<8;i++)masterLamp(x+Math.cos(i*Math.PI/4)*r*.94,z+Math.sin(i*Math.PI/4)*r*.94,.82);
  box(1.8,.55,1.8,MASTER.curb,[x,terrainHeight(x,z)+.30,z]);
  cyl(.72,.22,MASTER.brass,[x,terrainHeight(x,z)+.70,z]);
  const flame=new THREE.Mesh(new THREE.IcosahedronGeometry(.28,2),new THREE.MeshBasicMaterial({color:0xff9b48,transparent:true,opacity:.95}));
  flame.position.set(x,terrainHeight(x,z)+1.08,z);scene.add(flame);
  const l=new THREE.PointLight(0xff9b4d,1.8,9,.8);l.position.copy(flame.position);scene.add(l);
}
function masterStreet(x,z,w,d,rot=0){
  const path=addMesh(terrainRibbonGeometry(x,z,w,d,rot,72),MASTER.plaza,[0,0,0],undefined,false);path.receiveShadow=true;
  for(const side of [-1,1])for(let i=0;i<18;i++){
    const v=(i/17-.5)*d,lx=side*w*.53,lz=v,c=Math.cos(rot),s=Math.sin(rot);
    const px=x+lx*c-lz*s,pz=z+lx*s+lz*c;box(.42,.18,.72,MASTER.curb,[px,terrainHeight(px,pz)+.16,pz],rot+(i%3)*.08);
  }
}
function masterRiverBanks(){
  for(const side of [-1,1])for(let i=0;i<18;i++){
    const z=-48+i*5.1,cx=riverCenterX(z),hw=riverHalfWidth(z),x=cx+side*(hw+1.9),y=terrainHeight(x,z);
    const stone=box(1.1,.32,.72,MASTER.curb,[x,y+.18,z],(i*.41)%Math.PI);stone.scale.set(1.2+(i%3)*.25,.75,1);
    if(i%2===0){const plant=new THREE.Group();plant.position.set(x+side*.7,y,z+.8);for(let j=0;j<5;j++)cyl(.025,.7+worldRandom()*.45,MASTER.green,[(worldRandom()-.5)*.6,.35,(worldRandom()-.5)*.5],[0,(worldRandom()-.5)*.35,(worldRandom()-.5)*.18],plant);scene.add(plant);}
  }
}
function masterTreeCluster(x,z,s=1){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);
  cyl(.30*s,3.0*s,HD.trunk||MASTER.timber,[0,1.5*s,0],[],g);
  [[0,3.25,0,1.65],[1.0,2.85,.15,1.05],[-.95,2.75,-.10,1.12],[.15,4.05,.05,1.05]].forEach((v,i)=>{const m=new THREE.Mesh(new THREE.IcosahedronGeometry(v[3]*s,2),i%2?(HD.leafLight||MASTER.green):(HD.leaf||MASTER.green));m.position.set(v[0]*s,v[1]*s,v[2]*s);m.scale.y=.9;m.castShadow=true;m.receiveShadow=true;g.add(m);});
  scene.add(g);return g;
}
function masterFlowerMeadow(x,z,r=4){
  const g=new THREE.Group();g.position.set(x,terrainHeight(x,z)+.03,z);
  for(let i=0;i<26;i++){const a=worldRandom()*Math.PI*2,rr=Math.sqrt(worldRandom())*r;cyl(.018,.22+worldRandom()*.20,i%3?MASTER.green:MASTER.flower,[Math.cos(a)*rr,.11,Math.sin(a)*rr],[0,0,0],g);}
  scene.add(g);return g;
}
function buildMasterArtDirectionPass(){
  masterPlaza(-5,-8,10.5);
  masterStreet(-5,-19,6.0,22,-.04);masterStreet(-8,3,5.0,34,.04);masterStreet(7,-8,5.0,34,.10);masterStreet(7,13,4.2,22,-.06);
  masterArch(-5,-31,9.5,6.2);
  masterBanner(-14,-28,-.10,4.8);masterBanner(4,-29,.08,4.8);masterBanner(-25,8,.32,4.1);masterBanner(23,9,-.25,4.1);
  masterRiverBanks();masterStreet(31,6,5.6,15,Math.PI/2);
  [[27,-1],[35,-1],[27,13],[35,13]].forEach(v=>masterLamp(...v,.82));
  [[-39,-28,1.35],[-38,2,1.15],[-37,28,1.25],[31,-34,1.35],[42,-5,1.2],[39,27,1.3],[-31,39,1.15],[34,42,1.25]].forEach(v=>masterTreeCluster(...v));
  [[-31,-15,4.5],[-27,27,4.0],[20,29,4.8],[38,34,4.6],[-39,15,3.8]].forEach(v=>masterFlowerMeadow(...v));
  [[-14,-13,0.9],[1,-7,.82],[-12,11,.8],[16,-17,.9],[16,14,.78]].forEach(([x,z,r])=>masterLamp(x+r*2.1,z-r*2.0,.72));
  const plazaLight=new THREE.PointLight(0xffc27a,2.2,16,.75);plazaLight.position.set(-5,5,-8);scene.add(plazaLight);
  const gateLight=new THREE.PointLight(0xff9c52,1.8,12,.8);gateLight.position.set(-5,4,-31);scene.add(gateLight);
}

// ============================================================================
// CIVIC ARCHITECTURE PASS — second macro construction layer.
// Adds a coherent settlement silhouette rather than isolated asset drops.
// ============================================================================
function civicTower(x,z,s=1){
  const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);
  box(2.8*s,5.4*s,2.8*s,MASTER.curb,[0,2.7*s,0],0,g);
  box(3.25*s,.42*s,3.25*s,MASTER.timberLight,[0,5.2*s,0],0,g);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;box(.52*s,.72*s,.78*s,MASTER.curb,[Math.cos(a)*1.15*s,5.72*s,Math.sin(a)*1.15*s],a,g);}
  const roof=new THREE.Mesh(new THREE.ConeGeometry(2.25*s,2.1*s,6),MASTER.roof);roof.position.y=6.55*s;roof.rotation.y=Math.PI/6;roof.castShadow=true;g.add(roof);
  masterLamp(x+1.8*s,z-1.8*s,.78);scene.add(g);return g;
}
function civicWall(x,z,length,rot=0){
  const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;
  const seg=Math.max(2,Math.floor(length/3));
  for(let i=0;i<seg;i++){
    const px=(i-(seg-1)/2)*3.0;
    box(2.75,2.4,.55,MASTER.curb,[px,1.2,0],0,g);
    if(i<seg-1)box(.20,2.65,.72,MASTER.timber,[px+1.45,1.32,0],0,g);
  }
  box(length+.35,.20,.72,MASTER.timberLight,[0,2.42,0],0,g);
  scene.add(g);return g;
}
function marketPavilion(x,z,rot=0){
  const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rot;
  box(7.6,.24,4.5,MASTER.curb,[0,.18,0],0,g);
  for(const px of [-3.15,3.15])for(const pz of [-1.65,1.65])cyl(.13,4.2,MASTER.timber,[px,2.1,pz],[],g);
  box(7.9,.18,4.8,MASTER.timberLight,[0,4.25,0],0,g);
  const roofL=new THREE.Mesh(new THREE.ConeGeometry(4.9,2.15,4),MASTER.roof);roofL.position.y=5.35;roofL.rotation.y=Math.PI/4;roofL.scale.z=.82;roofL.castShadow=true;g.add(roofL);
  for(const px of [-2.3,0,2.3]){box(1.7,.12,1.25,MASTER.plaster,[px,2.05,2.32],0,g);box(1.8,.10,1.35,MASTER.banner,[px,3.2,2.32],0,g);}
  scene.add(g);return g;
}
function buildCivicArchitecturePass(){
  // A compact market pavilion becomes the social heart immediately south of the square.
  marketPavilion(-5,-18,-.03);
  // Perimeter construction frames the village without becoming a fortress.
  civicWall(-39,8,24,Math.PI/2);civicWall(-3,38,62,0);civicWall(27,29,22,Math.PI/2);
  civicTower(-39,-5,.92);civicTower(-39,28,.86);civicTower(27,28,.84);
  // Forge and mill receive heavier working-yard silhouettes.
  civicWall(1,-12,10,.0);civicWall(18,-24,10,.12);
  // Chapel garden: a low wall and gate make the civic landmark feel placed in a town.
  civicWall(-12,17,13,.0);
  masterArch(-12,14,4.4,3.0);
  // Roofline accents give the core skyline a richer vertical rhythm.
  for(const [x,z,s] of [[-22,-4,.72],[-23,5,.7],[-20,15,.72],[-8,20,.68],[-1,22,.66],[7,17,.68],[10,-28,.72]]) {
    const y=terrainHeight(x,z);
    const cap=new THREE.Mesh(new THREE.ConeGeometry(1.35*s,.95*s,4),MASTER.roof);
    cap.position.set(x,y+4.15*s,z);cap.rotation.y=Math.PI/4;cap.castShadow=true;scene.add(cap);
    cyl(.10,.85*s,MASTER.brass,[x,y+4.75*s,z]);
  }
}

// ============================================================================
// PRESENTATION MATERIAL PASS — large-value readability before micro detail.
// ============================================================================
function buildPresentationMaterialPass(){
  // Pull the world out of the muddy midtones seen in early runtime frames.
  MAT.grass.color.set(0x6d8248);MAT.road.color.set(0x9a8568);MAT.rock.color.set(0x706b61);
  MAT.water.color.set(0x23808d);MAT.water.opacity=.96;
  MASTER.plaza.color.set(0x91836e);MASTER.plazaDark.color.set(0x6b5e51);MASTER.curb.color.set(0x77736a);
  MASTER.timber.color.set(0x543523);MASTER.timberLight.color.set(0x80593d);
  HD.timber.color.set(0x4b3123);HD.timberLight.color.set(0x765038);
  HD.plaster.color.set(0xc5b99e);HD.plasterWarm.color.set(0xd0bf9f);
  HD.stone.color.set(0x858078);HD.stoneDark.color.set(0x5b5852);
  HD.roof.color.set(0x403c38);HD.roofWarm.color.set(0x5b493e);
  ARCH.timber.color.set(0x4b3022);ARCH.timberLight.color.set(0x765039);
  ARCH.stoneA.color.set(0x817c73);ARCH.stoneB.color.set(0x66625c);
  ARCH.roofA.color.set(0x45403b);ARCH.roofB.color.set(0x5a473d);ARCH.roofC.color.set(0x45514b);
  // A gentle cool environment keeps shadowed facades legible while warm practicals retain focus.
  hemi.intensity=1.08;fill.intensity=.66;sun.intensity=2.6;scene.environmentIntensity=.34;
  renderer.toneMappingExposure=1.04;
  scene.fog.color.set(0x72827b);scene.fog.density=.00086;
  bloomPass.strength=.07;bloomPass.radius=.34;bloomPass.threshold=.88;
}

// ============================================================================
// LANDMARK COURTYARD PASS — integrate the five major silhouettes into believable
// functional spaces instead of leaving them as standalone models.
// ============================================================================
function courtyardDeck(x,z,w,d,rot=0,mat=MASTER.plazaDark){
  const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y+.04,z);g.rotation.y=rot;
  box(w,.16,d,mat,[0,.08,0],0,g);
  for(const side of [-1,1])for(let i=0;i<Math.max(2,Math.floor(w/2.4));i++)cyl(.07,.8,MASTER.timber,[-w*.42+i*(w*.84/Math.max(1,Math.floor(w/2.4)-1)),.45,side*d*.42],[],g);
  scene.add(g);return g;
}
function courtyardCrates(x,z,count=5,rot=0){
  for(let i=0;i<count;i++){
    const px=x+Math.cos(i*2.3)*(.8+(i%3)*.22),pz=z+Math.sin(i*2.3)*(.7+(i%2)*.24);
    const q=hdProp('crate',px,pz,.55+(i%3)*.08,rot+i*.17);
    q.userData.staticVisual=true;
  }
}
function courtyardBarrels(x,z,count=5,rot=0){
  for(let i=0;i<count;i++)hdProp('barrel',x+Math.cos(i*2.4)*(.75+(i%2)*.18),z+Math.sin(i*2.4)*(.65+(i%3)*.16),.58,rot+i*.18);
}
function buildLandmarkCourtyardPass(){
  // Warm Lantern: timber beer garden and stacked firewood.
  courtyardDeck(-14,-8.8,7.2,3.2,-.02,MASTER.timberLight);
  courtyardBarrels(-16.6,-7.6,4,.1);courtyardCrates(-11.4,-8.2,3,.2);masterLamp(-14,-8.0,.86);
  // Riverside Forge: hard stone apron, ore stacks and a covered tool rack.
  courtyardDeck(1,-11.2,6.5,3.4,.02,MASTER.curb);
  courtyardBarrels(3.0,-11.4,4,.3);courtyardCrates(-.9,-12.0,4,-.2);
  for(let i=0;i<5;i++)box(.12,.12,1.5,MASTER.iron,[-1.8+i*.65,1.15,-12.85],.18);
  masterLamp(2.8,-10.2,.82);
  // Chapel: enclosed garden with low stone edging and a ceremonial path.
  courtyardDeck(-12,15.8,7.2,2.8,.0,MASTER.plaza);
  for(let i=0;i<10;i++){const a=i/9*Math.PI;const px=-12+Math.cos(a)*4.0,pz=15.8+Math.sin(a)*2.0;box(.45,.22,.45,MASTER.curb,[px,terrainHeight(px,pz)+.12,pz],a);}
  masterFlowerMeadow(-12,16.5,2.6);masterLamp(-12,15.1,.78);
  // Ashwheel Mill: loading platform aimed toward the river.
  courtyardDeck(20,-20.0,7.0,3.4,.04,MASTER.timberLight);
  courtyardCrates(20,-21.2,6,.1);courtyardBarrels(17.2,-19.5,4,-.1);masterLamp(20,-18.9,.8);
  // North Watch: patrol yard with training posts and a strong approach light.
  courtyardDeck(16,10.2,7.0,3.1,.0,MASTER.plazaDark);
  for(let i=0;i<4;i++){cyl(.09,1.8,MASTER.timber,[13.7+i*1.5,terrainHeight(13.7+i*1.5,10.2)+.9,10.2]);box(.48,.12,.48,MASTER.brass,[13.7+i*1.5,terrainHeight(13.7+i*1.5,10.2)+1.72,10.2]);}
  masterLamp(12.8,12.2,.86);
}

// ============================================================================
// BEAUTY LIGHTING PASS — layered key/fill/rim and a restrained sun disc.
// The purpose is dimensional material response, not decorative town dressing.
// ============================================================================
function buildBeautyLightingPass(){
  sun.color.set(0xffd6b0);sun.intensity=2.75;sun.position.set(-64,92,38);
  fill.color.set(0x8fb8c7);fill.intensity=.58;fill.position.set(48,38,-58);
  hemi.color.set(0xf4f7ef);hemi.groundColor.set(0x2c3028);hemi.intensity=1.12;
  moon.intensity=.055;
  scene.environmentIntensity=.38;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  // Soft directional rim separates the hero and major silhouettes from the landscape.
  if(!scene.getObjectByName('BeautyRim')){
    const rim=new THREE.DirectionalLight(0x9cc7d6,.42);rim.name='BeautyRim';rim.position.set(34,54,-72);scene.add(rim);
  }
  // Slightly stronger occlusion at contact scale; this is still intentionally restrained.
  ssaoPass.kernelRadius=12;ssaoPass.minDistance=.001;ssaoPass.maxDistance=.19;
  bloomPass.strength=.075;bloomPass.radius=.32;bloomPass.threshold=.90;
}

// ============================================================================
// HIGH-END ATMOSPHERE PASS — depth cues without foreground transparency sheets.
// ============================================================================

// ============================================================================
// GRAPHICS FOUNDATION V2 — global surface language and material hierarchy.
// This pass is intentionally asset/material focused: it does not expand the
// settlement footprint. It establishes one coherent stylized-PBR response for
// the entire existing scene before any later architecture/world-design pass.
// ============================================================================
function installFoundationSurfaceShader(mat,seed=1,edge=.018){
  if(!mat || !(mat.isMeshStandardMaterial||mat.isMeshPhysicalMaterial) || mat.userData.foundationShaderInstalled) return;
  const prior=mat.onBeforeCompile;
  mat.onBeforeCompile=(shader,renderer)=>{
    if(prior)prior(shader,renderer);
    const worldSeed=Number(seed)||1;
    shader.vertexShader='varying vec3 vFoundationWorld; varying vec3 vFoundationNormal;\n'+
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n vFoundationWorld=(modelMatrix*vec4(transformed,1.0)).xyz; vFoundationNormal=normalize(mat3(modelMatrix)*objectNormal);'
      );
    shader.fragmentShader='varying vec3 vFoundationWorld; varying vec3 vFoundationNormal;\n'+
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n float fMacroA=sin(vFoundationWorld.x*(.071+'+(worldSeed*.0031).toFixed(5)+')+vFoundationWorld.z*(.053+'+(worldSeed*.0023).toFixed(5)+'));\n float fMacroB=sin(vFoundationWorld.x*.019-vFoundationWorld.z*.031+'+(worldSeed*1.37).toFixed(4)+');\n float fBreak=clamp(fMacroA*.045+fMacroB*.025,-.065,.065);\n diffuseColor.rgb*=1.0+fBreak;\n float fWarm=sin(vFoundationWorld.x*.011+vFoundationWorld.z*.008)*.5+.5;\n diffuseColor.rgb*=mix(vec3(.985,.99,.98),vec3(1.012,1.004,.988),fWarm);\n float fUp=clamp(dot(normalize(vFoundationNormal),vec3(0.0,1.0,0.0)),0.0,1.0);\n float fCrease=1.0-fUp;\n diffuseColor.rgb*=mix(vec3(.925,.91,.88),vec3(1.018,1.012,1.0),fUp*.34);\n diffuseColor.rgb*=1.0-fCrease*.045;\n float fSpec=pow(1.0-max(dot(normalize(vFoundationNormal),normalize(-vViewPosition)),0.0),4.0);\n diffuseColor.rgb*=1.0+fSpec*.012;'
      );
  };
  mat.userData.foundationShaderInstalled=true;
  mat.needsUpdate=true;
}
window.__HEARTHMERE_FOLIAGE_SHADERS=[];
function foundationPhysicalizeFoliageMaterial(mat,phase=0){
  if(!mat || mat.userData.foundationFoliageConverted || mat.isMeshBasicMaterial) return mat;
  const physical=new THREE.MeshPhysicalMaterial();
  physical.name=(mat.name||'Foliage')+'_FoundationPhysical';
  physical.color.copy(mat.color||new THREE.Color(0xffffff));
  physical.map=mat.map||null;
  physical.alphaMap=mat.alphaMap||null;
  physical.normalMap=mat.normalMap||null;
  if(physical.normalScale && mat.normalScale) physical.normalScale.copy(mat.normalScale);
  physical.aoMap=mat.aoMap||null;
  physical.aoMapIntensity=mat.aoMapIntensity??1;
  physical.vertexColors=mat.vertexColors;
  physical.side=mat.side;
  physical.transparent=mat.transparent;
  physical.opacity=mat.opacity;
  physical.alphaTest=Math.max(mat.alphaTest||0,.32);
  physical.depthWrite=mat.depthWrite;
  physical.depthTest=mat.depthTest;
  physical.fog=mat.fog;
  physical.roughness=Math.min(.92,Math.max(.72,mat.roughness??.84));
  physical.metalness=0;
  physical.sheen=.34;
  physical.sheenColor.set(0x8fbf8a);
  physical.sheenRoughness=.82;
  physical.clearcoat=.035;
  physical.clearcoatRoughness=.78;
  physical.envMapIntensity=.55;
  physical.userData.foundationFoliageConverted=true;
  const prior=mat.onBeforeCompile;
  physical.onBeforeCompile=(shader,renderer)=>{
    if(prior)prior(shader,renderer);
    shader.uniforms.uLeafPhase={value:phase};
    shader.vertexShader='uniform float uLeafPhase;varying vec3 vLeafWorld;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vLeafWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader='varying vec3 vLeafWorld;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float leafBreak=sin(vLeafWorld.x*1.9+vLeafWorld.z*1.37+uLeafPhase)*sin(vLeafWorld.z*.73-vLeafWorld.x*.41+uLeafPhase*.71); diffuseColor.rgb*=1.0+leafBreak*.028; float backLight=pow(max(dot(normalize(vNormal),normalize(vec3(-.52,.74,.42))),0.0),2.2); diffuseColor.rgb+=vec3(.055,.075,.038)*backLight;');
  };
  physical.needsUpdate=true;
  physical.userData.foliagePhase=phase;
  return physical;
}
function upgradeArchitecturalLibraries(){
  const libraries=[MASTER,HD,ARCH];
  const sourceMats=new Set();
  libraries.forEach(lib=>Object.values(lib||{}).forEach(m=>{if(m?.isMeshStandardMaterial)sourceMats.add(m);}));
  const replacements=new Map();
  sourceMats.forEach(mat=>{
    const p=new THREE.MeshPhysicalMaterial();
    p.name=(mat.name||'Architecture')+'_Physical';
    p.color.copy(mat.color);
    p.map=mat.map||null;p.normalMap=mat.normalMap||null;p.normalScale?.copy(mat.normalScale||new THREE.Vector2(1,1));
    p.roughness=mat.roughness;p.metalness=mat.metalness;
    p.aoMap=mat.aoMap||null;p.aoMapIntensity=mat.aoMapIntensity??1;
    p.emissive.copy(mat.emissive||new THREE.Color(0,0,0));p.emissiveMap=mat.emissiveMap||null;p.emissiveIntensity=mat.emissiveIntensity??1;
    p.alphaMap=mat.alphaMap||null;p.transparent=mat.transparent;p.opacity=mat.opacity;p.side=mat.side;p.depthWrite=mat.depthWrite;p.depthTest=mat.depthTest;
    p.envMapIntensity=mat.envMapIntensity??.4;
    const n=(mat.name||'').toLowerCase();
    const wood=/wood|timber|plank/.test(n),roof=/roof|tile|slate/.test(n),stone=/stone|curb|plaza/.test(n),metal=/iron|brass/.test(n);
    if(wood){p.clearcoat=.10;p.clearcoatRoughness=.50;p.roughness=Math.max(.68,p.roughness);}
    if(roof){p.clearcoat=.13;p.clearcoatRoughness=.52;p.roughness=Math.max(.70,p.roughness);}
    if(stone){p.sheen=.055;p.sheenColor.set(0xb5aa98);p.sheenRoughness=.86;p.roughness=Math.max(.78,p.roughness);}
    if(metal){p.metalness=Math.max(.72,p.metalness);p.roughness=Math.min(.44,p.roughness);p.envMapIntensity=Math.max(.65,p.envMapIntensity);}
    if(!wood&&!roof&&!stone&&!metal){p.sheen=.035;p.sheenRoughness=.88;}
    p.userData.architecturePhysicalized=true;
    p.onBeforeCompile=mat.onBeforeCompile;
    p.needsUpdate=true;
    replacements.set(mat,p);
  });
  scene.traverse(obj=>{
    if(!obj.isMesh||!obj.material)return;
    if(Array.isArray(obj.material))obj.material=obj.material.map(m=>replacements.get(m)||m);
    else if(replacements.has(obj.material))obj.material=replacements.get(obj.material);
  });
  libraries.forEach(lib=>Object.keys(lib||{}).forEach(k=>{const m=lib[k];if(replacements.has(m))lib[k]=replacements.get(m);}));
  window.__HEARTHMERE_ARCHITECTURE_PHYSICAL={sourceMaterials:sourceMats.size,replaced:replacements.size};
}

function buildWaterDetailPass(){
  if(window.__HEARTHMERE_WATER_DETAIL?.version===1)return;
  const root=new THREE.Group();root.name='WaterDetail';
  const makeFoam=(side)=>{
    const verts=[],indices=[],segments=96;
    for(let j=0;j<=segments;j++){
      const t=j/segments,z=-55+t*120,cx=riverCenterX(z),hw=riverHalfWidth(z);
      const inner=cx+side*(hw-.18),outer=cx+side*(hw-.92);
      const y=.12+Math.sin(z*.29+side)*.006;
      verts.push(inner,y,z,outer,y+.008,z);
    }
    for(let j=0;j<segments;j++){const a=j*2,b=a+1,c=a+2,d=c+1;indices.push(a,c,b,b,c,d);}
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
    const mat=new THREE.MeshBasicMaterial({color:0xd9eee4,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geo,mat);mesh.renderOrder=3;root.add(mesh);
  };
  makeFoam(-1);makeFoam(1);
  const glintMat=new THREE.MeshBasicMaterial({color:0xffe4ae,transparent:true,opacity:.42,depthWrite:false});
  for(let i=0;i<34;i++){
    const z=-48+worldRandom()*106,cx=riverCenterX(z),hw=riverHalfWidth(z);
    const x=cx+(worldRandom()-.5)*hw*1.35;
    const g=new THREE.Mesh(new THREE.PlaneGeometry(.32+worldRandom()*.65,.045+worldRandom()*.025),glintMat);
    g.position.set(x,.15,z);g.rotation.x=-Math.PI/2;g.rotation.z=worldRandom()*Math.PI;
    g.userData.waterGlint=true;root.add(g);
  }
  scene.add(root);
  window.__HEARTHMERE_WATER_DETAIL={version:1,bankFoamRibbons:2,surfaceGlints:34};
}
function buildCinematicWorldDepthPass(){
  if(window.__HEARTHMERE_WORLD_DEPTH?.version===1)return;
  const root=new THREE.Group();
  root.name='CinematicWorldDepth';
  const makeRidge=(z,baseY,width,depth,seed,color,opacity)=>{
    const pts=[];
    for(let i=0;i<=24;i++){
      const u=i/24;
      const x=-width*.5+u*width;
      const h=depth*(.34+.22*Math.sin(u*8.7+seed)+.16*Math.sin(u*17.1-seed*.7)+.10*Math.sin(u*31.0+seed*1.7));
      pts.push([x,baseY+h]);
    }
    const shape=new THREE.Shape();
    shape.moveTo(-width*.5,baseY-2);
    shape.lineTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)shape.lineTo(pts[i][0],pts[i][1]);
    shape.lineTo(width*.5,baseY-2);shape.closePath();
    const geo=new THREE.ShapeGeometry(shape);
    const mat=new THREE.MeshPhysicalMaterial({color,roughness:.98,metalness:0,transparent:opacity<1,opacity,side:THREE.DoubleSide,fog:true});
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.z=z;
    mesh.renderOrder=-20;
    root.add(mesh);
  };
  makeRidge(-92,-.4,210,20,1.7,0x334b4a,.88);
  makeRidge(-132,-1.8,250,27,4.1,0x243b3d,.72);
  makeRidge(82,-.2,210,18,7.2,0x405453,.78);

  const makeMistBand=(y,z,w,h,color,opacity)=>{
    const geo=new THREE.PlaneGeometry(w,h);
    const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,fog:true});
    const m=new THREE.Mesh(geo,mat);
    m.position.set(0,y,z);m.rotation.x=-Math.PI*.5;
    m.scale.y=.45;
    root.add(m);
  };
  makeMistBand(.8,-58,170,12,0xd5d6c0,.055);
  makeMistBand(1.5,-88,210,16,0xb9c8bd,.035);

  // A restrained distant tree line gives the settlement a believable enclosed valley
  // without spending geometry on the playable center.
  const treeMat=new THREE.MeshPhysicalMaterial({color:0x243a34,roughness:1,metalness:0,flatShading:true,fog:true});
  const trunkMat=new THREE.MeshPhysicalMaterial({color:0x302a23,roughness:.98,metalness:0,fog:true});
  const treeGroup=new THREE.Group();treeGroup.name='DistantTreeLine';
  for(let i=0;i<46;i++){
    const side=i%2?1:-1;
    const x=side*(55+worldRandom()*18);
    const z=-64+worldRandom()*92;
    const s=1.8+worldRandom()*2.8;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12*s,.20*s,1.9*s,6),trunkMat);
    trunk.position.set(x,.95*s,z);
    const crown=new THREE.Mesh(new THREE.ConeGeometry(1.15*s,3.5*s,7),treeMat);
    crown.position.set(x,3.0*s,z);
    treeGroup.add(trunk,crown);
  }
  root.add(treeGroup);
  scene.add(root);
  window.__HEARTHMERE_WORLD_DEPTH={version:1,ridges:3,mistBands:2,distantTrees:46};
}
function buildGraphicsFoundationV2(){
  upgradeArchitecturalLibraries();
  // Renderer/presentation: preserve a rich HDR-like response while keeping the
  // mobile target conservative. Three.js recommends environment lighting for PBR
  // materials, and the scene already supplies a PMREM environment.
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.075;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.transmissionResolutionScale=.55;
  scene.environmentIntensity=.42;

  const materials=new Set();
  let meshCount=0,physicalCount=0,foliageCount=0;
  scene.traverse(obj=>{
    if(!obj.isMesh || obj===sky || obj===sunDisc) return;
    meshCount++;
    const list=Array.isArray(obj.material)?obj.material:[obj.material];
    const foliageObj=!!(obj.userData?.distilled || obj.userData?.vegetationTier || obj.userData?.assetName?.startsWith('distilled_') || /leaf|foliage|grass|fern|shrub|bush/i.test(obj.name||''));
    list.forEach((m,mi)=>{
      if(!m)return;
      let mat=m;
      if(foliageObj && !m.userData.foundationFoliageConverted && (m.isMeshStandardMaterial||m.isMeshPhysicalMaterial)){
        const phase=(obj.userData.windPhase||0)+mi*.73;
        mat=foundationPhysicalizeFoliageMaterial(m,phase);
        if(Array.isArray(obj.material))obj.material[mi]=mat;else obj.material=mat;
        foliageCount++;
      }
      if(mat.isMeshStandardMaterial||mat.isMeshPhysicalMaterial){
        physicalCount++;
        const n=(obj.name||'')+' '+(mat.name||'');
        const isMetal=/iron|steel|metal|blade|sword|buckl|brass/i.test(n);
        const isRoof=/roof|slate|tile/i.test(n);
        const isStone=/stone|rock|mortar|cobble|wall/i.test(n);
        const isWood=/wood|timber|plank|bark/i.test(n);
        const isCloth=/cloth|cape|cloak|fabric|tunic|fur/i.test(n);
        if(isMetal){mat.metalness=Math.max(mat.metalness??0,.72);mat.roughness=Math.min(mat.roughness??.38,.42);mat.envMapIntensity=Math.max(mat.envMapIntensity??.4,.7);}
        else if(isRoof){mat.roughness=Math.max(mat.roughness??.82,.70);mat.envMapIntensity=Math.max(mat.envMapIntensity??.3,.42);}
        else if(isStone){mat.roughness=Math.max(mat.roughness??.9,.78);mat.envMapIntensity=Math.max(mat.envMapIntensity??.25,.36);}
        else if(isWood){mat.roughness=Math.max(mat.roughness??.82,.68);mat.envMapIntensity=Math.max(mat.envMapIntensity??.25,.40);}
        else if(isCloth){mat.roughness=Math.max(mat.roughness??.8,.72);mat.envMapIntensity=Math.max(mat.envMapIntensity??.25,.34);}
        else {mat.roughness=Math.min(1,Math.max(.52,mat.roughness??.78));mat.envMapIntensity=Math.max(mat.envMapIntensity??.2,.30);}
        if(mat.normalMap && mat.normalScale){
          const ns=Math.min(1.0,Math.max(.16,mat.normalScale.x||.5));
          mat.normalScale.set(ns,ns);
        }
        if(mat.isMeshPhysicalMaterial){
          mat.ior=1.45;
          mat.specularIntensity=Math.max(mat.specularIntensity??.5,isMetal?0.85:.52);
          if(mat.specularColor)mat.specularColor.set(isMetal?0xffffff:0xe7ddd0);
          if(!isMetal && isWood)mat.clearcoat=Math.max(mat.clearcoat||0,.08);
          if(!isMetal && isRoof)mat.clearcoat=Math.max(mat.clearcoat||0,.12);
          if(!isMetal && isCloth)mat.sheen=Math.max(mat.sheen||0,.16);
        }
        if(!mat.transparent && !mat.userData.noFoundationShader && !window.__HEARTHMERE_DISABLE_FOUNDATION_SURFACE_SHADER){
          installFoundationSurfaceShader(mat,((obj.id||1)*.37)+(mi*.91),.018);
        }
        materials.add(mat);
      }
    });
  });

  // Convert the distilled foliage after all assets have been attached. This is the
  // high-impact part of the foundation: leaves/grass now share the same physically
  // based sheen language instead of looking like flat green cards.
  scene.traverse(obj=>{
    if(!obj.isMesh || !obj.material)return;
    const foliageObj=!!(obj.userData?.distilled || obj.userData?.vegetationTier || obj.userData?.assetName?.startsWith('distilled_') || /leaf|foliage|grass|fern|shrub|bush/i.test(obj.name||''));
    if(!foliageObj)return;
    const list=Array.isArray(obj.material)?obj.material:[obj.material];
    list.forEach((m,i)=>{
      if(!m)return;
      if(m.isMeshPhysicalMaterial){
        m.sheen=Math.max(m.sheen||0,.34);
        m.sheenColor.set(0x8fbf8a);
        m.sheenRoughness=.82;
        m.envMapIntensity=Math.max(m.envMapIntensity||0,.48);
        m.needsUpdate=true;
      }
    });
  });

  // Foliage tiers are intentionally readable from the play camera: hero canopy gets
  // stronger contact shadows; understory stays softer so it does not turn into noise.
  scene.traverse(obj=>{
    if(!obj.isMesh)return;
    if(obj.userData?.vegetationTier==='hero'){
      obj.castShadow=true;obj.receiveShadow=true;
    }else if(obj.userData?.vegetationTier==='hero_companion'){
      obj.castShadow=true;obj.receiveShadow=true;
    }else if(obj.userData?.distilled && /grass|fern/.test(obj.userData?.assetName||'')){
      obj.castShadow=false;obj.receiveShadow=true;
    }
  });

  // Lighting hierarchy: warm key, cool fill, restrained bloom, stronger contact AO.
  sun.color.set(0xffd7b1);sun.intensity=2.82;sun.position.set(-64,92,38);
  fill.color.set(0x8bb8c9);fill.intensity=.62;fill.position.set(48,38,-58);
  hemi.color.set(0xf2f6ee);hemi.groundColor.set(0x262c25);hemi.intensity=1.10;
  ssaoPass.kernelRadius=13;
  ssaoPass.minDistance=.001;
  ssaoPass.maxDistance=.21;
  bloomPass.strength=.085;
  bloomPass.radius=.34;
  bloomPass.threshold=.92;

  // Practical lights get a little more color separation without adding a new town layer.
  scene.traverse(obj=>{
    if(!obj.isPointLight && !obj.isSpotLight)return;
    if(obj.userData.foundationTuned)return;
    obj.userData.foundationTuned=true;
    if(obj.color.r>.7 && obj.color.g<.75)obj.intensity*=1.08;
  });

  window.__HEARTHMERE_GRAPHICS_FOUNDATION={
    version:2,
    meshes:meshCount,
    materials:materials.size,
    physicalMaterials:physicalCount,
    foliageConverted:foliageCount,
    environmentIntensity:scene.environmentIntensity,
    toneMappingExposure:renderer.toneMappingExposure
  };
}

function buildGraphicsMasterPass(){
  if(player && !player.userData.graphicsMasterRig){
    const key=new THREE.SpotLight(0xffd0a0,3.2,11,Math.PI*.34,.78,1.8);
    key.position.set(-3.8,6.4,4.6);key.castShadow=false;key.name='HeroWarmKey';
    const keyTarget=new THREE.Object3D();keyTarget.position.set(0,1.5,0);player.add(keyTarget);key.target=keyTarget;player.add(key);
    const rim=new THREE.PointLight(0x8ec5d5,2.4,8,.9);rim.position.set(2.8,3.4,-2.6);rim.name='HeroCoolRim';player.add(rim);
    const fillHero=new THREE.PointLight(0xffb36c,.72,5,.9);fillHero.position.set(-1.8,2.1,2.4);player.add(fillHero);
    player.userData.graphicsMasterRig={key,rim,fillHero};
  }
  scene.traverse(obj=>{
    if(obj.userData?.vegetationTier!=='hero' || obj.userData.graphicsCanopyDetail)return;
    obj.userData.graphicsCanopyDetail=true;
    const accents=[
      [-.72,4.58,.16,.62,.48,.58,0],[.68,4.42,-.12,.58,.44,.54,2],[.05,5.05,.18,.54,.40,.50,1]
    ];
    accents.forEach(([x,y,z,sx,sy,sz,mi])=>{
      const leaf=hdSphere(.70,TREE_LEAF_MATS[mi],[x,y,z],obj,[sx,sy,sz]);
      leaf.castShadow=true;leaf.receiveShadow=true;leaf.userData.graphicsCanopyAccent=true;
    });
  });
  const rigs=[['inn',-10,5.5,-7,0xffb56e,1.25,9],['forge',4.7,4.8,-9,0xff9b55,1.10,8],['chapel',-7,6,15,0xffd49a,.90,9],['mill',22.5,5,-13.5,0xffb86b,1.15,9],['watchtower',20.5,7,17.5,0x88b8cc,1,10]];
  rigs.forEach(([name,x,y,z,color,intensity,distance])=>{
    const id='GraphicsRim_'+name;if(scene.getObjectByName(id))return;
    const l=new THREE.PointLight(color,intensity,distance,.9);l.name=id;l.position.set(x,y,z);scene.add(l);
  });
  if(!scene.getObjectByName('GraphicsSunHalo')){
    const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');
    const g=ctx.createRadialGradient(128,128,4,128,128,124);
    g.addColorStop(0,'rgba(255,245,206,.78)');g.addColorStop(.12,'rgba(255,220,158,.38)');g.addColorStop(.42,'rgba(255,198,132,.12)');g.addColorStop(1,'rgba(255,180,120,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    // The previous full-size additive halo could contaminate the entire mobile frame.
    // Keep the sun texture available for future refinement, but do not composite a
    // camera-facing additive wash over the authored world.
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false,fog:false,blending:THREE.AdditiveBlending,opacity:.16}));
    halo.name='GraphicsSunHalo';halo.position.copy(sunDisc.position);halo.scale.set(6,6,1);halo.visible=false;scene.add(halo);
  }
  window.__HEARTHMERE_GRAPHICS_MASTER={version:1,gradePass:true,heroRig:!!player?.userData.graphicsMasterRig,canopyAccents:[...scene.children].filter(o=>o.userData?.graphicsCanopyDetail).length,landmarkRims:rigs.length};
}
function buildLandmarkBannerPass(){
  if(window.__HEARTHMERE_BANNERS?.version===1)return;
  const specs=[
    ['InnBanner',-10,6.1,-7,0xc06a3d,.92],
    ['ForgeBanner',4.7,5.3,-9,0x9b4a35,.78],
    ['ChapelBanner',-7,6.8,15,0x6d8290,.68],
    ['MillBanner',22.5,5.7,-13.5,0xb07a43,.82],
    ['WatchBanner',20.5,8.3,17.5,0x58776e,.64]
  ];
  const banners=[];
  specs.forEach(([name,x,y,z,color,scale],i)=>{
    const g=new THREE.Group();g.name=name;g.position.set(x,y,z);
    const poleMat=new THREE.MeshPhysicalMaterial({color:0x4b3425,roughness:.86,metalness:0});
    const clothMat=new THREE.MeshPhysicalMaterial({color,roughness:.76,metalness:0,sheen:.18,sheenColor:new THREE.Color(0xf0c89a),side:THREE.DoubleSide});
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,2.2,8),poleMat);
    pole.position.y=-.65;pole.castShadow=true;g.add(pole);
    const top=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshPhysicalMaterial({color:0xc59a58,roughness:.42,metalness:.58}));
    top.position.y=.48;g.add(top);
    const cloth=new THREE.Mesh(new THREE.PlaneGeometry(.82*scale,.58*scale,4,2),clothMat);
    cloth.position.set(.39*scale,.08,0);cloth.rotation.y=Math.PI;
    cloth.userData.landmarkBanner=true;cloth.userData.bannerPhase=i*1.31;
    g.add(cloth);scene.add(g);banners.push(cloth);
  });
  window.__HEARTHMERE_BANNERS={version:1,count:banners.length,banners};
}
function buildHighEndAtmospherePass(){
  scene.background.set(0x7e9692);
  scene.fog.color.set(0x71837d);scene.fog.density=.00072;
  if(sky?.material?.uniforms){
    sky.material.uniforms.top.value.set(0x18384b);
    sky.material.uniforms.mid.value.set(0x5f817f);
    sky.material.uniforms.horizon.value.set(0xb9c4bd);
    sky.material.uniforms.sun.value.set(0xffe0bd);
  }
  sunDisc.material.opacity=.72;sunDisc.scale.setScalar(1.15);
}
const tmpTarget=new THREE.Vector3();
const tmpMove=new THREE.Vector3();
const tmpNext=new THREE.Vector3();
const tmpWanderDelta=new THREE.Vector3();

// Hero readability pass: a soft selection disc, grounded shadow, and stronger layered motion.
const heroRing=new THREE.Mesh(new THREE.RingGeometry(.52,.68,32),new THREE.MeshBasicMaterial({color:0xe5c66e,transparent:true,opacity:.34,side:THREE.DoubleSide,depthWrite:false}));
heroRing.rotation.x=-Math.PI/2;heroRing.position.y=.035;heroRing.visible=false;scene.add(heroRing);
function updateHeroPresentation(){
 if(!player)return;
 heroRing.visible=true;heroRing.position.set(player.position.x,.035,player.position.z);
 heroRing.scale.setScalar(1+Math.sin(time*2.8)*.035);
 const walking=player.userData.walking?1:0;
 const ph=time*(walking?9.5:2.1)+player.userData.phase;
 const stride=Math.sin(ph),strideOpp=Math.sin(ph+Math.PI);
 const idleBreath=Math.sin(time*2.15+player.userData.phase);
 if(player.userData.parts.arms.length){
   player.userData.parts.arms.forEach((a,j)=>{
     const swing=walking?(j?strideOpp:stride)*.34:idleBreath*.018;
     a.rotation.z=swing;
     a.rotation.x=walking?Math.cos(ph+(j?Math.PI:0))*.08:Math.sin(time*1.4+j)*.012;
     a.rotation.y=walking?Math.sin(ph*.5+(j?1:0))*.025:Math.sin(time*1.1+j)*.006;
   });
 }
 if(player.userData.parts.legs.length){
   player.userData.parts.legs.forEach((l,j)=>{
     const swing=walking?(j?stride:strideOpp)*.48:idleBreath*.018;
     l.rotation.x=swing;
     l.rotation.z=walking?Math.cos(ph+(j?Math.PI:0))*.025:0;
   });
 }
 if(player.userData.parts.cloak){
   player.userData.parts.cloak.rotation.x=Math.sin(time*2.2+player.userData.phase)*(.035+.025*walking);
   player.userData.parts.cloak.rotation.y=Math.sin(time*1.7+player.userData.phase)*(.028+.018*walking);
   player.userData.parts.cloak.position.y=.98+idleBreath*.008;
 }
 if(player.userData.heroCape){
   const amp=walking?.055:.018;
   player.userData.heroCape.rotation.z=Math.sin(ph*.72)*amp;
   player.userData.heroCape.rotation.y=-.08+Math.sin(ph*.51)*amp*.7;
   player.userData.heroCape.rotation.x=Math.sin(ph*.43)*amp*.38;
 }
 if(player.userData.heroShield){
   player.userData.heroShield.rotation.z=-.10+Math.sin(ph)*.018*walking;
   player.userData.heroShield.rotation.y=.02+Math.sin(ph*.55)*.012*walking;
   player.userData.heroShield.position.y=1.55+Math.sin(ph)*.012*walking;
 }
 if(player.userData.heroBlade){
   player.userData.heroBlade.rotation.z=-.24+Math.sin(ph)*.012*walking;
   player.userData.heroBlade.rotation.y=Math.sin(ph*.5)*.008*walking;
 }
 // Equipment gets its own restrained secondary motion so the hero reads as a
 // dressed character rather than a stack of rigid primitives.
 if(player.userData.heroMeshes){
   player.userData.heroMeshes.forEach((m,j)=>{
     m.rotation.z+=Math.sin(time*(1.45+(j%4)*.17)+j*.37)*.00045;
   });
 }
 const rigPulse=1+idleBreath*.0045;
 player.scale.y=rigPulse;
}

function updateVillager(g,t,dt){
 if(g===player)return;
 const now=t;
 if(!g.userData.wanderTarget && now>g.userData.nextWander){
   const a=worldRandom()*Math.PI*2,r=2.5+worldRandom()*5.5;
   const tx=g.userData.home.x+Math.cos(a)*r,tz=g.userData.home.z+Math.sin(a)*r;
   if(traversable(tx,tz)){g.userData.wanderTarget=new THREE.Vector3(tx,0,tz);g.userData.walking=true;}
   g.userData.nextWander=now+6500+worldRandom()*6500;
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
  perfStats.drawCalls=Math.round(perfStats.drawCallsAccum/perfStats.frames);
  perfStats.triangles=Math.round(perfStats.trianglesAccum/perfStats.frames);
  perfStats.geometries=renderer.info.memory.geometries;
  perfStats.textures=renderer.info.memory.textures;
  perfStats.geometryBytes=renderer.info.memory.attributesSize||0;
  perfStats.textureBytes=renderer.info.memory.texturesSize||0;
  perfStats.programs=renderer.info.programs?.length||0;
  collectSceneBudget();
  perfStats.visibleMeshes=sceneBudget.visibleMeshes;
  perfStats.shadowCasters=sceneBudget.shadowCasters;
  perfStats.transparentMeshes=sceneBudget.transparentMeshes;
  perfStats.lights=sceneBudget.lights;
  perfStats.shadowPolicyDisabledTiny=shadowPolicy.disabledTiny;
  perfStats.qualityLevel=quality.level;
  perfStats.updatedAt=now;
  if(diagnosticsMode) console.table(perfStats);
  perfStats.frames=0;perfStats.frameMs=0;perfStats.minFrameMs=Infinity;perfStats.maxFrameMs=0;perfStats.drawCallsAccum=0;perfStats.trianglesAccum=0;
}
function updateAdaptiveQuality(now){
  if(captureMode||document.hidden)return;
  if(quality.level!==0){quality.level=0;quality.pixelRatioCap=1.55;quality.ssaoScale=1.00;const pixelRatio=Math.max(quality.pixelRatioMin,Math.min(devicePixelRatio,quality.pixelRatioCap));renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(pixelRatio);composer.setSize(innerWidth,innerHeight);resizeSSAO();}
  return;
  quality.frameSamples.push(perfStats.lastFrameMs);
  if(quality.frameSamples.length<120)return;
  const samples=quality.frameSamples.splice(0);
  const sorted=samples.slice().sort((a,b)=>a-b);
  const avgFrameMs=samples.reduce((a,b)=>a+b,0)/samples.length;
  const p95FrameMs=sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))];
  let next=quality.level;
  if(p95FrameMs>28 && quality.level<3) next=quality.level+1;
  else if(p95FrameMs<18 && avgFrameMs<15 && quality.level>0) next=quality.level-1;
  if(next===quality.level) return;
  quality.level=next;
  quality.pixelRatioCap=[1.55,1.40,1.25,1.10][quality.level];
  quality.ssaoScale=[.75,.70,.64,.58][quality.level];
  setShadowMapSize([3072,2560,2048,1536][quality.level]);
  const pixelRatio=Math.max(quality.pixelRatioMin,Math.min(devicePixelRatio,quality.pixelRatioCap));
  renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight);
  composer.setPixelRatio(pixelRatio);composer.setSize(innerWidth,innerHeight);resizeSSAO();
  rendererDiagnostics.pixelRatio=pixelRatio;
  rendererDiagnostics.qualityLevel=quality.level;
  rendererDiagnostics.averageFrameMs=avgFrameMs;
  rendererDiagnostics.p95FrameMs=p95FrameMs;
  rendererDiagnostics.shadowMapSize=sun.shadow.mapSize.x;
}
function frame(t){
 if(document.hidden)return;
 const rawDt=Math.max(0,t-last)/1000;
 const dt=Math.min(.05,rawDt);
 last=t;time+=dt;
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
 TREE_LEAF_MATS.forEach(m=>{if(m.userData.foliageShader)m.userData.foliageShader.uniforms.uFoliageTime.value=time;});
 window.__HEARTHMERE_FOLIAGE_SHADERS.forEach(shader=>{if(shader?.uniforms?.uFoliageTime)shader.uniforms.uFoliageTime.value=time;});updateWorldLife(dt);
 shadowRefreshFrame++;
 if(shadowRefreshFrame>=3){sun.shadow.needsUpdate=true;shadowRefreshFrame=0;}
 updateHeroPresentation();updateCharacterPresentation();
 foam.forEach((r,i)=>{r.position.z+=dt*(.65+(i%4)*.1);r.scale.x=1.5+Math.sin(time*1.8+i)*.22;r.material.opacity=.16+.10*(Math.sin(time*1.4+i)+1);if(r.position.z>62)r.position.z=-52;r.position.x=27+Math.sin(time*.7+i*1.8)*3.8});
 embers.forEach((e,i)=>{e.position.y+=dt*(.35+Math.sin(i)*.08);e.position.x+=Math.sin(time*2+i)*dt*.025;if(e.position.y>3)e.position.y=.9;e.material.opacity=.35+.5*(Math.sin(time*6+i)+1)/2});
 const day=(Math.sin(time*.014)+1)/2;
 fireLights.forEach((l,i)=>l.intensity=5.1+Math.sin(time*7+i)*.75+Math.sin(time*13)*.3);warmWindows.forEach((m,i)=>m.emissiveIntensity=.10+.055*(Math.sin(time*.9+i*.73)+1)/2);windowSpillLights.forEach((l,i)=>{const dayLight=(Math.sin(time*.014)+1)/2;l.intensity=.07+.34*(1-dayLight)+.035*(Math.sin(time*.85+i*.61)+1)/2;});
 smoke.forEach((s,i)=>{s.position.y+=dt*(.22+.025*i);s.position.x+=Math.sin(time*.65+s.userData.phase)*dt*.018;s.material.opacity=.035+.025*(Math.sin(time*.8+s.userData.phase)+1)/2;if(s.position.y>6){s.position.y=.9;s.position.x+=((i%2)-.5)*.3}});
 clouds.forEach((c,i)=>{c.position.x+=dt*c.userData.speed;if(c.position.x>120)c.position.x=-120;});
birds.forEach((b,i)=>{b.position.x+=dt*(1.2+i*.15);b.position.z+=Math.sin(time*.8+b.userData.phase)*dt*.12;b.rotation.z=Math.sin(time*7+b.userData.phase)*.16;if(b.position.x>55)b.position.x=-55});
 motes.forEach((m,i)=>{m.position.y+=dt*(.018+Math.sin(i)*.006);m.position.x+=Math.sin(time*.25+m.userData.phase)*dt*.012;m.material.opacity=.08+.12*(Math.sin(time*.7+m.userData.phase)+1)/2;if(m.position.y>10)m.position.y=1});
 ambientLeaves.forEach((l,i)=>{l.position.y-=dt*l.userData.speed;l.position.x+=dt*(.18+l.userData.wind*.12);l.position.z+=Math.sin(time*.7+l.userData.phase)*dt*.10;l.rotation.z+=dt*(.7+Math.sin(i)*.12);l.material.opacity=.16+.20*(Math.sin(time*.8+l.userData.phase)+1)/2;if(l.position.y<.4||l.position.x>55){l.position.set(-48,5+worldRandom()*3,-44+worldRandom()*92);}});
 fireflies.forEach((f,i)=>{const dayNow=(Math.sin(time*.014)+1)/2,night=1-dayNow;f.position.y+=Math.sin(time*1.6+f.userData.phase)*dt*.12;f.position.x+=Math.cos(time*.9+f.userData.phase)*dt*.06;f.position.z+=Math.sin(time*.7+f.userData.phase)*dt*.05;f.material.opacity=Math.max(0,night*.72)*(0.45+0.55*(Math.sin(time*2.2+f.userData.phase)+1)/2);f.scale.setScalar(.7+.5*(Math.sin(time*2.7+f.userData.phase)+1)/2);});
 riverMist.forEach((m,i)=>{m.position.y=m.userData.baseY+Math.sin(time*.55+m.userData.phase)*.10;m.position.x+=Math.sin(time*.33+m.userData.phase)*dt*.018;m.material.opacity=.025+.045*(Math.sin(time*.75+m.userData.phase)+1)/2;});

 const golden=1-Math.abs(day-.52)*1.92;
scene.fog.density=.00105+.00058*(1-day);
scene.fog.color.setHSL(.42,.025,.39+.08*day);
sun.position.y=48+day*58;
sun.position.x=-58+Math.sin(time*.018)*22;
sun.position.z=42+Math.cos(time*.014)*18;
 sunDisc.position.copy(sun.position).normalize().multiplyScalar(220); const sunHalo=scene.getObjectByName('GraphicsSunHalo'); if(sunHalo)sunHalo.position.copy(sunDisc.position);
sun.intensity=1.35+2.15*day;
// FORENSIC DAYLIGHT CHROMA PASS:
// The previous frame loop re-authored light chroma every frame, making one-shot
// light tests invalid and allowing a persistent warm/green cast to survive.
// Keep the authored intensity/day cycle, but use near-neutral daylight chroma so
// color is carried by actual materials and intentionally local practical lights.
sun.color.setHSL(.055-.008*day,.055,.68+.08*day);
fill.color.setHSL(.55,.075,.60);
fill.intensity=.30+.28*day;
moon.intensity=.035+.24*(1-day);
hemi.intensity=.66+.48*day;
hemi.color.setHSL(.50,.025,.82);
hemi.groundColor.setHSL(.08,.025,.18+.04*day);
renderer.toneMappingExposure=.84+.16*day;
// Forensic isolation: the PMREM environment is a persistent global indirect-light
// source. Hold it OFF every frame so no later presentation pass can restore it.
scene.environmentIntensity=.26+.10*day;
window.__HEARTHMERE_FORENSIC_DAYLIGHT={active:false,reason:'Build 80: restored authored PMREM contribution and switched presentation transform to AgX'};
cinematicSpots.forEach((l,i)=>{l.intensity=(2.8+(i%3)*.55)*(1.0+(1-day)*1.9);});

 if(player){
  const oldTargetX=controls.target.x,oldTargetZ=controls.target.z;
  tmpTarget.set(player.position.x+Math.sin(player.rotation.y)*1.15,.72,player.position.z+Math.cos(player.rotation.y)*1.15);
  controls.target.lerp(tmpTarget,.11);
  const dx=controls.target.x-oldTargetX,dz=controls.target.z-oldTargetZ;
  camera.position.x+=dx;camera.position.z+=dz;
  if(!camera.userData.followInit){camera.position.set(controls.target.x+14.6,8.2,controls.target.z+14.8);camera.userData.followInit=true;}
}
for(const labelMesh of worldLabels) labelMesh.visible=!cinematicMode;
controls.update();
try{
  if(rawRender){
    if(rawMaterialProbe){
      // FORENSIC MATERIAL PROBE: isolated known-good geometry/material.
      // This does not modify or replace any production world material.
      const priorSkyVisible=sky.visible;
      const priorClear=renderer.getClearColor(new THREE.Color());
      const priorAlpha=renderer.getClearAlpha();
      const probeMat=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,fog:false,depthTest:false,depthWrite:false});
      const probe=new THREE.Mesh(new THREE.BoxGeometry(3,3,3),probeMat);
      const probeDirection=new THREE.Vector3();
      camera.getWorldDirection(probeDirection);
      probe.position.copy(camera.position).addScaledVector(probeDirection,8);
      probe.name='ForensicMaterialProbe';
      sky.visible=false;
      const hidden=[];
      // Do not traverse/hide the Scene root itself. Scene.visible=false prevents
      // every descendant—including the probe we add below—from being rendered.
      // This was the reason the Build 105 known-good cube could disappear.
      scene.traverse(o=>{
        if(o===scene || o===probe || o===sky || !o.visible)return;
        hidden.push([o,o.visible]);
        o.visible=false;
      });
      const priorSceneVisible=scene.visible;
      scene.visible=true;
      scene.add(probe);
      renderer.setClearColor(0x101010,1);
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
      scene.remove(probe);
      for(const [o,v] of hidden)o.visible=v;
      probe.geometry.dispose();
      probeMat.dispose();
      sky.visible=priorSkyVisible;
      scene.visible=priorSceneVisible;
      renderer.setClearColor(priorClear,priorAlpha);
    }else if(rawUncompiled){
      const priorSkyVisible=sky.visible;
      const changed=[];
      sky.visible=false;
      scene.traverseVisible(o=>{
        if(!o.isMesh||o===sky)return;
        const mats=Array.isArray(o.material)?o.material:[o.material];
        mats.forEach(mat=>{
          if(!mat)return;
          changed.push([mat,mat.onBeforeCompile,mat.needsUpdate]);
          // Three.js 0.181's program-cache path expects onBeforeCompile to remain callable.
          // A null hook can throw "Cannot read properties of null" during shader-key generation.
          // Use a no-op hook for this forensic pass instead of nulling the property.
          mat.onBeforeCompile=()=>{};
          mat.needsUpdate=true;
        });
      });
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
      for(const [mat,hook,needs] of changed){mat.onBeforeCompile=hook;mat.needsUpdate=true;}
      sky.visible=priorSkyVisible;
    }else if(rawLambertDirect){
      // BUILD 109 HARDENED LAMBERT DIRECT.
      // This is the decisive material-family test after the uncompiled-hook test.
      // Walk the complete scene graph (not traverseVisible), force every ancestor and
      // mesh visible, disable culling, and replace every mesh material with one shared
      // plain Lambert material. This removes PBR textures, normal maps, transparency,
      // custom shader hooks, and material-specific state while retaining real geometry,
      // transforms, camera, and renderer lighting.
      const priorSkyVisible=sky.visible;
      const mat=window.__HEARTHMERE_FORENSIC_LAMBERT_DIRECT_MAT||(window.__HEARTHMERE_FORENSIC_LAMBERT_DIRECT_MAT=new THREE.MeshLambertMaterial({
        color:0xbfc1bd,side:THREE.DoubleSide,fog:false,transparent:false,opacity:1,
        depthTest:true,depthWrite:true
      }));
      // BUILD 111 execution marker: this banner is deliberately impossible to
      // confuse with the production UI. It proves that this exact forensic branch
      // is executing on the phone, independent of the rendered world result.
      let marker=document.getElementById('hm-lambert-forensic-marker');
      if(!marker){
        marker=document.createElement('div');
        marker.id='hm-lambert-forensic-marker';
        marker.textContent='BUILD 111 • LAMBERT DIRECT ACTIVE';
        Object.assign(marker.style,{
          position:'fixed',left:'50%',top:'8px',transform:'translateX(-50%)',
          zIndex:'99999',padding:'8px 14px',borderRadius:'8px',
          background:'#8b1e1e',color:'#fff',font:'700 13px/1.2 monospace',
          letterSpacing:'.04em',pointerEvents:'none',boxShadow:'0 2px 10px rgba(0,0,0,.45)'
        });
        document.body.appendChild(marker);
      }
      sky.visible=false;
      renderer.setClearColor(0x101820,1);
      let meshCount=0;
      scene.traverse(o=>{
        if(o===scene||o===sky)return;
        o.visible=true;
        if(o.isMesh){
          meshCount++;
          o.material=mat;
          o.frustumCulled=false;
          o.visible=true;
        }
      });
      scene.visible=true;
      window.__HEARTHMERE_FORENSIC_LAMBERT_DIRECT_STATS={
        meshCount,
        cameraPosition:camera.position.toArray(),
        cameraTarget:controls.target.toArray(),
        sceneChildren:scene.children.length
      };
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
      // Intentionally leave the forensic material state active for the URL session.
      // This prevents later animation/composer passes from restoring the production
      // material state and makes the screenshot a deterministic A/B comparison.
      sky.visible=false;
    }else if(rawFlatDirect){
      // BUILD 112 DEPTH-OCCLUSION ISOLATION.
      // Plain MeshBasic with depth testing/writing disabled. If the world appears here,
      // a foreground depth-writing mesh was occluding the scene in normal/Lambert passes.
      let marker=document.getElementById('hm-flat-forensic-marker');
      if(!marker){
        marker=document.createElement('div');
        marker.id='hm-flat-forensic-marker';
        marker.textContent='BUILD 112 • DEPTH TEST DISABLED';
        Object.assign(marker.style,{position:'fixed',left:'50%',top:'8px',transform:'translateX(-50%)',zIndex:'99999',padding:'8px 14px',borderRadius:'8px',background:'#145a8d',color:'#fff',font:'700 13px/1.2 monospace',letterSpacing:'.04em',pointerEvents:'none',boxShadow:'0 2px 10px rgba(0,0,0,.45)'});
        document.body.appendChild(marker);
      }
      const mat=window.__HEARTHMERE_FORENSIC_FLAT_DIRECT_MAT||(window.__HEARTHMERE_FORENSIC_FLAT_DIRECT_MAT=new THREE.MeshBasicMaterial({color:0xd8d8d8,side:THREE.DoubleSide,fog:false,transparent:false,opacity:1,depthTest:false,depthWrite:false}));
      sky.visible=false;
      let meshCount=0;
      scene.traverse(o=>{
        if(o===scene||o===sky)return;
        o.visible=true;
        if(o.isMesh){meshCount++;o.material=mat;o.frustumCulled=false;}
      });
      scene.visible=true;
      window.__HEARTHMERE_FORENSIC_FLAT_DIRECT_STATS={meshCount,cameraPosition:camera.position.toArray(),cameraTarget:controls.target.toArray(),sceneChildren:scene.children.length};
      renderer.setClearColor(0x101820,1);
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
    }else if(rawFrameDirect){
      // BUILD 113 CAMERA/BOUNDS ISOLATION.
      // Rebuild the successful world-geometry proof, but compute aggregate world bounds
      // and explicitly frame those bounds. This removes camera target/orientation and
      // clipping-distance ambiguity from the remaining diagnostic.
      let marker=document.getElementById('hm-frame-forensic-marker');
      if(!marker){
        marker=document.createElement('div');
        marker.id='hm-frame-forensic-marker';
        marker.textContent='BUILD 113 • WORLD AUTO-FRAME';
        Object.assign(marker.style,{position:'fixed',left:'50%',top:'8px',transform:'translateX(-50%)',zIndex:'99999',padding:'8px 14px',borderRadius:'8px',background:'#6a3d9a',color:'#fff',font:'700 13px/1.2 monospace',letterSpacing:'.04em',pointerEvents:'none',boxShadow:'0 2px 10px rgba(0,0,0,.45)'});
        document.body.appendChild(marker);
      }
      const mat=window.__HEARTHMERE_FORENSIC_FRAME_DIRECT_MAT||(window.__HEARTHMERE_FORENSIC_FRAME_DIRECT_MAT=new THREE.MeshBasicMaterial({color:0x39ff88,side:THREE.DoubleSide,fog:false,transparent:false,depthTest:false,depthWrite:false}));
      sky.visible=false;
      const bounds=new THREE.Box3();
      const box=new THREE.Box3();
      let meshCount=0;
      scene.traverse(o=>{
        if(o===scene||o===sky)return;
        o.visible=true;
        if(o.isMesh){
          meshCount++;
          o.material=mat;
          o.frustumCulled=false;
          o.updateWorldMatrix(true,false);
          box.setFromObject(o);
          const finiteBox=box.isEmpty() &&
            Number.isFinite(box.min.x)&&Number.isFinite(box.min.y)&&Number.isFinite(box.min.z)&&
            Number.isFinite(box.max.x)&&Number.isFinite(box.max.y)&&Number.isFinite(box.max.z)
            ? false : (
              Number.isFinite(box.min.x)&&Number.isFinite(box.min.y)&&Number.isFinite(box.min.z)&&
              Number.isFinite(box.max.x)&&Number.isFinite(box.max.y)&&Number.isFinite(box.max.z) &&
              (box.max.x-box.min.x)<600 && (box.max.y-box.min.y)<600 && (box.max.z-box.min.z)<600
            );
          if(finiteBox)bounds.union(box);
        }
      });
      scene.visible=true;
      const center=bounds.getCenter(new THREE.Vector3());
      const size=bounds.getSize(new THREE.Vector3());
      const radius=Math.max(size.length()*.5,8);
      const fov=THREE.MathUtils.degToRad(camera.fov);
      const distance=Math.max(radius/Math.tan(fov/2)*1.15,12);
      const dir=new THREE.Vector3(1,.62,1).normalize();
      camera.position.copy(center).addScaledVector(dir,distance);
      camera.near=.05;
      camera.far=Math.max(3000,distance+radius*3);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      controls.update();
      window.__HEARTHMERE_FORENSIC_FRAME_STATS={meshCount,boundsEmpty:bounds.isEmpty(),min:bounds.min.toArray(),max:bounds.max.toArray(),center:center.toArray(),size:size.toArray(),camera:camera.position.toArray(),distance,near:camera.near,far:camera.far};
      renderer.setClearColor(0x101820,1);
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
    }else if(rawNormalDirect){
      const priorSkyVisible=sky.visible;
      const changed=[];
      const mat=window.__HEARTHMERE_FORENSIC_NORMAL_DIRECT_MAT||(window.__HEARTHMERE_FORENSIC_NORMAL_DIRECT_MAT=new THREE.MeshNormalMaterial({flatShading:false,side:THREE.DoubleSide,fog:false,depthTest:true,depthWrite:true}));
      sky.visible=false;
      scene.traverseVisible(o=>{
        if(!o.isMesh||o===sky)return;
        changed.push([o,o.material,o.frustumCulled,o.visible]);
        o.material=mat;
        o.frustumCulled=false;
        o.visible=true;
      });
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
      for(const [o,m,f,v] of changed){o.material=m;o.frustumCulled=f;o.visible=v;}
      sky.visible=priorSkyVisible;
    }else if(rawDepth){
      const priorSkyVisible=sky.visible;
      const changed=[];
      const mat=window.__HEARTHMERE_FORENSIC_DEPTH_MAT||(window.__HEARTHMERE_FORENSIC_DEPTH_MAT=new THREE.MeshDepthMaterial({depthPacking:THREE.BasicDepthPacking,side:THREE.DoubleSide,fog:false}));
      sky.visible=false;
      scene.traverseVisible(o=>{
        if(!o.isMesh||o===sky)return;
        changed.push([o,o.material,o.frustumCulled,o.visible]);
        o.material=mat;
        o.frustumCulled=false;
        o.visible=true;
      });
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
      for(const [o,m,f,v] of changed){o.material=m;o.frustumCulled=f;o.visible=v;}
      sky.visible=priorSkyVisible;
    }else if(rawBasicDirect){
      // FORENSIC WORLD-GEOMETRY ISOLATION.
      // Do NOT use traverseVisible here: a hidden parent group makes every descendant
      // disappear from traverseVisible, which would make this test falsely report that
      // the world has no renderable geometry. Walk the complete scene graph, force the
      // ancestor chain visible for the duration of the test, and disable frustum culling.
      const priorSkyVisible=sky.visible;
      const changed=[];
      const mat=window.__HEARTHMERE_FORENSIC_BASIC_DIRECT_MAT||(window.__HEARTHMERE_FORENSIC_BASIC_DIRECT_MAT=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,fog:false,depthTest:true,depthWrite:true}));
      sky.visible=false;
      let meshCount=0;
      scene.traverse(o=>{
        if(o===scene||o===sky)return;
        changed.push([o,o.visible]);
        o.visible=true;
        if(o.isMesh){
          meshCount++;
          changed.push([o,o.material,o.frustumCulled,o.visible,'mesh']);
          o.material=mat;
          o.frustumCulled=false;
          o.visible=true;
        }
      });
      window.__HEARTHMERE_FORENSIC_BASIC_DIRECT_STATS={
        meshCount,
        cameraPosition:camera.position.toArray(),
        cameraTarget:controls.target.toArray(),
        sceneChildren:scene.children.length
      };
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
      // Restore the entire scene graph, not merely the meshes.
      for(let i=changed.length-1;i>=0;i--){
        const entry=changed[i];
        if(entry[4]==='mesh'){
          const o=entry[0];
          o.material=entry[1];
          o.frustumCulled=entry[2];
          o.visible=entry[3];
        }else{
          entry[0].visible=entry[1];
        }
      }
      sky.visible=priorSkyVisible;
    }else if(rawNormal||rawBasic){
      const priorOverride=scene.overrideMaterial;
      const priorSkyVisible=sky.visible;
      scene.overrideMaterial=rawBasic
        ? (window.__HEARTHMERE_FORENSIC_BASIC_MAT||(window.__HEARTHMERE_FORENSIC_BASIC_MAT=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide})))
        : (window.__HEARTHMERE_FORENSIC_NORMAL_MAT||(window.__HEARTHMERE_FORENSIC_NORMAL_MAT=new THREE.MeshNormalMaterial({flatShading:false,side:THREE.DoubleSide})));
      sky.visible=false;
      renderer.clear(true,true,true);
      renderer.render(scene,camera);
      sky.visible=priorSkyVisible;
      scene.overrideMaterial=priorOverride;
    }else renderer.render(scene,camera);
  }
  else if(!postProcessingFailed) composer.render();
  else renderer.render(scene,camera);
}catch(err){
  postProcessingFailed=true;
  postProcessingError=err?.message||String(err);
  recordRuntimeIssue('errors',{message:postProcessingError,source:'composer.render',line:0,column:0});
  try{renderer.render(scene,camera);}catch(fallbackErr){
    recordRuntimeIssue('errors',{message:fallbackErr?.message||String(fallbackErr),source:'renderer.render fallback',line:0,column:0});
  }
}
const currentDrawCalls=renderer.info.render.calls;
const currentTriangles=renderer.info.render.triangles;
const frameRendered=currentDrawCalls>0;
if(frameRendered)window.__HEARTHMERE_READY_STATE.firstFrameRendered=true;
const frameMs=rawDt*1000;
perfStats.lastFrameMs=frameMs;
perfStats.drawCallsAccum+=currentDrawCalls;perfStats.trianglesAccum+=currentTriangles;
updatePerformanceStats(t,frameMs);renderer.info.reset();updateAdaptiveQuality(t);destinationMarker.scale.setScalar(1+Math.sin(time*5)*.08);minimap();if(autoCaptureArmed && player && window.__HEARTHMERE_READY && cc0LoadStats.pending===0 && distilledLoadStats.pending===0 && performance.now()-captureReadyAt>1200 && frameRendered){autoCaptureArmed=false;captureRequested=true;}if(captureRequested){
  captureRequested=false;
  window.__HEARTHMERE_CAPTURE_META={
    seed:WORLD_SEED,
    threeRevision:THREE.REVISION,
    viewport:[innerWidth,innerHeight],
    pixelRatio:renderer.getPixelRatio(),
    qualityLevel:quality.level,
    drawCalls:currentDrawCalls,
    triangles:currentTriangles,
    geometries:renderer.info.memory.geometries,
    textures:renderer.info.memory.textures,
    sceneBudget:{...sceneBudget},
    textureBudget:{...textureBudget},
    assetFailures:[...assetLoadStats.failedNames],
    distilledFailures:[...distilledLoadStats.failedKeys],
    cc0Failures:[...cc0LoadStats.failedUrls],
    runtimeErrors:runtimeDiagnostics.errors.slice(-8),
    postProcessingFailed,
    postProcessingError,
    unhandledRejections:runtimeDiagnostics.unhandledRejections.slice(-8),
    contextLost:runtimeDiagnostics.contextLost,
    shadowPolicy:{...shadowPolicy},
    staticFrozen:window.__HEARTHMERE_STATIC_FROZEN||0,
    gpuMemory:{geometryBytes:renderer.info.memory.attributesSize||0,textureBytes:renderer.info.memory.texturesSize||0,programs:renderer.info.programs?.length||0}
  };
  renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hearthmere-real-game-frame.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)},'image/png')}}
renderer.setAnimationLoop(frame);
document.addEventListener('visibilitychange',()=>{
  runtimeDiagnostics.visibilityState=document.visibilityState;
  quality.frameSamples.length=0;quality.frameCount=0;quality.sampleStarted=performance.now();last=performance.now();
});
window.addEventListener('pagehide',()=>{runtimeDiagnostics.visibilityState='pagehide';});


/* GRAPHICS PASS 4 — ground/vegetation integration.
   Purpose: make the authored world feel physically rooted without expanding the
   footprint or relying on hundreds of unique meshes. This pass uses instancing,
   hero-camera-biased placement, and material variation instead of micro-geometry.
*/

/* GRAPHICS PASS 5 — material grounding. */
function strengthenMaterialGrounding(){
  let installed=0;
  scene.traverse(obj=>{
    if(!obj.isMesh||obj===sky||obj===sunDisc||obj.userData?.noFoundationShader)return;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    mats.forEach(mat=>{
      if(!mat || !(mat.isMeshStandardMaterial||mat.isMeshPhysicalMaterial))return;
      if(mat.userData.groundingPassInstalled)return;
      const prior=mat.onBeforeCompile;
      mat.onBeforeCompile=(shader,renderer)=>{
        if(prior)prior(shader,renderer);
        shader.vertexShader='varying vec3 vGroundingWorld;\n'+
          shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vGroundingWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
        shader.fragmentShader='varying vec3 vGroundingWorld;\n'+
          shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n float groundBand=1.0-smoothstep(-.10,.72,vGroundingWorld.y);\n float groundNoise=sin(vGroundingWorld.x*.83+vGroundingWorld.z*.61)*.5+.5;\n diffuseColor.rgb*=1.0-groundBand*(.035+groundNoise*.028);');
      };
      mat.userData.groundingPassInstalled=true;
      mat.needsUpdate=true;installed++;
    });
  });
  window.__HEARTHMERE_MATERIAL_GROUNDING={version:1,materials:installed};
}
/* GRAPHICS PASS 7 — character presentation and focal readability.
   The hero is the player's visual anchor, so presentation gets a dedicated
   lighting/contact layer rather than relying on global scene lighting alone.
*/
function buildCharacterPresentationPass(){
  if(window.__HEARTHMERE_CHARACTER_PRESENTATION?.version===1)return;
  const hero=player;
  if(!hero)return;

  const c=document.createElement('canvas');c.width=128;c.height=128;
  const ctx=c.getContext('2d');
  const g=ctx.createRadialGradient(64,64,3,64,64,62);
  g.addColorStop(0,'rgba(0,0,0,.48)');
  g.addColorStop(.34,'rgba(0,0,0,.25)');
  g.addColorStop(.72,'rgba(0,0,0,.07)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
  const shadowMap=new THREE.CanvasTexture(c);
  shadowMap.colorSpace=THREE.SRGBColorSpace;
  const shadow=new THREE.Mesh(
    new THREE.PlaneGeometry(1.9,1.9),
    new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,depthTest:true,opacity:.72})
  );
  shadow.rotation.x=-Math.PI/2;
  shadow.name='HeroContactShadow';
  shadow.renderOrder=-1;
  scene.add(shadow);

  const key=new THREE.SpotLight(0xffd7a1,5.2,18,Math.PI*.24,.82,1.7);
  key.name='HeroPresentationKey';
  key.position.set(-5.5,9.5,6.5);
  key.castShadow=false;
  const target=new THREE.Object3D();
  target.name='HeroPresentationTarget';
  target.position.set(0,1.15,30);
  scene.add(target);scene.add(key);key.target=target;

  const rim=new THREE.PointLight(0x8bc4d1,.95,9,1.8);
  rim.name='HeroPresentationRim';
  rim.position.set(2.6,2.7,27.8);
  scene.add(rim);

  // Role-specific accents prevent the two supporting characters from reading as
  // recolored copies of the hero while keeping the existing character source intact.
  const roleColors={smith:0xb85f3f,watch:0x5b8a69};
  characters.forEach(g=>{
    if(g===hero)return;
    const accent=roleColors[g.userData.role]||0x6b7082;
    const badge=new THREE.Mesh(
      new THREE.CylinderGeometry(.13,.13,.035,16),
      new THREE.MeshPhysicalMaterial({color:accent,roughness:.52,metalness:.08,clearcoat:.18})
    );
    badge.rotation.z=Math.PI/2;
    badge.position.set(0,1.72,.16);
    badge.userData.characterRoleAccent=true;
    g.add(badge);
  });

  window.__HEARTHMERE_CHARACTER_PRESENTATION={
    version:1,heroContactShadow:true,heroKey:true,heroRim:true,npcRoleAccents:Math.max(0,characters.length-1)
  };
  window.__HEARTHMERE_HERO_CONTACT_SHADOW=shadow;
  window.__HEARTHMERE_HERO_PRESENTATION_KEY=key;
}

function updateCharacterPresentation(){
  const shadow=window.__HEARTHMERE_HERO_CONTACT_SHADOW;
  if(!shadow||!player)return;
  shadow.position.set(player.position.x,terrainHeight(player.position.x,player.position.z)+.018,player.position.z);
  const moving=player.userData.walking?1:0;
  const pulse=1+Math.sin(time*2.15+player.userData.phase)*.025;
  shadow.scale.set(1.0+moving*.08,pulse,1.0+moving*.08);
  const key=window.__HEARTHMERE_HERO_PRESENTATION_KEY;
  if(key)key.target.position.lerp(new THREE.Vector3(player.position.x,1.15,player.position.z),.12);
}


/* GRAPHICS PASS 6 — world-material integration and authored terrain transitions.
   This is a macro-readability pass: it strengthens the relationships between
   paths, meadow, river, structures and vegetation without enlarging the map.
*/
function buildWorldMaterialIntegrationPass(){
  if(window.__HEARTHMERE_WORLD_MATERIAL_INTEGRATION?.version===1)return;
  const root=new THREE.Group();
  root.name='WorldMaterialIntegration';
  scene.add(root);

  // Road-to-meadow transition: irregular shoulder stones and dark soil pockets
  // soften the hard ribbon boundary while preserving the readable road silhouette.
  const shoulderGeo=new THREE.DodecahedronGeometry(.15,0);
  const shoulderMat=new THREE.MeshPhysicalMaterial({
    color:0x766b57,roughness:.98,metalness:0,sheen:.06
  });
  const shoulders=new THREE.InstancedMesh(shoulderGeo,shoulderMat,240);
  shoulders.name='RoadShoulderStones';
  const dummy=new THREE.Object3D();
  let count=0;
  const roadSegments=[
    [0,7,11.5,120,0],[-13,-1,50,7.5,0],[17,7,8,65,.18],[23,6,24,6.2,.02]
  ];
  for(const [cx,cz,w,d,rot] of roadSegments){
    const c=Math.min(54,Math.max(12,Math.round(d*.55)));
    for(let i=0;i<c && count<240;i++){
      const t=(i+.37)/c-.5;
      const side=i%2?-1:1;
      const edge=w*.5+.38+(i%4)*.17;
      const along=t*d;
      const localX=side*edge,localZ=along;
      const cs=Math.cos(rot),sn=Math.sin(rot);
      const x=cx+localX*cs-localZ*sn;
      const z=cz+localX*sn+localZ*cs;
      const y=terrainHeight(x,z);
      dummy.position.set(x,y+.10,z);
      dummy.rotation.set(worldRandom()*.55,worldRandom()*Math.PI*2,worldRandom()*.55);
      const sc=.62+worldRandom()*.95;
      dummy.scale.set(sc,sc*(.55+worldRandom()*.45),sc*(.72+worldRandom()*.45));
      dummy.updateMatrix();shoulders.setMatrixAt(count++,dummy.matrix);
    }
  }
  shoulders.count=count;shoulders.instanceMatrix.needsUpdate=true;root.add(shoulders);

  // Moisture language at the river: darker stones, low vegetation and a subtle
  // wetness response make the water corridor grow out of the terrain.
  const wetMat=new THREE.MeshPhysicalMaterial({
    color:0x56685c,roughness:.72,metalness:0,clearcoat:.16,clearcoatRoughness:.38
  });
  const wetStones=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.19,1),wetMat,150);
  wetStones.name='RiverWetBankStones';
  count=0;
  for(let i=0;i<430 && count<150;i++){
    const z=-51+worldRandom()*112;
    const side=i%2?-1:1;
    const x=NAV.river.centerX+side*(NAV.river.halfWidth*.72+worldRandom()*3.4);
    if(Math.abs(z-7)<8)continue;
    const y=terrainHeight(x,z);
    dummy.position.set(x,y+.13,z);
    dummy.rotation.set(worldRandom(),worldRandom(),worldRandom());
    const sc=.55+worldRandom()*1.05;
    dummy.scale.set(sc,sc*(.42+worldRandom()*.46),sc*(.75+worldRandom()*.55));
    dummy.updateMatrix();wetStones.setMatrixAt(count++,dummy.matrix);
  }
  wetStones.count=count;wetStones.instanceMatrix.needsUpdate=true;root.add(wetStones);

  // Building contact collars: low irregular stone courses stop buildings from
  // appearing pasted onto the meadow. These are intentionally broad rather than
  // tiny trim pieces.
  const foundationMat=new THREE.MeshPhysicalMaterial({
    color:0x68665f,roughness:.96,metalness:0,sheen:.05
  });
  const foundationGeo=new THREE.BoxGeometry(1,1,1);
  let collars=0;
  const buildingNames=/Inn|Forge|Chapel|Mill|Watchtower|cottage_/i;
  scene.traverse(obj=>{
    if(!obj.isGroup||!buildingNames.test(obj.name||''))return;
    if(obj.userData.worldMaterialCollar)return;
    const box3=new THREE.Box3().setFromObject(obj);
    if(!isFinite(box3.min.x)||box3.isEmpty())return;
    const sx=Math.min(9,Math.max(2.2,(box3.max.x-box3.min.x)*.78));
    const sz=Math.min(9,Math.max(2.0,(box3.max.z-box3.min.z)*.78));
    const cx=(box3.min.x+box3.max.x)*.5,cz=(box3.min.z+box3.max.z)*.5;
    const y=terrainHeight(cx,cz)+.045;
    const collar=new THREE.Mesh(foundationGeo,foundationMat.clone());
    collar.name='FoundationCollar';
    collar.scale.set(sx,.12,sz);
    collar.position.set(cx,y,cz);
    collar.rotation.y=obj.rotation.y||0;
    collar.receiveShadow=true;
    root.add(collar);
    obj.userData.worldMaterialCollar=true;
    collars++;
  });

  // Controlled authored variation keeps repeated timber/stone assets from reading
  // as exact duplicates. Variation is material-level, not geometry noise.
  let varied=0;
  const seen=new Set();
  scene.traverse(obj=>{
    if(!obj.isMesh||obj===sky||obj===sunDisc)return;
    const name=((obj.name||'')+' '+(obj.userData?.assetName||'')).toLowerCase();
    if(!/cottage|inn|forge|chapel|mill|watchtower|timber|plaster|roof|stone|wall/.test(name))return;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    mats.forEach((mat,mi)=>{
      if(!mat?.color||seen.has(mat.uuid))return;
      seen.add(mat.uuid);
      const seed=(obj.id*17+mi*31)%9;
      const lift=1+(seed-4)*.012;
      mat.color.multiplyScalar(lift);
      if(/roof/.test(name))mat.roughness=Math.min(1,Math.max(.72,(mat.roughness??.82)+(seed%3)*.018));
      if(/stone|wall/.test(name))mat.roughness=Math.min(1,Math.max(.82,(mat.roughness??.9)+(seed%4)*.012));
      varied++;
    });
  });

  window.__HEARTHMERE_WORLD_MATERIAL_INTEGRATION={
    version:1,roadShoulderStones:shoulders.count,riverWetBankStones:wetStones.count,
    foundationCollars:collars,variedMaterials:varied
  };
}


function buildWildflowerMeadowPass(){
  if(window.__HEARTHMERE_WILDFLOWERS?.version===1)return;
  const root=new THREE.Group();root.name='WildflowerMeadows';
  const species=[
    {color:0xd9c98a,scale:.72,count:34},
    {color:0x8d86ad,scale:.62,count:30},
    {color:0xc47b67,scale:.58,count:28}
  ];
  const petalGeo=new THREE.ConeGeometry(.065,.22,5);
  const centerGeo=new THREE.SphereGeometry(.055,7,5);
  let placed=0;
  species.forEach((sp,si)=>{
    const petalMat=new THREE.MeshPhysicalMaterial({color:sp.color,roughness:.78,metalness:0,sheen:.25,flatShading:true});
    const centerMat=new THREE.MeshPhysicalMaterial({color:si===1?0xd5bd70:0x8f6a3f,roughness:.84,metalness:0});
    const petalsA=new THREE.InstancedMesh(petalGeo,petalMat,sp.count);
    const petalsB=new THREE.InstancedMesh(petalGeo,petalMat,sp.count);
    const centers=new THREE.InstancedMesh(centerGeo,centerMat,sp.count);
    const dummy=new THREE.Object3D();
    let n=0,guard=0;
    while(n<sp.count&&guard<sp.count*14){
      guard++;
      const x=-47+worldRandom()*94,z=-51+worldRandom()*108;
      const edge=1-Math.min(1,Math.hypot(x*.55,(z+2)*.42)/55);
      if(Math.abs(x)<9&&z>-31&&z<35)continue;
      if(edge<.08&&worldRandom()<.7)continue;
      if(Math.abs(x-31)<4&&z>-34&&z<55)continue;
      const y=terrainHeight(x,z);
      const s=sp.scale*(.72+worldRandom()*.42);
      dummy.position.set(x,y+.10,z);dummy.rotation.set(0,worldRandom()*Math.PI,0);dummy.scale.set(s,s,s);dummy.updateMatrix();petalsA.setMatrixAt(n,dummy.matrix);
      dummy.rotation.y+=Math.PI*.5;dummy.rotation.x=.08;dummy.updateMatrix();petalsB.setMatrixAt(n,dummy.matrix);
      dummy.position.y+=.12*s;dummy.scale.setScalar(s*.72);dummy.rotation.set(0,worldRandom()*Math.PI,0);dummy.updateMatrix();centers.setMatrixAt(n,dummy.matrix);
      n++;
    }
    petalsA.count=n;petalsB.count=n;centers.count=n;
    petalsA.instanceMatrix.needsUpdate=true;petalsB.instanceMatrix.needsUpdate=true;centers.instanceMatrix.needsUpdate=true;
    petalsA.frustumCulled=false;petalsB.frustumCulled=false;centers.frustumCulled=false;
    root.add(petalsA,petalsB,centers);placed+=n;
  });
  scene.add(root);
  window.__HEARTHMERE_WILDFLOWERS={version:1,flowers:placed,species:3};
}
function buildGroundIntegrationPass(){
  if(window.__HEARTHMERE_GROUND_INTEGRATION?.version===1)return;
  const rootGroup=new THREE.Group();
  rootGroup.name='GroundIntegrationPass';
  scene.add(rootGroup);

  const grassGeo=new THREE.ConeGeometry(.055,.42,4,1);
  const grassMat=new THREE.MeshPhysicalMaterial({
    color:0x6d8a45,roughness:.96,metalness:0,
    sheen:.18,sheenColor:new THREE.Color(0x9aaa62),
    side:THREE.DoubleSide
  });
  const grassMesh=new THREE.InstancedMesh(grassGeo,grassMat,420);
  grassMesh.name='GroundUnderstoryInstanced';
  grassMesh.castShadow=false;grassMesh.receiveShadow=true;
  const dummy=new THREE.Object3D();
  let count=0;
  const occupied=[
    {x:0,z:0,r:10},{x:-16,z:-8,r:9},{x:18,z:6,r:9},{x:-26,z:19,r:8},
    {x:24,z:-20,r:10},{x:-5,z:30,r:7},{x:34,z:22,r:7}
  ];
  function nearOccupied(x,z){
    for(const p of occupied) if(Math.hypot(x-p.x,z-p.z)<p.r)return true;
    return false;
  }
  for(let i=0;i<1200 && count<420;i++){
    const x=-50+worldRandom()*100,z=-50+worldRandom()*112;
    if(nearOccupied(x,z))continue;
    if(Math.abs(z-10)<2.2 && x>-8 && x<27)continue;
    if(x>20 && Math.abs(z)<27 && worldRandom()<.72)continue;
    const y=terrainHeight(x,z);
    dummy.position.set(x,y+.19,z);
    dummy.rotation.set(
      (worldRandom()-.5)*.22,
      worldRandom()*Math.PI*2,
      (worldRandom()-.5)*.22
    );
    const scale=.55+worldRandom()*1.25;
    dummy.scale.set(scale*(.7+worldRandom()*.45),scale,scale*(.72+worldRandom()*.42));
    dummy.updateMatrix();
    grassMesh.setMatrixAt(count++,dummy.matrix);
  }
  grassMesh.count=count;grassMesh.instanceMatrix.needsUpdate=true;
  rootGroup.add(grassMesh);

  // A second, darker layer breaks the uniform lawn silhouette and visually anchors
  // rocks, paths and building edges. It is deliberately sparse on mobile.
  const tuftGeo=new THREE.ConeGeometry(.075,.62,5,1);
  const tuftMat=new THREE.MeshPhysicalMaterial({
    color:0x344f2c,roughness:1,metalness:0,sheen:.10,
    side:THREE.DoubleSide
  });
  const tufts=new THREE.InstancedMesh(tuftGeo,tuftMat,190);
  tufts.name='GroundDarkTufts';
  const dummy2=new THREE.Object3D();
  count=0;
  for(let i=0;i<700 && count<190;i++){
    const x=-51+worldRandom()*102,z=-52+worldRandom()*116;
    if(nearOccupied(x,z))continue;
    if(worldRandom()<.48)continue;
    const y=terrainHeight(x,z);
    dummy2.position.set(x,y+.25,z);
    dummy2.rotation.set((worldRandom()-.5)*.28,worldRandom()*Math.PI*2,(worldRandom()-.5)*.28);
    const scale=.45+worldRandom()*.85;
    dummy2.scale.set(scale,scale*(.75+worldRandom()*.65),scale);
    dummy2.updateMatrix();tufts.setMatrixAt(count++,dummy2.matrix);
  }
  tufts.count=count;tufts.instanceMatrix.needsUpdate=true;rootGroup.add(tufts);

  // River-edge reeds: a low, intentional silhouette language rather than a flat
  // texture boundary. Placement follows the existing river corridor.
  const reedGeo=new THREE.ConeGeometry(.035,.72,4,1);
  const reedMat=new THREE.MeshPhysicalMaterial({
    color:0x788c4b,roughness:.94,sheen:.25,
    sheenColor:new THREE.Color(0xb1ad69),side:THREE.DoubleSide
  });
  const reeds=new THREE.InstancedMesh(reedGeo,reedMat,110);
  reeds.name='RiverbankReeds';
  count=0;
  for(let i=0;i<360 && count<110;i++){
    const z=-48+worldRandom()*108;
    const side=worldRandom()<.5?-1:1;
    const x=27+side*(1.1+worldRandom()*1.5);
    const y=terrainHeight(x,z);
    dummy.position.set(x,y+.36,z);
    dummy.rotation.set((worldRandom()-.5)*.16,worldRandom()*Math.PI*2,(worldRandom()-.5)*.16);
    const scale=.65+worldRandom()*.8;
    dummy.scale.set(scale*.65,scale,scale*.65);
    dummy.updateMatrix();reeds.setMatrixAt(count++,dummy.matrix);
  }
  reeds.count=count;reeds.instanceMatrix.needsUpdate=true;rootGroup.add(reeds);

  // Small grounding stones are instanced so building/road transitions read as
  // authored terrain rather than a perfectly clean procedural plane.
  const stoneGeo=new THREE.DodecahedronGeometry(.16,0);
  const stoneMat=new THREE.MeshPhysicalMaterial({color:0x6d7060,roughness:.98,metalness:0,sheen:.06});
  const stones=new THREE.InstancedMesh(stoneGeo,stoneMat,95);
  stones.name='GroundingStones';
  count=0;
  for(let i=0;i<430 && count<95;i++){
    const x=-50+worldRandom()*100,z=-50+worldRandom()*112;
    if(nearOccupied(x,z)||worldRandom()<.68)continue;
    const y=terrainHeight(x,z);
    dummy.position.set(x,y+.10,z);dummy.rotation.set(worldRandom(),worldRandom(),worldRandom());
    const scale=.45+worldRandom()*.85;
    dummy.scale.set(scale,scale*(.45+worldRandom()*.55),scale);
    dummy.updateMatrix();stones.setMatrixAt(count++,dummy.matrix);
  }
  stones.count=count;stones.instanceMatrix.needsUpdate=true;rootGroup.add(stones);

  window.__HEARTHMERE_GROUND_INTEGRATION={
    version:1,grassInstances:grassMesh.count,darkTufts:tufts.count,
    riverReeds:reeds.count,groundingStones:stones.count
  };
}


/*
============================================================================
GRAPHICS BENCHMARK V3 — WORLD RECONSTRUCTION
This is deliberately a macro art-direction pass. It does not chase tiny trim:
it changes the silhouette hierarchy, biome composition, terrain framing,
material separation and landmark context that determine whether the world
reads as a cohesive authored place at normal play distance.
============================================================================
*/
function buildWorldArtDirectionV3(){
  if(window.__HEARTHMERE_GRAPHICS_V3?.version===3)return;
  const root=new THREE.Group();root.name='GraphicsBenchmarkV3';scene.add(root);

  // 1) Large-scale terrain framing. The playable basin is kept readable while
  // broad raised shoulders create a natural bowl instead of a flat green sheet.
  const ridgeMat=new THREE.MeshPhysicalMaterial({
    color:0x3f5546,roughness:.985,metalness:0,sheen:.12,
    sheenColor:new THREE.Color(0x728263),sheenRoughness:.92
  });
  const ridgeGeo=(cx,cz,rx,rz,h,phase)=>{
    const seg=64,verts=[],idx=[];
    for(let i=0;i<seg;i++){
      const a=i/seg*Math.PI*2;
      const wobble=1+.075*Math.sin(a*3+phase)+.045*Math.sin(a*7-phase*.7);
      const x=cx+Math.cos(a)*rx*wobble,z=cz+Math.sin(a)*rz*wobble;
      const y=macroTerrainHeight(x,z)+h*(.62+.20*Math.sin(a*2+phase)+.10*Math.sin(a*5));
      verts.push(x,y,z,x,macroTerrainHeight(x,z)+.06,z);
    }
    for(let i=0;i<seg;i++){const n=(i+1)%seg,a=i*2,b=a+1,c=n*2,d=c+1;idx.push(a,c,b,c,d,b);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return g;
  };
  [
    [-43,4,17,38,2.8,1.2],[45,8,18,42,3.4,2.7],[-4,46,42,13,2.5,.8],[18,-48,35,13,2.1,3.4]
  ].forEach(v=>{
    const m=new THREE.Mesh(ridgeGeo(...v),ridgeMat);m.receiveShadow=true;m.castShadow=true;root.add(m);
  });

  // 2) Replace the old "single lawn" read with broad, irregular biome islands.
  const biomeMats=[
    new THREE.MeshPhysicalMaterial({color:0x486236,roughness:.99,sheen:.12,sheenColor:new THREE.Color(0x71885a)}),
    new THREE.MeshPhysicalMaterial({color:0x667344,roughness:.985,sheen:.10,sheenColor:new THREE.Color(0x9b9a65)}),
    new THREE.MeshPhysicalMaterial({color:0x765e3f,roughness:1,metalness:0})
  ];
  const islands=[
    [-34,-6,11,7,.12,0],[-27,18,13,8,-.28,1],[18,27,15,9,.20,0],
    [40,17,10,16,.42,1],[-42,35,9,12,-.18,0],[34,-35,14,8,-.22,1],
    [-38,-39,11,7,.15,2],[7,-43,17,6,-.08,2]
  ];
  islands.forEach(([x,z,rx,rz,rot,mi],i)=>{
    const g=new THREE.CircleGeometry(1,64);g.scale(rx,rz,1);
    const mesh=new THREE.Mesh(g,biomeMats[mi]);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=rot;
    mesh.position.set(x,terrainHeight(x,z)+.028,z);mesh.receiveShadow=true;mesh.userData.staticVisual=true;root.add(mesh);
  });

  // 3) High-information woodland masses. Trees are clustered into authored groves,
  // not evenly scattered; the negative space around the settlement remains deliberate.
  const groves=[
    [-46,-22,1.35,5],[-44,-7,1.12,4],[-46,11,1.30,5],[-41,27,1.22,4],
    [45,-20,1.42,5],[47,-4,1.22,4],[46,14,1.35,5],[41,31,1.28,4],
    [-28,40,1.05,4],[-13,43,1.18,4],[4,45,1.10,4],[25,45,1.22,5],
    [-28,-42,1.08,4],[-10,-45,1.18,4],[12,-46,1.10,4],[29,-43,1.28,4]
  ];
  groves.forEach(([x,z,s,n],gi)=>{
    for(let j=0;j<n;j++){
      const a=(j/n)*Math.PI*2+gi*.71,r=1.1+(j%3)*.72;
      const tx=x+Math.cos(a)*r,tz=z+Math.sin(a)*r;
      const tree=hdTree(tx,tz,s*(.78+(j%3)*.10),(gi+j)%4===0);
      tree.userData.vegetationTier='hero_companion';
      tree.userData.windPhase=gi*.73+j*.31;
      tree.userData.windStrength=.0038;
      tree.userData.staticVisual=true;
      root.add(tree);
    }
  });

  // 4) Natural outcrops use deformed high-resolution icospheres rather than the
  // old perfectly round rock primitive. These establish foreground/intermediate
  // scale landmarks and make the terrain feel geologically continuous.
  const outcropMats=[
    new THREE.MeshPhysicalMaterial({color:0x5c6259,roughness:.94,sheen:.08,sheenColor:new THREE.Color(0x8b987b)}),
    new THREE.MeshPhysicalMaterial({color:0x454e49,roughness:.97,sheen:.10,sheenColor:new THREE.Color(0x6d805f)})
  ];
  const outcrops=[
    [-39,-12,1.9,1.25,1.45],[-36,21,2.2,1.5,1.15],[39,-9,2.0,1.3,1.55],
    [35,25,2.35,1.45,1.35],[-24,34,1.55,1.15,1.20],[28,-39,2.1,1.35,1.25],
    [-8,-39,1.45,1.05,1.05],[9,36,1.7,1.2,1.15]
  ];
  outcrops.forEach(([x,z,sx,sy,sz],i)=>{
    const geo=new THREE.IcosahedronGeometry(1,2);
    const p=geo.attributes.position;
    for(let k=0;k<p.count;k++){
      const vx=p.getX(k),vy=p.getY(k),vz=p.getZ(k);
      const n=1+.11*Math.sin(vx*5.3+vz*3.1+i)+.07*Math.cos(vy*7.1-vx*2.4);
      p.setXYZ(k,vx*n*sx,vy*n*sy,vz*n*sz);
    }
    geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,outcropMats[i%2]);m.position.set(x,terrainHeight(x,z)+sy*.64,z);
    m.rotation.set(.08+i*.03,i*.71,-.05);m.castShadow=true;m.receiveShadow=true;m.userData.staticVisual=true;root.add(m);
    const moss=new THREE.Mesh(new THREE.SphereGeometry(1.01,32,20),new THREE.MeshPhysicalMaterial({color:0x526b42,roughness:1,sheen:.18,transparent:true,opacity:.30}));
    moss.scale.set(sx*.92,sy*.40,sz*.96);moss.position.set(x-.12,terrainHeight(x,z)+sy*.92,z+.05);moss.rotation.y=i*.8;root.add(moss);
  });

  // 5) The settlement gets a stronger inhabited skyline: a few asymmetrical homes
  // and workshops bridge the gap between landmark buildings and wilderness.
  const skyline=[
    [-24,-7,.92,.08],[-20,4,.82,-.12],[-17,23,.88,.18],[-2,27,.82,-.10],
    [9,20,.86,.16],[12,-27,.90,-.14],[25,-25,.82,.10],[30,7,.78,-.16]
  ];
  skyline.forEach(([x,z,s,r],i)=>{
    const h=hdBuilding('cottage',x,z,s,r);
    h.userData.architectureTier='secondary_hero';
    h.userData.staticVisual=true;
    root.add(h);
    if(i%2===0){
      const yard=new THREE.Mesh(new THREE.CircleGeometry(2.3,48),new THREE.MeshPhysicalMaterial({color:0x6c684f,roughness:1,transparent:true,opacity:.42}));
      yard.rotation.x=-Math.PI/2;yard.position.set(x,terrainHeight(x,z)+.045,z);yard.userData.staticVisual=true;root.add(yard);
    }
  });

  // 6) Cohesive material grade: architecture stays warm and tactile, vegetation
  // stays deep/varied, and the river becomes the cool visual counterweight.
  [ARCH.plasterA,ARCH.plasterB,ARCH.plasterC,HD.plaster,HD.plasterWarm].forEach(m=>{
    m.roughness=Math.max(.82,m.roughness||.9);m.envMapIntensity=Math.max(.42,m.envMapIntensity||0);
  });
  [ARCH.roofA,ARCH.roofB,ARCH.roofC,HD.roof,HD.roofWarm].forEach(m=>{
    m.roughness=Math.max(.68,m.roughness||.8);m.envMapIntensity=Math.max(.38,m.envMapIntensity||0);
  });
  [HD.leaf,HD.leafLight,MASTER.green].forEach(m=>{
    if(m){m.roughness=.90;m.envMapIntensity=Math.max(.30,m.envMapIntensity||0);}
  });
  MAT.water.color.set(0x207b86);MAT.water.roughness=.055;MAT.water.clearcoat=1;MAT.water.clearcoatRoughness=.08;

  // 7) Presentation: stronger but controlled cinematic separation. This is intentionally
  // below "effect overload"; the geometry and composition carry the image.
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.10;
  scene.environmentIntensity=.44;
  sun.intensity=2.95;fill.intensity=.56;hemi.intensity=1.04;
  bloomPass.strength=.095;bloomPass.radius=.36;bloomPass.threshold=.88;
  ssaoPass.kernelRadius=14;ssaoPass.maxDistance=.23;
  cinematicGradePass.uniforms.uSaturation.value=1.0;
  cinematicGradePass.uniforms.uContrast.value=1.0;
  cinematicGradePass.uniforms.uWarmth.value=0.0;
  cinematicGradePass.uniforms.uVignette.value=0.0;

  window.__HEARTHMERE_GRAPHICS_V3={
    version:3,terrainRidges:4,biomeIslands:islands.length,groves:groves.length,
    outcrops:outcrops.length,secondaryBuildings:skyline.length,
    renderer:'Three.js 0.181.1 / WebGL PBR pipeline'
  };
}


/*
============================================================================
GRAPHICS BENCHMARK V4 — ASSET REPLACEMENT
Macro quality rule: when a procedural silhouette has reached its ceiling,
replace it with a richer authored/CC0 asset instead of decorating the weak
silhouette further. This pass specifically replaces the V3 companion woods
and geology with the already-vendored/high-information asset pipeline.
============================================================================
*/
async function buildWorldArtDirectionV4(){
  if(window.__HEARTHMERE_GRAPHICS_V4?.version===4)return;

  const v3=scene.getObjectByName('GraphicsBenchmarkV3');
  if(v3){
    v3.traverse(o=>{
      if(o.userData?.vegetationTier==='hero_companion')o.visible=false;
      if(o.isMesh && o.geometry){
        const type=o.geometry.type||'';
        if(type==='IcosahedronGeometry')o.visible=false;
      }
    });
  }

  // Replace the procedural forest companions with the production GLB tree set.
  const treeSpecs=[
    [-46,-23,1.10,-.22,0],[-44,-8,1.02,.12,1],[-46,11,1.16,-.18,0],[-41,27,1.08,.28,1],
    [45,-20,1.18,.14,1],[47,-4,1.08,-.12,0],[46,14,1.15,.24,1],[41,31,1.10,-.18,0],
    [-28,40,.94,.20,1],[-13,43,1.02,-.16,0],[4,45,.96,.12,1],[25,45,1.05,-.24,0],
    [-28,-42,.98,.18,1],[-10,-45,1.06,-.10,0],[12,-46,.98,.22,1],[29,-43,1.08,-.16,0],
    [-37,-16,.82,.34,0],[37,-16,.88,-.26,1],[-35,30,.86,.18,1],[34,30,.90,-.22,0]
  ];
  const trees=[];
  for(let i=0;i<treeSpecs.length;i++){
    const [x,z,s,r,p]=treeSpecs[i];
    const g=await placeAsset(p?'tree_pine':'tree_oak',x,z,s,r);
    if(g){g.userData.assetReplacementTier='v4_tree';g.userData.staticVisual=true;trees.push(g);}
  }

  // Replace the V3 procedural geology with the local Poly Haven rock/moss set.
  const rockSpecs=[
    [-39,-12,1.25,.16,0],[-36,21,1.42,-.28,1],[39,-9,1.30,.22,2],
    [35,25,1.46,-.16,0],[-24,34,1.05,.30,1],[28,-39,1.36,-.20,2],
    [-8,-39,.96,.12,0],[9,36,1.10,-.24,1]
  ];
  const rocks=[];
  for(let i=0;i<rockSpecs.length;i++){
    const [x,z,s,r,v]=rockSpecs[i];
    const g=await placeDistilledVariant('rock',x,z,s,r,v);
    if(g){g.userData.assetReplacementTier='v4_rock';g.userData.staticVisual=true;rocks.push(g);}
  }

  // Build a layered near-ground material break using actual high-information
  // CC0 shrubs/ferns/grass rather than relying on flat procedural color patches.
  const understory=[
    ['shrub',-31,-18,.62,.12,0],['shrubAlt',-26,-10,.55,-.18,1],['scrub',-22,20,.58,.24,2],
    ['fern',-18,9,.48,-.12,0],['shrubAlt',-14,-18,.52,.20,1],['shrub',-4,-23,.62,-.24,0],
    ['scrub',7,-17,.58,.14,1],['fern',12,-7,.46,-.18,0],['shrubAlt',19,-2,.56,.22,1],
    ['shrub',24,8,.64,-.16,0],['scrub',29,18,.56,.18,2],['fern',17,22,.44,-.28,0],
    ['shrubAlt',-23,27,.54,.10,1],['scrub',-8,29,.60,-.22,2],['shrub',7,31,.58,.16,0],
    ['fern',-4,16,.46,.26,1],['shrubAlt',3,5,.52,-.12,0],['shrub',-2,-7,.50,.18,1]
  ];
  const understoryPlaced=[];
  for(let i=0;i<understory.length;i++){
    const [key,x,z,s,r,v]=understory[i];
    const g=await placeDistilledVariant(key,x,z,s,r,v);
    if(g){g.userData.assetReplacementTier='v4_understory';g.userData.staticVisual=true;understoryPlaced.push(g);}
  }

  // A sparse grass layer ties the replacement assets into the authored ground
  // without turning the mobile scene into a dense alpha-card carpet.
  const grassSpecs=[
    [-33,-14,.44,.1],[-28,5,.38,-.2],[-19,-4,.42,.18],[-10,-15,.40,-.14],
    [0,-12,.44,.22],[10,-3,.38,-.18],[18,5,.43,.16],[27,12,.40,-.22],
    [-20,22,.40,.12],[-7,25,.42,-.16],[6,27,.38,.20],[20,28,.44,-.12]
  ];
  const grassPlaced=[];
  for(let i=0;i<grassSpecs.length;i++){
    const [x,z,s,r]=grassSpecs[i];
    const g=await placeDistilledVariant('grass',x,z,s,r,i);
    if(g){g.userData.assetReplacementTier='v4_grass';g.userData.staticVisual=true;grassPlaced.push(g);}
  }

  // Material hierarchy: natural assets should sit into the world rather than
  // looking like isolated imports.
  [...trees,...rocks,...understoryPlaced,...grassPlaced].forEach(g=>{
    g.traverse(o=>{
      if(!o.isMesh||!o.material)return;
      o.material.roughness=Math.max(.72,o.material.roughness??.82);
      o.material.envMapIntensity=Math.max(.28,o.material.envMapIntensity??0);
      o.receiveShadow=true;
    });
  });

  window.__HEARTHMERE_GRAPHICS_V4={
    version:4,
    replacedProceduralTrees:trees.length,
    replacedGeology:rocks.length,
    understory:understoryPlaced.length,
    grassAnchors:grassPlaced.length,
    strategy:'replace weak silhouettes with richer GLB assets'
  };
}

/* GRAPHICS BENCHMARK V5 — HERO SILHOUETTE REPLACEMENT
   Do not keep adding detail to a silhouette that is still visibly procedural.
   Replace the highest-salience remaining procedural foliage with the richer
   authored GLB library, while preserving the authored placement coordinates. */
async function buildWorldArtDirectionV5(){
  if(window.__HEARTHMERE_GRAPHICS_V5?.version===5)return;

  const proceduralTrees=[];
  scene.traverse(o=>{
    if(!o.isGroup || o.userData?.vegetationTier!=='hero')return;
    if(o.userData?.assetReplacementTier)return;
    proceduralTrees.push(o);
  });

  const specs=proceduralTrees.map((g,i)=>({
    x:g.position.x,z:g.position.z,scale:g.scale.x,rotation:g.rotation.y,
    pine:!!(g.children?.some?.(c=>c.userData?.pineTree)),
    i
  }));

  // Hide first, then replace. This prevents a doubled silhouette if an asset loads
  // successfully and makes the intended production layer explicit.
  proceduralTrees.forEach(g=>{
    g.visible=false;
    g.userData.replacedByV5=true;
  });

  const placed=[];
  for(const s of specs){
    const name=s.i%4===0?'tree_pine':'tree_oak';
    const g=await placeAsset(name,s.x,s.z,s.scale,s.rotation);
    if(g){
      g.userData.assetReplacementTier='v5_hero_tree';
      g.userData.staticVisual=true;
      g.traverse(o=>{
        if(!o.isMesh||!o.material)return;
        o.material=o.material.clone();
        o.material.roughness=Math.max(.72,o.material.roughness??.82);
        o.material.envMapIntensity=Math.max(.30,o.material.envMapIntensity??0);
        o.castShadow=true;o.receiveShadow=true;
      });
      placed.push(g);
    }else{
      // Preserve the authored procedural tree if the production asset is unavailable.
      const original=proceduralTrees[s.i];
      if(original){original.visible=true;original.userData.replacementFallback=true;}
    }
  }

  // Remove only successfully replaced procedural hero roots; their old geometry no
  // longer contributes to draw calls or shadows. Fallbacks remain intact.
  proceduralTrees.forEach(g=>{
    if(g.userData.replacementFallback)return;
    g.removeFromParent();
  });

  // V3's circular biome decals were useful for blocking composition, but their
  // perfect circumference is a visible procedural tell. Replace those decals with
  // irregular authored-looking ground islands so the terrain reads as continuous.
  const v3Root=scene.getObjectByName('GraphicsBenchmarkV3');
  let replacedBiomeDecals=0;
  if(v3Root){
    v3Root.traverse(o=>{
      if(o.isMesh && o.geometry?.type==='CircleGeometry'){
        o.visible=false;
        o.userData.replacedByV5Biome=true;
        replacedBiomeDecals++;
      }
    });
  }
  const biomeSpecs=[
    [-34,-6,12,8,.12,0x536c3e],[-27,18,14,9,-.28,0x6a7647],[18,27,16,10,.20,0x536c3e],
    [40,17,11,17,.42,0x6a7647],[-42,35,10,13,-.18,0x536c3e],[34,-35,15,9,-.22,0x6a7647],
    [-38,-39,12,8,.15,0x765e3f],[7,-43,18,7,-.08,0x765e3f]
  ];
  const biomeRoot=new THREE.Group();
  biomeRoot.name='V5BiomeIntegration';
  biomeSpecs.forEach(([cx,cz,rx,rz,rot,color],i)=>{
    const seg=20,verts=[],idx=[];
    for(let j=0;j<seg;j++){
      const a=j/seg*Math.PI*2;
      const wobble=1+.10*Math.sin(a*3+i*.7)+.055*Math.sin(a*7-i);
      const x=cx+Math.cos(a)*rx*wobble,z=cz+Math.sin(a)*rz*wobble;
      const y=terrainHeight(x,z)+.035;
      verts.push(x,y,z);
    }
    verts.push(cx,terrainHeight(cx,cz)+.038,cz);
    const center=seg;
    for(let j=0;j<seg;j++){const n=(j+1)%seg;idx.push(center,j,n);}
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setIndex(idx);geo.computeVertexNormals();
    const mat=new THREE.MeshPhysicalMaterial({
      color,roughness:.995,metalness:0,sheen:.10,
      sheenColor:new THREE.Color(i%2?0x9b9a65:0x71885a),sheenRoughness:.94
    });
    const m=new THREE.Mesh(geo,mat);
    m.receiveShadow=true;m.userData.staticVisual=true;m.userData.biomeIslandV5=true;
    biomeRoot.add(m);
  });
  scene.add(biomeRoot);

  // A deliberately sparse foreground dressing ribbon gives the new hero trees a
  // believable ground contact without carpeting the mobile scene in alpha cards.
  const contactSpots=[
    [-34,-30,.72,0],[-27,-25,.58,.6],[-18,-28,.66,-.4],[23,-31,.74,.3],
    [29,-27,.62,-.7],[43,-24,.68,.2],[-37,28,.64,-.3],[-31,34,.56,.5],
    [-22,31,.62,-.2],[39,29,.70,.4],[45,38,.58,-.5],[24,42,.60,.2]
  ];
  const contact=[];
  for(let i=0;i<contactSpots.length;i++){
    const [x,z,sc,r]=contactSpots[i];
    const key=i%3===0?'shrub':i%3===1?'shrubAlt':'scrub';
    const g=await placeDistilledVariant(key,x,z,sc,r,i);
    if(g){g.userData.assetReplacementTier='v5_tree_contact';g.userData.staticVisual=true;contact.push(g);}
  }

  window.__HEARTHMERE_GRAPHICS_V5={
    version:5,
    replacedHeroTrees:placed.length,
    fallbackHeroTrees:proceduralTrees.length-placed.length,
    contactDressing:contact.length,
    strategy:'replace remaining hero procedural foliage with production GLB silhouettes'
  };
}

(async()=>{bootSet(.10,'Assembling the village…');await buildLandmarks();bootSet(.69,'Dressing Hearthmere…');await dressVillage();await buildResidentialQuarter();addVillageMicroDressing();bootSet(.79,'Growing the woodland…');await buildFoliage();bootSet(.82,'Finishing woodland dressing…');await buildNaturalDressing();buildLandscapeAnchors();buildWorldVisualPass();buildCinematicLighting();buildFarmArrival();buildStoryScenes();bootSet(.86,'Placing gathering sites…');await buildResourceNodes();bootSet(.91,'Calling the villagers…');await buildCharacters();await replaceLegacyVisuals();await buildDistilledNature();await buildVegetationBiomes();await applyCC0Materials();await buildInteractions();buildMasterArtDirectionPass();buildCivicArchitecturePass();buildPresentationMaterialPass();buildLandmarkCourtyardPass();buildBeautyLightingPass();buildHighEndAtmospherePass();buildCinematicWorldDepthPass();buildWaterDetailPass();buildLandmarkBannerPass();buildGraphicsFoundationV2();buildGraphicsMasterPass();buildWorldMaterialIntegrationPass();buildGroundIntegrationPass();buildWildflowerMeadowPass();strengthenMaterialGrounding();buildCharacterPresentationPass();buildWorldLifeAndInteractionPass();buildWorldArtDirectionV3();await buildWorldArtDirectionV4();await buildWorldArtDirectionV5();
interactables.forEach(o=>registerInteractionRoot(o));
applyShadowPolicy();
freezeStaticVisuals();
bootSet(.975,'Preparing materials and shaders…');if(!new URLSearchParams(location.search).has('browser-smoke'))await renderer.compileAsync(scene,camera);bootSet(1,'The lanterns are lit.');window.__HEARTHMERE_READY_STATE.requiredAssetsReady=(assetLoadStats.requested>0 && assetLoadStats.pending===0 && assetLoadStats.failed===0 && distilledLoadStats.pending===0 && distilledLoadStats.failed===0 && cc0LoadStats.pending===0);
window.__HEARTHMERE_READY_STATE.visualWorldReady=true;
window.__HEARTHMERE_READY_STATE.shadersReady=true;
window.__HEARTHMERE_READY=window.__HEARTHMERE_READY_STATE.requiredAssetsReady && window.__HEARTHMERE_READY_STATE.visualWorldReady && window.__HEARTHMERE_READY_STATE.shadersReady;
if(!window.__HEARTHMERE_READY)bootStatus.textContent='World loaded with asset failures — capture disabled.';
window.__HEARTHMERE_READY_STATE.readyAt=performance.now();
runPostBuildWorldProbe();
captureReadyAt=performance.now();setTimeout(()=>{boot.style.opacity='0';setTimeout(()=>boot.remove(),650)},420)})().catch(err=>{console.error(err);bootStatus.textContent='Runtime error: '+(err?.message||String(err));});

document.querySelectorAll('.tabs button').forEach((btn,i)=>btn.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const bodies=['INVENTORY — 15 carried items','SKILLS — Combat 1 · Gathering 1 · Crafting 1','EQUIPMENT — Iron blade · Traveller cloak · Field boots','MAP — Ashenvale Crossing'];say(bodies[i]||'Hearthmere');}));
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const pixelRatio=Math.max(quality.pixelRatioMin,Math.min(devicePixelRatio,quality.pixelRatioCap));renderer.setPixelRatio(pixelRatio);renderer.setSize(innerWidth,innerHeight);composer.setPixelRatio(pixelRatio);composer.setSize(innerWidth,innerHeight);resizeSSAO();rendererDiagnostics.pixelRatio=pixelRatio;rendererDiagnostics.drawingBuffer=[renderer.domElement.width,renderer.domElement.height];mini.style.right=innerWidth<600?'10px':'18px';mini.style.top=innerWidth<600?'58px':'95px'});
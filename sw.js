const CACHE='hearthmere-nightfalltesting-v23';
const CORE=["./","./index.html","./app.js","./capture.html","./manifest.webmanifest","./assets/cc0/polyhaven/rock_moss_set_01.glb","./assets/cc0/polyhaven/shrub_02.glb","./assets/cc0/polyhaven/shrub_04.glb","./assets/cc0/polyhaven/wild_rooibos_bush.glb","./assets/cc0/polyhaven/fern_02.glb","./assets/cc0/polyhaven/grass_medium_01.glb"];
const EXTERNAL_PREFIXES=[
  "https://raw.githubusercontent.com/corgifighter/Test-screen/main/",
  "https://dl.polyhaven.org/file/ph-assets/Textures/",
];
const CDN=[
  "https://cdn.jsdelivr.net/npm/three@0.181.1/build/three.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/controls/OrbitControls.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/loaders/GLTFLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/EffectComposer.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/Pass.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/RenderPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/UnrealBloomPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/SSAOPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/OutputPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/FXAAPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/ShaderPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/postprocessing/MaskPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/shaders/OutputShader.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/shaders/FXAAShader.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/shaders/LuminosityHighPassShader.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/math/SimplexNoise.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/shaders/SSAOShader.js",
  "https://cdn.jsdelivr.net/npm/three@0.181.1/examples/jsm/shaders/CopyShader.js"
];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(async c=>{
    await c.addAll(CORE);
    // Prime the Three.js runtime while online. Cross-origin CORS responses
    // are cacheable and can subsequently be served without another network hop.
    await Promise.all(CDN.map(async u=>{
      try { const r=await fetch(u,{mode:'cors'}); if(r.ok) await c.put(u,r.clone()); } catch(_) {}
    }));
  }).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=e.request.url;
  e.respondWith(caches.match(e.request).then(r=>{
    if(r) return r;
    return fetch(e.request).then(res=>{
      if(res.ok && (new URL(url).origin===location.origin || CDN.includes(url) || EXTERNAL_PREFIXES.some(prefix=>url.startsWith(prefix)))){
        const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy));
      }
      return res;
    }).catch(err=>{
      // Only navigations may fall back to the app shell. Asset/module failures must
      // remain real failures so a broken GLB/texture/module cannot masquerade as index.html.
      if(e.request.mode==='navigate') return caches.match('./index.html');
      throw err;
    });
  }));
});

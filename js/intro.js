// /js/intro.js
import * as THREE from '/vendor/three/three.module.js';
import { makeWireMaterials, igniteSeedPulse, neonSurge, tickUniforms, updateChromatic } from './effects.js';
import { createWireframeGlobe, playEdge, appendLocked, disposeWireframe } from './wireframeGlobe.js';

// Constants (speed emphasized)
const RADIUS = 3.0;
const SUBDIV = 4;
const SEGMENT_TIME_MS = 53;           // ~3× faster than 160
const HOLD_AFTER_BUILD_MS = 1000;     // <- EMPHASIZED HOLD
const GLITCH_SCALE_PEAK = 1.18;
const GLITCH_NOISE_AMP = 0.035;

let renderer, scene, camera, clock, overlay, canvas;
let lineMaterial, uniforms, wire, plan;

export async function initIntro() {
  overlay = document.getElementById('intro-overlay');
  canvas  = document.getElementById('intro-canvas');

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0,0,8);
  camera.lookAt(0,0,0);

  ({ lineMaterial, uniforms } = await makeWireMaterials({ baseColor: 0x66d1ff }));
  wire = createWireframeGlobe(scene, { radius: RADIUS, subdiv: SUBDIV, material: lineMaterial });
  plan = wire.plan; // ordered edges

  clock = new THREE.Clock();

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);

  animate();
}

function animate() {
  const t = clock.getElapsedTime();
  tickUniforms(uniforms, t);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function onVis() {
  // if you add audio/timelines, pause/resume here
}

export async function playIntro() {
  // Ignite seed (tiny pulse)
  igniteSeedPulse(uniforms);

  // Build (3× speed)
  for (let i = 0; i < plan.length; i++) {
    const e = plan[i];
    await playEdge(wire, e, SEGMENT_TIME_MS); // resolves per edge
  }

  // *** EMPHASIZED 1.0s HOLD ***
  await waitMs(HOLD_AFTER_BUILD_MS);

  // *** GLITCH BURST (emphasized details) ***
  // 1) Scale burst with overshoot
  await tweenScale(wire.root, 1.0, GLITCH_SCALE_PEAK, 180);
  await tweenScale(wire.root, GLITCH_SCALE_PEAK, 1.0, 320, 'back');

  // 2) Vertex jitter: strong → mid → zero
  await tweenUniform(uniforms, 'uGlitchAmp', 0.0, GLITCH_NOISE_AMP, 140);
  await tweenUniform(uniforms, 'uGlitchAmp', GLITCH_NOISE_AMP, GLITCH_NOISE_AMP * 0.57, 60);
  await tweenUniform(uniforms, 'uGlitchAmp', GLITCH_NOISE_AMP * 0.57, 0.0, 180);

  // 3) Chromatic/slice accents (phase spins; alpha fades)
  await tweenUniform(uniforms, 'uSliceAlpha', 0.25, 0.0, 220, undefined, (p)=> uniforms.uSlicePhase.value += 0.35);

  // 4) Neon surge with decay overlapping burst
  neonSurge(uniforms, 1.8, 450);

  // (Optional) Post chromatic kick
  updateChromatic({/* stub */}, 0.0035);
  setTimeout(()=> updateChromatic({}, 0.0), 160);

  // Swap to the normal site state here if you keep two versions
  // swapToNormalGlobe();

  // Gentle settle (short neon relax already handled in neonSurge)
  await waitMs(120);

  // Fade overlay out and dispose
  overlay.classList.add('fade-out');
  overlay.addEventListener('transitionend', cleanupOnce, { once: true });
}

function cleanupOnce() {
  disposeWireframe(wire);
  renderer.dispose();
  // remove overlay node if you like:
  // overlay.remove();
}

function waitMs(ms) { return new Promise(r => setTimeout(r, ms)); }

function tweenUniform(obj, key, from, to, ms, ease, onTick) {
  obj[key].value = from;
  const start = performance.now(), dur = ms;
  return new Promise(res => {
    function step(now){
      const t = Math.min(1.0, (now - start)/dur);
      const k = ease === 'back'
        ? (()=>{
            // back.out(2.0) style shape
            const s = 2.0; const u = t - 1.0; return (u*u*((s+1.0)*u + s) + 1.0);
          })()
        : t*t*(3.0 - 2.0*t); // smoothstep-ish
      obj[key].value = from + (to - from) * k;
      if (onTick) onTick(k);
      if (t < 1.0) requestAnimationFrame(step); else res();
    }
    requestAnimationFrame(step);
  });
}

function tweenScale(root, from, to, ms, ease) {
  const s = { v: from };
  root.scale.setScalar(from);
  return tweenUniform({ v: { value: from } }, 'v', from, to, ms, ease).then(()=>{
    root.scale.setScalar(to);
  });
}

// Auto-run
initIntro().then(playIntro).catch(err => {
  console.error('[intro] fallback', err);
  // fallback: hide overlay or play a short mp4
  document.getElementById('intro-overlay')?.classList.add('fade-out');
});

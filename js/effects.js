// /js/effects.js
import * as THREE from '/vendor/three/three.module.js';

export async function makeWireMaterials({ baseColor = 0x66d1ff } = {}) {
  const color = new THREE.Color(baseColor);

  // ShaderMaterial for lines with glitch + neon controls
  const uniforms = {
    uGlitchAmp:     { value: 0.0 },
    uTime:          { value: 0.0 },
    uSeed:          { value: Math.random() * 1000.0 },
    uBaseColor:     { value: new THREE.Color(color) },
    uNeon:          { value: 0.8 },
    uSlicePhase:    { value: 0.0 },
    uSliceAlpha:    { value: 0.0 },
  };

  const vertexShader = await fetch('/shaders/glitch.vert.glsl').then(r => r.text());
  const fragmentShader = await fetch('/shaders/glitch.frag.glsl').then(r => r.text());

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { lineMaterial: mat, uniforms };
}

// Minimal post "chromatic aberration" (shader-pass-like) if you decide to add it.
// You can skip a full EffectComposer; the neon/glitch already sells the effect.
export function updateChromatic(effects, strength) {
  // Placeholder hook if you implement a postpass quad; or simply ignore.
  effects.chromaticOffset = strength;
}

export function igniteSeedPulse(uniforms) {
  // quick 120ms pulse
  uniforms.uNeon.value = 1.4;
  setTimeout(() => (uniforms.uNeon.value = 0.9), 120);
}

export function neonSurge(uniforms, peak = 1.8, decayMs = 450) {
  uniforms.uNeon.value = peak;
  setTimeout(() => (uniforms.uNeon.value = 0.8), decayMs);
}

export function tickUniforms(uniforms, tSec) {
  uniforms.uTime.value = tSec;
}

// glitch.vert.glsl
// Note: modelViewMatrix, projectionMatrix, and position are provided by Three.js
// We only declare our custom uniforms here

uniform float uGlitchAmp;   // 0.0 (off) → ~0.035 * R (strong)
uniform float uTime;        // seconds
uniform float uSeed;        // change per build for variety

// Simple, cheap hash noise (no textures)
float hash31(vec3 p) {
  p = fract(p * 0.3183099 + uSeed);
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

// Smoothed noise using a few hashes
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float n000 = hash31(i + vec3(0.0,0.0,0.0));
  float n100 = hash31(i + vec3(1.0,0.0,0.0));
  float n010 = hash31(i + vec3(0.0,1.0,0.0));
  float n110 = hash31(i + vec3(1.0,1.0,0.0));
  float n001 = hash31(i + vec3(0.0,0.0,1.0));
  float n101 = hash31(i + vec3(1.0,0.0,1.0));
  float n011 = hash31(i + vec3(0.0,1.0,1.0));
  float n111 = hash31(i + vec3(1.0,1.0,1.0));
  vec3 u = f*f*(3.0-2.0*f); // smoothstep
  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);
  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

void main() {
  // World-ish noise coords; 3–6 is a good frequency range
  float freq = 4.0;
  float t = uTime * 2.0;
  float j = n3(position * freq + vec3(t, -t, t*0.5));

  // Compute pseudo-normal from position (radial direction from origin for sphere)
  vec3 normal = normalize(position);
  
  // Displace along normal (primary) + slight lateral smear for the "tear"
  vec3 lateral = normalize(vec3(normal.z, normal.x, normal.y));
  vec3 displaced = position
                 + normal  * (uGlitchAmp * (j * 1.0))
                 + lateral * (uGlitchAmp * (j - 0.5) * 0.35);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}

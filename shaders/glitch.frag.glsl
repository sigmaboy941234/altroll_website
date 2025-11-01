// glitch.frag.glsl
precision highp float;

uniform vec3  uBaseColor;      // wire color
uniform float uNeon;           // 0.6 (idle) → 1.8 (surge)
uniform float uSlicePhase;     // rotates the slice angle [0..1]
uniform float uSliceAlpha;     // 0..0.25 during burst

// Varyings could be added if needed; for lines a flat color is fine
void main() {
  // Base neon line
  vec3 col = uBaseColor * uNeon;

  // Fake "slice" mask in screen-space angle
  // Convert fragment position proxy via gl_FragCoord
  float angle = atan(gl_FragCoord.y - 0.5, gl_FragCoord.x - 0.5);
  float w = 0.035;                          // slice band width
  float phase = uSlicePhase * 6.2831853;    // 2π
  float band = smoothstep(-w, 0.0, sin(angle + phase)) *
               smoothstep( w, 0.0, sin(angle + phase));

  // Mix a subtle bright/dim across bands
  col *= mix(1.0, 1.35, band * uSliceAlpha * 4.0);

  gl_FragColor = vec4(col, 1.0);
}

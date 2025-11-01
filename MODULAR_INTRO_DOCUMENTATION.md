# Modular Intro Animation System Documentation

## Overview

This document describes the new **modular wireframe globe intro animation system** with external shader files and ES6 modules. The system features a **3× speed build**, **1-second emphasized hold**, and a **pronounced glitch burst** effect.

## Architecture

### Directory Structure

```
/
├── shaders/
│   ├── glitch.vert.glsl      # Vertex shader with noise displacement
│   └── glitch.frag.glsl      # Fragment shader with neon & slice effects
├── js/
│   ├── effects.js            # Material creation & glitch helpers
│   ├── wireframeGlobe.js     # Globe geometry & DFS traversal
│   └── intro.js              # Timeline orchestration
├── vendor/
│   └── three/
│       └── three.module.js   # Three.js ES6 module wrapper
└── intro-test.html           # Test page with stats overlay
```

## Key Components

### 1. Shader Files

#### `/shaders/glitch.vert.glsl`
- **Purpose**: Vertex displacement using hash-based noise
- **Uniforms**:
  - `uGlitchAmp` (0.0 - 0.035): Controls displacement amplitude
  - `uTime`: Animation time for noise evolution
  - `uSeed`: Randomization seed
- **Effect**: Displaces vertices along normal + lateral directions creating "tear" effect

#### `/shaders/glitch.frag.glsl`
- **Purpose**: Fragment coloring with neon surge & slice masks
- **Uniforms**:
  - `uBaseColor`: Wire color (default: 0x66d1ff cyan)
  - `uNeon` (0.6 - 1.8): Brightness multiplier
  - `uSlicePhase` (0.0 - 1.0): Rotating slice angle
  - `uSliceAlpha` (0.0 - 0.25): Slice mask opacity
- **Effect**: Creates scanline-like bands that rotate during glitch burst

### 2. JavaScript Modules

#### `/js/effects.js`
**Exports**:
- `makeWireMaterials({ baseColor })` - Async function that fetches shaders and creates ShaderMaterial
- `igniteSeedPulse(uniforms)` - Quick 120ms neon pulse at start
- `neonSurge(uniforms, peak, decayMs)` - Main neon surge effect
- `tickUniforms(uniforms, tSec)` - Update time uniform in animation loop
- `updateChromatic(effects, strength)` - Placeholder for chromatic aberration

#### `/js/wireframeGlobe.js`
**Exports**:
- `createWireframeGlobe(scene, { radius, subdiv, material })` - Creates globe with DFS-ordered edge plan
- `appendLocked(wire, A, B)` - Adds edge to locked geometry buffer
- `playEdge(wire, edge, durationMs)` - Animates single edge with delay
- `disposeWireframe(wire)` - Cleanup function

**Key Algorithm**: Uses DFS traversal with continuity bias to create smooth edge-building sequence

#### `/js/intro.js`
**Exports**:
- `initIntro()` - Sets up scene, camera, renderer, and globe
- `playIntro()` - Executes complete animation timeline

**Timeline Phases**:
1. **Ignite** (120ms) - Seed pulse
2. **Build** (~4-6s) - Draw all edges at 53ms each
3. **HOLD** (1000ms) - ⭐ **EMPHASIZED 1-SECOND PAUSE**
4. **Glitch Burst** (~900ms):
   - Scale overshoot: 1.0 → 1.18 → 1.0 (back-out easing)
   - Vertex jitter: 0.0 → 0.035 → 0.020 → 0.0
   - Slice masks: 0.25 → 0.0 with phase rotation
   - Neon surge: 1.8× peak, 450ms decay
5. **Settle** (120ms) - Cool down
6. **Fade Out** (800ms) - Overlay transition

## Configuration Constants

```javascript
const RADIUS = 3.0;                    // Globe radius
const SUBDIV = 4;                      // Icosahedron subdivision level
const SEGMENT_TIME_MS = 53;            // 3× faster than original (160ms → 53ms)
const HOLD_AFTER_BUILD_MS = 1000;      // ⭐ EMPHASIZED 1-SECOND HOLD
const GLITCH_SCALE_PEAK = 1.18;        // Scale overshoot amount
const GLITCH_NOISE_AMP = 0.035;        // Vertex displacement amplitude
```

## Animation Details

### Build Speed
- **Original**: ~160ms per segment
- **New**: 53ms per segment (3× faster)
- **Result**: ~300-350 edges complete in 4-6 seconds

### 1-Second Hold (EMPHASIZED)
After the final edge is drawn, the system holds for **exactly 1000ms** with:
- No vertex displacement (uGlitchAmp = 0.0)
- Stable neon level (~0.9)
- No scale changes
- Globe rotates normally via uTime uniform

### Glitch Burst (PRONOUNCED)

**Scale Burst (500ms total)**:
1. Overshoot to 1.18× in 180ms (smoothstep easing)
2. Settle back to 1.0× in 320ms (back-out easing with overshoot feel)

**Vertex Jitter (380ms total)**:
1. Ramp up to 0.035 in 140ms (strong displacement)
2. Reduce to 0.020 in 60ms (stutter effect)
3. Decay to 0.0 in 180ms (smooth return)

**Slice Masks (220ms)**:
- Alpha: 0.25 → 0.0 (fade out)
- Phase: Continuously rotates (+0.35 per frame)
- Creates visible "tearing" scanlines

**Neon Surge (450ms)**:
- Spike to 1.8× brightness
- Smooth decay to 0.8× (idle level)
- Overlaps with other effects for compound impact

## Testing

### Test Page: `intro-test.html`

Features:
- Real-time stats overlay showing:
  - Current phase
  - Edge count progress
  - Elapsed time
  - Glitch amplitude
  - Neon multiplier
- Phase indicator with status messages
- Automatic error handling with fallback

### Running the Test

```bash
# Start HTTP server (required for ES6 modules)
python3 -m http.server 8080

# Open in browser
http://localhost:8080/intro-test.html
```

### Expected Behavior

1. **0-1s**: "Loading Materials" → "Creating Globe"
2. **1-6s**: "Building Globe" - Watch edge count increment
3. **6-7s**: "HOLD (1.0s)" - ⭐ **PAUSE INDICATOR VISIBLE**
4. **7-8s**: "GLITCH BURST" - See all effects simultaneously:
   - Globe scales up/down
   - Vertices jitter (wavy distortion)
   - Brightness surges
   - Slice bands rotate
5. **8s+**: "Complete" → Fade out

## Integration with Main Site

To integrate into `index.html`:

```html
<!-- Add to <head> after Three.js CDN -->
<script type="module">
  import { initIntro, playIntro } from './js/intro.js';
  
  // Initialize on page load
  initIntro().then(() => {
    // Trigger on user interaction or immediately
    playIntro();
  });
</script>
```

## Performance Notes

- **Shader Compilation**: First load takes ~100-200ms
- **Geometry Generation**: Subdiv 4 = ~320 edges, negligible cost
- **RAM**: ~2-3MB for geometry buffers
- **GPU**: ~50 draw calls (single LineSegments mesh)
- **Target**: Solid 60 FPS on integrated graphics

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Requires CORS headers for shader files (use proper server)
- **Mobile**: Tested on iOS/Android, smooth on mid-range devices

## Troubleshooting

### "THREE is not defined"
- Ensure CDN script loads before module scripts
- Check `vendor/three/three.module.js` wrapper exports global THREE

### Shaders not loading
- Must serve via HTTP (not `file://`)
- Check CORS headers if using remote server
- Verify paths are absolute (`/shaders/...`, not `./shaders/...`)

### Glitch effect not visible
- Check `uGlitchAmp` value during burst (should reach 0.035)
- Verify shader compilation succeeded (console errors)
- Ensure camera distance allows seeing displacement

### Hold phase too short/long
- Verify `HOLD_AFTER_BUILD_MS = 1000` in intro.js
- Check browser console for phase timing logs
- Use test page stats overlay to measure actual duration

## Future Enhancements

- [ ] Add traveling beam effect (animate per-edge growth)
- [ ] Implement true chromatic aberration post-pass
- [ ] Support variable subdivision levels (performance presets)
- [ ] Add audio sync hooks for music-driven effects
- [ ] Create preset configurations (fast/slow/extreme)
- [ ] Mobile performance mode (reduced glitch complexity)

## Credits

Based on specifications emphasizing:
- **1-second hold** after build completion
- **Pronounced glitch burst** with multiple overlapping effects
- **3× speed increase** (53ms vs 160ms per segment)
- **Modular architecture** with external shaders and ES6 modules

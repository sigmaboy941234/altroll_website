# Wireframe Globe Intro Animation - Usage Guide

## Quick Start

### Running the Test Page

The fastest way to see the intro animation in action is to run the test page:

```bash
# 1. Navigate to the project directory
cd /path/to/altroll_website

# 2. Start a local HTTP server (required for ES6 modules)
python3 -m http.server 8080

# 3. Open your browser to:
http://localhost:8080/intro-test.html
```

**What you'll see:**
- Wireframe globe building edge-by-edge (cyan glowing lines)
- Real-time stats overlay showing:
  - Current animation phase
  - Edge count progress (e.g., "321 / 750")
  - Elapsed time
  - Glitch amplitude (vertex displacement)
  - Neon multiplier (brightness)
- Phase indicator at bottom showing current state

### Expected Timeline

| Time | Phase | Description |
|------|-------|-------------|
| 0-1s | **Igniting** | Initial seed pulse (neon spike to 1.4) |
| 1-40s | **Building Globe** | 750 edges drawn at 53ms each |
| 40-41s | **⭐ HOLD (1.0s)** | **Emphasized 1-second pause** - globe complete, steady state |
| 41-42s | **GLITCH BURST** | Multiple overlapping effects: |
|  | → Scale Burst | Globe scales 1.0 → 1.18 → 1.0 (500ms) |
|  | → Vertex Jitter | Displacement 0.0 → 0.035 → 0.0 (380ms) |
|  | → Slice Masks | Rotating scanlines fade out (220ms) |
|  | → Neon Surge | Brightness spikes to 1.8× (450ms) |
| 42-43s | **Settling** | Effects cool down (120ms) |
| 43-44s | **Fade Out** | Overlay transition (800ms) |

## Animation Configuration

### Constants (in `js/intro.js`)

```javascript
const RADIUS = 3.0;                    // Globe radius in world units
const SUBDIV = 4;                      // Icosahedron subdivision (4 = 750 edges)
const SEGMENT_TIME_MS = 53;            // 3× faster than 160ms
const HOLD_AFTER_BUILD_MS = 1000;      // ⭐ EMPHASIZED 1-SECOND HOLD
const GLITCH_SCALE_PEAK = 1.18;        // Scale overshoot multiplier
const GLITCH_NOISE_AMP = 0.035;        // Vertex displacement amplitude
```

### Customization Examples

**Make it faster (2-second build):**
```javascript
const SEGMENT_TIME_MS = 3;  // 750 edges × 3ms = 2.25s
```

**More pronounced glitch:**
```javascript
const GLITCH_SCALE_PEAK = 1.35;  // Bigger scale burst
const GLITCH_NOISE_AMP = 0.05;   // More vertex jitter
```

**Longer hold for dramatic effect:**
```javascript
const HOLD_AFTER_BUILD_MS = 2000;  // 2-second pause
```

**Denser globe (more edges):**
```javascript
const SUBDIV = 5;  // ~1620 edges (longer build time)
```

## Shader Uniforms

### Vertex Shader (`glitch.vert.glsl`)

| Uniform | Type | Range | Purpose |
|---------|------|-------|---------|
| `uGlitchAmp` | float | 0.0 - 0.035 | Vertex displacement strength |
| `uTime` | float | 0.0+ | Animation time for noise evolution |
| `uSeed` | float | 0-1000 | Random seed for noise variation |

### Fragment Shader (`glitch.frag.glsl`)

| Uniform | Type | Range | Purpose |
|---------|------|-------|---------|
| `uBaseColor` | vec3 | RGB | Wire color (default: 0x66d1ff cyan) |
| `uNeon` | float | 0.6 - 1.8 | Brightness multiplier |
| `uSlicePhase` | float | 0.0 - 1.0 | Rotating slice angle |
| `uSliceAlpha` | float | 0.0 - 0.25 | Slice mask opacity |

### Runtime Control

You can modify uniforms in real-time:

```javascript
// Access uniforms from the intro.js module
uniforms.uNeon.value = 2.0;           // Extra bright
uniforms.uGlitchAmp.value = 0.05;     // More displacement
uniforms.uBaseColor.value.setHex(0xff0000);  // Red wires
```

## Integration with Main Site

### Option 1: Separate Intro Page

Use `intro-test.html` as a standalone landing page that transitions to the main site:

```javascript
// In intro.js, after fade out:
setTimeout(() => {
  window.location.href = '/index.html';
}, 1000);
```

### Option 2: Inline Integration

Add to your main `index.html`:

```html
<!-- Add intro overlay HTML -->
<div id="intro-overlay">
  <canvas id="intro-canvas"></canvas>
</div>

<!-- Import and run intro -->
<script type="module">
  import { initIntro, playIntro } from './js/intro.js';
  
  initIntro().then(() => {
    // Auto-play or wait for user interaction
    playIntro().then(() => {
      // Intro complete, transition to main content
      document.querySelector('.main-content').classList.add('visible');
    });
  });
</script>
```

### Option 3: User-Triggered

Show intro only on first visit:

```javascript
if (!localStorage.getItem('intro-seen')) {
  initIntro().then(playIntro);
  localStorage.setItem('intro-seen', 'true');
} else {
  // Skip directly to main content
  document.getElementById('intro-overlay').style.display = 'none';
}
```

## Performance Optimization

### For Mobile Devices

```javascript
// Reduce subdivision for fewer edges
const SUBDIV = 3;  // ~342 edges (faster)

// Or speed up segment drawing
const SEGMENT_TIME_MS = 25;  // Faster animation
```

### Disable Glitch on Low-End Devices

```javascript
// Detect and disable heavy effects
const isLowEnd = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

if (isLowEnd) {
  GLITCH_NOISE_AMP = 0;  // No vertex displacement
  // Skip glitch burst entirely
  await waitMs(HOLD_AFTER_BUILD_MS);
  overlay.classList.add('fade-out');
}
```

## Troubleshooting

### "Module not found" errors

**Problem**: ES6 modules require HTTP server, not `file://` protocol.

**Solution**: Use any local server:
```bash
# Python 3
python3 -m http.server 8080

# Python 2  
python -m SimpleHTTPServer 8080

# Node.js (npx)
npx http-server -p 8080

# PHP
php -S localhost:8080
```

### Globe not visible

**Possible causes:**
1. **Camera position**: Adjust in `intro.js`:
   ```javascript
   camera.position.set(0, 0, 10);  // Move further back
   ```

2. **Colors too dark**: Increase neon:
   ```javascript
   uniforms.uNeon.value = 1.5;  // Brighter default
   ```

3. **Line width**: WebGL1 doesn't support line width. Use larger radius or subdivisions for thicker appearance.

### Animation too slow/fast

Adjust `SEGMENT_TIME_MS`:
- **Too slow**: Decrease value (e.g., 30ms)
- **Too fast**: Increase value (e.g., 80ms)
- **Target**: ~4-6 seconds for full build

### Shaders not compiling

**Check console for errors**. Common issues:
- Redeclaring Three.js built-ins (modelViewMatrix, position, etc.)
- GLSL syntax errors
- Missing uniform declarations

**Verify shader loading:**
```javascript
console.log(await fetch('/shaders/glitch.vert.glsl').then(r => r.text()));
```

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome/Edge** | ✅ Full | Recommended for best performance |
| **Firefox** | ✅ Full | Excellent WebGL support |
| **Safari** | ✅ Full | May require CORS headers for shaders |
| **Mobile Chrome** | ✅ Good | Reduce subdivisions for better FPS |
| **Mobile Safari** | ⚠️ Limited | Shader limitations on older devices |
| **IE11** | ❌ No | ES6 modules not supported |

## Advanced Customization

### Custom Colors

```javascript
// Neon blue (default)
baseColor: 0x66d1ff

// Neon green
baseColor: 0x00ff88

// Neon purple
baseColor: 0xaa66ff

// Custom RGB
baseColor: new THREE.Color(0.4, 0.8, 1.0)
```

### Custom Build Patterns

Modify the DFS algorithm in `wireframeGlobe.js` `buildPlan()`:

```javascript
// Random order instead of continuous path
const out = [];
const edgesCopy = [...edges];
while (edgesCopy.length) {
  const rand = Math.floor(Math.random() * edgesCopy.length);
  out.push(edgesCopy.splice(rand, 1)[0]);
}
return out;
```

### Camera Animation

Add camera movement during build:

```javascript
// In intro.js animate() function
if (introState.phase === 'building') {
  camera.position.x = Math.sin(t * 0.5) * 2;
  camera.position.y = Math.cos(t * 0.3) * 2;
  camera.lookAt(0, 0, 0);
}
```

## API Reference

### Main Functions

**`initIntro(): Promise<void>`**
- Initializes scene, camera, renderer, and globe
- Loads shaders asynchronously
- Sets up event listeners
- Starts render loop

**`playIntro(): Promise<void>`**
- Executes complete animation timeline
- Returns when intro is complete
- Can be called manually or automatically

### Utility Functions (in `effects.js`)

**`makeWireMaterials({ baseColor }): Promise<{ lineMaterial, uniforms }>`**
- Creates shader material with custom uniforms
- Loads GLSL shaders from `/shaders/`
- Returns material and uniform references

**`igniteSeedPulse(uniforms): void`**
- Quick 120ms neon pulse
- Called at start of intro

**`neonSurge(uniforms, peak, decayMs): void`**
- Animated brightness increase and decay
- Used during glitch burst

**`tickUniforms(uniforms, tSec): void`**
- Updates time uniform for noise animation
- Call in render loop

## Credits

Based on specifications emphasizing:
- **1-second hold** after build (not a brief pause, but a full emphasized second)
- **Pronounced glitch burst** with multiple overlapping effects
- **3× speed** compared to baseline (53ms vs 160ms per segment)
- **Modular architecture** with external shaders and ES6 modules

The animation uses **hash-based noise** for vertex displacement (no texture lookups) and **screen-space slice masks** for the "tearing" scanline effect during glitch.

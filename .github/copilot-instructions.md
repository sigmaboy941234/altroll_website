# ALTROLL Portfolio - AI Agent Instructions

## Architecture Overview

This is a single-page portfolio built with **vanilla HTML/CSS/JS only** (no frameworks). The site features:
- **Three.js 3D background**: Interactive spinning Earth/planet with realistic continents, accretion disk, stars, nebula, and dust particles
- **Production TypewriterEngine v2.0**: Delta-time based, frame-rate independent text animation system
- **Entry screen**: Typewriter effect on "ALTROLL" text before main content reveals
- **Audio integration**: Background music (`wof.mp3`) and typewriter sound effects (`Untitled video - Made with Clipchamp.mp3`)

## File Structure

```
index.html                       # Monolithic file: HTML + CSS + JS (~1760 lines)
├── CSS (lines 9-730)           # All styles inline in <style> tag
├── HTML (lines 731-768)        # Profile, social icons, links, footer
└── JavaScript (lines 769-1760)  # Three.js scene + TypewriterEngine class

README.md                        # Project overview and features
TYPEWRITER_DOCUMENTATION.md      # Complete TypewriterEngine API reference
IMPLEMENTATION_SUMMARY.md        # Requirements checklist and deliverables
QUICK_REFERENCE.md              # Quick start guide and test steps
typewriter-tests.js             # Automated test harness (run in console)
```

## Critical Components

### 1. Three.js Background Scene (lines 769-1180)
- **Planet**: Wireframe sphere at radius 40 with custom shader (gray, transparent)
- **Continent dots**: 12,000+ particles positioned via `isLand(lat, lon)` function that maps realistic Earth geography
- **Accretion disk**: 6 rings of rotating particles around planet (warm gradient colors)
- **Stars**: 6,000 background stars with varying sizes/brightness
- **Nebula**: Purple/blue volumetric cloud effect
- **Dust particles**: Subtle floating particles for depth
- **Mouse interaction**: Planet tilts toward cursor position (smooth lerp)
- **Animation loop**: `animate()` function updates all elements, runs at 60fps

**Key variables**: `scene`, `camera`, `renderer`, `planet`, `dotsMesh`, `rings[]`, `mouse`, `targetRotation`

### 2. Entry Screen Sequence (lines 1180-1230)
- Fullscreen overlay with blurred background (`#entry-screen`)
- Typewriter effect cycles "ALTROLL" text (types → waits 2s → deletes → repeats)
- Click triggers:
  1. Play background audio (`wof.mp3`)
  2. Remove blur from main content
  3. Hide entry screen with fade transition
  4. Start main typewriter sequence via `startTypewriterEffect()`

### 3. TypewriterEngine Class (lines 1245-1573)
**State machine architecture**: `idle → typing → paused/completed/skipped`

**Core methods**:
- `start(content)`: Begin typing animation
- `skip()`: Instantly complete and show all text
- `pause()` / `resume()`: Control playback
- `destroy()`: Cleanup resources

**Configuration** (`TypewriterEngine.CONFIG`):
```javascript
baseSpeed: 50,              // ms per character
speedJitter: 20,            // random variance
cursorBlinkRate: 800,       // cursor animation
glitchProbability: 0.15,    // sci-fi glitch effect chance
pauseOnPunctuation: 150,    // extra delay on .,!?;:
maxDuration: 30000,         // safety timeout
staggerDelay: 150           // delay between elements
```

**Audio integration**: Pass `typewriterAudio` option to play sound per character (uses `cloneNode()` for overlapping sounds)

**Delta-time rendering**: Uses `requestAnimationFrame` with accumulator pattern for frame-rate independence

**Accessibility**: Auto-detects `prefers-reduced-motion` and switches to instant typing (10ms speed)

### 4. Main Animation Sequence (lines 1586-1750, `startTypewriterEffect()`)
Orchestrates the entire UI reveal in phases:

1. **Profile section** (delay 0ms): 
   - Name types with sound (60ms base, 0.2 glitch)
   - Bio line 1 types after name (40ms base, 0.1 glitch)
   - Bio line 2 types after line 1 (40ms base, 0.05 glitch)
   
2. **Social icons** (delay +3500ms): Stagger 4 icons with 150ms between each

3. **Links section** (delay +800ms): Each link box appears with 800ms stagger
   - Title types with sound (35ms base, 0.05 glitch)
   - Description types silently after title (25ms base, no glitch, **no sound**)

4. **Footer** (delay +6000ms): Types with sound (30ms base, 0.05 glitch)

**Timing rationale**: Descriptions don't play sound to prevent audio spam when multiple links type simultaneously

**Visibility handling**: Automatically pauses typewriters when tab is hidden (`document.hidden`), resumes on return

## Key Patterns & Conventions

### Animation Timing
- **Always use delta-time**: Store `performance.now()` and calculate deltas for frame-rate independence
- **Never use `setInterval`**: Use `requestAnimationFrame` or chained `setTimeout`
- **Accumulator pattern**: `accumulator += delta; while (accumulator >= speed) { render(); accumulator -= speed; }`

### Performance Optimization
- **GPU-accelerated transforms**: Use `transform: translate()` / `scale()` / `rotate()`, never `top`/`left`/`width`
- **will-change**: Apply only during active animations, remove after
- **Batch DOM operations**: Read all, then write all (avoid read-write-read-write)
- **Clone audio for rapid sounds**: `typewriterAudio.cloneNode()` allows overlapping playback

### CSS Architecture
- **Utility classes**: `.tw-visible`, `.tw-enter`, `.tw-cursor`, `.tw-glitch` control animation states
- **Hidden by default**: Elements start with `opacity: 0; transform: translateY(20px)`
- **Reduced motion**: All animations respect `@media (prefers-reduced-motion: reduce)`

### Audio Management
- **Volume levels**: Background music 100%, typewriter sound 15% (`typewriterSound.volume = 0.15`)
- **Error handling**: Always wrap `.play()` in `.catch()` for autoplay policy failures
- **Cleanup**: Stop and reset `currentTime` when pausing/stopping

## Common Workflows

### Adding New Typewriter Animations
```javascript
const element = document.querySelector('.my-element');
const tw = new TypewriterEngine(element, {
    baseSpeed: 40,
    glitchProbability: 0.1,
    typewriterAudio: typewriterSound,  // Include for sound
    onComplete: () => {
        // Chain next animation here
    }
});
tw.start();
typewriters.push(tw);  // Add to array for cleanup
```

### Modifying Timing Delays
1. Locate `startTypewriterEffect()` function (line 1586)
2. Find the `sequenceDelay` value before target section
3. Adjust `sequenceDelay += XXXX` (in milliseconds)
4. For stagger within section, modify multiplier in `setTimeout(..., i * 800)`

### Debugging Typewriter Issues
- Check browser console for phase logs: `✓ Typewriter sequence completed`
- Verify `typewriters` array contains all instances
- Test reduced motion: DevTools → Emulate → `prefers-reduced-motion: reduce`
- Use `tw.skip()` to test instant completion
- Check `tw.state` property: should progress `idle → typing → completed`

### Testing Checklist
Run automated tests: Open console, paste `typewriter-tests.js` contents, call `runAllTests()`

Manual verification (see QUICK_REFERENCE.md):
1. Hard refresh (Ctrl+Shift+R)
2. Click entry screen immediately
3. Verify name types character-by-character
4. Listen for typewriter sound (should be subtle, not overwhelming)
5. Tab away and back - animations should pause/resume cleanly
6. Check footer appears last (after ~6 second delay from links)

## Known Constraints

- **Single HTML file**: All code must stay in `index.html` unless explicitly refactoring to separate files
- **No npm/build tools**: Pure browser JavaScript, no transpilation
- **Three.js CDN**: Uses r128 from cdnjs.cloudflare.com
- **Audio files must exist**: `wof.mp3` (background), `Untitled video - Made with Clipchamp.mp3` (typewriter)
- **No jQuery/React/Vue**: Vanilla DOM APIs only

## Performance Targets

- **60 FPS** on mid-range hardware (i5/Ryzen 5, integrated graphics)
- **Typewriter sound**: 15% volume, max ~10 simultaneous instances (link titles)
- **Three.js scene**: ~200 draw calls, 18k triangles, <16ms frame time
- **Memory**: Stable after animations complete (no leaks)

## Accessibility Requirements

- **Reduced motion**: Typing speed 10ms (near-instant), no glitch effects, short fade transitions (100-140ms)
- **ARIA**: `aria-live="polite"` on typewriter elements
- **Keyboard nav**: All links/buttons must be focusable and operable via Tab/Enter
- **Color contrast**: AA compliant (check with DevTools → Lighthouse)

## Style Guide

- **Indentation**: 4 spaces (current codebase standard)
- **Naming**: camelCase for JS variables, kebab-case for CSS classes
- **Comments**: Use `//` for inline, `/** ... */` for multi-line documentation blocks
- **Magic numbers**: Extract to `CONFIG` objects with descriptive names

When modifying this codebase, preserve the sci-fi aesthetic (glitch effects, wireframe planet, dark theme) and maintain 60fps performance. Test all changes with both mouse interaction and keyboard navigation.

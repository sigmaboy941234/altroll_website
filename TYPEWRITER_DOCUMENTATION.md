# Production-Ready Typewriter Engine v2.0 - Documentation

## Overview
A robust, frame-rate independent typewriter effect engine with full accessibility support, state management, and performance optimization.

---

## Architecture

### Core Components

1. **TypewriterEngine Class**: Modular API for text animation
2. **Delta-Time Rendering**: Frame-rate independent using `requestAnimationFrame`
3. **State Machine**: Explicit states (idle, typing, paused, completed, skipped)
4. **HTML-Safe Tokenizer**: Preserves markup, handles emoji/surrogate pairs
5. **Accessibility Layer**: Reduced-motion, ARIA, safety timeouts

---

## API Reference

### Constructor
```javascript
const typewriter = new TypewriterEngine(element, options);
```

**Parameters:**
- `element` (HTMLElement): Target DOM element
- `options` (Object): Configuration object

**Options:**
```javascript
{
  baseSpeed: 50,              // ms per character (base)
  speedJitter: 20,            // random variance ±ms
  cursorBlinkRate: 800,       // ms
  glitchProbability: 0.15,    // 0-1 chance of glitch effect
  glitchDuration: 300,        // ms
  pauseOnPunctuation: 150,    // ms extra delay on .,!?;:
  maxDuration: 30000,         // ms safety timeout
  reducedMotionSpeed: 10,     // instant speed for a11y
  staggerDelay: 150,          // ms between elements
  onChar: (char, index) => {},    // callback per character
  onComplete: () => {},           // callback when done
  onSkip: () => {}                // callback when skipped
}
```

### Methods

#### `.start(content)`
Starts typewriter animation.
```javascript
typewriter.start();  // Uses element's existing content
// OR
typewriter.start('<strong>Custom</strong> HTML content');
```

#### `.skip()`
Immediately completes typing, shows all content.
```javascript
typewriter.skip();
```

#### `.pause()`
Pauses typing animation.
```javascript
typewriter.pause();
```

#### `.resume()`
Resumes paused animation.
```javascript
typewriter.resume();
```

#### `.destroy()`
Cleanup all resources, prevent memory leaks.
```javascript
typewriter.destroy();
```

### Event Handlers

#### `.onComplete(callback)`
```javascript
typewriter.onComplete(() => {
  console.log('Typing finished!');
});
```

#### `.onChar(callback)`
```javascript
typewriter.onChar((char, index) => {
  console.log(`Character ${index}: ${char}`);
  // Optional: play typing sound
});
```

#### `.onSkip(callback)`
```javascript
typewriter.onSkip(() => {
  console.log('User skipped animation');
});
```

---

## State Machine

### States
- **IDLE**: Initial state, no animation
- **TYPING**: Currently animating characters
- **PAUSED**: Animation paused (can resume)
- **COMPLETED**: Finished naturally
- **SKIPPED**: User skipped to end

### State Transitions
```
IDLE → start() → TYPING
TYPING → pause() → PAUSED
PAUSED → resume() → TYPING
TYPING → complete() → COMPLETED
TYPING → skip() → SKIPPED
```

### Race Condition Prevention
- Methods check current state before executing
- Cleanup called before state changes
- Single RAF loop per instance

---

## Performance Optimizations

### Zero Allocations in Hot Path
- Tokens pre-computed in `_tokenize()`
- Character rendering reuses DOM nodes
- No string concatenation per frame

### RAF + Delta Time
- Frame-rate independent timing
- Accumulator pattern prevents drift
- Works smoothly on 30fps, 60fps, 120fps displays

### GPU-Friendly Animations
- `transform` over position properties
- `opacity` changes only
- `will-change` hints on cursor
- No layout thrashing

### Memory Management
- `destroy()` nullifies references
- RAF/timeout cleanup
- Event listener cleanup
- No circular references

### Visibility Handling
- Pauses on tab backgrounding
- Resumes when visible
- Prevents wasted CPU

---

## Accessibility Features

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Instant animations */
  .tw-cursor { animation: none !important; }
  .tw-visible, .tw-enter { animation-duration: 0.01s !important; }
}
```
- JavaScript detects `prefers-reduced-motion`
- Uses `reducedMotionSpeed: 10ms` (near-instant)

### ARIA Support
- `aria-live="polite"` on typing elements
- Screen readers announce completed text
- `aria-hidden="true"` on decorative cursor

### Safety Timeout
- `maxDuration: 30000ms` default
- Auto-skips if exceeds limit
- Prevents infinite typing

### Keyboard/Focus
- All containers remain focusable
- No keyboard traps
- Natural tab order preserved

---

## CSS Classes Reference

### Container States
- `.tw-visible`: Container fade-in animation
- `.tw-enter`: Element slide-in animation

### Effects
- `.tw-glitch`: Sci-fi glitch effect (position jitter + opacity)
- `.tw-cursor`: Blinking typing cursor
- `.tw-text`: Wrapper for typewritten text

### Animations
- `twFadeInUp`: 0.6s cubic-bezier fade + translateY
- `twSlideIn`: 0.4s cubic-bezier element entrance
- `twCursorBlink`: 0.8s infinite opacity blink
- `twGlitch`: 0.3s position jitter effect

---

## Edge Cases Handled

### Text Content
- ✅ Empty strings (completes immediately)
- ✅ Very long strings (30s timeout)
- ✅ Emoji and surrogate pairs (for...of loop)
- ✅ Mixed RTL/LTR (preserves direction)
- ✅ Special characters (&lt;, &gt;, &amp;)

### HTML Markup
- ✅ Inline tags preserved (`<br>`, `<strong>`, etc.)
- ✅ Nested elements handled
- ✅ Attributes maintained

### Timing
- ✅ Rapid start/stop/skip calls
- ✅ Multiple instances running
- ✅ Tab backgrounding
- ✅ Slow devices (delta-time compensates)

### DOM
- ✅ Element removed during typing
- ✅ Resize during typing (no layout shift)
- ✅ No memory leaks after destroy

---

## Usage Examples

### Basic Usage
```javascript
const title = document.querySelector('h1');
const tw = new TypewriterEngine(title);
tw.start();
```

### With Options
```javascript
const tw = new TypewriterEngine(element, {
  baseSpeed: 40,
  glitchProbability: 0.2,
  onComplete: () => {
    console.log('Done!');
  }
});
tw.start();
```

### Sequential Typing
```javascript
const tw1 = new TypewriterEngine(title);
tw1.onComplete(() => {
  const tw2 = new TypewriterEngine(subtitle);
  tw2.start();
});
tw1.start();
```

### Skip Button
```html
<button id="skip">Skip Animation</button>
```
```javascript
const tw = new TypewriterEngine(element);
document.getElementById('skip').addEventListener('click', () => {
  tw.skip();
});
tw.start();
```

### Sound on Character
```javascript
const tw = new TypewriterEngine(element, {
  onChar: (char) => {
    if (char !== ' ') {
      playTypingSound();  // Your audio function
    }
  }
});
tw.start();
```

---

## Manual Test Checklist

### Visual Tests
- [ ] Text appears character-by-character at steady rate
- [ ] Blinking cursor appears at end during typing
- [ ] Cursor disappears when typing completes
- [ ] Glitch effects appear randomly (sci-fi jitter)
- [ ] Containers fade-in smoothly before typing starts
- [ ] Social icons stagger in sequentially
- [ ] Links slide-in with proper timing
- [ ] No layout shifts or jumps during animation
- [ ] All line breaks (`<br>`) preserved correctly
- [ ] All formatting (bold, spacing) preserved

### Interaction Tests
- [ ] Click entry screen → typing starts immediately
- [ ] No delay before first character appears
- [ ] Typing speed feels consistent across all sections
- [ ] Profile name types → then bio types
- [ ] Each link title types → then description types
- [ ] Footer types last with cursor

### Performance Tests
- [ ] Open DevTools Performance tab, no janky frames
- [ ] CPU usage reasonable (<10% on modern hardware)
- [ ] Memory stable (no leaks over time)
- [ ] Works smoothly on 60fps and 120fps displays
- [ ] No console errors or warnings
- [ ] Network tab shows no unnecessary requests

### Accessibility Tests
- [ ] Enable "Reduce motion" in OS settings
  - [ ] Typing appears near-instantly (10ms)
  - [ ] No cursor blinking animation
  - [ ] No glitch effects
  - [ ] Containers fade-in instantly
- [ ] Use screen reader (NVDA/JAWS)
  - [ ] Content announced after typing completes
  - [ ] Cursor not announced (aria-hidden)
- [ ] Keyboard navigation
  - [ ] Tab order logical
  - [ ] No focus traps
  - [ ] All links reachable

### Edge Case Tests
- [ ] Refresh page rapidly during typing → no errors
- [ ] Switch browser tabs during typing → pauses/resumes
- [ ] Resize window during typing → no layout breaks
- [ ] Wait for 30s timeout → auto-completes
- [ ] Inspect Elements tab → DOM structure clean
- [ ] Multiple page loads → no memory accumulation

### Browser Tests
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on macOS)
- [ ] Mobile Chrome (responsive)
- [ ] Mobile Safari (responsive)

---

## Configuration Tuning Guide

### Speed Tuning
```javascript
// Faster typing
{ baseSpeed: 30, speedJitter: 10 }

// Slower, deliberate typing
{ baseSpeed: 80, speedJitter: 30 }

// Instant (for debugging)
{ baseSpeed: 1, speedJitter: 0 }
```

### Glitch Tuning
```javascript
// More glitches (intense sci-fi)
{ glitchProbability: 0.3, glitchDuration: 400 }

// Subtle glitches
{ glitchProbability: 0.05, glitchDuration: 200 }

// No glitches
{ glitchProbability: 0 }
```

### Punctuation Pause
```javascript
// Longer pause on periods (dramatic)
{ pauseOnPunctuation: 300 }

// No pause
{ pauseOnPunctuation: 0 }
```

---

## Troubleshooting

### Text appears all at once
- Check `baseSpeed` not set too low
- Verify `reducedMotion` not enabled
- Check console for errors in `_tick()`

### Cursor missing
- Verify `.tw-cursor` CSS loaded
- Check `cursor` element appended
- Inspect DOM for cursor element

### Glitches not appearing
- Increase `glitchProbability`
- Check `prefers-reduced-motion` disabled
- Verify `.tw-glitch` CSS loaded

### Memory leak
- Call `destroy()` after completion
- Check no circular references in callbacks
- Verify RAF/timeouts cleaned up

### Janky animation
- Reduce number of simultaneous typewriters
- Lower `glitchProbability`
- Check other JavaScript not blocking main thread
- Profile with DevTools Performance

---

## Changes from Previous Version

### What Changed
1. **Removed destructive DOM manipulation** that broke formatting
2. **Added delta-time rendering** for frame-rate independence
3. **Implemented proper state machine** preventing race conditions
4. **Added accessibility features** (reduced-motion, ARIA, timeouts)
5. **Optimized performance** (zero allocations in hot path)
6. **Added proper cleanup** (prevent memory leaks)
7. **Preserved HTML structure** (line breaks, spacing intact)

### Why Changed
- Previous version wrapped every character in spans, breaking `<br>` tags
- Frame-dependent timing caused inconsistent speed
- No state management led to bugs on rapid interactions
- Missing accessibility features
- No cleanup caused memory leaks
- DOM thrashing on every character

### Migration Notes
- CSS classes renamed: `.typewriter-visible` → `.tw-visible`
- JavaScript global changed: `startTypewriterEffect()` same
- No breaking changes to HTML structure
- All existing styles preserved

---

## Testing Strategy

### Unit Tests (Conceptual)
```javascript
// Test tokenizer
assert(tokenize('Hello').length === 5);
assert(tokenize('Hello<br>World')[5].type === 'tag');
assert(tokenize('👋').length === 1);  // Emoji as single token

// Test state machine
tw.start();
assert(tw.state === 'typing');
tw.pause();
assert(tw.state === 'paused');
tw.resume();
assert(tw.state === 'typing');
tw.skip();
assert(tw.state === 'skipped');

// Test cleanup
tw.destroy();
assert(tw.rafId === null);
assert(tw.timeoutId === null);
```

### Integration Tests (Conceptual)
```javascript
// Test complete sequence
let completed = false;
const tw = new TypewriterEngine(element, {
  baseSpeed: 10,
  onComplete: () => completed = true
});
tw.start('Test');
await delay(100);
assert(completed === true);
assert(element.textContent === 'Test');

// Test skip
const tw2 = new TypewriterEngine(element);
tw2.start('Long text...');
tw2.skip();
assert(tw2.state === 'skipped');
assert(element.textContent === 'Long text...');

// Test reduced motion
window.matchMedia = () => ({ matches: true });  // Mock
const tw3 = new TypewriterEngine(element);
assert(tw3.reducedMotion === true);
```

---

## Performance Benchmarks

### Expected Metrics (Modern Hardware)
- **FPS**: Steady 60fps during typing
- **CPU**: <5% per typewriter instance
- **Memory**: ~50KB per instance
- **Start Time**: <1ms to first character
- **Character Rate**: Exactly `baseSpeed` ±jitter

### Profiling Points
1. RAF callback duration (<2ms)
2. `_renderToken()` duration (<0.5ms)
3. Layout/reflow count (minimize)
4. Memory snapshots (no growth)

---

## Future Enhancements (Not Implemented)

### Potential Features
- Custom cursor styles (block, underline)
- Word-by-word mode (vs char-by-char)
- Sound on character (built-in audio)
- Configurable easing curves
- Backspace/delete effects
- Multi-line cursor tracking
- Full rich-text editor integration
- Undo/redo support
- Real-time speed adjustment
- Analytics hooks (track skip rate)

---

## License & Credits
Created for ALTROLL portfolio website (2025)
Production-ready typewriter engine with no external dependencies

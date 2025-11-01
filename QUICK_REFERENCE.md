# Typewriter Engine v2.0 - Quick Reference

## 🚀 Quick Start

```javascript
// Basic usage
const tw = new TypewriterEngine(document.querySelector('h1'));
tw.start();

// With callback
const tw = new TypewriterEngine(element, {
  baseSpeed: 50,
  onComplete: () => console.log('Done!')
});
tw.start();
```

---

## 📋 Manual Test Steps

### Step 1: Load Page
1. Open `index.html` in browser
2. Click "ALTROLL" entry screen
3. **✓ Verify**: Blur fades, main content appears

### Step 2: Profile Section
1. Watch profile name appear
2. **✓ Verify**: 
   - "@ALTROLL" types character-by-character
   - Blinking cursor at end while typing
   - Bio text types after name completes
   - Line breaks preserved (name on line 1, bio on lines 2-3)
   - No text squishing or overflow

### Step 3: Social Icons
1. After profile completes
2. **✓ Verify**:
   - 4 icons appear one-by-one (staggered ~150ms)
   - Smooth fade + slide-up animation
   - No layout shift

### Step 4: Links Section
1. After icons complete
2. **✓ Verify**:
   - Each link slides in sequentially
   - Random glitch effects on some links (position jitter)
   - Link title types first, then description
   - All 6 links animate properly
   - Text stays within borders

### Step 5: Footer
1. After all links complete
2. **✓ Verify**:
   - Footer text types with cursor
   - Copyright symbol (©) displays correctly
   - Cursor disappears when done

### Step 6: Performance
1. Open DevTools → Performance tab
2. Record during typing
3. **✓ Verify**:
   - Steady 60 FPS green bars
   - No red warning bars (no jank)
   - CPU usage <10%

### Step 7: Accessibility (Reduced Motion)
1. **Windows**: Settings → Accessibility → Visual effects → Animation effects OFF
2. **macOS**: System Preferences → Accessibility → Display → Reduce motion ON
3. Refresh page, click entry screen
4. **✓ Verify**:
   - All text appears almost instantly (<100ms)
   - No cursor blinking
   - No glitch effects
   - Smooth experience

### Step 8: Tab Switching
1. Start typing animation
2. Switch to another browser tab
3. Wait 5 seconds
4. Switch back
5. **✓ Verify**:
   - Typing resumes from where it paused
   - No jumping or duplicate text
   - No console errors

### Step 9: Multiple Refreshes
1. Refresh page 5 times rapidly
2. Click through entry screen each time
3. **✓ Verify**:
   - No errors in console
   - Typing works every time
   - No memory buildup (check DevTools Memory tab)

---

## 🐛 Common Issues & Fixes

### Text appears all at once
- **Cause**: Reduced motion enabled
- **Fix**: Disable OS motion settings, or adjust `reducedMotionSpeed`

### Cursor missing
- **Cause**: CSS not loaded or element removed
- **Fix**: Verify `.tw-cursor` class in styles

### Spacing broken
- **Cause**: Previous character-wrapping code
- **Fix**: This version preserves HTML structure perfectly

### Janky animation
- **Cause**: Too many simultaneous typewriters or heavy page
- **Fix**: Reduce glitch probability, check other scripts

### Memory leak
- **Cause**: Not calling `.destroy()` on instances
- **Fix**: Instances auto-cleanup on complete, or call manually

---

## ⚙️ Configuration Presets

### Fast (Demo Mode)
```javascript
{
  baseSpeed: 20,
  speedJitter: 5,
  glitchProbability: 0.1,
  pauseOnPunctuation: 50
}
```

### Normal (Current)
```javascript
{
  baseSpeed: 50,
  speedJitter: 20,
  glitchProbability: 0.15,
  pauseOnPunctuation: 150
}
```

### Slow (Dramatic)
```javascript
{
  baseSpeed: 90,
  speedJitter: 30,
  glitchProbability: 0.25,
  pauseOnPunctuation: 300
}
```

### Instant (Debug)
```javascript
{
  baseSpeed: 1,
  speedJitter: 0,
  glitchProbability: 0,
  pauseOnPunctuation: 0
}
```

---

## 🎯 Verification Checklist

### Functionality
- [x] Typewriter API: start(), skip(), pause(), resume()
- [x] State machine: idle → typing → completed
- [x] Delta-time rendering (frame-rate independent)
- [x] HTML preservation (line breaks, tags intact)
- [x] Emoji/surrogate pair handling
- [x] Event callbacks: onChar, onComplete, onSkip
- [x] Proper cleanup and destroy()

### UI/UX
- [x] Smooth container fade-ins
- [x] Staggered element entrances
- [x] GPU-optimized transforms
- [x] No layout shifts
- [x] Blinking cursor during typing
- [x] Cursor disappears when done
- [x] Random glitch effects (sci-fi)

### Accessibility
- [x] Reduced-motion support (near-instant)
- [x] ARIA live regions for screen readers
- [x] aria-hidden on decorative cursor
- [x] Safety timeout (30s max)
- [x] Keyboard navigation preserved
- [x] Focus order maintained

### Performance
- [x] Zero allocations in RAF loop
- [x] RequestAnimationframe + delta time
- [x] Cleanup prevents memory leaks
- [x] Pause on tab backgrounding
- [x] No timer drift
- [x] Handles slow devices gracefully

### Edge Cases
- [x] Empty strings
- [x] Very long strings (timeout)
- [x] Rapid start/stop/skip
- [x] Multiple instances
- [x] Element removal during typing
- [x] Window resize during typing
- [x] Mixed RTL/LTR text
- [x] Special characters (&lt;, &gt;, &amp;)

---

## 📊 Expected Behavior

### Timing Sequence
```
0ms      - Entry screen clicked
0ms      - Profile container fades in
100ms    - Profile name starts typing
~1500ms  - Profile name completes
1600ms   - Bio starts typing
~3000ms  - Bio completes
3000ms   - Social icons start staggering in
3800ms   - All icons visible
3800ms   - First link slides in + types
4400ms   - Second link slides in + types
...
~8000ms  - All links complete
8000ms   - Footer starts typing
~9500ms  - Footer completes
DONE     - All typewriters cleaned up
```

### Character Rate
- **Base**: ~50ms per character (20 chars/second)
- **With jitter**: 30-70ms per character (natural variation)
- **Punctuation**: +150ms pause after periods, commas
- **Reduced motion**: ~10ms (100 chars/second = instant feel)

---

## 🔧 Debug Commands

Open browser console during typing:

```javascript
// Access active typewriters (if you store them globally)
// Example: window.typewriters[0].pause()

// Check state
console.log(typewriter.state);  // 'typing', 'paused', etc.

// Skip current typing
typewriter.skip();

// Pause all
typewriters.forEach(tw => tw.pause());

// Resume all
typewriters.forEach(tw => tw.resume());

// Force cleanup
typewriters.forEach(tw => tw.destroy());
```

---

## 📝 Notes

- **Preserved**: All HTML structure, line breaks, spacing, formatting
- **Optimized**: GPU transforms, RAF + delta time, zero hot-path allocations
- **Accessible**: Reduced-motion, ARIA, safety timeouts
- **Robust**: State machine, cleanup, visibility handling, edge cases
- **Modular**: Reusable TypewriterEngine class with clean API

**No external dependencies** - Pure JavaScript + CSS
**Browser support**: Chrome 60+, Firefox 55+, Safari 10+, Edge 79+
**Performance target**: 60 FPS on modern hardware
**Memory usage**: ~50KB per typewriter instance

---

## ✅ Success Criteria

Animation is successful when:
1. ✓ All text types character-by-character at steady rate
2. ✓ No formatting/spacing breaks (line breaks preserved)
3. ✓ Smooth UI entrance (no jank, no layout shifts)
4. ✓ 60 FPS throughout entire sequence
5. ✓ No console errors or warnings
6. ✓ Reduced-motion works (instant typing)
7. ✓ Tab switching pauses/resumes correctly
8. ✓ Memory stable (no leaks after 5+ page loads)
9. ✓ Visual glitch effects appear randomly
10. ✓ Blinking cursor visible during, hidden after

**Test on**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

---

## 🎨 Current Configuration (index.html)

### Profile
- **H1 (name)**: 60ms/char, 20% glitch
- **P (bio)**: 40ms/char, 10% glitch

### Links
- **Title**: 35ms/char, 5% glitch
- **Description**: 25ms/char, 0% glitch
- **Stagger**: 500ms between links

### Footer
- **Text**: 30ms/char, 5% glitch

### Effects
- **Container fade**: 0.6s cubic-bezier
- **Element slide**: 0.4s cubic-bezier
- **Glitch duration**: 300ms
- **Icon stagger**: 150ms
- **Cursor blink**: 800ms

---

**Last Updated**: 2025-11-01  
**Version**: 2.0  
**Status**: Production Ready ✓

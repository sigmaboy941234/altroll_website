# Intro Animation Test Plan

## Pre-Testing Setup

1. **Browser Requirements:**
   - Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
   - WebGL support enabled
   - No ad blockers blocking CDN domains (cdnjs.cloudflare.com)

2. **Test Environment:**
   - Local web server (not file:// protocol - CORS issues)
   - Good internet connection for CDN resources
   - Hardware acceleration enabled in browser

## Test Procedure

### Phase 1: Initial Load
```
Expected: Entry screen shows with "ALTROLL" typewriter effect
```

**Steps:**
1. Open `index.html` in browser
2. Observe entry screen overlay

**Verify:**
- [ ] Black background with entry screen overlay
- [ ] "ALTROLL" text types and deletes repeatedly
- [ ] Blinking cursor after text
- [ ] Blurred background (if visible)
- [ ] No console errors (press F12)

### Phase 2: Click Entry Screen
```
Expected: Background audio starts, entry screen fades, intro begins
```

**Steps:**
1. Click anywhere on entry screen
2. Watch intro animation sequence

**Verify:**
- [ ] Background music starts (wof.mp3)
- [ ] Entry screen fades out smoothly
- [ ] Intro animation begins immediately
- [ ] No flashing or jarring transitions

### Phase 3: Building Phase
```
Expected: Wireframe segments grow one at a time, camera follows
Duration: ~3-5 seconds depending on graph coverage
```

**Observe:**
- [ ] Segments materialize from thin air (start invisible)
- [ ] Each segment grows in length (0 → full)
- [ ] Each segment fades in opacity (0 → visible)
- [ ] Each segment thickness increases (0 → thin line)
- [ ] Segments connect at endpoints (continuous chain where possible)
- [ ] Camera follows the currently growing segment
- [ ] Camera orbits slightly during build
- [ ] No sudden camera jumps
- [ ] Smooth transitions between segments
- [ ] 60 FPS maintained (check DevTools Performance tab)

**Expected Visual:**
```
Frame 0:    •--------→ (first segment growing)
Frame 10:   •--------•--------→ (second segment growing)
Frame 20:   •--------•--------•--------→ (chain continues)
...
Frame N:    Complete wireframe globe visible
```

### Phase 4: Zoom Out
```
Expected: Segments fade out, main globe fades in, camera zooms to overview
Duration: 700ms
```

**Verify:**
- [ ] Wireframe segments fade out smoothly
- [ ] Main planet wireframe fades in (gray lines)
- [ ] Continent dots fade in (white dots on land masses)
- [ ] Orbit rings fade in (3 rings around planet)
- [ ] Camera smoothly zooms to static pose: (0, 50, 120)
- [ ] No popping or sudden visibility changes
- [ ] Smooth easing (cubic in-out)

### Phase 5: Static Hold
```
Expected: Camera holds at overview position
Duration: 700ms
```

**Verify:**
- [ ] Camera remains still at (0, 50, 120)
- [ ] Globe rotates normally
- [ ] All elements visible: planet, dots, rings
- [ ] No camera drift
- [ ] Clean framing of entire globe

### Phase 6: Handoff
```
Expected: Camera returns to original orbit position
Duration: 1500ms
```

**Verify:**
- [ ] Camera smoothly moves to orbit position
- [ ] Target position: original orbit (0, 30, 80) approximately
- [ ] Smooth easing (cubic in-out)
- [ ] No sudden jumps
- [ ] Camera lookAt stays centered on globe

### Phase 7: Normal Operation
```
Expected: Standard orbit behavior resumes
```

**Verify:**
- [ ] Camera orbits around globe automatically
- [ ] Slow, gentle circular motion
- [ ] Slight vertical oscillation
- [ ] Globe continues rotating
- [ ] Background elements animate (stars, nebula, dust)
- [ ] Intro does not run again

### Phase 8: UI Sequence
```
Expected: Typewriter effects on profile, social icons, links, footer
Note: This is existing functionality, should be unchanged
```

**Verify:**
- [ ] Profile name types character-by-character
- [ ] Bio lines type after name
- [ ] Social icons appear with stagger
- [ ] Links fade in with typewriter titles
- [ ] Footer appears last
- [ ] All existing animations work as before

## Performance Testing

### Metrics to Check (DevTools → Performance)
- [ ] FPS: Steady 60 FPS throughout intro
- [ ] CPU: <20% during intro
- [ ] Memory: No leaks (stable after intro completes)
- [ ] GPU: <50% usage
- [ ] No long tasks (>50ms)
- [ ] No forced reflows/layout thrashing

### Performance Tab:
1. Start recording
2. Click entry screen
3. Wait for intro to complete (~8 seconds)
4. Stop recording
5. Analyze timeline

**Expected:**
- Green bars (60 FPS)
- No red warnings
- Smooth frame timing
- No dropped frames

## Edge Cases

### Test 1: Tab Backgrounding
**Steps:**
1. Start intro
2. Switch to different tab during building phase
3. Switch back after 2-3 seconds

**Expected:**
- [ ] Intro continues from where it left off
- [ ] No catch-up burst
- [ ] Smooth resume
- [ ] No audio glitches

### Test 2: Window Resize
**Steps:**
1. Start intro
2. Resize browser window during building phase

**Expected:**
- [ ] Camera adjusts smoothly
- [ ] No distortion
- [ ] Segments remain properly positioned
- [ ] Intro continues without errors

### Test 3: Reduced Motion
**Steps:**
1. Enable reduced motion in OS settings
2. Reload page
3. Click entry screen

**Expected:**
- [ ] Intro runs but animations are faster (~10ms per segment)
- [ ] No glitch effects
- [ ] Smooth but expedited build
- [ ] All phases still visible

### Test 4: Slow Device
**Test on:**
- Low-end laptop
- Mobile device
- Throttled CPU (DevTools)

**Expected:**
- [ ] Intro still runs
- [ ] May drop below 60 FPS (acceptable)
- [ ] No crashes or freezing
- [ ] Animation completes successfully

## Browser Compatibility

Test in each browser:

**Chrome/Edge (Chromium):**
- [ ] Intro runs smoothly
- [ ] Audio plays
- [ ] No console errors
- [ ] 60 FPS maintained

**Firefox:**
- [ ] Intro runs smoothly
- [ ] Audio plays
- [ ] Shader rendering correct
- [ ] 60 FPS maintained

**Safari:**
- [ ] Intro runs smoothly
- [ ] Audio plays (may require interaction first)
- [ ] WebGL rendering correct
- [ ] 60 FPS maintained

**Mobile Chrome:**
- [ ] Intro runs (may be slower)
- [ ] Touch works to start
- [ ] No crashes
- [ ] Acceptable performance

**Mobile Safari:**
- [ ] Intro runs
- [ ] Touch works
- [ ] Audio plays after interaction
- [ ] Acceptable performance

## Failure Modes

### If Three.js Fails to Load:
**Symptom:** Black screen, console error "THREE is not defined"
**Action:** Check CDN access, verify network, try local Three.js copy

### If Segments Don't Appear:
**Symptom:** Entry screen fades but no wireframe builds
**Action:** Check console for shader errors, verify WebGL support

### If Camera Doesn't Move:
**Symptom:** Static view during building phase
**Action:** Check `introState.phase` in console, verify update loop running

### If Intro Runs Forever:
**Symptom:** Building phase never completes
**Action:** Check `buildSequence.length`, verify edge traversal logic

### If Performance Is Poor:
**Symptom:** <30 FPS, janky animation
**Action:** Reduce `latSegments`/`lonSegments` in INTRO_CONFIG, check other page scripts

## Success Criteria

✅ **All tests pass** if:
1. Intro runs from start to finish without errors
2. Visual quality is smooth and professional
3. Performance is 60 FPS on mid-range hardware
4. Camera follows build logically
5. Transitions are smooth
6. No bugs or crashes
7. Existing UI functionality unchanged
8. Browser compatibility confirmed

## Regression Testing

Verify existing functionality still works:
- [ ] Entry screen typewriter (ALTROLL)
- [ ] Background music starts on click
- [ ] Profile typewriter animations
- [ ] Social icons stagger animation
- [ ] Links fade in with typewriter
- [ ] Footer appears
- [ ] Toggle UI button works
- [ ] All links navigate correctly
- [ ] Responsive design on mobile
- [ ] Keyboard navigation works

## Notes for User Acceptance

When demoing to stakeholders:
1. Use fast, stable internet
2. Use Chrome/Edge for best performance
3. Full screen for immersive effect
4. Mention estimated 6-second intro duration
5. Highlight camera follow behavior
6. Point out smooth transitions
7. Show toggle UI button after intro

## Known Acceptable Behaviors

These are **not bugs**:
- Occasional "teleport" between disconnected graph regions (~47% of transitions)
- Slight camera lag when following fast segment growth
- Brief moment where segments overlap at dense grid points
- Build time varies (3-5s) depending on graph coverage
- Entry screen audio may require user interaction (browser autoplay policy)

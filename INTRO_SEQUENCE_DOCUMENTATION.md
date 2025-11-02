# Intro Sequence Documentation

## Overview
This document describes the intro sequence animation added to the ALTROLL portfolio website. The sequence shows wireframe segments slowly connecting to form a globe, with the camera tracking the formation.

## Animation Phases

### Phase 1: Formation (4 seconds)
- **Duration**: 4000ms
- **What happens**:
  - 20 wireframe segments start scattered around space (80-120 units from center)
  - Segments slowly move toward the center (0, 0, 0)
  - Segments rotate from random orientations to aligned with globe
  - Opacity fades in from 0 to 0.5
  - Camera orbits around the forming globe in a complete circle
  - Camera starts at distance 100 and moves to 70 as globe forms
  - Camera height lowers from 40 to 30

### Phase 2: Zoom Out (2 seconds)
- **Duration**: 2000ms
- **What happens**:
  - Wireframe segments fade out (opacity 0.5 → 0)
  - Main planet wireframe fades in (opacity 0 → 0.3)
  - Continent dots fade in (opacity 0 → 1.0)
  - Orbit rings fade in (opacity 0 → 0.2)
  - Camera smoothly zooms out from current position to (0, 50, 120)
  - Uses ease-out-cubic for smooth deceleration

### Phase 3: Static Hold (1 second)
- **Duration**: 1000ms
- **What happens**:
  - Camera remains static at (0, 50, 120)
  - Globe rotates normally with all elements visible
  - Brief pause to let user appreciate the view

### Phase 4: Transition to Normal (2 seconds)
- **Duration**: 2000ms
- **What happens**:
  - Camera smoothly transitions from static position to orbital path
  - Interpolates from (0, 50, 120) to the normal orbit position
  - Uses ease-out-cubic for smooth transition
  - After transition completes, `introState.active` becomes false

### Phase 5: Normal Operation
- **After intro completes**:
  - Camera follows existing orbital behavior
  - Gentle orbit at radius 80, height 30
  - Vertical oscillation continues as before
  - All existing interactions and UI animations work normally

## Technical Details

### State Management
```javascript
let introState = {
    active: true,
    phase: 'formation',
    progress: 0,
    startTime: performance.now(),
    phaseDurations: {
        formation: 4000,
        zoom_out: 2000,
        static_hold: 1000
    }
};
```

### Wireframe Segments
- **Count**: 20 segments
- **Geometry**: SphereGeometry with arc sections (1/20th of full sphere each)
- **Initial positions**: Scattered at distance 80-120 units
- **Target position**: (0, 0, 0)
- **Material**: Basic wireframe, gray color (0x666666)

### Camera Tracking
- **Formation phase**: Orbits while following formation
- **Zoom out**: Smooth movement to overview position
- **Static hold**: Fixed at (0, 50, 120)
- **Transition**: Interpolates to existing orbit logic

### Easing Functions
- **Formation**: Ease-in-out (s-curve) for smooth acceleration/deceleration
- **Zoom out**: Ease-out-cubic for natural deceleration
- **Transition**: Ease-out-cubic for smooth merge into orbit

## Preserved Behaviors

### Unchanged Elements
- ✅ Planet rotation (0.002 rad/frame)
- ✅ Dots rotation (0.002 rad/frame)
- ✅ Orbit rings rotation (varies by ring)
- ✅ Background stars animation
- ✅ Nebula animation
- ✅ Dust particles animation
- ✅ All UI timing and typewriter effects
- ✅ Entry screen behavior
- ✅ All scroll and interaction logic

### Camera Restoration
After the intro sequence completes:
- Camera seamlessly transitions to existing orbital behavior
- Original orbit parameters preserved: radius=80, height=30
- Existing vertical oscillation continues
- Mouse interaction (if implemented) remains functional

## Timeline Summary

```
0ms    → 4000ms:  Formation (segments connect, camera orbits)
4000ms → 6000ms:  Zoom out (main elements fade in, camera pulls back)
6000ms → 7000ms:  Static hold (pause at overview)
7000ms → 9000ms:  Transition (smooth merge into normal orbit)
9000ms+        :  Normal operation (existing camera behavior)
```

## Testing Checklist

- [ ] Load page in browser
- [ ] Click entry screen to start
- [ ] Verify wireframe segments start scattered
- [ ] Watch segments move together over 4 seconds
- [ ] Confirm camera orbits around formation
- [ ] Verify smooth zoom out to overview
- [ ] Check brief static hold
- [ ] Verify smooth transition to normal orbit
- [ ] Confirm all existing animations still work
- [ ] Check no console errors
- [ ] Verify 60 FPS throughout

## Performance Considerations

- **Additional geometry**: 20 wireframe segments (low poly)
- **Memory impact**: Minimal (~50KB for segments)
- **CPU impact**: Negligible (simple position interpolation)
- **FPS target**: Maintains 60 FPS throughout sequence
- **Cleanup**: Segments become invisible after formation, not removed from scene

## Browser Compatibility

Same as existing code:
- Chrome 60+
- Firefox 55+
- Safari 10+
- Edge 79+
- Mobile browsers (responsive)

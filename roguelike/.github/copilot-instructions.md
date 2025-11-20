# AI Agent Instructions - Top-Down Roguelike Shooter

## Architecture Overview

This is a **Three.js-based 2D top-down shooter** using an orthographic camera for strict 2D rendering with 3D particle effects and post-processing (bloom). The game runs entirely client-side with no build step.

### Core Module Structure
- **`core.js`**: Shared Three.js scene, camera, geometries, materials, and collision utilities. All entities reference these singletons.
- **`main.js`**: Game loop hub - imports all modules, manages game state, runs collision detection, spawns enemies, and handles UI events.
- **Entity Classes**: `Player`, `Enemy`, `Bullet` are independent classes that manage their own Three.js meshes and add/remove themselves from the scene.
- **`particles.js`**: Centralized particle system with methods like `createExplosion()`, `createBlockTrail()`, `createShockwave()` used throughout.
- **`shockwave.js`**: Standalone entity class for the blue enemy's area-of-effect attack.

### Critical Patterns

**1. Dual Object Structure (Enemy/Bullet)**
Enemies use a `root` Group for movement and a `mesh` child for visual rotation. This prevents health bars from spinning:
```js
this.root = new THREE.Group(); // Moves toward player
this.mesh = new THREE.Mesh(geo, mat); // Rotates independently
this.root.add(this.mesh);
scene.add(this.root);
```
All collision checks use `enemy.root.position`, not `enemy.mesh.position`.

**2. Material Cloning for Instance-Specific Effects**
Purple enemies clone materials to prevent shared color changes:
```js
if (type === 'purple') {
    mat = mat.clone(); // Each instance gets its own material
}
```
Without this, flashing one purple enemy affects all purple enemies.

**3. Bullet Types & Collision Logic**
- **Player bullets**: Standard `Bullet` class with `isSuper`, `isExplosivePellet`, `isReflected` flags
- **Enemy pellets**: Plain objects with `isEnemyPellet: true`, custom `update()` function, and `destroy()` method
- **Death burst pellets**: Player `Bullet` instances with yellow material override

Collision checks must skip inappropriate pairs:
```js
if (bullet.isEnemyPellet) continue; // Skip enemy bullets hitting enemies
if (!bullet.isEnemyPellet && enemyPellet.isEnemyPellet) { /* shootable */ }
```

**4. Enemy-Specific Mechanics**
Each enemy type has unique behavior checked in `main.js`:
- **Blue (Hexagon)**: Triggers `Shockwave` at 50% HP via `hasShockwaved` flag
- **Purple (Octagon)**: Eats bullets (increments `pelletsEaten` + `totalPelletsConsumed`), spits attacks at 5, takes self-damage

### Development Workflow

**Running Locally:**
```powershell
npx http-server -p 8081 -c-1  # Disable caching for instant updates
```
Open `http://localhost:8081`. The `-c-1` flag is critical for seeing changes immediately.

**Debugging Enemies:**
Use the debug panel (top-right) to spawn specific enemy types near the player for testing mechanics.

**Common Gotchas:**
- **Shockwaves fail silently**: Always check `b.reflect` exists before calling (enemy pellets don't have it)
- **Purple enemy instant death**: Self-damage was 50 (too high for 30 HP) - now 15 per attack
- **Pellets disappear**: Enemy pellets colliding with enemies on spawn - check `isEnemyPellet` exclusions
- **Health bars spin**: Using `mesh.position` instead of `root.position` for enemy movement

### Adding New Enemies

1. Add geometry + material to `core.js` (`GEOMETRIES.enemyX`, `MATERIALS.enemyX`)
2. Add case in `Enemy` constructor with stats (`hp`, `speed`, `radius`, custom properties)
3. Clone material if instance-specific effects needed (flashing, pulsing)
4. Add type-specific logic in `main.js` game loop (attacks, state changes)
5. Update `spawnEnemy()` wave requirements and spawn rates
6. Create enemy intro in `enemyIntros` object with `wave`, `name`, `desc`, `ability`, `warning`

### UI State Machine

States: `'playing'` | `'upgrade'` | `'intro'` | `'gameover'`

Flow: `playing` → all enemies dead → `'upgrade'` → pick upgrade → check for new enemy → `'intro'` (if new) → `'playing'`

Enemy intros only show once per playthrough (tracked in `shownIntros` Set).

### Post-Processing & Visuals

Uses `EffectComposer` with `UnrealBloomPass` (strength: 0.8, threshold: 0.1). Grid background at `z: -10`, all entities at `z: 0`, UI overlay uses CSS.

Particle system runs independently in `particleSystem.update()` - particles scale/fade based on `life` value and remove themselves when dead.

### Key Files Reference
- **Enemy mechanics**: `js/enemy.js` + collision logic in `main.js` (~line 260-370)
- **Bullet types**: `js/bullet.js` (player) + inline object creation in `enemy.js:createEnemyPellet()`
- **Game loop**: `main.js:update()` - Entities update → Shockwaves → Collisions → Cleanup
- **Shared resources**: `js/core.js` - Import scene/materials from here, never recreate

### Testing Checklist for Changes
- Spawn enemy with debug panel and verify mechanics
- Check browser console for errors (especially collision/update loops)
- Test shockwave interaction (blue enemy at 50% HP)
- Verify purple enemy: eats 5 bullets → attacks → takes self-damage → death burst
- Confirm player bullets can shoot down enemy pellets

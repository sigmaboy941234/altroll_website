import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { scene, camera, checkCollision } from './core.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Bullet } from './bullet.js';
import { particleSystem } from './particles.js';
import { Shockwave } from './shockwave.js';
import { getRandomUpgrades } from './upgrade.js';
import { playHitSound, playExplosionSound } from './audio.js';

const canvasContainer = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

// Post Processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 0.8; // Reduced from 2.0
bloomPass.radius = 0.3;
composer.addPass(bloomPass);

// Background Grid
const gridHelper = new THREE.GridHelper(2000, 50, 0x222222, 0x111111);
gridHelper.rotation.x = Math.PI / 2;
gridHelper.position.z = -10; // Move behind everything
scene.add(gridHelper);

// Game State
const game = {
    player: new Player(),
    bullets: [],
    enemies: [],
    shockwaves: [],
    walls: [], // Reflecting walls created by white enemies
    wave: 1,
    score: 0,
    state: 'playing',
    enemiesToSpawn: 0,
    spawnTimer: 0
};

// Input
const input = {
    keys: {},
    mouse: { x: 0, y: 0 },
    mouseDown: false
};

// UI Elements
const ui = {
    score: document.getElementById('wave-display'),
    hpBar: document.getElementById('health-bar'),
    upgradeMenu: document.getElementById('upgrade-menu'),
    upgradeOptions: document.getElementById('upgrade-options'),
    enemyIntro: document.getElementById('enemy-intro'),
    enemyInfo: document.getElementById('enemy-info'),
    gameOver: document.getElementById('game-over'),
    finalScore: document.getElementById('final-score')
};

const enemyIntros = {
    red_orbiter: {
        wave: 2,
        name: "ORBITER",
        desc: "Red core protected by two rotating satellites.",
        ability: "Satellites block all incoming fire. The core is vulnerable only when exposed.",
        warning: "Destroy the small squares first to open up a clear shot at the main body!"
    },
    blue: {
        wave: 3,
        name: "TANK UNIT",
        desc: "Heavily armored hexagonal enemy with high HP.",
        ability: "At 50% health, releases a massive SHOCKWAVE that pushes you and reflects all bullets back at you.",
        warning: "Keep your distance when it's damaged!"
    },
    yellow: {
        wave: 5,
        name: "SPEED DEMON",
        desc: "Fast-moving triangular enemy with low HP.",
        ability: "Rushes at you at extreme speed.",
        warning: "High threat - prioritize elimination!"
    },
    purple: {
        wave: 6,
        name: "PELLET THIEF",
        desc: "Mysterious octagonal entity that absorbs your attacks.",
        ability: "Eats your bullets instead of taking damage. After consuming 5 bullets, it spits out a massive tracking pellet or spray attack.",
        warning: "Stop spamming and aim carefully! Killing it releases absorbed pellets as bonus firepower."
    },
    green: {
        wave: 7,
        name: "HEALER NODE",
        desc: "Hollow green support unit that never attacks directly.",
        ability: "Periodically emits healing waves that restore HP to nearby enemies. Always spawns in groups.",
        warning: "Priority target! Eliminate healers first or enemies become unkillable. Death triggers shockwave."
    },
    white: {
        wave: 8,
        name: "REFLECTOR DRONE",
        desc: "White square with rotating cyan outline.",
        ability: "Creates temporary reflecting walls (neon cyan lines). Your bullets bounce realistically off these barriers.",
        warning: "Non-threatening alone, but walls can trap you or redirect your fire. Use reflections strategically!"
    }
};

let shownIntros = new Set();

function startWave() {
    // Check for new enemy introduction
    let newEnemyType = null;
    for (const [type, intro] of Object.entries(enemyIntros)) {
        if (game.wave === intro.wave && !shownIntros.has(type)) {
            newEnemyType = type;
            shownIntros.add(type);
            break;
        }
    }

    if (newEnemyType) {
        showEnemyIntro(newEnemyType);
    } else {
        beginWave();
    }
}

function showEnemyIntro(type) {
    const intro = enemyIntros[type];
    game.state = 'intro';
    
    ui.enemyInfo.innerHTML = `
        <div class="enemy-name">${intro.name}</div>
        <div class="enemy-desc">${intro.desc}</div>
        <div class="enemy-desc"><strong>ABILITY:</strong> ${intro.ability}</div>
        <div class="enemy-warning">⚠ ${intro.warning}</div>
    `;
    
    ui.enemyIntro.classList.remove('hidden');
    
    gsap.fromTo("#enemy-intro", 
        { scale: 0.8, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }
    );
}

function beginWave() {
    game.enemiesToSpawn = 5 + Math.floor(game.wave * 3);
    game.spawnTimer = 0;
    ui.score.innerText = game.wave;
    game.state = 'playing';
    
    // GSAP Wave Text Animation
    gsap.fromTo("#score-container", 
        { scale: 2, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
}

function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    const w = window.innerWidth / 2 + 50;
    const h = window.innerHeight / 2 + 50;

    switch(edge) {
        case 0: x = (Math.random() - 0.5) * window.innerWidth; y = h; break;
        case 1: x = w; y = (Math.random() - 0.5) * window.innerHeight; break;
        case 2: x = (Math.random() - 0.5) * window.innerWidth; y = -h; break;
        case 3: x = -w; y = (Math.random() - 0.5) * window.innerHeight; break;
    }

    let type = 'red';
    const rand = Math.random();
    
    // Spawn Logic
    if (game.wave >= 8 && rand < 0.65) type = 'white';
    else if (game.wave >= 7 && rand < 0.55) type = 'green';
    else if (game.wave >= 6 && rand < 0.45) type = 'purple';
    else if (game.wave >= 5 && rand < 0.35) type = 'yellow';
    else if (game.wave >= 3 && rand < 0.25) type = 'blue';
    else if (game.wave >= 2 && rand < 0.2) type = 'red_orbiter'; // New enemy in wave 2

    game.enemies.push(new Enemy(x, y, type));
    
    // Green healers spawn in groups of 2-3
    if (type === 'green' && Math.random() < 0.7) {
        const groupSize = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < groupSize; i++) {
            const offsetAngle = Math.random() * Math.PI * 2;
            const offsetDist = 80 + Math.random() * 40;
            const gx = x + Math.cos(offsetAngle) * offsetDist;
            const gy = y + Math.sin(offsetAngle) * offsetDist;
            game.enemies.push(new Enemy(gx, gy, 'green'));
        }
    }
}

function triggerBulletHell(x, y) {
    const count = 16;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        // isSuper=false, but we want custom visuals. 
        // Let's modify Bullet constructor or just make a new "MiniSuper" type?
        // Easier: Pass a flag or handle it in Bullet.
        // Let's just make them normal bullets but we will override their mesh color/size after creation
        
        const b = new Bullet(x, y, angle, game.player.damage, 6, game.enemies, false);
        b.homingStrength = 0; 
        
        // Custom visuals for explosion pellets
        b.mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White
        b.mesh.geometry = new THREE.CircleGeometry(6, 8); // 2x bigger than normal (normal is 4)
        b.radius = 6;
        b.isExplosivePellet = true; // Mark them so they explode on contact

        game.bullets.push(b);
    }
}

function update() {
    try {
        if (game.state !== 'playing') return;

        // Spawning
        if (game.enemiesToSpawn > 0) {
            game.spawnTimer--;
            if (game.spawnTimer <= 0) {
                spawnEnemy();
                game.enemiesToSpawn--;
                game.spawnTimer = Math.max(15, 50 - game.wave);
            }
        } else if (game.enemies.length === 0) {
            game.state = 'upgrade';
            showUpgradeMenu();
        }

        // Entities
        game.player.update(input, game.enemies, game.bullets);
        
        game.bullets.forEach(b => {
            try {
                if (b.isEnemyPellet && b.update) {
                    b.update(game.player.mesh.position);
                } else if (b.update) {
                    b.update();
                }
            } catch (e) {
                console.error("Bullet update error:", e, b);
                b.markedForDeletion = true;
            }
        });
        game.bullets = game.bullets.filter(b => {
            if (b.markedForDeletion) {
                if (b.destroy) b.destroy();
                return false;
            }
            return true;
        });

        game.enemies.forEach(e => {
            e.update(game.player.mesh.position);
            
            // Purple enemy spit logic - check every frame (but not if dead)
            if (e.type === 'purple' && e.pelletsEaten >= e.maxPellets && e.hp > 0) {
                const didAttack = e.spitPellets(game.player, game.bullets);
                if (didAttack) {
                    playExplosionSound();
                    particleSystem.createExplosion(e.root.position.x, e.root.position.y, 0xaa44ff, 10, 4);
                    
                    // Check if it died from self-damage (only if not already dead)
                    if (e.hp <= 0 && !e.markedForDeletion) {
                        e.markedForDeletion = true;
                        e.destroy();
                        game.score += e.scoreValue;
                        playExplosionSound();
                        particleSystem.createExplosion(e.root.position.x, e.root.position.y, e.mesh.material.color, 15, 4);
                        game.player.addCharge(1);
                    }
                }
            }
            
            // Green healer healing logic
            if (e.type === 'green' && e.hp > 0) {
                e.healTimer++;
                if (e.healTimer >= e.healInterval) {
                    e.healTimer = 0;
                    e.healNearbyEnemies(game.enemies, particleSystem);
                }
            }
            
            // White reflector wall creation
            if (e.type === 'white' && e.hp > 0) {
                e.wallTimer++;
                if (e.wallTimer >= e.wallInterval) {
                    e.wallTimer = 0;
                    e.createReflectingWall(game.walls);
                    playHitSound();
                }
            }
        });

        // Blue Enemy Shockwave Logic
        game.enemies.forEach(e => {
            // Trigger Shockwave
            if (e.type === 'blue' && !e.hasShockwaved && e.hp <= e.maxHp * 0.5) {
                e.hasShockwaved = true;
                game.shockwaves.push(new Shockwave(e.root.position.x, e.root.position.y));
            }
        });

        // Update Shockwaves
        game.shockwaves.forEach(s => s.update(game.player, game.bullets));
        game.shockwaves = game.shockwaves.filter(s => !s.markedForDeletion);

        // Update Walls
        game.walls.forEach(w => w.update());
        game.walls = game.walls.filter(w => {
            if (w.markedForDeletion) {
                w.destroy();
                return false;
            }
            return true;
        });

        particleSystem.update();

    // Bullet - Wall Reflections
    for (const bullet of game.bullets) {
        if (!bullet.mesh || bullet.isEnemyPellet) continue; // Only player bullets bounce
        
        for (const wall of game.walls) {
            // Line segment intersection check
            const bx = bullet.mesh.position.x;
            const by = bullet.mesh.position.y;
            const br = bullet.radius;
            
            // Calculate distance from point to line segment
            const dx = wall.x2 - wall.x1;
            const dy = wall.y2 - wall.y1;
            const lineLenSq = dx * dx + dy * dy;
            const t = Math.max(0, Math.min(1, ((bx - wall.x1) * dx + (by - wall.y1) * dy) / lineLenSq));
            const closestX = wall.x1 + t * dx;
            const closestY = wall.y1 + t * dy;
            const dist = Math.sqrt((bx - closestX) ** 2 + (by - closestY) ** 2);
            
            // Check collision using wall thickness (half thickness + bullet radius)
            if (dist < br + (wall.thickness / 2)) { 
                // Reflect bullet velocity across wall (tangent)
                const wallAngle = Math.atan2(dy, dx);
                const bulletAngle = Math.atan2(bullet.velocity.y, bullet.velocity.x);
                const reflectedAngle = 2 * wallAngle - bulletAngle;
                
                const speed = Math.sqrt(bullet.velocity.x ** 2 + bullet.velocity.y ** 2);
                bullet.velocity.x = Math.cos(reflectedAngle) * speed;
                bullet.velocity.y = Math.sin(reflectedAngle) * speed;
                bullet.mesh.rotation.z = reflectedAngle;
                
                // Calculate normal
                let normalAngle = wallAngle + Math.PI / 2;
                let nx = Math.cos(normalAngle);
                let ny = Math.sin(normalAngle);
                
                // Ensure normal points against the incoming velocity (towards where the bullet came from)
                // We use the OLD velocity for this check (which we just overwrote? No, we overwrote bullet.velocity)
                // Wait, I overwrote bullet.velocity above. I should use the values before overwrite or calculate dot with new velocity?
                // New velocity is reflected. Reflected velocity should be AWAY from wall.
                // So normal should be in same direction as reflected velocity (roughly).
                // Dot of reflected velocity and normal should be positive.
                
                const dot = bullet.velocity.x * nx + bullet.velocity.y * ny;
                if (dot < 0) {
                    nx = -nx;
                    ny = -ny;
                }
                
                // Move bullet slightly away from wall to prevent re-collision
                bullet.mesh.position.x += nx * 5;
                bullet.mesh.position.y += ny * 5;
                
                // Visual feedback
                particleSystem.createHitEffect(closestX, closestY);
                playHitSound();
                break;
            }
        }
    }

    // Collisions
    // Bullet - Enemy
    for (const bullet of game.bullets) {
        if (!bullet.mesh) continue;

        // Player bullets vs Enemy pellets (all bullets can shoot down enemy pellets)
        if (!bullet.isEnemyPellet && !bullet.markedForDeletion) {
            for (const enemyBullet of game.bullets) {
                if (!enemyBullet.isEnemyPellet || !enemyBullet.mesh || enemyBullet.markedForDeletion) continue;
                
                const dx = bullet.mesh.position.x - enemyBullet.mesh.position.x;
                const dy = bullet.mesh.position.y - enemyBullet.mesh.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < (bullet.radius + enemyBullet.radius)) {
                    bullet.markedForDeletion = true;
                    enemyBullet.markedForDeletion = true;
                    particleSystem.createExplosion(enemyBullet.mesh.position.x, enemyBullet.mesh.position.y, 0xaa44ff, 4, 3);
                    playHitSound();
                    break;
                }
            }
            
            if (bullet.markedForDeletion) continue;
        }

        // Reflected bullets hurt player
        if (bullet.isReflected) {
            if (game.player.mesh) {
                const dx = bullet.mesh.position.x - game.player.mesh.position.x;
                const dy = bullet.mesh.position.y - game.player.mesh.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < (bullet.radius + game.player.radius)) {
                    bullet.markedForDeletion = true;
                    game.player.hp -= 10;
                    ui.hpBar.style.width = `${Math.max(0, (game.player.hp / game.player.maxHp) * 100)}%`;
                    particleSystem.createHitEffect(game.player.mesh.position.x, game.player.mesh.position.y);
                    playHitSound();
                }
            }
            continue;
        }

        for (const enemy of game.enemies) {
            if (!enemy.root) continue;

            // Check collision with orbiters first (Red Orbiter)
            if (enemy.type === 'red_orbiter' && enemy.orbiters && enemy.orbiters.length > 0) {
                let hitOrbiter = false;
                for (const orbiter of enemy.orbiters) {
                    // Calculate absolute position of orbiter
                    // Orbiter is child of orbiterGroup, which is child of root
                    // But we can just use world position if we updated matrices, but Three.js might not have updated yet
                    // Easier: Calculate manually or use getWorldPosition
                    
                    // Since we are in 2D and know the structure:
                    // root pos + orbiterGroup rotation + orbiter pos
                    // Actually, orbiterGroup rotates. Orbiter local pos is fixed relative to group.
                    // Let's use Three.js world position helper
                    const orbiterPos = new THREE.Vector3();
                    orbiter.mesh.getWorldPosition(orbiterPos);
                    
                    const dx = bullet.mesh.position.x - orbiterPos.x;
                    const dy = bullet.mesh.position.y - orbiterPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Orbiter radius is bigger now (12) + bullet radius
                    if (dist < (12 + bullet.radius)) {
                        bullet.markedForDeletion = true;
                        orbiter.hp -= bullet.damage;
                        playHitSound();
                        // Red sparks for shield hit
                        particleSystem.createExplosion(orbiterPos.x, orbiterPos.y, 0xff4444, 3, 2);
                        hitOrbiter = true;
                        break;
                    }
                }
                if (hitOrbiter) break; // Bullet destroyed on orbiter
            }

            const dx = bullet.mesh.position.x - enemy.root.position.x;
            const dy = bullet.mesh.position.y - enemy.root.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (bullet.radius + enemy.radius)) {
                // Purple enemy eats pellets (only normal bullets, not enemy pellets)
                if (enemy.type === 'purple' && !bullet.isSuper && !bullet.isExplosivePellet && !bullet.isReflected && !bullet.isEnemyPellet) {
                    bullet.markedForDeletion = true;
                    const isFull = enemy.eatPellet();
                    particleSystem.createExplosion(enemy.root.position.x, enemy.root.position.y, 0xaa44ff, 3, 2);
                    break; // Pellet eaten, don't damage
                }
                
                // Skip enemy bullets hitting enemies
                if (bullet.isEnemyPellet) {
                    continue;
                }
                
                bullet.markedForDeletion = true;
                enemy.hp -= bullet.damage;
                playHitSound();
                particleSystem.createHitEffect(bullet.mesh.position.x, bullet.mesh.position.y);

                // Super Bullet Explosion
                if (bullet.isSuper) {
                    triggerBulletHell(bullet.mesh.position.x, bullet.mesh.position.y);
                    particleSystem.createExplosion(bullet.mesh.position.x, bullet.mesh.position.y, 0xffffff, 20, 5);
                    playExplosionSound();
                } else if (bullet.isExplosivePellet) {
                    particleSystem.createExplosion(bullet.mesh.position.x, bullet.mesh.position.y, 0xffffff, 5, 3);
                }

                if (enemy.hp <= 0 && !enemy.markedForDeletion) {
                    // Green healer death - mini shockwave that pushes bullets
                    if (enemy.type === 'green') {
                        game.shockwaves.push(new Shockwave(enemy.root.position.x, enemy.root.position.y, true)); // Mini shockwave
                    }
                    
                    // Purple enemy death - burst pellets based on total consumed
                    if (enemy.type === 'purple' && enemy.totalPelletsConsumed > 0) {
                        const burstCount = enemy.totalPelletsConsumed; // One bonus pellet per consumed
                        for (let i = 0; i < burstCount; i++) {
                            const angle = (i / burstCount) * Math.PI * 2;
                            const b = new Bullet(enemy.root.position.x, enemy.root.position.y, angle, game.player.damage * 0.5, 6, game.enemies, false);
                            b.homingStrength = 0.05;
                            // Make them yellow so they're distinguishable from enemy pellets
                            b.mesh.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                            game.bullets.push(b);
                        }
                        // Extra visual feedback for death burst
                        particleSystem.createExplosion(enemy.root.position.x, enemy.root.position.y, 0xffff00, 20, 5);
                    }
                    
                    enemy.markedForDeletion = true;
                    enemy.destroy();
                    game.score += enemy.scoreValue;
                    playExplosionSound();
                    particleSystem.createExplosion(enemy.root.position.x, enemy.root.position.y, enemy.mesh.material.color, 15, 4);
                    
                    game.player.addCharge(1);
                }
                break;
            }
        }
    }

        // Enemy - Player
        for (const enemy of game.enemies) {
            if (!enemy.markedForDeletion && enemy.root) {
                const dx = enemy.root.position.x - game.player.mesh.position.x;
                const dy = enemy.root.position.y - game.player.mesh.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < (enemy.radius + game.player.radius)) {
                    game.player.hp -= 0.5;
                    ui.hpBar.style.width = `${Math.max(0, (game.player.hp / game.player.maxHp) * 100)}%`;
                    
                    camera.position.x = (Math.random() - 0.5) * 5;
                    camera.position.y = (Math.random() - 0.5) * 5;
                }
            }
        }
        
        // Enemy Pellets - Player
        for (const bullet of game.bullets) {
            if (bullet.isEnemyPellet && game.player.mesh && bullet.mesh) {
                const dx = bullet.mesh.position.x - game.player.mesh.position.x;
                const dy = bullet.mesh.position.y - game.player.mesh.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < (bullet.radius + game.player.radius)) {
                    bullet.markedForDeletion = true;
                    game.player.hp -= bullet.damage;
                    ui.hpBar.style.width = `${Math.max(0, (game.player.hp / game.player.maxHp) * 100)}%`;
                    particleSystem.createExplosion(bullet.mesh.position.x, bullet.mesh.position.y, 0xaa44ff, 5, 3);
                    playHitSound();
                    
                    camera.position.x = (Math.random() - 0.5) * 8;
                    camera.position.y = (Math.random() - 0.5) * 8;
                }
            }
        }
        
        // Reset camera shake decay
        camera.position.x *= 0.9;
        camera.position.y *= 0.9;

        game.enemies = game.enemies.filter(e => !e.markedForDeletion);

        if (game.player.hp <= 0) {
            game.state = 'gameover';
            ui.gameOver.classList.remove('hidden');
            ui.finalScore.innerText = `WAVES SURVIVED: ${game.wave - 1}`;
        }
    } catch (err) {
        console.error("Game Loop Error:", err);
    }
}

function showUpgradeMenu() {
    ui.upgradeMenu.classList.remove('hidden');
    ui.upgradeOptions.innerHTML = '';
    
    // GSAP Entry
    gsap.fromTo("#upgrade-menu", 
        { scale: 0.8, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
    );

    const options = getRandomUpgrades(3);
    options.forEach(upgrade => {
        const div = document.createElement('div');
        div.className = 'upgrade-card';
        div.innerHTML = `
            <div class="upgrade-title">${upgrade.name}</div>
            <div class="upgrade-desc">${upgrade.description}</div>
        `;
        div.onclick = () => {
            upgrade.apply(game.player);
            ui.upgradeMenu.classList.add('hidden');
            game.wave++;
            startWave(); // This will check for enemy intro
        };
        ui.upgradeOptions.appendChild(div);
    });
}

// Frame rate limiter (cap at 60 FPS)
let lastFrameTime = 0;
const targetFrameTime = 1000 / 60; // 16.67ms for 60 FPS

function animate(currentTime = 0) {
    requestAnimationFrame(animate);
    
    // Calculate time since last frame
    const deltaTime = currentTime - lastFrameTime;
    
    // Only update if enough time has passed (60 FPS cap)
    if (deltaTime >= targetFrameTime) {
        lastFrameTime = currentTime - (deltaTime % targetFrameTime);
        update();
        composer.render();
    }
}

// Event Listeners
window.addEventListener('keydown', e => input.keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => input.keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => {
    input.mouse.x = e.clientX;
    input.mouse.y = e.clientY;
});
window.addEventListener('mousedown', () => input.mouseDown = true);
window.addEventListener('mouseup', () => input.mouseDown = false);
window.addEventListener('resize', () => {
    camera.left = window.innerWidth / -2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = window.innerHeight / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload();
});

document.getElementById('continue-btn').addEventListener('click', () => {
    ui.enemyIntro.classList.add('hidden');
    beginWave();
});

// Debug spawner
document.querySelectorAll('.debug-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-enemy');
        const playerPos = game.player.mesh.position;
        
        // Spawn enemy near player (but not on top)
        const angle = Math.random() * Math.PI * 2;
        const distance = 200;
        const x = playerPos.x + Math.cos(angle) * distance;
        const y = playerPos.y + Math.sin(angle) * distance;
        
        game.enemies.push(new Enemy(x, y, type));
    });
});

// Start
startWave();
animate();
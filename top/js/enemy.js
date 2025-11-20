import * as THREE from 'three';
import { scene, GEOMETRIES, MATERIALS } from './core.js';

export class Enemy {
    constructor(x, y, type) {
        this.type = type;
        this.markedForDeletion = false;
        
        let geo, mat;
        this.radius = 15;
        this.speed = 2;
        this.hp = 10;
        this.maxHp = 10;
        this.scoreValue = 10;
        this.rotationSpeed = 0.05;

        switch (type) {
            case 'red':
                geo = GEOMETRIES.enemyRed;
                mat = MATERIALS.enemyRed;
                this.hp = 20;
                break;
            case 'red_orbiter':
                geo = GEOMETRIES.enemyRedSmall; // Small core
                mat = MATERIALS.enemyRed;
                this.hp = 30; // Slightly tankier core
                this.speed = 1.5; // Slower than normal red
                this.radius = 15; // Smaller collision radius for core
                this.scoreValue = 25;
                this.rotationSpeed = 0.02;
                this.orbiters = [];
                break;
            case 'blue':
                geo = GEOMETRIES.enemyBlue;
                mat = MATERIALS.enemyBlue;
                this.hp = 60;
                this.speed = 1.2;
                this.radius = 20;
                this.scoreValue = 20;
                this.rotationSpeed = 0.02;
                break;
            case 'yellow':
                geo = GEOMETRIES.enemyYellow;
                mat = MATERIALS.enemyYellow;
                this.hp = 10;
                this.speed = 4.5;
                this.radius = 12;
                this.scoreValue = 15;
                this.rotationSpeed = 0.1;
                break;
            case 'purple':
                geo = GEOMETRIES.enemyPurple;
                mat = MATERIALS.enemyPurple;
                this.hp = 30;
                this.speed = 1.0;
                this.radius = 18;
                this.scoreValue = 25;
                this.rotationSpeed = 0.03;
                this.pelletsEaten = 0;
                this.maxPellets = 5;
                this.totalPelletsConsumed = 0; // Track all consumed pellets for death burst
                break;
            case 'green':
                geo = GEOMETRIES.enemyGreen;
                mat = MATERIALS.enemyGreen.clone(); // Clone for pulsing effect
                this.hp = 15;
                this.speed = 0.8;
                this.radius = 15;
                this.scoreValue = 30;
                this.rotationSpeed = 0.04;
                this.healTimer = 0;
                this.healInterval = 180; // Heal every 3 seconds (60 FPS)
                this.healRadius = 150;
                this.healAmount = 5; // Increased from 2
                break;
            case 'white':
                geo = GEOMETRIES.enemyWhite;
                mat = MATERIALS.enemyWhite;
                this.hp = 20;
                this.speed = 1.5;
                this.radius = 14;
                this.scoreValue = 35;
                this.rotationSpeed = 0.02;
                this.wallTimer = 0;
                this.wallInterval = 240; // Create wall every 4 seconds
                this.hasOutline = true;
                break;
        }
        this.maxHp = this.hp;
        this.hasShockwaved = false;
        this.shockwaveActiveTimer = 0;

        // Root group for movement (doesn't rotate)
        this.root = new THREE.Group();
        this.root.position.set(x, y, 0);
        scene.add(this.root);

        // Clone material for purple to prevent shared color changes
        if (type === 'purple') {
            mat = mat.clone();
        }
        this.mesh = new THREE.Mesh(geo, mat);
        // Mesh is added to root, so it can rotate independently
        this.root.add(this.mesh);

        // Red Orbiter Setup
        if (type === 'red_orbiter') {
            this.orbiterGroup = new THREE.Group();
            this.root.add(this.orbiterGroup);
            
            // Create a special material for orbiters (transparent red shield look)
            const orbiterMat = new THREE.MeshBasicMaterial({ 
                color: 0xff4444, 
                transparent: true, 
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            for (let i = 0; i < 2; i++) {
                const orbiter = new THREE.Mesh(GEOMETRIES.enemyRedBig, orbiterMat); // Big orbiters
                // Position them on opposite sides
                const angle = i * Math.PI;
                const dist = 40; // Distance from center (increased for bigger orbiters)
                orbiter.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
                
                this.orbiterGroup.add(orbiter);
                this.orbiters.push({
                    mesh: orbiter,
                    angle: angle,
                    dist: dist,
                    hp: 15 // Takes more shots (was 8)
                });
            }
        }

        // White enemy gets a rotating outline
        if (type === 'white') {
            this.outline = new THREE.Mesh(
                GEOMETRIES.enemyWhiteOutline,
                MATERIALS.enemyWhiteOutline.clone()
            );
            this.outline.position.z = -0.1; // Slightly behind
            this.root.add(this.outline);
        }

        // Health bar background
        this.hpBarBg = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 4),
            new THREE.MeshBasicMaterial({ color: 0x550000 })
        );
        this.hpBarBg.position.y = -25;
        this.root.add(this.hpBarBg);

        // Health bar fg
        this.hpBar = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 4),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        this.hpBar.position.y = -25;
        this.hpBar.position.z = 0.1; // Slightly above
        this.root.add(this.hpBar);
    }

    update(playerPos) {
        const dx = playerPos.x - this.root.position.x;
        const dy = playerPos.y - this.root.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.root.position.x += (dx / dist) * this.speed;
            this.root.position.y += (dy / dist) * this.speed;
        }

        this.mesh.rotation.z += this.rotationSpeed;

        // White enemy outline counter-rotation
        if (this.type === 'white' && this.outline) {
            this.outline.rotation.z -= this.rotationSpeed * 2; // Rotate opposite direction, faster
            // Pulse the outline opacity
            const pulse = 0.6 + Math.sin(Date.now() * 0.005) * 0.3;
            this.outline.material.opacity = pulse;
        }

        // Purple enemy special behavior - pulsate when full
        if (this.type === 'purple' && this.pelletsEaten >= this.maxPellets) {
            const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1;
            this.mesh.scale.set(scale, scale, 1);
        }

        // Green healer special behavior - pulsate and heal
        if (this.type === 'green') {
            // Constant gentle pulse
            const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.15;
            this.mesh.scale.set(pulse, pulse, 1);
            
            // Glow effect
            const glowIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
            this.mesh.material.opacity = glowIntensity;
        }

        // Update HP Bar
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        this.hpBar.scale.x = hpPercent;
        this.hpBar.position.x = (hpPercent - 1) * 15; 

        // Update Orbiters
        if (this.type === 'red_orbiter' && this.orbiterGroup) {
            this.orbiterGroup.rotation.z += 0.03; // Rotate the whole group
            
            // Rotate individual orbiters for cool effect
            this.orbiters.forEach(o => {
                o.mesh.rotation.z -= 0.1; // Spin fast
            });
            
            // Check if orbiters are dead
            for (let i = this.orbiters.length - 1; i >= 0; i--) {
                if (this.orbiters[i].hp <= 0) {
                    // Remove mesh
                    this.orbiterGroup.remove(this.orbiters[i].mesh);
                    this.orbiters.splice(i, 1);
                }
            }
        }
    }

    eatPellet() {
        if (this.type !== 'purple') return false;
        
        this.pelletsEaten++;
        this.totalPelletsConsumed++;
        
        // Visual feedback - brief flash
        this.mesh.material.color.setHex(0xffffff);
        setTimeout(() => {
            this.mesh.material.color.setHex(0xaa44ff);
        }, 50);
        
        return this.pelletsEaten >= this.maxPellets; // Returns true if ready to spit
    }

    healNearbyEnemies(enemies, particleSystem) {
        if (this.type !== 'green') return;
        
        let healed = false;
        enemies.forEach(e => {
            if (e === this || e.markedForDeletion) return;
            
            const dx = e.root.position.x - this.root.position.x;
            const dy = e.root.position.y - this.root.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.healRadius) {
                e.hp = Math.min(e.maxHp, e.hp + this.healAmount);
                healed = true;
                
                // Small heal particle at healed enemy
                particleSystem.createHealParticle(e.root.position.x, e.root.position.y);
            }
        });
        
        if (healed) {
            // Create expanding heal wave visual
            particleSystem.createHealWave(this.root.position.x, this.root.position.y);
        }
    }

    createReflectingWall(walls) {
        if (this.type !== 'white') return;
        
        // Create a wall centered on enemy
        const angle = Math.random() * Math.PI * 2;
        const wallLength = 150;
        const wallThickness = 8; // Thicker wall (visual + collision)
        const wallLifetime = 300; // 5 seconds
        
        const cx = this.root.position.x;
        const cy = this.root.position.y;
        
        const wall = {
            x1: cx + Math.cos(angle) * wallLength / 2,
            y1: cy + Math.sin(angle) * wallLength / 2,
            x2: cx - Math.cos(angle) * wallLength / 2,
            y2: cy - Math.sin(angle) * wallLength / 2,
            thickness: wallThickness,
            life: wallLifetime,
            maxLife: wallLifetime,
            markedForDeletion: false,
            createVisual: function() {
                // Use PlaneGeometry for reliable thickness
                const geometry = new THREE.PlaneGeometry(wallLength, wallThickness);
                const material = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 1.0,
                    side: THREE.DoubleSide
                });
                this.mesh = new THREE.Mesh(geometry, material);
                
                // Position at center
                const centerX = (this.x1 + this.x2) / 2;
                const centerY = (this.y1 + this.y2) / 2;
                this.mesh.position.set(centerX, centerY, 0);
                
                // Rotate to match angle
                const dx = this.x2 - this.x1;
                const dy = this.y2 - this.y1;
                this.mesh.rotation.z = Math.atan2(dy, dx);
                
                scene.add(this.mesh);
            },
            update: function() {
                this.life--;
                if (this.life <= 0) {
                    this.markedForDeletion = true;
                }
                // Fade out in last second
                if (this.mesh && this.life < 60) {
                    this.mesh.material.opacity = this.life / 60;
                }
            },
            destroy: function() {
                if (this.mesh) {
                    scene.remove(this.mesh);
                    this.mesh.geometry.dispose();
                    this.mesh.material.dispose();
                }
            }
        };
        
        wall.createVisual();
        walls.push(wall);
    }

    spitPellets(player, bullets) {
        if (this.type !== 'purple' || this.pelletsEaten < this.maxPellets) return false;
        
        const count = this.pelletsEaten;
        this.pelletsEaten = 0;
        
        // Take 15 damage when spitting
        this.hp = Math.max(0, this.hp - 15);
        
        // Reset scale
        this.mesh.scale.set(1, 1, 1);
        
        const attackType = Math.random();
        console.log(`Purple enemy spitting! Type: ${attackType < 0.5 ? 'Tracking' : 'Spray'}, Count: ${count}`);
        
        // 50% chance: One big tracking pellet OR spray
        if (attackType < 0.5) {
            // Big tracking pellet
            const angle = Math.atan2(player.mesh.position.y - this.root.position.y, 
                                      player.mesh.position.x - this.root.position.x);
            const pellet = this.createEnemyPellet(this.root.position.x, this.root.position.y, angle, true);
            console.log("Created tracking pellet at:", pellet.mesh.position);
            bullets.push(pellet);
        } else {
            // Spray in random directions
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const pellet = this.createEnemyPellet(this.root.position.x, this.root.position.y, angle, false);
                bullets.push(pellet);
            }
            console.log(`Created ${count} spray pellets`);
        }
        
        return true; // Attack triggered
    }

    createEnemyPellet(x, y, angle, isTracking) {
        const pellet = {
            mesh: new THREE.Mesh(
                new THREE.CircleGeometry(isTracking ? 10 : 5, 8),
                new THREE.MeshBasicMaterial({ color: 0xaa44ff })
            ),
            radius: isTracking ? 10 : 5,
            velocity: {
                x: Math.cos(angle) * (isTracking ? 3 : 5),
                y: Math.sin(angle) * (isTracking ? 3 : 5)
            },
            isEnemyPellet: true,
            isTracking: isTracking,
            damage: 15,
            markedForDeletion: false,
            update: function(playerPos) {
                try {
                    if (this.isTracking && playerPos) {
                        const angle = Math.atan2(playerPos.y - this.mesh.position.y, 
                                                playerPos.x - this.mesh.position.x);
                        const currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
                        let diff = angle - currentAngle;
                        while (diff <= -Math.PI) diff += Math.PI * 2;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        
                        const newAngle = currentAngle + diff * 0.05;
                        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
                        this.velocity.x = Math.cos(newAngle) * speed;
                        this.velocity.y = Math.sin(newAngle) * speed;
                    }
                    
                    this.mesh.position.x += this.velocity.x;
                    this.mesh.position.y += this.velocity.y;
                    
                    const w = window.innerWidth / 2 + 500;
                    const h = window.innerHeight / 2 + 500;
                    if (Math.abs(this.mesh.position.x) > w || Math.abs(this.mesh.position.y) > h) {
                        this.markedForDeletion = true;
                    }
                } catch (e) {
                    console.error("Enemy pellet update error:", e);
                    this.markedForDeletion = true;
                }
            },
            destroy: function() {
                if (this.mesh && this.mesh.parent) {
                    this.mesh.parent.remove(this.mesh);
                }
                this.markedForDeletion = true;
            }
        };
        
        pellet.mesh.position.set(x, y, 0);
        scene.add(pellet.mesh);
        
        return pellet;
    }

    destroy() {
        scene.remove(this.root);
        this.markedForDeletion = true;
    }
}
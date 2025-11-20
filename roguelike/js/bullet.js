import * as THREE from 'three';
import { scene, GEOMETRIES, MATERIALS, getDistance } from './core.js';
import { particleSystem } from './particles.js';

export class Bullet {
    constructor(x, y, angle, damage, speed, enemies, isSuper = false, homing = false) {
        this.isSuper = isSuper;
        this.homing = homing;
        
        // Super bullet visuals: White, bigger (3-4x normal size)
        const mat = isSuper ? new THREE.MeshBasicMaterial({ color: 0xffffff }) : MATERIALS.bullet;
        const geo = isSuper ? new THREE.CircleGeometry(20, 6) : GEOMETRIES.bullet; // Much bigger for super

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(x, y, 0);
        scene.add(this.mesh);

        this.angle = angle;
        this.damage = isSuper ? damage * 3 : damage;
        this.speed = speed;
        this.enemies = enemies;
        this.radius = isSuper ? 20 : 4; // 5x bigger for collision
        this.markedForDeletion = false;
        this.homingStrength = isSuper ? 0.02 : 0.15;
        this.isReflected = false;
        
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };

        this.target = null;
        if (this.homing) this.findTarget();
    }

    findTarget() {
        if (this.isReflected || !this.homing) return; // Reflected bullets don't home
        
        let closest = null;
        let minDist = Infinity;
        
        for (const enemy of this.enemies) {
            if (enemy.markedForDeletion) continue;
            // Enemy uses .root now
            const dist = getDistance(this.mesh, enemy.root);
            if (dist < minDist && dist < 500) {
                minDist = dist;
                closest = enemy;
            }
        }
        this.target = closest;
    }

    reflect(originX, originY) {
        if (this.isReflected) return; // Prevent double reflection logic
        
        this.isReflected = true;
        this.target = null;
        
        // Visual change
        this.mesh.material = this.mesh.material.clone();
        this.mesh.material.color.setHex(0xff0000); // Red
        
        // Calculate vector away from shockwave origin
        const dx = this.mesh.position.x - originX;
        const dy = this.mesh.position.y - originY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        
        // Set new velocity OUTWARDS
        const speed = 12; // Fast return speed
        this.velocity.x = (dx / dist) * speed;
        this.velocity.y = (dy / dist) * speed;
        
        // Update rotation to face new direction
        this.mesh.rotation.z = Math.atan2(this.velocity.y, this.velocity.x);
    }

    update() {
        try {
            // Super Bullet Trail
            if (this.isSuper) {
                particleSystem.createBlockTrail(this.mesh.position.x, this.mesh.position.y);
            }

            // Fail safe: Check if target is dead or invalid
            if (this.target && (this.target.markedForDeletion || !this.target.root)) {
                this.target = null;
                if (!this.isReflected && this.homing) this.findTarget(); 
            }

            // Homing Logic (Only if not reflected and homing is enabled)
            if (this.target && !this.target.markedForDeletion && !this.isReflected && this.homing) {
                const targetAngle = Math.atan2(
                    this.target.root.position.y - this.mesh.position.y,
                    this.target.root.position.x - this.mesh.position.x
                );
                
                let currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
                let diff = targetAngle - currentAngle;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                currentAngle += diff * this.homingStrength;

                this.velocity.x = Math.cos(currentAngle) * this.speed;
                this.velocity.y = Math.sin(currentAngle) * this.speed;
                
                this.mesh.rotation.z = currentAngle;
            }

            // Apply Velocity
            this.mesh.position.x += this.velocity.x;
            this.mesh.position.y += this.velocity.y;

            // Bounds check
            const w = window.innerWidth / 2 + 200;
            const h = window.innerHeight / 2 + 200;
            if (Math.abs(this.mesh.position.x) > w || Math.abs(this.mesh.position.y) > h) {
                this.markedForDeletion = true;
            }
        } catch (e) {
            console.error("Bullet update error:", e);
            this.markedForDeletion = true; // Remove broken bullet
        }
    }

    destroy() {
        scene.remove(this.mesh);
        this.markedForDeletion = true;
    }
}
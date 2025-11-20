import * as THREE from 'three';
import { scene } from './core.js';

export class Shockwave {
    constructor(x, y, isMini = false) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = isMini ? 150 : 350;
        this.expansionSpeed = isMini ? 8 : 5; // Slower expansion for smoother look
        this.life = 1.0;
        this.decay = isMini ? 0.02 : 0.008; 
        this.isMini = isMini;
        this.age = 0;
        
        // Visuals: A ring
        const geometry = new THREE.RingGeometry(0.8, 1, 64);
        const material = new THREE.MeshBasicMaterial({ 
            color: isMini ? 0x00ff44 : 0x00ffff, 
            transparent: true, 
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, -1); // Just below bullets
        scene.add(this.mesh);
        
        this.markedForDeletion = false;
    }

    update(player, bullets) {
        try {
            // Expand
            this.radius += this.expansionSpeed;
            this.age++;
            
            // Calculate progress (0.0 to 1.0)
            const progress = Math.min(1, this.radius / this.maxRadius);
            
            // Update Visuals with smooth fade based on progress
            if (this.mesh) {
                this.mesh.scale.setScalar(this.radius);
                
                let targetOpacity = 0.8;
                
                if (this.isMini) {
                    // Mini shockwave: Simple fade out
                    targetOpacity = 0.8 * (1.0 - progress);
                } else {
                    // Blue shockwave: Squared falloff for faster fade
                    // (1 - progress)^2 starts at 1 and drops quickly
                    // At 50% progress, it's 0.25. At 80%, it's 0.04.
                    targetOpacity = 0.8 * Math.pow(1.0 - progress, 2);
                }
                
                this.mesh.material.opacity = Math.max(0, targetOpacity);
            }

            if (progress >= 1.0) {
                this.destroy();
                return;
            }

            // Logic: Check for entities inside the expanding wave
            // We want to affect things that are *inside* the current radius
            
            // 1. Bullets
            bullets.forEach(b => {
                if (b.isReflected || !b.mesh || b.isEnemyPellet) return; // Skip reflected, invalid, and enemy pellets
                
                const dx = b.mesh.position.x - this.x;
                const dy = b.mesh.position.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // If bullet is inside the shockwave and has reflect method
                if (dist < this.radius && b.reflect) {
                    b.reflect(this.x, this.y);
                }
            });

            // 2. Player (only for full shockwave)
            if (!this.isMini && player && player.mesh) {
                const dx = player.mesh.position.x - this.x;
                const dy = player.mesh.position.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.radius) {
                    // Calculate push direction
                    const angle = Math.atan2(dy, dx);
                    const pushForce = 12; // Strong push per frame
                    
                    player.mesh.position.x += Math.cos(angle) * pushForce;
                    player.mesh.position.y += Math.sin(angle) * pushForce;
                }
            }
        } catch (e) {
            console.error("Shockwave update error:", e);
            this.destroy();
        }
    }

    destroy() {
        this.markedForDeletion = true;
        scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
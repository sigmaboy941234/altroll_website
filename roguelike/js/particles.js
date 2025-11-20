import * as THREE from 'three';
import { scene, MATERIALS } from './core.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, color, count = 10, speed = 2) {
        const geometry = new THREE.CircleGeometry(2, 4);
        const material = new THREE.MeshBasicMaterial({ color: color, transparent: true });

        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());
            particle.position.set(x, y, 0);
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * speed + 1;
            
            this.particles.push({
                mesh: particle,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03
            });
            
            scene.add(particle);
        }
    }

    createHitEffect(x, y) {
        this.createExplosion(x, y, 0xffff00, 4, 3);
    }

    createBlockTrail(x, y) {
        const geometry = new THREE.PlaneGeometry(6, 6);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x + (Math.random()-0.5)*5, y + (Math.random()-0.5)*5, -1); // Behind bullet
        particle.rotation.z = Math.random() * Math.PI;
        
        this.particles.push({
            mesh: particle,
            vx: 0,
            vy: 0,
            life: 0.5,
            decay: 0.05
        });
        
        scene.add(particle);
    }

    createShockwave(x, y) {
        const geometry = new THREE.RingGeometry(10, 12, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x4444ff, transparent: true, side: THREE.DoubleSide });
        const wave = new THREE.Mesh(geometry, material);
        wave.position.set(x, y, -1);
        
        this.particles.push({
            mesh: wave,
            vx: 0,
            vy: 0,
            life: 1.5, // Lasts longer (was 1.0)
            decay: 0.015, // Slower decay (was 0.03)
            isWave: true
        });
        scene.add(wave);
    }

    createHealWave(x, y) {
        const geometry = new THREE.RingGeometry(8, 10, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff44, 
            transparent: true, 
            opacity: 0, // Start invisible
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const wave = new THREE.Mesh(geometry, material);
        wave.position.set(x, y, -1);
        wave.scale.setScalar(0.1); // Start small
        
        this.particles.push({
            mesh: wave,
            vx: 0,
            vy: 0,
            life: 1.0,
            decay: 0, // Don't decay life, rely on progress
            isWave: true,
            isHealWave: true,
            maxScale: 15,
            age: 0 // Track how long it's been alive
        });
        scene.add(wave);
    }

    createHealParticle(x, y) {
        const geometry = new THREE.CircleGeometry(3, 6);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff44, 
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x + (Math.random()-0.5)*20, y + (Math.random()-0.5)*20, 0);
        
        this.particles.push({
            mesh: particle,
            vx: 0,
            vy: -2, // Float upward
            life: 0.8,
            decay: 0.04
        });
        scene.add(particle);
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.life -= p.decay;
            
            if (p.isWave) {
                const targetScale = p.maxScale || 30;
                
                if (p.isHealWave) {
                    // Linear expansion for heal wave (smoother)
                    p.mesh.scale.addScalar(0.15); 
                } else {
                    // Exponential for others (explosive)
                    const scaleSpeed = p.maxScale ? 0.3 : 0.1;
                    p.mesh.scale.multiplyScalar(1 + scaleSpeed);
                }
                
                const currentScale = p.mesh.scale.x;
                const progress = Math.min(1, currentScale / targetScale);

                // Heal wave specific fade animation
                if (p.isHealWave) {
                    // Squared falloff for faster fade
                    const fade = 1.0 - progress;
                    const opacity = 0.7 * (fade * fade);
                    p.mesh.material.opacity = Math.max(0, opacity);
                } else {
                    p.mesh.material.opacity = p.life;
                }
                
                if (progress >= 1) p.life = 0; // Fade when max size reached
            } else {
                p.mesh.material.opacity = p.life;
                p.mesh.scale.setScalar(p.life);
            }

            if (p.life <= 0) {
                scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }
}

export const particleSystem = new ParticleSystem();
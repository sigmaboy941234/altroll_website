import * as THREE from 'three';
import { scene, GEOMETRIES, MATERIALS } from './core.js';
import { Bullet } from './bullet.js';
import { playShootSound } from './audio.js';

export class Player {
    constructor() {
        this.mesh = new THREE.Mesh(GEOMETRIES.player, MATERIALS.player);
        scene.add(this.mesh);
        
        this.radius = 15;
        this.speed = 5;
        this.maxHp = 100;
        this.hp = 100;
        this.damage = 10;
        this.fireRate = 12;
        this.bulletSpeed = 8;
        this.multishot = 1;
        this.homing = false;
        
        this.shootTimer = 0;
        
        // Special Attack Stats
        this.shotsLanded = 0;
        this.superChargeThreshold = 20; // Shots needed for super
        this.bulletHellThreshold = 50; // Shots needed for bullet hell (if we want it passive)
        
        // We'll use a charge meter for the "Supercharged" shot
        this.charge = 0;
    }

    update(input, enemies, bullets) {
        // Movement
        if (input.keys['w'] || input.keys['arrowup']) this.mesh.position.y += this.speed;
        if (input.keys['s'] || input.keys['arrowdown']) this.mesh.position.y -= this.speed;
        if (input.keys['a'] || input.keys['arrowleft']) this.mesh.position.x -= this.speed;
        if (input.keys['d'] || input.keys['arrowright']) this.mesh.position.x += this.speed;

        // Constrain
        const w = window.innerWidth / 2 - 20;
        const h = window.innerHeight / 2 - 20;
        this.mesh.position.x = Math.max(-w, Math.min(w, this.mesh.position.x));
        this.mesh.position.y = Math.max(-h, Math.min(h, this.mesh.position.y));

        // Rotation
        // Convert mouse screen coords to world coords
        // Since camera is centered at 0,0 and orthographic:
        const worldMouseX = input.mouse.x - window.innerWidth / 2;
        const worldMouseY = -(input.mouse.y - window.innerHeight / 2); // Invert Y for Three.js

        const dx = worldMouseX - this.mesh.position.x;
        const dy = worldMouseY - this.mesh.position.y;
        this.mesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2; // Adjust for triangle orientation

        // Shooting
        if (this.shootTimer > 0) this.shootTimer--;
        
        if (input.mouseDown && this.shootTimer <= 0) {
            this.shoot(enemies, bullets);
        }
    }

    shoot(enemies, bullets) {
        this.shootTimer = this.fireRate;
        playShootSound();
        
        const isSuper = this.charge >= this.superChargeThreshold;
        if (isSuper) {
            this.charge = 0; // Reset charge
            // Update UI
            document.getElementById('charge-bar').style.width = '0%';
        }

        const baseAngle = this.mesh.rotation.z + Math.PI / 2;
        const startAngle = baseAngle - (this.multishot - 1) * 0.1;
        
        for (let i = 0; i < this.multishot; i++) {
            const angle = startAngle + i * 0.2;
            const bullet = new Bullet(
                this.mesh.position.x + Math.cos(baseAngle) * 20, 
                this.mesh.position.y + Math.sin(baseAngle) * 20, 
                angle, 
                this.damage, 
                this.bulletSpeed,
                enemies,
                isSuper,
                this.homing
            );
            bullets.push(bullet);
        }
    }

    addCharge(amount) {
        this.charge = Math.min(this.superChargeThreshold, this.charge + amount);
        const pct = (this.charge / this.superChargeThreshold) * 100;
        document.getElementById('charge-bar').style.width = `${pct}%`;
    }
}
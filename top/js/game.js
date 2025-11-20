import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Particle } from './particles.js';
import { checkCollision, randomRange } from './utils.js';
import { getRandomUpgrades } from './upgrade.js';
import { playHitSound, playExplosionSound } from './audio.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.player = new Player(this.width / 2, this.height / 2);
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        
        this.wave = 1;
        this.waveTimer = 0;
        this.enemiesToSpawn = 0;
        this.spawnTimer = 0;
        this.gameState = 'playing'; // playing, upgrade, gameover
        
        this.score = 0;
        
        this.ui = {
            score: document.getElementById('score'),
            upgradeMenu: document.getElementById('upgrade-menu'),
            upgradeOptions: document.getElementById('upgrade-options'),
            gameOver: document.getElementById('game-over')
        };

        this.startWave();
    }

    startWave() {
        this.enemiesToSpawn = 5 + Math.floor(this.wave * 2.5);
        this.spawnTimer = 0;
        this.ui.score.innerText = `Wave: ${this.wave}`;
    }

    spawnEnemy() {
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        const buffer = 50;

        switch(edge) {
            case 0: x = Math.random() * this.width; y = -buffer; break;
            case 1: x = this.width + buffer; y = Math.random() * this.height; break;
            case 2: x = Math.random() * this.width; y = this.height + buffer; break;
            case 3: x = -buffer; y = Math.random() * this.height; break;
        }

        // Determine type based on wave and random chance
        let type = 'red';
        const rand = Math.random();
        
        if (this.wave > 2 && rand < 0.2) type = 'blue';
        else if (this.wave > 4 && rand < 0.4) type = 'yellow';
        
        this.enemies.push(new Enemy(x, y, type));
    }

    update(input) {
        if (this.gameState !== 'playing') return;

        // Spawning
        if (this.enemiesToSpawn > 0) {
            this.spawnTimer--;
            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.enemiesToSpawn--;
                this.spawnTimer = Math.max(20, 60 - this.wave * 2); // Spawn faster each wave
            }
        } else if (this.enemies.length === 0) {
            // Wave cleared
            this.gameState = 'upgrade';
            this.showUpgradeMenu();
            return;
        }

        // Player
        const newBullets = this.player.update(input, this.enemies);
        this.bullets.push(...newBullets);

        // Bullets
        this.bullets.forEach(b => b.update());
        this.bullets = this.bullets.filter(b => !b.markedForDeletion);

        // Enemies
        this.enemies.forEach(e => e.update(this.player));

        // Particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        // Collisions
        this.checkCollisions();

        // Game Over check
        if (this.player.hp <= 0) {
            this.gameState = 'gameover';
            this.ui.gameOver.classList.remove('hidden');
        }
    }

    checkCollisions() {
        // Bullet - Enemy
        for (const bullet of this.bullets) {
            for (const enemy of this.enemies) {
                if (checkCollision(bullet, enemy)) {
                    bullet.markedForDeletion = true;
                    enemy.hp -= bullet.damage;
                    playHitSound();
                    
                    // Hit VFX
                    for (let i = 0; i < 3; i++) {
                        this.particles.push(new Particle(bullet.x, bullet.y, '#ffff00'));
                    }

                    if (enemy.hp <= 0 && !enemy.markedForDeletion) {
                        enemy.markedForDeletion = true;
                        this.score += enemy.scoreValue;
                        playExplosionSound();
                        
                        // Death VFX
                        for (let i = 0; i < 10; i++) {
                            this.particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                        }
                    }
                    break; // Bullet hits one enemy
                }
            }
        }

        // Enemy - Player
        for (const enemy of this.enemies) {
            if (!enemy.markedForDeletion && checkCollision(enemy, this.player)) {
                this.player.hp -= 0.5; // Continuous damage on contact
                // Push back?
            }
        }

        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw entities
        this.particles.forEach(p => p.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        if (this.gameState !== 'gameover') {
            this.player.draw(this.ctx);
        }
    }

    showUpgradeMenu() {
        this.ui.upgradeMenu.classList.remove('hidden');
        this.ui.upgradeOptions.innerHTML = '';
        
        const options = getRandomUpgrades(3);
        
        options.forEach(upgrade => {
            const div = document.createElement('div');
            div.className = 'upgrade-card';
            div.innerHTML = `
                <div class="upgrade-title">${upgrade.name}</div>
                <div class="upgrade-desc">${upgrade.description}</div>
            `;
            div.onclick = () => {
                upgrade.apply(this.player);
                this.ui.upgradeMenu.classList.add('hidden');
                this.wave++;
                this.startWave();
                this.gameState = 'playing';
            };
            this.ui.upgradeOptions.appendChild(div);
        });
    }
}
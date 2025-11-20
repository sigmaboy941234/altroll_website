import * as THREE from 'three';

// Shared resources
export const scene = new THREE.Scene();
export const camera = new THREE.OrthographicCamera(
    window.innerWidth / -2, window.innerWidth / 2,
    window.innerHeight / 2, window.innerHeight / -2,
    1, 1000
);
camera.position.z = 10;

// Materials
export const MATERIALS = {
    player: new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
    enemyRed: new THREE.MeshBasicMaterial({ color: 0xff4444 }),
    enemyBlue: new THREE.MeshBasicMaterial({ color: 0x4444ff }),
    enemyYellow: new THREE.MeshBasicMaterial({ color: 0xffff44 }),
    enemyPurple: new THREE.MeshBasicMaterial({ color: 0xaa44ff }),
    enemyGreen: new THREE.MeshBasicMaterial({ color: 0x00ff44, transparent: true, opacity: 0.8 }),
    enemyWhite: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    enemyWhiteOutline: new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 }),
    bullet: new THREE.MeshBasicMaterial({ color: 0xffff00 }),
    bulletSuper: new THREE.MeshBasicMaterial({ color: 0xff00ff }),
    particle: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
};

// Geometries
export const GEOMETRIES = {
    player: new THREE.CircleGeometry(15, 3), // Triangle
    enemyRed: new THREE.PlaneGeometry(30, 30), // Square
    enemyRedSmall: new THREE.PlaneGeometry(12, 12), // Small square for core
    enemyRedBig: new THREE.PlaneGeometry(24, 24), // Big square for orbiters
    enemyBlue: new THREE.CircleGeometry(20, 6), // Hexagon (Tanky)
    enemyYellow: new THREE.CircleGeometry(12, 3), // Triangle (Fast) - rotated differently
    enemyPurple: new THREE.CircleGeometry(18, 8), // Octagon
    enemyGreen: new THREE.RingGeometry(12, 15, 4), // Hollow square (ring with 4 segments)
    enemyWhite: new THREE.PlaneGeometry(24, 24), // Square core
    enemyWhiteOutline: new THREE.PlaneGeometry(28, 28), // Larger square for rotating outline
    bullet: new THREE.CircleGeometry(4, 8),
    bulletSuper: new THREE.CircleGeometry(12, 16)
};

export function getDistance(o1, o2) {
    const dx = o1.position.x - o2.position.x;
    const dy = o1.position.y - o2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function checkCollision(mesh1, radius1, mesh2, radius2) {
    const dist = getDistance(mesh1, mesh2);
    return dist < (radius1 + radius2);
}
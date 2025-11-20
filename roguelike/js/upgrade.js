export const UPGRADES = [
    {
        id: 'damage',
        name: 'Damage Up',
        description: 'Increase bullet damage by 5',
        apply: (player) => { player.damage += 5; }
    },
    {
        id: 'firerate',
        name: 'Rapid Fire',
        description: 'Increase fire rate by 15%',
        apply: (player) => { player.fireRate = Math.max(2, player.fireRate * 0.85); }
    },
    {
        id: 'speed',
        name: 'Speed Up',
        description: 'Increase movement speed',
        apply: (player) => { player.speed += 1; }
    },
    {
        id: 'multishot',
        name: 'Multishot',
        description: 'Fire an additional bullet',
        apply: (player) => { player.multishot += 1; }
    },
    {
        id: 'health',
        name: 'Max Health',
        description: 'Increase max HP by 20 and heal',
        apply: (player) => { 
            player.maxHp += 20; 
            player.hp = player.maxHp; 
        }
    },
    {
        id: 'bulletspeed',
        name: 'Bullet Speed',
        description: 'Bullets travel faster',
        apply: (player) => { player.bulletSpeed += 2; }
    },
    {
        id: 'homing',
        name: 'Homing Shots',
        description: 'Bullets home in on enemies',
        apply: (player) => { player.homing = true; }
    }
];

export function getRandomUpgrades(count) {
    const shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
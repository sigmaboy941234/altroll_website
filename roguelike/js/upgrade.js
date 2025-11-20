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
        apply: (player) => { player.multishot += 1; },
        tier: true // Indicates this upgrade has tiers/can be stacked indefinitely with changing names if we wanted, but for now just always available
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
        apply: (player) => { player.homing = true; },
        oneTime: true // New flag for one-time upgrades
    }
];

export function getRandomUpgrades(count, player) {
    // Filter out one-time upgrades that the player already has
    const availableUpgrades = UPGRADES.filter(u => {
        if (u.oneTime && player.homing && u.id === 'homing') return false;
        return true;
    });

    // Modify Multishot name/desc based on current tier
    const multishotUpgrade = availableUpgrades.find(u => u.id === 'multishot');
    if (multishotUpgrade) {
        const nextCount = player.multishot + 1;
        multishotUpgrade.name = `Multishot (Tier ${player.multishot})`;
        multishotUpgrade.description = `Fire ${nextCount} bullets at once`;
    }

    const shuffled = [...availableUpgrades].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
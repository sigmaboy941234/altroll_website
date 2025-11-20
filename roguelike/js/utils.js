export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function checkCollision(circle, rect) {
    // Simple circle-rect collision (assuming rect is axis aligned for simplicity, 
    // but enemies are rotating cubes? Let's stick to simple circle-circle or circle-rect approximation)
    // For this game, treating everything as circles for collision is easiest and feels fine for fast paced.
    // Let's use circle-circle collision for now, assuming enemies have a radius.
    
    const dx = circle.x - rect.x;
    const dy = circle.y - rect.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle.radius + rect.radius;
}

export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}
/**
 * Validation script for intro animation logic
 * Tests the graph generation and build sequence without Three.js
 */

const INTRO_CONFIG = {
    latSegments: 12,
    lonSegments: 16,
};

// Generate nodes
const nodes = [];
const latSegments = INTRO_CONFIG.latSegments;
const lonSegments = INTRO_CONFIG.lonSegments;
const planetRadius = 40;

for (let lat = 0; lat <= latSegments; lat++) {
    const phi = (lat / latSegments) * Math.PI;
    for (let lon = 0; lon < lonSegments; lon++) {
        const theta = (lon / lonSegments) * Math.PI * 2;
        const x = planetRadius * Math.sin(phi) * Math.cos(theta);
        const y = planetRadius * Math.cos(phi);
        const z = planetRadius * Math.sin(phi) * Math.sin(theta);
        nodes.push({ x, y, z });
    }
}

console.log(`✓ Generated ${nodes.length} nodes`);

// Generate edges
const edges = [];
const getNodeIndex = (lat, lon) => {
    lon = (lon + lonSegments) % lonSegments;
    if (lat < 0 || lat > latSegments) return -1;
    return lat * lonSegments + lon;
};

for (let lat = 0; lat <= latSegments; lat++) {
    for (let lon = 0; lon < lonSegments; lon++) {
        const currentIdx = getNodeIndex(lat, lon);
        
        // Horizontal edge
        if (lat < latSegments) {
            const nextLonIdx = getNodeIndex(lat, lon + 1);
            if (nextLonIdx >= 0) {
                edges.push([currentIdx, nextLonIdx]);
            }
        }
        
        // Vertical edge
        if (lat < latSegments) {
            const nextLatIdx = getNodeIndex(lat + 1, lon);
            if (nextLatIdx >= 0) {
                edges.push([currentIdx, nextLatIdx]);
            }
        }
    }
}

console.log(`✓ Generated ${edges.length} edges`);

// Compute build sequence
const buildSequence = [];
const visitedEdges = new Set();
const seedNodeIdx = 0;

// Build adjacency map
const adjacency = new Map();
edges.forEach(([i0, i1], edgeIdx) => {
    if (!adjacency.has(i0)) adjacency.set(i0, []);
    if (!adjacency.has(i1)) adjacency.set(i1, []);
    adjacency.get(i0).push({ node: i1, edgeIdx, reversed: false });
    adjacency.get(i1).push({ node: i0, edgeIdx, reversed: true });
});

// Improved DFS that maintains continuity
let currentNode = seedNodeIdx;
const visitedNodes = new Set();
const backtrackStack = [currentNode];

let iterations = 0;
const maxIterations = edges.length * 3;

while (buildSequence.length < edges.length && iterations < maxIterations) {
    iterations++;
    visitedNodes.add(currentNode);
    const neighbors = adjacency.get(currentNode) || [];
    
    // Find unvisited edge from current node
    let foundUnvisited = false;
    for (const neighbor of neighbors) {
        if (!visitedEdges.has(neighbor.edgeIdx)) {
            visitedEdges.add(neighbor.edgeIdx);
            
            // Ensure continuity: start from current node
            const startNode = currentNode;
            const endNode = neighbor.node;
            
            buildSequence.push({
                edgeIdx: neighbor.edgeIdx,
                startNode: startNode,
                endNode: endNode,
            });
            
            backtrackStack.push(endNode);
            currentNode = endNode;
            foundUnvisited = true;
            break;
        }
    }
    
    // Backtrack if no unvisited edges
    if (!foundUnvisited) {
        backtrackStack.pop();
        if (backtrackStack.length > 0) {
            currentNode = backtrackStack[backtrackStack.length - 1];
        } else {
            // Find any unvisited node to start new component
            let foundNewStart = false;
            for (let i = 0; i < nodes.length; i++) {
                if (!visitedNodes.has(i) && adjacency.has(i)) {
                    currentNode = i;
                    backtrackStack.push(i);
                    foundNewStart = true;
                    break;
                }
            }
            if (!foundNewStart) break;
        }
    }
}

console.log(`✓ Built sequence with ${buildSequence.length} edges in ${iterations} iterations`);

// Validate continuity
let discontinuities = 0;
for (let i = 1; i < buildSequence.length; i++) {
    const prev = buildSequence[i - 1];
    const curr = buildSequence[i];
    if (prev.endNode !== curr.startNode) {
        discontinuities++;
    }
}

console.log(`✓ Continuity: ${buildSequence.length - discontinuities}/${buildSequence.length} continuous (${discontinuities} gaps)`);

// Validate no duplicate edges
const uniqueEdges = new Set(buildSequence.map(s => s.edgeIdx));
console.log(`✓ Unique edges: ${uniqueEdges.size} / ${buildSequence.length}`);

// Calculate estimated build time
const segmentDurationMs = 110;
const totalBuildTimeMs = buildSequence.length * segmentDurationMs;
const totalBuildTimeSec = (totalBuildTimeMs / 1000).toFixed(1);

console.log(`\n--- Summary ---`);
console.log(`Nodes: ${nodes.length}`);
console.log(`Edges generated: ${edges.length}`);
console.log(`Build sequence: ${buildSequence.length} edges`);
console.log(`Estimated build time: ${totalBuildTimeSec}s`);
console.log(`Discontinuities: ${discontinuities} (${((discontinuities/buildSequence.length)*100).toFixed(1)}%)`);

if (buildSequence.length === edges.length && uniqueEdges.size === buildSequence.length) {
    console.log(`\n✅ Validation PASSED - All edges included, no duplicates!`);
    if (discontinuities === 0) {
        console.log(`🎯 Perfect continuity - single unbroken chain!`);
    } else if (discontinuities < 10) {
        console.log(`⚠️  Few discontinuities - acceptable for complex graph`);
    }
} else {
    console.log(`\n❌ Validation FAILED`);
}

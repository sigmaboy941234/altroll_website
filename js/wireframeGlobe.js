// /js/wireframeGlobe.js
import * as THREE from '/vendor/three/three.module.js';

export function createWireframeGlobe(scene, { radius=3.0, subdiv=4, material }) {
  const root = new THREE.Group();
  scene.add(root);

  const geo = new THREE.IcosahedronGeometry(radius, subdiv);
  const edges = new THREE.EdgesGeometry(geo);

  // Build adjacency and plan
  const plan = buildPlan(edges);

  // Preallocate big position buffer for all locked edges
  const maxEdges = plan.length;
  const lockedPos = new Float32Array(maxEdges * 2 * 3);
  const lockedGeom = new THREE.BufferGeometry();
  lockedGeom.setAttribute('position', new THREE.BufferAttribute(lockedPos, 3));
  lockedGeom.setDrawRange(0, 0); // we'll extend as we lock edges

  const locked = new THREE.LineSegments(lockedGeom, material);
  root.add(locked);

  return {
    root,
    locked,
    lockedPos,
    lockedCount: 0,
    geom: geo,
    edges,
    plan,
  };
}

export function appendLocked(wire, A, B) {
  const { lockedPos } = wire;
  let i = wire.lockedCount * 2 * 3;
  lockedPos[i++] = A.x; lockedPos[i++] = A.y; lockedPos[i++] = A.z;
  lockedPos[i++] = B.x; lockedPos[i++] = B.y; lockedPos[i++] = B.z;
  wire.lockedCount++;
  wire.locked.geometry.attributes.position.needsUpdate = true;
  wire.locked.geometry.setDrawRange(0, wire.lockedCount * 2);
}

export function playEdge(wire, edge, durationMs = 53) {
  // Ultra-simple: append immediately, but delay to "simulate" travel time.
  // If you want an actual traveling beam, animate a small segment mesh here.
  const [ai, bi] = edge;
  const A = vertexOf(wire.geom, ai);
  const B = vertexOf(wire.geom, bi);
  return new Promise(res => {
    appendLocked(wire, A, B);
    setTimeout(res, durationMs);
  });
}

function vertexOf(geo, index) {
  const a = index * 3;
  const p = geo.attributes.position.array;
  return new THREE.Vector3(p[a], p[a+1], p[a+2]);
}

function buildPlan(edgesGeo) {
  // Convert EdgesGeometry position list into adjacency, then DFS
  const pos = edgesGeo.getAttribute('position').array;
  const indexAttr = edgesGeo.getIndex();
  
  // Map edge endpoints to vertex indices on the base geo
  // For an EdgesGeometry, each pair in index is a distinct vertex; we'll dedupe by position.
  const key = (x,y,z) => `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
  const map = new Map();
  let vCount = 0;
  const getIdx = (x,y,z)=>{
    const k = key(x,y,z);
    if (!map.has(k)) map.set(k, vCount++);
    return map.get(k);
  };

  const edges = [];
  
  if (indexAttr) {
    // Has index buffer
    const idx = indexAttr.array;
    for (let i=0;i<idx.length;i+=2){
      const a = idx[i]*3, b = idx[i+1]*3;
      const ax = pos[a], ay = pos[a+1], az = pos[a+2];
      const bx = pos[b], by = pos[b+1], bz = pos[b+2];
      const ai = getIdx(ax,ay,az);
      const bi = getIdx(bx,by,bz);
      edges.push([ai,bi]);
    }
  } else {
    // No index buffer - positions are sequential pairs
    for (let i=0;i<pos.length;i+=6){
      const ax = pos[i], ay = pos[i+1], az = pos[i+2];
      const bx = pos[i+3], by = pos[i+4], bz = pos[i+5];
      const ai = getIdx(ax,ay,az);
      const bi = getIdx(bx,by,bz);
      edges.push([ai,bi]);
    }
  }

  const adj = Array.from({length: vCount}, ()=> new Set());
  edges.forEach(([a,b]) => { adj[a].add(b); adj[b].add(a); });

  // DFS that prefers small angular change to "flow" around
  const visited = new Set();
  const out = [];
  const seed = 0;
  let cur = seed;

  function nextNeighbor(a, prev) {
    let best = null, bestScore = -1e9;
    const aVec = vOf(a);
    const dir = prev != null ? vOf(a).clone().sub(vOf(prev)).normalize() : new THREE.Vector3(1,0,0);

    for (const b of adj[a]) {
      const eKey = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (visited.has(eKey)) continue;
      const candDir = vOf(b).clone().sub(aVec).normalize();
      const score = 0.9 * dir.dot(candDir) - 0.1 * (Math.abs(vOf(b).y) * 0.1); // bias continuity
      if (score > bestScore){ bestScore = score; best = b; }
    }
    return best;
  }

  function vOf(i){
    // reconstruct from map: we only need directions; approximate on unit sphere
    // (We don't have the original geo vertices here; that's fine for scoring.)
    // Use inverse of map if needed; for brevity, return unit axes cycling:
    const phi = (i / vCount) * Math.PI * 2.0;
    const theta = (i % Math.max(1, vCount/2)) / (Math.max(1, vCount/2)) * Math.PI;
    return new THREE.Vector3(
      Math.sin(theta)*Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta)*Math.sin(phi)
    );
  }

  let prev = null;
  while (true) {
    const b = nextNeighbor(cur, prev);
    if (b == null) {
      // find any unvisited edge to continue
      let moved = false;
      for (let a=0;a<vCount;a++){
        for (const nb of adj[a]) {
          const eKey = a < nb ? `${a}-${nb}` : `${nb}-${a}`;
          if (!visited.has(eKey)) { cur = a; prev = null; moved = true; break; }
        }
        if (moved) break;
      }
      if (!moved) break; // done
      continue;
    }
    const eKey = cur < b ? `${cur}-${b}` : `${b}-${cur}`;
    visited.add(eKey);
    out.push([cur, b]);
    prev = cur;
    cur = b;
  }
  return out;
}

export function disposeWireframe(wire) {
  wire.locked.geometry.dispose();
  wire.geom.dispose();
}

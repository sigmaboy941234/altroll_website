// Three.js Module Wrapper
// This file provides ES6 module exports for the THREE.js library loaded via CDN
// When the CDN script loads, it creates a global THREE object
// This wrapper exports that global object as a module

// Check if THREE is available globally (loaded via CDN)
if (typeof THREE === 'undefined') {
    console.warn('THREE.js not loaded yet. Make sure the CDN script is included before module scripts.');
}

// Export the global THREE object and commonly used classes
export default THREE;
export const Scene = THREE?.Scene;
export const PerspectiveCamera = THREE?.PerspectiveCamera;
export const WebGLRenderer = THREE?.WebGLRenderer;
export const Mesh = THREE?.Mesh;
export const Group = THREE?.Group;
export const ShaderMaterial = THREE?.ShaderMaterial;
export const IcosahedronGeometry = THREE?.IcosahedronGeometry;
export const EdgesGeometry = THREE?.EdgesGeometry;
export const BufferGeometry = THREE?.BufferGeometry;
export const BufferAttribute = THREE?.BufferAttribute;
export const LineSegments = THREE?.LineSegments;
export const Vector3 = THREE?.Vector3;
export const Color = THREE?.Color;
export const Clock = THREE?.Clock;
export const UniformsUtils = THREE?.UniformsUtils;
export { THREE as THREE };

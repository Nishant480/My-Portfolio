import * as THREE from "three";

const D2R = Math.PI / 180;

/** Point on a unit sphere matching three's SphereGeometry equirectangular UVs. */
export function latLonToVec3(lat: number, lon: number, r = 1) {
  const la = lat * D2R;
  const lo = lon * D2R;
  return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
}

/** Rotation that brings (lat, lon) to face the camera on +Z, north up. */
export function faceQuat(lat: number, lon: number, out = new THREE.Quaternion()) {
  const lo = lon * D2R;
  const yaw = -Math.atan2(Math.cos(lo), -Math.sin(lo));
  return out.setFromEuler(new THREE.Euler(lat * D2R, yaw, 0, "XYZ"));
}

// Hand-traced, simplified West Bengal outline (lon, lat).
export const WEST_BENGAL: [number, number][] = [
  [88.05, 27.2], [88.55, 27.15], [88.85, 27.05], [89.1, 26.85], [89.5, 26.82], [89.86, 26.7],
  [89.85, 26.3], [89.55, 26.05], [89.1, 26.2], [88.75, 26.3], [88.5, 26.42], [88.33, 26.2],
  [88.2, 25.95], [88.45, 25.6], [88.1, 25.3], [88.2, 24.95], [88.15, 24.6], [88.45, 24.3],
  [88.75, 24.2], [88.72, 23.85], [88.6, 23.55], [88.85, 23.25], [88.95, 22.85], [89.0, 22.45],
  [89.05, 22.0], [88.8, 21.65], [88.3, 21.58], [87.85, 21.68], [87.48, 21.62], [87.25, 21.85],
  [86.85, 22.05], [86.75, 22.35], [86.4, 22.55], [86.0, 22.6], [85.85, 22.95], [86.05, 23.45],
  [86.5, 23.65], [86.85, 23.8], [87.2, 24.05], [87.6, 24.3], [87.75, 24.7], [87.8, 25.1],
  [87.95, 25.35], [87.8, 25.6], [87.95, 25.95], [88.1, 26.3], [88.0, 26.5], [88.1, 26.75],
  [88.0, 27.0], [88.05, 27.2],
];

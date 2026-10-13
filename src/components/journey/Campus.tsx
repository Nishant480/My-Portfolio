"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { facadeEmissive, facadeTexture, glassTexture, podiumTexture, signTexture } from "./canvasTextures";

// Stylised IIT Kharagpur: Atal Bihari Vajpayee Hall in the middle (U-shaped,
// facing +Z), the Main Building far behind it, roads, trees and other blocks.
// The glowing window on the front facade is "my room"; the camera flies into it.

// Room 118 is on the first floor of the main tower; its window glows.
export const LIT_WINDOW = new THREE.Vector3(-4, 4.95, 5.02);
const ENTRANCE = new THREE.Vector3(6, 1.6, 13);

export const campusCamera = {
  pos: new THREE.CatmullRomCurve3([
    new THREE.Vector3(70, 170, 210),
    new THREE.Vector3(40, 72, 115),
    new THREE.Vector3(12, 24, 55),
    new THREE.Vector3(-3, 7, 22),
    new THREE.Vector3(6, 1.8, 19),
    new THREE.Vector3(6, 1.65, 14.2),
  ]),
  look: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -30),
    new THREE.Vector3(0, 10, -2),
    new THREE.Vector3(0, 10, 4),
    LIT_WINDOW.clone(),
    ENTRANCE.clone(),
    new THREE.Vector3(6, 1.6, 10),
  ]),
};

const skyVertex = /* glsl */ `
  varying vec3 vPos;
  void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const skyFragment = /* glsl */ `
  varying vec3 vPos;
  void main() {
    float h = normalize(vPos).y;
    vec3 top = vec3(0.23, 0.35, 0.62);
    vec3 mid = vec3(0.98, 0.66, 0.45);
    vec3 low = vec3(1.0, 0.82, 0.6);
    vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.45, h)) : low;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Trees() {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; out.length < 420 && i < 4000; i++) {
      const x = (rand(i) - 0.5) * 380;
      const z = (rand(i + 999) - 0.5) * 380;
      if (x > -34 && x < 20 && z > -12 && z < 30) continue; // hall + forecourt
      if (Math.abs(z - 24) < 5) continue; // road
      if (Math.abs(x) < 50 && z < -105 && z > -140) continue; // main building
      out.push([x, z, 0.7 + rand(i + 5) * 0.8]);
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    spots.forEach(([x, z, s], i) => {
      m.compose(new THREE.Vector3(x, 1.2 * s, z), q, new THREE.Vector3(s, s, s));
      trunks.current!.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, 3.6 * s, z), q, new THREE.Vector3(s, s * (0.9 + rand(i) * 0.5), s));
      crowns.current!.setMatrixAt(i, m);
      crowns.current!.setColorAt(i, c.setHSL(0.27 + rand(i + 3) * 0.08, 0.45, 0.25 + rand(i + 7) * 0.12));
    });
    trunks.current!.instanceMatrix.needsUpdate = true;
    crowns.current!.instanceMatrix.needsUpdate = true;
    if (crowns.current!.instanceColor) crowns.current!.instanceColor.needsUpdate = true;
  }, [spots]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 2.4, 6]} />
        <meshStandardMaterial color="#6b4a2f" />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow>
        <icosahedronGeometry args={[1.8, 0]} />
        <meshStandardMaterial flatShading />
      </instancedMesh>
    </group>
  );
}

function Blocks() {
  const blocks = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
    const colors = ["#d9c9a8", "#c96f4a", "#e6dccb", "#b8664a"];
    for (let i = 0; out.length < 34 && i < 500; i++) {
      const x = (rand(i + 50) - 0.5) * 320;
      const z = (rand(i + 70) - 0.5) * 320;
      if (Math.abs(x) < 45 && z > -150 && z < 45) continue;
      const w = 10 + rand(i + 1) * 18;
      const d = 8 + rand(i + 2) * 14;
      const h = 5 + rand(i + 3) * 10;
      out.push({ p: [x, h / 2, z], s: [w, h, d], c: colors[i % colors.length] });
    }
    return out;
  }, []);
  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={b.p} castShadow receiveShadow>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={b.c} />
        </mesh>
      ))}
    </group>
  );
}

function MainBuilding() {
  return (
    <group position={[0, 0, -122]}>
      <mesh position={[0, 7, 0]} castShadow>
        <boxGeometry args={[90, 14, 12]} />
        <meshStandardMaterial color="#b9573b" />
      </mesh>
      <mesh position={[0, 14.4, 0]}>
        <boxGeometry args={[92, 0.8, 13]} />
        <meshStandardMaterial color="#efe6d2" />
      </mesh>
      <mesh position={[0, 19, 2]} castShadow>
        <boxGeometry args={[12, 38, 12]} />
        <meshStandardMaterial color="#c4623f" />
      </mesh>
      <mesh position={[0, 39, 2]}>
        <boxGeometry args={[13, 2, 13]} />
        <meshStandardMaterial color="#efe6d2" />
      </mesh>
      <mesh position={[0, 46, 2]}>
        <cylinderGeometry args={[0.15, 0.15, 12]} />
        <meshStandardMaterial color="#ddd" />
      </mesh>
      <mesh position={[1.6, 50.5, 2]}>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#ff9933" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Hall({ hallName }: { hallName: string }) {
  const tex = useMemo(
    () => ({
      tower: facadeTexture(6, 8, 1, 6, "#ecebe4"),
      towerGlow: facadeEmissive(6, 8, 1, 6),
      wing: facadeTexture(4, 6, -1, -1, "#ecebe4"),
      wingGlow: facadeEmissive(4, 6, -1, -1),
      podium: podiumTexture(),
      glass: glassTexture(),
      sign: signTexture([hallName, "Hall of Residence · IIT Kharagpur"]),
    }),
    [hallName],
  );
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e9e7e0" }), []);
  const peach = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f0c39c" }), []);
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8a5a4a" }), []);
  const glass = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.glass, metalness: 0.55, roughness: 0.18, color: "#ffffff" }),
    [tex],
  );
  const tower = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.tower, emissiveMap: tex.towerGlow, emissive: "#ffffff", emissiveIntensity: 1.4 }),
    [tex],
  );
  const wing = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.wing, emissiveMap: tex.wingGlow, emissive: "#ffffff", emissiveIntensity: 1.2 }),
    [tex],
  );
  const podium = useMemo(() => new THREE.MeshStandardMaterial({ map: tex.podium }), [tex]);

  return (
    <group>
      {/* Main white tower, window grid on the front (+Z). */}
      <mesh position={[0, 13, 0]} material={[white, white, white, white, tower, white]} castShadow receiveShadow>
        <boxGeometry args={[16, 26, 10]} />
      </mesh>
      <mesh position={[0, 26.3, 0]} material={trim}>
        <boxGeometry args={[16.4, 0.6, 10.4]} />
      </mesh>
      {/* Blue glass stair towers and the slim beige column. */}
      <mesh position={[-9.6, 13.3, 1.5]} material={glass} castShadow>
        <boxGeometry args={[3.2, 26.6, 6]} />
      </mesh>
      <mesh position={[-12.4, 12, 0]} castShadow>
        <boxGeometry args={[2.6, 24, 8]} />
        <meshStandardMaterial color="#e8c49a" />
      </mesh>
      {/* Second wing behind and to the left. */}
      <mesh position={[-20, 10, -2]} material={[white, white, white, white, wing, white]} castShadow receiveShadow>
        <boxGeometry args={[12, 20, 9]} />
      </mesh>
      <mesh position={[-26.6, 10.3, -0.5]} material={glass} castShadow>
        <boxGeometry args={[2.4, 20.6, 5]} />
      </mesh>
      {/* Balcony slab on the tower. */}
      <mesh position={[-6, 18, 6]} material={white} castShadow>
        <boxGeometry args={[4, 0.4, 2.4]} />
      </mesh>
      {/* Peach podium with jali panels and the entrance canopy. */}
      <mesh position={[6, 3.6, 9]} material={[peach, peach, peach, peach, podium, peach]} castShadow receiveShadow>
        <boxGeometry args={[16, 7.2, 8]} />
      </mesh>
      <mesh position={[6, 7.35, 9]} material={trim}>
        <boxGeometry args={[16.4, 0.3, 8.4]} />
      </mesh>
      <mesh position={[6, 3.0, 14.4]} material={trim} castShadow>
        <boxGeometry args={[8, 0.35, 2.8]} />
      </mesh>
      {[2.4, 9.6].map((x) => (
        <mesh key={x} position={[x, 1.5, 15.4]} material={peach} castShadow>
          <boxGeometry args={[0.5, 3, 0.5]} />
        </mesh>
      ))}
      {/* Name board on the lawn by the path. */}
      <mesh position={[-1.5, 1.2, 21]} rotation={[0, 0.35, 0]}>
        <boxGeometry args={[6.4, 1.8, 0.3]} />
        <meshStandardMaterial attach="material-0" color="#8a5a4a" />
        <meshStandardMaterial attach="material-1" color="#8a5a4a" />
        <meshStandardMaterial attach="material-2" color="#8a5a4a" />
        <meshStandardMaterial attach="material-3" color="#8a5a4a" />
        <meshStandardMaterial attach="material-4" map={tex.sign} emissiveMap={tex.sign} emissive="#ffffff" emissiveIntensity={0.35} />
        <meshStandardMaterial attach="material-5" color="#8a5a4a" />
      </mesh>
      {/* Forecourt and path. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 16]} receiveShadow>
        <planeGeometry args={[40, 12]} />
        <meshStandardMaterial color="#b9a78f" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.025, 15]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color="#7fa65a" />
      </mesh>
      <pointLight position={[LIT_WINDOW.x, LIT_WINDOW.y, LIT_WINDOW.z + 0.8]} color="#ffcf6e" intensity={8} distance={7} />
      <pointLight position={[6, 2.6, 15]} color="#ffe2b0" intensity={5} distance={8} />
    </group>
  );
}

export function Campus({ hallName }: { hallName: string }) {
  const skyMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: skyVertex, fragmentShader: skyFragment, side: THREE.BackSide, depthWrite: false }),
    [],
  );
  return (
    <group>
      <mesh material={skyMat}>
        <sphereGeometry args={[480, 32, 16]} />
      </mesh>
      <hemisphereLight args={["#ffd9b0", "#4b5d3a", 0.9]} />
      <directionalLight
        position={[-80, 70, 60]}
        intensity={2.4}
        color="#ffc58f"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-far={300}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#6f8f4a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 24]} receiveShadow>
        <planeGeometry args={[900, 6]} />
        <meshStandardMaterial color="#5a5a5e" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, 0.04, -40]} receiveShadow>
        <planeGeometry args={[6, 160]} />
        <meshStandardMaterial color="#5a5a5e" />
      </mesh>
      <Hall hallName={hallName} />
      <MainBuilding />
      <Blocks />
      <Trees />
    </group>
  );
}

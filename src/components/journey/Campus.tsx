"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { facadeEmissive, facadeTexture, signTexture } from "./canvasTextures";

// Stylised IIT Kharagpur: Atal Bihari Vajpayee Hall in the middle (U-shaped,
// facing +Z), the Main Building far behind it, roads, trees and other blocks.
// The glowing window on the front facade is "my room"; the camera flies into it.

export const LIT_WINDOW = new THREE.Vector3(3, 6.2, 3.02);

export const campusCamera = {
  pos: new THREE.CatmullRomCurve3([
    new THREE.Vector3(60, 170, 190),
    new THREE.Vector3(36, 70, 100),
    new THREE.Vector3(12, 20, 42),
    new THREE.Vector3(4.5, 8, 15),
    new THREE.Vector3(3, 6.25, 4.0),
  ]),
  look: new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -30),
    new THREE.Vector3(0, 4, -4),
    new THREE.Vector3(0, 6, 0),
    new THREE.Vector3(3, 6.2, 2.5),
    new THREE.Vector3(3, 6.2, 2),
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
      if (Math.abs(x) < 26 && z > -10 && z < 30) continue; // hall + courtyard
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
  const tex = useMemo(() => {
    const front = facadeTexture(12, 4, 7, 1);
    const frontGlow = facadeEmissive(12, 4, 7, 1);
    const wing = facadeTexture(7, 4, -1, -1);
    const wingGlow = facadeEmissive(7, 4, -1, -1);
    const sign = signTexture([hallName, "Hall of Residence · IIT Kharagpur"]);
    return { front, frontGlow, wing, wingGlow, sign };
  }, [hallName]);

  const plain = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c96f4a" }), []);
  const roof = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e8dcc4" }), []);
  const frontMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.front, emissiveMap: tex.frontGlow, emissive: "#ffffff", emissiveIntensity: 1.4 }),
    [tex],
  );
  const wingMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.wing, emissiveMap: tex.wingGlow, emissive: "#ffffff", emissiveIntensity: 1.2 }),
    [tex],
  );

  return (
    <group>
      {/* Central block: front face (+Z) carries the window grid. */}
      <mesh position={[0, 5, 0]} material={[plain, plain, roof, plain, frontMat, plain]} castShadow receiveShadow>
        <boxGeometry args={[24, 10, 6]} />
      </mesh>
      {/* Wings, window grids facing the courtyard. */}
      <mesh position={[-15, 5, 4]} material={[wingMat, plain, roof, plain, plain, plain]} castShadow receiveShadow>
        <boxGeometry args={[6, 10, 14]} />
      </mesh>
      <mesh position={[15, 5, 4]} material={[plain, wingMat, roof, plain, plain, plain]} castShadow receiveShadow>
        <boxGeometry args={[6, 10, 14]} />
      </mesh>
      {/* Parapets */}
      {[[0, 10.3, 0, 24.4, 0.6, 6.4], [-15, 10.3, 4, 6.4, 0.6, 14.4], [15, 10.3, 4, 6.4, 0.6, 14.4]].map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]} material={roof}>
          <boxGeometry args={[b[3], b[4], b[5]]} />
        </mesh>
      ))}
      {/* Entrance: canopy, door and name board. */}
      <mesh position={[0, 2.8, 4.2]} material={roof} castShadow>
        <boxGeometry args={[7, 0.3, 2.6]} />
      </mesh>
      {[-3.2, 3.2].map((x) => (
        <mesh key={x} position={[x, 1.4, 5.3]} material={roof}>
          <cylinderGeometry args={[0.15, 0.15, 2.8]} />
        </mesh>
      ))}
      <mesh position={[0, 1.2, 3.02]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshStandardMaterial color="#3b2a20" />
      </mesh>
      <mesh position={[0, 3.9, 3.05]}>
        <planeGeometry args={[8, 2]} />
        <meshStandardMaterial map={tex.sign} emissiveMap={tex.sign} emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>
      {/* Lawn and path in the courtyard. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 11]} receiveShadow>
        <planeGeometry args={[24, 16]} />
        <meshStandardMaterial color="#7fa65a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 13]} receiveShadow>
        <planeGeometry args={[3, 20]} />
        <meshStandardMaterial color="#d8c9a6" />
      </mesh>
      <pointLight position={[LIT_WINDOW.x, LIT_WINDOW.y, LIT_WINDOW.z + 0.6]} color="#ffcf6e" intensity={6} distance={6} />
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

"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { nightSkyTexture, posterTexture, screenTexture } from "./canvasTextures";
import { journey, STAGES } from "./store";

// Hostel room at night: bed, study table under the window, ceiling fan, and the
// laptop whose screen the camera dives into. Room spans x/z in [-2.5, 2.5].

const LAPTOP_POS = new THREE.Vector3(0.9, 0.78, -2.02);
const LID_TILT = -0.26; // radians past vertical
export const SCREEN_CENTER = new THREE.Vector3(
  LAPTOP_POS.x,
  LAPTOP_POS.y + 0.018 + Math.cos(-LID_TILT) * 0.118,
  LAPTOP_POS.z - 0.1175 - Math.sin(-LID_TILT) * 0.118,
);
export const SCREEN_NORMAL = new THREE.Vector3(0, Math.sin(-LID_TILT), Math.cos(-LID_TILT));

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const roomKeys: { t: number; pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { t: STAGES.toRoom, pos: v(-0.3, 1.6, 2.35), look: v(-1.9, 1.4, -0.6) },
  { t: 0.73, pos: v(0.0, 1.55, 1.9), look: v(0.9, 1.1, -2.2) },
  { t: STAGES.screen[0], pos: v(0.9, 1.22, -1.15), look: SCREEN_CENTER.clone() },
  { t: STAGES.screen[1], pos: SCREEN_CENTER.clone().addScaledVector(SCREEN_NORMAL, 0.25), look: SCREEN_CENTER.clone() },
];

function Box({ p, s, c, ...rest }: { p: [number, number, number]; s: [number, number, number]; c: string } & Record<string, unknown>) {
  return (
    <mesh position={p} castShadow receiveShadow {...rest}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} />
    </mesh>
  );
}

function Fan() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 4;
  });
  return (
    <group position={[0, 3.2, 0.2]}>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4]} />
        <meshStandardMaterial color="#8a8a8a" />
      </mesh>
      <group ref={ref} position={[0, -0.42, 0]}>
        <mesh>
          <cylinderGeometry args={[0.1, 0.12, 0.08, 16]} />
          <meshStandardMaterial color="#9c9c9c" metalness={0.4} roughness={0.4} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[1.2, 0.01, 0.13]} />
            <meshStandardMaterial color="#b5b0a6" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function FairyLights() {
  const bulbs = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i <= 26; i++) {
      const x = -2.4 + (i / 26) * 4.8;
      out.push([x, 2.85 - Math.sin((i / 26) * Math.PI * 3) ** 2 * 0.18, -2.47]);
    }
    return out;
  }, []);
  const colors = ["#ffd27a", "#ff8fab", "#9bf6ff", "#caffbf"];
  return (
    <group>
      {bulbs.map((b, i) => (
        <mesh key={i} position={b}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color={colors[i % colors.length]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Laptop({ name, headline }: { name: string; headline: string }) {
  const screenRef = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => screenTexture(name, headline), [name, headline]);
  const corners = useMemo(() => [v(-0.155, -0.0975, 0), v(0.155, -0.0975, 0), v(0.155, 0.0975, 0), v(-0.155, 0.0975, 0)], []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  // Project the screen's corners to CSS pixels so the live site can be laid
  // exactly over the 3D screen before it expands to fill the window.
  useFrame(({ camera, size }) => {
    const m = screenRef.current;
    if (!m || journey.p < STAGES.screen[0] - 0.04) {
      journey.screen.ok = false;
      return;
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const c of corners) {
      tmp.copy(c);
      m.localToWorld(tmp).project(camera);
      const sx = (tmp.x * 0.5 + 0.5) * size.width;
      const sy = (-tmp.y * 0.5 + 0.5) * size.height;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
      y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    journey.screen = { x: x0, y: y0, w: x1 - x0, h: y1 - y0, ok: true };
  });

  return (
    <group position={LAPTOP_POS}>
      <mesh position={[0, 0.009, 0]} castShadow>
        <boxGeometry args={[0.34, 0.018, 0.235]} />
        <meshStandardMaterial color="#4a4e57" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.0185, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 0.12]} />
        <meshStandardMaterial color="#25272b" />
      </mesh>
      <group position={[0, 0.018, -0.1175]} rotation={[LID_TILT, 0, 0]}>
        <mesh position={[0, 0.118, -0.004]} castShadow>
          <boxGeometry args={[0.34, 0.235, 0.008]} />
          <meshStandardMaterial color="#4a4e57" metalness={0.5} roughness={0.45} />
        </mesh>
        <mesh ref={screenRef} position={[0, 0.118, 0.0005]}>
          <planeGeometry args={[0.31, 0.195]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0, 0.2, 0.25]} color="#8b9cff" intensity={0.6} distance={1.2} />
    </group>
  );
}

export function Room({ name, headline }: { name: string; headline: string }) {
  const tex = useMemo(
    () => ({
      sky: nightSkyTexture(),
      kgp: posterTexture("IIT KGP", "Yogah Karmasu Kaushalam", 210),
      dream: posterTexture("BUILD", "ship · learn · repeat", 330),
    }),
    [],
  );
  const wall = "#e7dfd2";

  return (
    <group>
      <ambientLight intensity={0.18} color="#b8c4ff" />
      <pointLight position={[0.35, 1.35, -2.2]} color="#ffbe6b" intensity={2.2} distance={5} castShadow />
      <pointLight position={[0, 2.9, 0.5]} color="#ffe2b8" intensity={1.2} distance={7} />
      <directionalLight position={[0.9, 2, -6]} color="#7d8cff" intensity={0.6} />

      {/* Shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#b9ad9b" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#f1ece3" />
      </mesh>
      {/* Back wall with a window cut-out (built from four panels). */}
      <Box p={[-1.05, 1.6, -2.54]} s={[2.9, 3.2, 0.12]} c={wall} />
      <Box p={[2.0, 1.6, -2.54]} s={[1.0, 3.2, 0.12]} c={wall} />
      <Box p={[0.95, 0.6, -2.55]} s={[1.14, 1.2, 0.1]} c={wall} />
      <Box p={[0.95, 2.8, -2.55]} s={[1.14, 0.8, 0.1]} c={wall} />
      <mesh position={[0.95, 1.8, -2.75]}>
        <planeGeometry args={[1.6, 1.4]} />
        <meshBasicMaterial map={tex.sky} toneMapped={false} />
      </mesh>
      {[0.4, 0.95, 1.5].map((x) => (
        <Box key={x} p={[x, 1.8, -2.5]} s={[0.04, 1.2, 0.04]} c="#5c6b73" />
      ))}
      <Box p={[-2.55, 1.6, 0]} s={[0.1, 3.2, 5]} c={wall} />
      <Box p={[2.55, 1.6, 0]} s={[0.1, 3.2, 5]} c={wall} />

      {/* Bed */}
      <Box p={[-1.75, 0.25, -0.9]} s={[1.0, 0.5, 2.0]} c="#6d4c3d" />
      <Box p={[-1.75, 0.55, -0.85]} s={[0.95, 0.12, 1.9]} c="#f5f1ea" />
      <Box p={[-1.75, 0.63, -0.55]} s={[0.97, 0.06, 1.3]} c="#3d5a80" />
      <Box p={[-1.75, 0.66, -1.65]} s={[0.6, 0.1, 0.35]} c="#ffffff" />
      {/* Posters above the bed */}
      <mesh position={[-2.49, 1.9, -1.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.6, 0.85]} />
        <meshStandardMaterial map={tex.kgp} />
      </mesh>
      <mesh position={[-2.49, 1.85, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.55, 0.77]} />
        <meshStandardMaterial map={tex.dream} />
      </mesh>

      {/* Study table, chair, lamp, books, mug, plant */}
      <Box p={[0.9, 0.75, -2.15]} s={[1.5, 0.05, 0.7]} c="#8b5e3c" />
      {[[0.2, -1.85], [1.6, -1.85], [0.2, -2.45], [1.6, -2.45]].map(([x, z], i) => (
        <Box key={i} p={[x, 0.37, z]} s={[0.05, 0.74, 0.05]} c="#5a3d28" />
      ))}
      <group position={[0.9, 0, -1.35]}>
        <Box p={[0, 0.45, 0]} s={[0.45, 0.05, 0.45]} c="#2f3e46" />
        <Box p={[0, 0.8, 0.21]} s={[0.45, 0.65, 0.05]} c="#2f3e46" />
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
          <Box key={i} p={[x, 0.22, z]} s={[0.04, 0.45, 0.04]} c="#1d262b" />
        ))}
      </group>
      <group position={[0.3, 0.78, -2.3]}>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.02, 20]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.4]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.05, 0.42, 0.05]} rotation={[0.6, 0, -0.3]}>
          <coneGeometry args={[0.08, 0.12, 20, 1, true]} />
          <meshStandardMaterial color="#e63946" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.05, 0.38, 0.08]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color="#fff1c1" toneMapped={false} />
        </mesh>
      </group>
      {[["#e76f51", 0.06], ["#2a9d8f", 0.05], ["#e9c46a", 0.045]].map(([c, h], i) => (
        <Box key={i} p={[1.45, 0.78 + 0.03 + i * 0.055, -2.3]} s={[0.24, Number(h), 0.17]} c={String(c)} />
      ))}
      <mesh position={[1.4, 0.83, -1.95]}>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 16]} />
        <meshStandardMaterial color="#f4f1de" />
      </mesh>
      <mesh position={[1.62, 0.84, -2.0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 12]} />
        <meshStandardMaterial color="#bc6c25" />
      </mesh>
      <mesh position={[1.62, 0.98, -2.0]}>
        <icosahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#52b788" flatShading />
      </mesh>

      {/* Cupboard and shelf */}
      <Box p={[2.15, 1.0, 1.2]} s={[0.6, 2.0, 1.2]} c="#7b5a42" />
      <Box p={[1.84, 1.0, 1.2]} s={[0.01, 1.9, 0.01]} c="#3b2a20" />
      <Box p={[-0.6, 1.9, -2.4]} s={[1.2, 0.04, 0.22]} c="#8b5e3c" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={i} p={[-1.05 + i * 0.09, 2.04, -2.4]} s={[0.06, 0.24 - (i % 3) * 0.03, 0.17]} c={["#264653", "#e76f51", "#2a9d8f", "#f4a261", "#6d597a", "#e9c46a"][i]} />
      ))}

      <Fan />
      <FairyLights />
      <Laptop name={name} headline={headline} />
    </group>
  );
}

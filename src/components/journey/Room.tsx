"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { doorTexture, heroPosterTexture, nightSkyTexture, plateTexture, posterTexture, screenTexture, tileTexture } from "./canvasTextures";
import { ease, journey, STAGES } from "./store";

// Room 118 at night, modelled on the owner's photos: steel mesh door off a
// granite-dado corridor, white walls and tiles, navy curtains with warm fairy
// lights, a green light grid around a Spider-Man poster, a white ergonomic chair
// and the laptop the camera dives into. Room spans x/z in [-2.5, 2.5].

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
  { t: STAGES.toRoom, pos: v(-0.1, 1.6, 4.55), look: v(-0.1, 1.7, 2.5) },
  { t: 0.7, pos: v(-0.1, 1.6, 4.35), look: v(-0.1, 1.6, 2.5) },
  { t: 0.735, pos: v(-0.1, 1.6, 3.2), look: v(-0.1, 1.4, 1.0) },
  { t: 0.775, pos: v(0.0, 1.55, 1.9), look: v(0.9, 1.1, -2.2) },
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

function Bulbs({ points, color, size = 0.022 }: { points: [number, number, number][]; color: string; size?: number }) {
  return (
    <group>
      {points.map((b, i) => (
        <mesh key={i} position={b}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function FairyLights() {
  // Warm white string draped over the curtain rod and down the window side.
  const warm = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      out.push([0.1 + t * 1.7, 2.52 - Math.sin(t * Math.PI) * 0.22, -2.4]);
    }
    for (let i = 1; i <= 8; i++) out.push([1.8 + Math.sin(i) * 0.04, 2.5 - i * 0.2, -2.38]);
    return out;
  }, []);
  // Green grid framing the poster on the right wall.
  const green = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) out.push([2.47, 1.3 + r * 0.3, -1.75 + c * 0.32 + (r % 2) * 0.08]);
    return out;
  }, []);
  return (
    <group>
      <Bulbs points={warm} color="#fff1cf" />
      <Bulbs points={green} color="#4dff88" size={0.02} />
      <pointLight position={[2.2, 1.9, -1.1]} color="#3dff7a" intensity={0.8} distance={2.5} />
      <pointLight position={[0.95, 2.3, -2.1]} color="#fff0cc" intensity={0.9} distance={2.5} />
    </group>
  );
}

function Chair() {
  const white = "#f2f2f0";
  return (
    <group position={[0.9, 0, -1.3]} rotation={[0, 0.3, 0]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.2, 0.06, Math.sin((i / 5) * Math.PI * 2) * 0.2]} rotation={[0, -(i / 5) * Math.PI * 2, 0]}>
          <boxGeometry args={[0.4, 0.03, 0.05]} />
          <meshStandardMaterial color={white} />
        </mesh>
      ))}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4]} />
        <meshStandardMaterial color="#cfcfcf" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.5, 0.07, 0.48]} />
        <meshStandardMaterial color="#1c1f26" />
      </mesh>
      <mesh position={[0, 0.88, 0.25]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.46, 0.66, 0.04]} />
        <meshStandardMaterial color="#20242c" />
      </mesh>
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 0.88, 0.25]} rotation={[-0.12, 0, 0]}>
          <boxGeometry args={[0.04, 0.72, 0.06]} />
          <meshStandardMaterial color={white} />
        </mesh>
      ))}
      <mesh position={[0, 1.27, 0.3]}>
        <boxGeometry args={[0.36, 0.12, 0.05]} />
        <meshStandardMaterial color={white} />
      </mesh>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.68, 0.02]}>
          <boxGeometry args={[0.05, 0.04, 0.36]} />
          <meshStandardMaterial color={white} />
        </mesh>
      ))}
    </group>
  );
}

function Door() {
  const ref = useRef<THREE.Group>(null);
  const tex = useMemo(() => ({ door: doorTexture(), plate: plateTexture("118") }), []);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = -1.7 * ease(journey.p, 0.69, 0.728);
  });
  return (
    <group>
      {/* Brown frame */}
      {[[-0.63, 1.07, 0.06, 2.14], [0.43, 1.07, 0.06, 2.14], [-0.1, 2.14, 1.12, 0.06]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 2.6]}>
          <boxGeometry args={[w, h, 0.14]} />
          <meshStandardMaterial color="#6e3b2a" />
        </mesh>
      ))}
      <mesh position={[-0.1, 2.3, 2.62]}>
        <planeGeometry args={[0.24, 0.12]} />
        <meshStandardMaterial map={tex.plate} metalness={0.4} roughness={0.4} />
      </mesh>
      <group ref={ref} position={[-0.6, 0, 2.64]}>
        <mesh position={[0.5, 1.04, 0]}>
          <boxGeometry args={[1.0, 2.08, 0.03]} />
          <meshStandardMaterial map={tex.door} metalness={0.7} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

function Corridor() {
  const cream = "#e9e4d6";
  const granite = "#3a1f22";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 3.65]}>
        <planeGeometry args={[12, 2.1]} />
        <meshStandardMaterial color="#4a2a2c" roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 3.65]}>
        <planeGeometry args={[12, 2.1]} />
        <meshStandardMaterial color="#efeae0" />
      </mesh>
      <mesh position={[0, 1.6, 4.72]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[12, 3.2]} />
        <meshStandardMaterial color={cream} />
      </mesh>
      <mesh position={[0, 0.5, 4.71]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[12, 1.0]} />
        <meshStandardMaterial color={granite} roughness={0.3} />
      </mesh>
      {/* Granite dado on the room side of the corridor, either side of the door */}
      {[[-3.3, 5.4], [3.25, 5.6]].map(([x, w], i) => (
        <mesh key={i} position={[x, 0.5, 2.62]}>
          <planeGeometry args={[w, 1.0]} />
          <meshStandardMaterial color={granite} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 3.15, 3.65]}>
        <boxGeometry args={[1.2, 0.05, 0.1]} />
        <meshBasicMaterial color="#f4f8ff" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.9, 3.7]} color="#f4f1e8" intensity={7} distance={8} />
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
      hero: heroPosterTexture(),
      tiles: tileTexture(),
    }),
    [],
  );
  const wall = "#ecebe6";
  const navy = "#18213d";

  return (
    <group>
      <ambientLight intensity={0.16} color="#b8c4ff" />
      <pointLight position={[0.35, 1.35, -2.2]} color="#ffbe6b" intensity={2.0} distance={5} castShadow />
      <pointLight position={[0, 2.9, 0.5]} color="#ffe9c8" intensity={0.9} distance={7} />
      <directionalLight position={[0.9, 2, -6]} color="#7d8cff" intensity={0.5} />

      {/* Shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial map={tex.tiles} roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#f1efea" />
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
        <Box key={x} p={[x, 1.8, -2.5]} s={[0.04, 1.2, 0.04]} c="#d9d9d4" />
      ))}
      {/* Navy curtains, gathered either side of the window */}
      <Box p={[0.95, 2.55, -2.42]} s={[1.8, 0.03, 0.03]} c="#bdbdb8" />
      {[[0.22, 0.42], [1.68, 0.42]].map(([x, w], i) => (
        <group key={i} position={[x, 1.75, -2.4]}>
          {[0, 1, 2, 3].map((k) => (
            <Box key={k} p={[(k - 1.5) * (w / 4), 0, (k % 2) * 0.04]} s={[w / 4 + 0.01, 1.6, 0.04]} c={navy} />
          ))}
        </group>
      ))}
      <Box p={[-2.55, 1.6, 0]} s={[0.1, 3.2, 5]} c={wall} />
      <Box p={[2.55, 1.6, 0]} s={[0.1, 3.2, 5]} c={wall} />
      {/* Front wall with the doorway (x -0.6..0.4) */}
      <Box p={[-1.57, 1.6, 2.55]} s={[1.94, 3.2, 0.1]} c={wall} />
      <Box p={[1.47, 1.6, 2.55]} s={[2.14, 3.2, 0.1]} c={wall} />
      <Box p={[-0.1, 2.67, 2.55]} s={[1.0, 1.06, 0.1]} c={wall} />

      {/* Bed */}
      <Box p={[-1.75, 0.25, -0.9]} s={[1.0, 0.5, 2.0]} c="#6d4c3d" />
      <Box p={[-1.75, 0.55, -0.85]} s={[0.95, 0.12, 1.9]} c="#f5f1ea" />
      <Box p={[-1.75, 0.63, -0.55]} s={[0.97, 0.06, 1.3]} c="#3d5a80" />
      <Box p={[-1.75, 0.66, -1.65]} s={[0.6, 0.1, 0.35]} c="#ffffff" />
      <mesh position={[-2.49, 1.9, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.6, 0.85]} />
        <meshStandardMaterial map={tex.kgp} />
      </mesh>
      {/* Spider-Man poster inside the green light grid */}
      <mesh position={[2.49, 1.85, -1.1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.42, 1.0]} />
        <meshStandardMaterial map={tex.hero} />
      </mesh>

      {/* Light-wood study table, lamp, books, bottle, plant */}
      <Box p={[0.9, 0.75, -2.15]} s={[1.5, 0.05, 0.7]} c="#c49a6c" />
      {[[0.2, -1.85], [1.6, -1.85], [0.2, -2.45], [1.6, -2.45]].map(([x, z], i) => (
        <Box key={i} p={[x, 0.37, z]} s={[0.05, 0.74, 0.05]} c="#a57b50" />
      ))}
      <Chair />
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
          <meshStandardMaterial color="#f4f4f4" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.05, 0.38, 0.08]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color="#fff1c1" toneMapped={false} />
        </mesh>
      </group>
      {[["#e76f51", 0.06], ["#2a9d8f", 0.05], ["#e9c46a", 0.045]].map(([c, h], i) => (
        <Box key={i} p={[1.45, 0.78 + 0.03 + i * 0.055, -2.3]} s={[0.24, Number(h), 0.17]} c={String(c)} />
      ))}
      <mesh position={[1.4, 0.86, -1.95]}>
        <cylinderGeometry args={[0.035, 0.035, 0.16, 16]} />
        <meshStandardMaterial color="#3a86ff" />
      </mesh>
      <mesh position={[1.62, 0.84, -2.0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 12]} />
        <meshStandardMaterial color="#bc6c25" />
      </mesh>
      <mesh position={[1.62, 0.98, -2.0]}>
        <icosahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#52b788" flatShading />
      </mesh>

      {/* Wooden cupboard */}
      <Box p={[2.15, 1.1, 1.2]} s={[0.6, 2.2, 1.2]} c="#8a5a33" />
      <Box p={[1.84, 1.1, 1.2]} s={[0.01, 2.1, 0.01]} c="#3b2a20" />
      <Box p={[-0.6, 1.9, -2.4]} s={[1.2, 0.04, 0.22]} c="#a57b50" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={i} p={[-1.05 + i * 0.09, 2.04, -2.4]} s={[0.06, 0.24 - (i % 3) * 0.03, 0.17]} c={["#264653", "#e76f51", "#2a9d8f", "#f4a261", "#6d597a", "#e9c46a"][i]} />
      ))}

      <Fan />
      <FairyLights />
      <Door />
      <Corridor />
      <Laptop name={name} headline={headline} />
    </group>
  );
}

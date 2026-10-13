"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Earth } from "./Earth";
import { Campus, campusCamera } from "./Campus";
import { Room, roomKeys } from "./Room";
import { ease, journey, lerp, range, smooth, STAGES } from "./store";

export type Scene = "earth" | "campus" | "room";
const sceneAt = (p: number): Scene => (p < STAGES.toCampus ? "earth" : p < STAGES.toRoom ? "campus" : "room");

type Groups = Record<Scene, React.RefObject<THREE.Group | null>>;

function Rig({ groups, onScene }: { groups: Groups; onScene: (s: Scene) => void }) {
  const { camera, scene: threeScene } = useThree();
  const fog = useMemo(() => new THREE.Fog("#f2b58c", 120, 420), []);
  const backgrounds = useMemo(
    () => ({ earth: new THREE.Color("#02030a"), campus: new THREE.Color("#f2b58c"), room: new THREE.Color("#0b0d14") }),
    [],
  );
  const look = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const last = useRef<Scene>("earth");

  useFrame((state) => {
    const p = journey.p;
    const scene = sceneAt(p);
    if (scene !== last.current) {
      last.current = scene;
      threeScene.fog = scene === "campus" ? fog : null;
      threeScene.background = backgrounds[scene];
      onScene(scene);
    }
    // Only the active scene is visible, so hidden scenes cost nothing to draw.
    for (const k of Object.keys(groups) as Scene[]) {
      const g = groups[k].current;
      if (g) g.visible = k === scene;
    }
    const cam = camera as THREE.PerspectiveCamera;

    if (scene === "earth") {
      // Pull in from orbit to just above Kharagpur.
      const dIndia = lerp(3.3, 1.85, ease(p, STAGES.india[0], STAGES.india[1]));
      const dBengal = lerp(dIndia, 1.24, ease(p, STAGES.bengal[0], STAGES.bengal[1]));
      const d = lerp(dBengal, 1.035, ease(p, STAGES.kgp[0], STAGES.toCampus));
      journey.altitude = (d - 1) * 6371000;
      const sway = (1 - range(p, 0, 0.05)) * 0.04;
      pos.set(Math.sin(state.clock.elapsedTime * 0.3) * sway, Math.cos(state.clock.elapsedTime * 0.25) * sway, d);
      look.set(0, 0, 0);
      cam.near = 0.001;
      cam.far = 200;
    } else if (scene === "campus") {
      const t = smooth(range(p, STAGES.toCampus, STAGES.toRoom));
      campusCamera.pos.getPoint(t, pos);
      campusCamera.look.getPoint(t, look);
      journey.altitude = pos.y * 3;
      cam.near = 0.1;
      cam.far = 1200;
    } else {
      let i = 0;
      while (i < roomKeys.length - 2 && p > roomKeys[i + 1].t) i++;
      const a = roomKeys[i];
      const b = roomKeys[i + 1];
      const t = smooth(range(p, a.t, b.t));
      pos.lerpVectors(a.pos, b.pos, t);
      look.lerpVectors(a.look, b.look, t);
      journey.altitude = 6 + pos.y;
      cam.near = 0.01;
      cam.far = 50;
    }
    cam.position.copy(pos);
    cam.lookAt(look);
    cam.updateProjectionMatrix();
  });
  return null;
}

export default function JourneyCanvas({
  name,
  headline,
  hallName,
  onScene,
}: {
  name: string;
  headline: string;
  hallName: string;
  onScene: (s: Scene) => void;
}) {
  const groups: Groups = {
    earth: useRef<THREE.Group>(null),
    campus: useRef<THREE.Group>(null),
    room: useRef<THREE.Group>(null),
  };

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 45, position: [0, 0, 3.3], near: 0.001, far: 200 }}
      onCreated={({ gl, scene }) => {
        scene.background = new THREE.Color("#02030a");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Suspense fallback={null}>
        <group ref={groups.earth}>
          <Earth />
        </group>
      </Suspense>
      <group ref={groups.campus}>
        <Campus hallName={hallName} />
      </group>
      <group ref={groups.room}>
        <Room name={name} headline={headline} />
      </group>
      <Rig groups={groups} onScene={onScene} />
    </Canvas>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, Stars } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import indiaBorder from "@/data/india-border.json";
import { faceQuat, latLonToVec3, WEST_BENGAL } from "./geo";
import { bump, ease, journey, KGP, lerp, range, STAGES } from "./store";

const SUN = new THREE.Vector3(0.9, 0.35, 0.75).normalize();

const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const earthFragment = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uWater;
  uniform vec3 uSun;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float ndl = dot(n, uSun);
    float dayMix = smoothstep(-0.18, 0.28, ndl);

    vec3 day = texture2D(uDay, vUv).rgb * (0.18 + 1.05 * max(ndl, 0.0));
    vec3 night = texture2D(uNight, vUv).rgb * vec3(1.6, 1.25, 0.85);
    vec3 color = mix(night, day, dayMix);

    float water = texture2D(uWater, vUv).r;
    vec3 r = reflect(-uSun, n);
    color += vec3(1.0, 0.92, 0.8) * pow(max(dot(r, v), 0.0), 140.0) * water * 0.25 * dayMix;

    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    color += vec3(0.32, 0.6, 1.0) * fres * (0.25 + 0.75 * dayMix);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const atmosphereFragment = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  uniform float uOpacity;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPosW);
    float i = pow(clamp(-dot(n, v), 0.0, 1.0), 2.0) * 2.6;
    gl_FragColor = vec4(vec3(0.35, 0.65, 1.0), i * uOpacity);
  }
`;

function ringPoints(coords: number[][], r: number) {
  return coords.map(([lon, lat]) => latLonToVec3(lat, lon, r));
}

export function Earth() {
  const { gl } = useThree();
  const [day, night, water, clouds] = useLoader(THREE.TextureLoader, [
    "/textures/earth-day.jpg",
    "/textures/earth-night.jpg",
    "/textures/earth-water.jpg",
    "/textures/earth-clouds.jpg",
  ]);
  useMemo(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    for (const t of [day, night]) t.colorSpace = THREE.SRGBColorSpace;
    for (const t of [day, night, water, clouds]) t.anisotropy = aniso;
  }, [day, night, water, clouds, gl]);

  const earthMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthVertex,
        fragmentShader: earthFragment,
        uniforms: { uDay: { value: day }, uNight: { value: night }, uWater: { value: water }, uSun: { value: SUN } },
      }),
    [day, night, water],
  );
  const atmoMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { uOpacity: { value: 1 } },
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  const spin = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const indiaRefs = useRef<(Line2 | null)[]>([]);
  const bengalRef = useRef<Line2>(null);
  const pinRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const india = useMemo(() => (indiaBorder as number[][][]).map((ring) => ringPoints(ring, 1.0025)), []);
  const bengal = useMemo(() => ringPoints(WEST_BENGAL, 1.003), []);
  const pinPos = useMemo(() => latLonToVec3(KGP.lat, KGP.lon, 1.0), []);
  const pinQuat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), pinPos.clone().normalize()),
    [pinPos],
  );

  // Drag-to-rotate with inertia, on top of a slow idle spin.
  const user = useRef(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, -1.2, 0)));
  const drag = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0 });
  const tmp = useMemo(
    () => ({ q: new THREE.Quaternion(), target: new THREE.Quaternion(), axisX: new THREE.Vector3(1, 0, 0), axisY: new THREE.Vector3(0, 1, 0) }),
    [],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      d.vx = (e.clientX - d.x) * 0.005;
      d.vy = (e.clientY - d.y) * 0.005;
      d.x = e.clientX;
      d.y = e.clientY;
    };
    const up = () => {
      drag.current.active = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (journey.p > 0.06) return;
    e.stopPropagation();
    drag.current = { active: true, x: e.clientX, y: e.clientY, vx: 0, vy: 0 };
    document.body.style.cursor = "grabbing";
  };

  useFrame((state, dt) => {
    const p = journey.p;
    const d = drag.current;

    // Apply drag velocity (or idle spin), decaying when released.
    const idle = d.active ? 0 : 0.06 * dt * (1 - range(p, 0, 0.05));
    tmp.q.setFromAxisAngle(tmp.axisY, d.vx + idle);
    user.current.premultiply(tmp.q);
    tmp.q.setFromAxisAngle(tmp.axisX, d.vy);
    user.current.premultiply(tmp.q);
    if (!d.active) {
      d.vx *= 0.94;
      d.vy *= 0.94;
    } else {
      d.vx *= 0.5;
      d.vy *= 0.5;
    }

    // Glide from the user's rotation to India, then West Bengal, then Kharagpur.
    const tB = ease(p, STAGES.bengal[0], STAGES.bengal[1]);
    const tK = ease(p, STAGES.kgp[0], STAGES.kgp[1]);
    const lat = lerp(lerp(21, 23.4, tB), KGP.lat, tK);
    const lon = lerp(lerp(80, 87.9, tB), KGP.lon, tK);
    faceQuat(lat, lon, tmp.target);
    const toTarget = ease(p, 0.02, STAGES.india[1] - 0.04);
    spin.current?.quaternion.slerpQuaternions(user.current, tmp.target, toTarget);

    if (cloudRef.current) {
      cloudRef.current.rotation.y += dt * 0.01;
      const m = cloudRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.85 * (1 - ease(p, 0.14, 0.26)) + 0.9 * ease(p, 0.44, 0.48);
    }
    atmoMat.uniforms.uOpacity.value = 1 - ease(p, 0.3, 0.44) * 0.8;

    const indiaOpacity = bump(p, 0.08, 0.4) * 0.9;
    for (const l of indiaRefs.current) if (l) l.material.opacity = indiaOpacity;
    if (bengalRef.current) {
      bengalRef.current.material.opacity = bump(p, 0.22, 0.48) * (0.75 + 0.25 * Math.sin(state.clock.elapsedTime * 4));
    }
    if (pinRef.current) {
      const s = ease(p, 0.34, 0.4);
      pinRef.current.scale.setScalar(Math.max(0.0001, s * lerp(1, 0.06, ease(p, 0.37, 0.47))));
    }
    if (pulseRef.current) {
      const t = (state.clock.elapsedTime % 1.6) / 1.6;
      pulseRef.current.scale.setScalar(1 + t * 3);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
    }
  });

  return (
    <group>
      <Stars radius={60} depth={40} count={5000} factor={3} saturation={0} fade speed={0.6} />
      <directionalLight position={SUN.clone().multiplyScalar(10)} intensity={2.2} />
      <ambientLight intensity={0.08} />
      <group ref={spin}>
        <mesh material={earthMat} onPointerDown={onDown}>
          <sphereGeometry args={[1, 128, 128]} />
        </mesh>
        <mesh ref={cloudRef}>
          <sphereGeometry args={[1.008, 96, 96]} />
          <meshStandardMaterial alphaMap={clouds} transparent depthWrite={false} color="#ffffff" opacity={0.85} />
        </mesh>
        {india.map((pts, i) => (
          <Line
            key={i}
            ref={(el) => {
              indiaRefs.current[i] = el as unknown as Line2 | null;
            }}
            points={pts}
            color="#7df9ff"
            lineWidth={1.6}
            transparent
            opacity={0}
            depthWrite={false}
          />
        ))}
        <Line ref={bengalRef as never} points={bengal} color="#ffb347" lineWidth={2.4} transparent opacity={0} depthWrite={false} />
        <group ref={pinRef} position={pinPos} quaternion={pinQuat} scale={0.0001}>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.006, 16, 16]} />
            <meshBasicMaterial color="#ff4d6d" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.0012, 0.0012, 0.12, 8]} />
            <meshBasicMaterial color="#ff4d6d" transparent opacity={0.7} toneMapped={false} />
          </mesh>
          <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[0.006, 0.009, 48]} />
            <meshBasicMaterial color="#ff4d6d" transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </group>
      <mesh material={atmoMat} scale={1.13}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
    </group>
  );
}

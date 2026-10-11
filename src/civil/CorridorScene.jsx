/* eslint-disable react-hooks/immutability, react-hooks/globals -- R3F mutates three.js objects (camera, textures) imperatively by design */
import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { profile, rooms, corridor as CORRIDOR } from './content';
import { concreteTexture, labelTexture, structureTexture, STRUCTURES } from './textures';

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

const HALF_W = 3.5;      // corridor half width (inner wall face)
const WALL_T = 0.4;
const HEIGHT = 4.6;
const Z_FRONT = 13;
const Z_BACK = -53;
const DOOR_W = 1.6;
const DOOR_H = 2.7;
const EYE = 1.65;
const ROOM = 7;           // room width/depth
const FRAME_Z = [9, 3.5, -2, -12.5, -23.5, -34.5, -45.5, -51.5];

// Wall pictures: [side, z, structure index]
const PICTURES = [
  ['left', 0.8, 0], ['right', -7, 1], ['left', -10, 2], ['right', -14.8, 3],
  ['left', -18, 4], ['right', -29, 5], ['left', -26, 6], ['right', -37.2, 7],
];

/* ------------------------------------------------------------------ */
/*  Materials                                                          */
/* ------------------------------------------------------------------ */

const SceneCtx = createContext(null);

function useMaterialSet(blueprint) {
  const set = useMemo(() => {
    const wallMap = concreteTexture({ base: '#b8b7b1', seed: 73 });
    const floorMap = concreteTexture({ base: '#a9a8a2', seed: 19, ties: false });
    const ceilMap = concreteTexture({ base: '#a4a49f', seed: 7, ties: false });
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const m = {
      wall: std({ map: wallMap, color: '#d2d1cb', roughness: 0.95 }),
      wallDark: std({ map: wallMap, color: '#a9a9a3', roughness: 0.95 }),
      floor: std({ map: floorMap, color: '#c2c1bb', roughness: 0.42, metalness: 0.05 }),
      ceiling: std({ map: ceilMap, color: '#9d9d98', roughness: 1 }),
      steel: std({ color: '#3d464c', roughness: 0.5, metalness: 0.65 }),
      steelLight: std({ color: '#8b949a', roughness: 0.4, metalness: 0.7 }),
      rebar: std({ color: '#7a4e36', roughness: 0.6, metalness: 0.4 }),
      safety: std({ color: '#f2c12e', roughness: 0.5 }),
      door: std({ color: '#55626a', roughness: 0.55, metalness: 0.35 }),
      wood: std({ color: '#b98d5a', roughness: 0.8 }),
      darkWood: std({ color: '#5b4330', roughness: 0.8 }),
      black: std({ color: '#242725', roughness: 0.6 }),
      white: std({ color: '#f1efe8', roughness: 0.6 }),
      gold: std({ color: '#d4a53a', roughness: 0.3, metalness: 0.85 }),
      red: std({ color: '#b3362b', roughness: 0.5 }),
      blue: std({ color: '#2f5e8c', roughness: 0.5 }),
      orange: std({ color: '#e0702d', roughness: 0.5 }),
    };
    const glow = new THREE.MeshBasicMaterial({ color: '#fff4dc', toneMapped: false });
    const warmGlass = new THREE.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false });
    Object.values(m).forEach(mat => { mat.userData.original = { color: mat.color.clone(), map: mat.map }; });
    return { m: { ...m, glow, warmGlass }, std: m, textures: [wallMap, floorMap, ceilMap] };
  }, []);

  useEffect(() => {
    Object.entries(set.std).forEach(([key, mat]) => {
      const o = mat.userData.original;
      if (blueprint) {
        const floorish = key === 'floor' || key === 'ceiling';
        mat.map = null;
        mat.color.set(key === 'safety' ? '#ffd24a' : floorish ? '#0e2f57' : '#1f5591');
        mat.transparent = !floorish;
        mat.opacity = floorish ? 1 : 0.22;
        mat.depthWrite = floorish;
      } else {
        mat.map = o.map;
        mat.color.copy(o.color);
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
      }
      mat.needsUpdate = true;
    });
  }, [blueprint, set]);

  useEffect(() => () => {
    Object.values(set.m).forEach(mat => mat.dispose());
    set.textures.forEach(t => t.dispose());
  }, [set]);

  return set.m;
}

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

const boxCache = new Map();
function scaledBox(w, h, d, tile = 3) {
  const key = `${w}|${h}|${d}|${tile}`;
  if (boxCache.has(key)) return boxCache.get(key);
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile);
    }
  }
  boxCache.set(key, g);
  return g;
}

function Block({ position, size, mat = 'wall', rotation, tile, edges = true, ...rest }) {
  const { m, blueprint } = useContext(SceneCtx);
  return (
    <mesh position={position} rotation={rotation} geometry={scaledBox(...size, tile)} material={m[mat]} {...rest}>
      {blueprint && edges && <Edges threshold={20} color={mat === 'safety' ? '#ffd24a' : '#cfe6ff'} />}
    </mesh>
  );
}

const UP = new THREE.Vector3(0, 1, 0);
function Bar({ from, to, r = 0.02, mat = 'rebar', segments = 6 }) {
  const { m } = useContext(SceneCtx);
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      length: a.distanceTo(b),
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()),
    };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion} material={m[mat]}>
      <cylinderGeometry args={[r, r, length, segments]} />
    </mesh>
  );
}

function TexPlane({ texture, size, ...rest }) {
  return (
    <mesh {...rest}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} toneMapped={false} transparent />
    </mesh>
  );
}

/* An I-section member along local Y. depth runs along X, flange width along Z. */
function ISection({ length, depth = 0.32, width = 0.26, tf = 0.025, tw = 0.014, mat = 'steel' }) {
  const off = depth / 2 - tf / 2;
  return (
    <group>
      <Block position={[off, 0, 0]} size={[tf, length, width]} mat={mat} />
      <Block position={[-off, 0, 0]} size={[tf, length, width]} mat={mat} />
      <Block position={[0, 0, 0]} size={[depth - tf * 2, length, tw]} mat={mat} edges={false} />
    </group>
  );
}

function Bolts({ positions, axis = 'x' }) {
  const rot = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  const { m } = useContext(SceneCtx);
  return positions.map((p, i) => (
    <mesh key={i} position={p} rotation={rot} material={m.steelLight}>
      <cylinderGeometry args={[0.018, 0.018, 0.05, 6]} />
    </mesh>
  ));
}

/* ------------------------------------------------------------------ */
/*  Corridor shell                                                     */
/* ------------------------------------------------------------------ */

function sideRooms(side) {
  return rooms.filter(r => r.side === side).sort((a, b) => b.z - a.z);
}

function Wall({ side }) {
  const x = (side === 'left' ? -1 : 1) * (HALF_W + WALL_T / 2);
  const segs = [];
  let top = Z_FRONT;
  sideRooms(side).forEach(r => {
    const a = r.z + DOOR_W / 2, b = r.z - DOOR_W / 2;
    segs.push([top, a]);
    // lintel above the door
    segs.push({ lintel: true, z: r.z });
    top = b;
  });
  segs.push([top, Z_BACK]);
  return (
    <group>
      {segs.map((s, i) => s.lintel
        ? <Block key={i} position={[x, (DOOR_H + HEIGHT) / 2, s.z]} size={[WALL_T, HEIGHT - DOOR_H, DOOR_W]} />
        : <Block key={i} position={[x, HEIGHT / 2, (s[0] + s[1]) / 2]} size={[WALL_T, HEIGHT, s[0] - s[1]]} />)}
      {/* skirting shadow line */}
      <Block position={[x * 0.995, 0.06, (Z_FRONT + Z_BACK) / 2]} size={[0.02, 0.12, Z_FRONT - Z_BACK]} mat="wallDark" edges={false} />
    </group>
  );
}

function PortalFrame({ z }) {
  const colH = HEIGHT - 0.45;
  const colX = HALF_W - 0.17;
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map(s => (
        <group key={s}>
          <group position={[s * colX, colH / 2, 0]}><ISection length={colH} /></group>
          <Block position={[s * colX, 0.015, 0]} size={[0.5, 0.03, 0.5]} mat="steel" />
          <Bolts positions={[[s * colX - 0.18, 0.04, -0.18], [s * colX + 0.18, 0.04, -0.18], [s * colX - 0.18, 0.04, 0.18], [s * colX + 0.18, 0.04, 0.18]]} axis="y" />
          {/* haunch */}
          <Block position={[s * (colX - 0.42), HEIGHT - 0.52, 0]} size={[0.7, 0.16, 0.012]} rotation={[0, 0, s * 0.28]} mat="steel" />
          <Block position={[s * (colX - 0.16), HEIGHT - 0.35, 0.14]} size={[0.3, 0.5, 0.02]} mat="steel" />
          <Bolts positions={[[s * (colX - 0.2), HEIGHT - 0.25, 0.155], [s * (colX - 0.2), HEIGHT - 0.45, 0.155], [s * (colX - 0.08), HEIGHT - 0.25, 0.155], [s * (colX - 0.08), HEIGHT - 0.45, 0.155]]} axis="z" />
        </group>
      ))}
      <group position={[0, HEIGHT - 0.225, 0]} rotation={[0, 0, Math.PI / 2]}>
        <ISection length={HALF_W * 2} depth={0.45} width={0.2} />
      </group>
    </group>
  );
}

function Ceiling() {
  const len = Z_FRONT - Z_BACK;
  const mid = (Z_FRONT + Z_BACK) / 2;
  return (
    <group>
      <Block position={[0, HEIGHT + 0.15, mid]} size={[HALF_W * 2 + WALL_T * 2, 0.3, len]} mat="ceiling" tile={4} />
      {/* continuous light line + cable tray */}
      <mesh position={[0, HEIGHT - 0.48, mid]} material={useContext(SceneCtx).m.glow}>
        <boxGeometry args={[0.07, 0.03, len - 2]} />
      </mesh>
      <Block position={[0, HEIGHT - 0.44, mid]} size={[0.16, 0.05, len - 2]} mat="steel" edges={false} />
      {[-1.9, 1.9].map(x => <Block key={x} position={[x, HEIGHT - 0.12, mid]} size={[0.4, 0.08, len - 1]} mat="steelLight" edges={false} />)}
    </group>
  );
}

function Floor() {
  const len = Z_FRONT - Z_BACK;
  return (
    <group>
      <Block position={[0, -0.05, (Z_FRONT + Z_BACK) / 2]} size={[HALF_W * 2, 0.1, len]} mat="floor" tile={4} />
      {/* centre setting-out line */}
      <mesh position={[0, 0.002, (Z_FRONT + Z_BACK) / 2 - 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.03, len - 6]} />
        <meshBasicMaterial color="#8d8a80" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function EndWall() {
  const tex = useMemo(() => labelTexture(['Thanks for walking through', 'muhammad shaheer · civil engineer'], {
    kind: 'caption', width: 1600, height: 220, bg: '#1f2224', fg: '#f1efe8',
  }), []);
  return (
    <group>
      <Block position={[0, HEIGHT / 2, Z_BACK - 0.2]} size={[HALF_W * 2 + WALL_T * 2, HEIGHT, 0.4]} />
      <TexPlane texture={tex} size={[4.4, 0.6]} position={[0, 2.3, Z_BACK + 0.01]} />
      <Block position={[0, 1.95, Z_BACK + 0.03]} size={[4.4, 0.04, 0.04]} mat="safety" />
      <Block position={[0, HEIGHT / 2, Z_FRONT + 0.2]} size={[HALF_W * 2 + WALL_T * 2, HEIGHT, 0.4]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Wall pictures & exhibits                                           */
/* ------------------------------------------------------------------ */

function Picture({ side, z, index }) {
  const item = STRUCTURES[index];
  const tex = useMemo(() => structureTexture(item), [item]);
  const cap = useMemo(() => labelTexture([item.title, item.caption], { kind: 'caption', width: 1024, height: 128, bg: '#2a2d2f' }), [item]);
  useEffect(() => () => { tex.dispose(); cap.dispose(); }, [tex, cap]);
  const s = side === 'left' ? 1 : -1;
  return (
    <group position={[-s * HALF_W, 0, z]} rotation={[0, s * Math.PI / 2, 0]}>
      <Block position={[0, 1.95, 0.03]} size={[1.62, 1.18, 0.05]} mat="black" edges={false} />
      <TexPlane texture={tex} size={[1.5, 1.055]} position={[0, 1.95, 0.058]} />
      <TexPlane texture={cap} size={[1.2, 0.15]} position={[0, 1.2, 0.012]} />
      {/* picture light */}
      <Block position={[0, 2.7, 0.14]} size={[0.9, 0.04, 0.06]} mat="steel" edges={false} />
      <mesh position={[0, 2.68, 0.15]} material={useContext(SceneCtx).m.glow}><boxGeometry args={[0.8, 0.012, 0.03]} /></mesh>
    </group>
  );
}

function Plinth({ position, children, label }) {
  const tex = useMemo(() => labelTexture(label, { kind: 'caption', width: 1024, height: 128, bg: '#2a2d2f' }), [label]);
  return (
    <group position={position}>
      <Block position={[0, 0.45, 0]} size={[1.1, 0.9, 1.1]} />
      <TexPlane texture={tex} size={[0.95, 0.12]} position={[0, 0.75, 0.556]} />
      <group position={[0, 0.9, 0]}>{children}</group>
    </group>
  );
}

function TrussModel() {
  const span = 1.0, h = 0.22, n = 6, d = span / n;
  const bars = [];
  [-0.12, 0.12].forEach(zz => {
    bars.push(<Bar key={`b${zz}`} from={[-span / 2, 0.08, zz]} to={[span / 2, 0.08, zz]} r={0.012} mat="steel" />);
    bars.push(<Bar key={`t${zz}`} from={[-span / 2 + d / 2, 0.08 + h, zz]} to={[span / 2 - d / 2, 0.08 + h, zz]} r={0.012} mat="steel" />);
    for (let i = 0; i < n; i++) {
      const x = -span / 2 + i * d;
      bars.push(<Bar key={`u${zz}${i}`} from={[x, 0.08, zz]} to={[x + d / 2, 0.08 + h, zz]} r={0.007} mat="steel" />);
      bars.push(<Bar key={`v${zz}${i}`} from={[x + d / 2, 0.08 + h, zz]} to={[x + d, 0.08, zz]} r={0.007} mat="steel" />);
    }
  });
  for (let i = 0; i <= n; i++) bars.push(<Bar key={`c${i}`} from={[-span / 2 + i * d, 0.08, -0.12]} to={[-span / 2 + i * d, 0.08, 0.12]} r={0.006} mat="steel" />);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <Block position={[0, 0.07, 0]} size={[span, 0.012, 0.26]} mat="wallDark" edges={false} />
      {[-span / 2, span / 2].map(x => <Block key={x} position={[x, 0.035, 0]} size={[0.08, 0.07, 0.3]} mat="wallDark" />)}
      {bars}
    </group>
  );
}

function RebarCage() {
  const bars = [];
  const c = 0.13, H = 1.0;
  [[-c, -c], [c, -c], [c, c], [-c, c], [0, -c], [0, c], [-c, 0], [c, 0]].forEach(([x, z], i) => {
    bars.push(<Bar key={`m${i}`} from={[x, 0, z]} to={[x, H, z]} r={0.011} />);
  });
  for (let y = 0.05; y < H; y += 0.1) {
    bars.push(
      <Bar key={`a${y}`} from={[-c, y, -c]} to={[c, y, -c]} r={0.005} />,
      <Bar key={`b${y}`} from={[-c, y, c]} to={[c, y, c]} r={0.005} />,
      <Bar key={`c${y}`} from={[-c, y, -c]} to={[-c, y, c]} r={0.005} />,
      <Bar key={`d${y}`} from={[c, y, -c]} to={[c, y, c]} r={0.005} />,
    );
  }
  return (
    <group>
      {bars}
      {/* half-cast column beside the cage */}
      <Block position={[0.0, 0.2, 0.0]} size={[0.34, 0.4, 0.34]} mat="wallDark" />
    </group>
  );
}

function SteelConnection() {
  return (
    <group>
      <group position={[0, 0.55, 0]}><ISection length={1.1} depth={0.26} width={0.22} /></group>
      <group position={[0.36, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}><ISection length={0.46} depth={0.24} width={0.16} /></group>
      <Block position={[0.14, 0.75, 0]} size={[0.02, 0.36, 0.22]} mat="steelLight" />
      <Bolts positions={[[0.16, 0.66, -0.06], [0.16, 0.66, 0.06], [0.16, 0.84, -0.06], [0.16, 0.84, 0.06]]} axis="x" />
      <Block position={[0, 0.01, 0]} size={[0.4, 0.02, 0.4]} mat="steel" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Lobby + avatar                                                     */
/* ------------------------------------------------------------------ */

function Avatar({ position }) {
  const tex = useTexture(profile.avatar);
  const bubbleTex = useMemo(() => labelTexture([profile.greeting, profile.greetingSub], { kind: 'bubble', width: 1024, height: 420 }), []);
  useEffect(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; }, [tex]);
  const group = useRef();
  const body = useRef();
  const bubble = useRef();
  const aspect = tex.image ? tex.image.width / tex.image.height : 0.45;
  const H = 1.5;
  useFrame(({ camera, clock }) => {
    if (!group.current) return;
    const g = group.current;
    // turn to face the visitor
    const target = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, THREE.MathUtils.clamp(target, -0.9, 0.9), 0.08);
    const t = clock.elapsedTime;
    if (body.current) {
      body.current.scale.y = 1 + Math.sin(t * 1.7) * 0.006;
      body.current.rotation.z = Math.sin(t * 0.9) * 0.012;
    }
    if (bubble.current) {
      const near = camera.position.z - g.position.z;
      const o = THREE.MathUtils.clamp((near - 1.2) / 2.5, 0, 1);
      bubble.current.material.opacity = o;
      bubble.current.position.y = H + 0.85 + Math.sin(t * 2) * 0.03;
    }
  });
  return (
    <group ref={group} position={position}>
      <group ref={body} position={[0, 0.55, 0]}>
        {/* soft contact shadow */}
        <mesh position={[0, H / 2, -0.04]}>
          <planeGeometry args={[H * aspect * 1.02, H * 1.01]} />
          <meshBasicMaterial map={tex} color="#000" transparent opacity={0.18} depthWrite={false} />
        </mesh>
        <mesh position={[0, H / 2, 0]}>
          <planeGeometry args={[H * aspect, H]} />
          <meshBasicMaterial map={tex} transparent alphaTest={0.05} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh ref={bubble} position={[0.15, H + 0.85, 0.05]}>
        <planeGeometry args={[1.5, 0.62]} />
        <meshBasicMaterial map={bubbleTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function HardHat({ position, mat = 'safety', rotation }) {
  const { m } = useContext(SceneCtx);
  return (
    <group position={position} rotation={rotation}>
      <mesh material={m[mat]} position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.13, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={m[mat]} position={[0.03, 0.02, 0]} scale={[1.25, 1, 1.05]}>
        <cylinderGeometry args={[0.14, 0.15, 0.015, 24]} />
      </mesh>
      <mesh material={m[mat]} position={[0, 0.13, 0]}><boxGeometry args={[0.03, 0.03, 0.2]} /></mesh>
    </group>
  );
}

function Lobby() {
  const plate = useMemo(() => labelTexture([profile.name, profile.title + ' · ' + profile.focus.split(' · ')[0]], { kind: 'caption', width: 1024, height: 140, bg: '#1f2224' }), []);
  const { m } = useContext(SceneCtx);
  return (
    <group>
      {/* reception counter */}
      <Block position={[1.75, 0.53, 4.35]} size={[2.3, 1.06, 0.55]} />
      <Block position={[1.75, 1.08, 4.32]} size={[2.45, 0.04, 0.68]} mat="steel" />
      <TexPlane texture={plate} size={[1.9, 0.26]} position={[1.75, 0.62, 4.63]} />
      <Block position={[1.75, 0.08, 4.64]} size={[2.3, 0.04, 0.02]} mat="safety" edges={false} />
      <HardHat position={[1.0, 1.1, 4.3]} rotation={[0, 0.6, 0]} />
      <mesh position={[2.45, 1.14, 4.35]} rotation={[0, 0.3, Math.PI / 2]} material={m.white}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 12]} />
      </mesh>
      <mesh position={[2.45, 1.14, 4.35]} rotation={[0, 0.3, Math.PI / 2]} material={m.blue}>
        <cylinderGeometry args={[0.041, 0.041, 0.08, 12]} />
      </mesh>
      <Suspense fallback={null}>
        <Avatar position={[1.75, 0, 3.75]} />
      </Suspense>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Doors                                                              */
/* ------------------------------------------------------------------ */

function Door({ room, open, onSelect, interactive }) {
  const s = room.side === 'left' ? 1 : -1; // local +x faces the corridor
  const leaf = useRef();
  const signMat = useRef();
  const [hover, setHover] = useState(false);
  const sign = useMemo(() => labelTexture([room.number, room.label], { kind: 'sign', width: 1024, height: 200 }), [room]);
  useEffect(() => () => sign.dispose(), [sign]);
  const { m } = useContext(SceneCtx);
  useFrame((_, dt) => {
    if (!leaf.current) return;
    const target = open ? 1.75 : hover && interactive ? 0.14 : 0;
    leaf.current.rotation.y = THREE.MathUtils.damp(leaf.current.rotation.y, target, open ? 3.5 : 8, dt);
    if (signMat.current) {
      const c = hover && interactive ? 1.25 : 1;
      signMat.current.color.setScalar(THREE.MathUtils.damp(signMat.current.color.r, c, 8, dt));
    }
  });
  useEffect(() => {
    document.body.style.cursor = hover && interactive ? 'pointer' : '';
    return () => { document.body.style.cursor = ''; };
  }, [hover, interactive]);
  const events = interactive ? {
    onPointerOver: e => { e.stopPropagation(); setHover(true); },
    onPointerOut: () => setHover(false),
    onClick: e => { e.stopPropagation(); setHover(false); onSelect(room.id); },
  } : {};
  const face = WALL_T / 2;
  return (
    <group position={[-s * (HALF_W + WALL_T / 2), 0, room.z]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
      {/* steel door casing */}
      {[-1, 1].map(k => <Block key={k} position={[face, DOOR_H / 2, k * (DOOR_W / 2 + 0.04)]} size={[0.06, DOOR_H + 0.08, 0.1]} mat="steel" />)}
      <Block position={[face, DOOR_H + 0.04, 0]} size={[0.06, 0.1, DOOR_W + 0.18]} mat="steel" />
      {/* reveal linings */}
      {[-1, 1].map(k => <Block key={`r${k}`} position={[0, DOOR_H / 2, k * (DOOR_W / 2 - 0.01)]} size={[WALL_T, DOOR_H, 0.02]} mat="wallDark" edges={false} />)}
      {/* leaf, hinged on the +z jamb, swings into the room */}
      <group ref={leaf} position={[-0.02, 0, DOOR_W / 2 - 0.04]}>
        <group position={[0, 0, -(DOOR_W - 0.08) / 2]} {...events}>
          <Block position={[0, DOOR_H / 2 - 0.02, 0]} size={[0.05, DOOR_H - 0.06, DOOR_W - 0.08]} mat="door" />
          <mesh position={[0.03, 1.75, 0.2]} material={m.warmGlass}><boxGeometry args={[0.012, 0.7, 0.16]} /></mesh>
          <Block position={[0.05, 1.05, -0.55]} size={[0.04, 0.04, 0.22]} mat="steelLight" edges={false} />
          <Block position={[0.03, 0.22, 0]} size={[0.012, 0.3, DOOR_W - 0.2]} mat="steelLight" edges={false} />
          <mesh position={[0.032, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.36, 0.36]} />
            <meshBasicMaterial color="#f2c12e" toneMapped={false} />
          </mesh>
        </group>
      </group>
      {/* sign above the door */}
      <mesh position={[face + 0.01, DOOR_H + 0.55, 0]} rotation={[0, Math.PI / 2, 0]} {...events}>
        <planeGeometry args={[1.9, 0.37]} />
        <meshBasicMaterial ref={signMat} map={sign} toneMapped={false} />
      </mesh>
      {/* hazard threshold strip */}
      <Hazard position={[face + 0.32, 0.003, 0]} />
    </group>
  );
}

let hazardTex;
function Hazard({ position }) {
  if (!hazardTex) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1c1f1d'; ctx.fillRect(0, 0, 256, 32);
    ctx.fillStyle = '#f2c12e';
    for (let x = -32; x < 256; x += 32) { ctx.beginPath(); ctx.moveTo(x, 32); ctx.lineTo(x + 16, 0); ctx.lineTo(x + 32, 0); ctx.lineTo(x + 16, 32); ctx.fill(); }
    hazardTex = new THREE.CanvasTexture(c);
    hazardTex.colorSpace = THREE.SRGBColorSpace;
  }
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      <planeGeometry args={[DOOR_W + 0.2, 0.18]} />
      <meshBasicMaterial map={hazardTex} toneMapped={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Rooms behind the doors                                             */
/* ------------------------------------------------------------------ */

function RoomShell({ children, light = '#ffe6c4' }) {
  const { m } = useContext(SceneCtx);
  // local frame: door wall at +x, back wall at -x
  const H = HEIGHT;
  return (
    <group>
      <Block position={[0, -0.05, 0]} size={[ROOM, 0.1, ROOM]} mat="floor" tile={4} />
      <Block position={[0, H + 0.1, 0]} size={[ROOM, 0.2, ROOM]} mat="ceiling" tile={4} />
      <Block position={[-ROOM / 2 - 0.1, H / 2, 0]} size={[0.2, H, ROOM]} />
      <Block position={[0, H / 2, -ROOM / 2 - 0.1]} size={[ROOM, H, 0.2]} />
      <Block position={[0, H / 2, ROOM / 2 + 0.1]} size={[ROOM, H, 0.2]} />
      {/* steel beam across the room */}
      <group position={[0, H - 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}><ISection length={ROOM} depth={0.4} width={0.18} /></group>
      <mesh position={[-0.6, H - 0.03, 0]} material={m.glow}><boxGeometry args={[2.4, 0.03, 0.1]} /></mesh>
      <pointLight position={[-0.5, H - 0.6, 0]} intensity={14} distance={11} decay={1.4} color={light} />
      {children}
    </group>
  );
}

function Table({ position, size = [1.6, 0.76, 0.8], rotation, mat = 'wood' }) {
  const [w, h, d] = size;
  return (
    <group position={position} rotation={rotation}>
      <Block position={[0, h, 0]} size={[w, 0.04, d]} mat={mat} />
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => (
        <Block key={`${a}${b}`} position={[a * (w / 2 - 0.05), h / 2, b * (d / 2 - 0.05)]} size={[0.04, h, 0.04]} mat="steel" edges={false} />
      ))}
    </group>
  );
}

function WallFrame({ position, texture, size = [1, 0.7], rotation = [0, Math.PI / 2, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <Block position={[0, 0, -0.02]} size={[size[0] + 0.08, size[1] + 0.08, 0.04]} mat="black" edges={false} />
      <TexPlane texture={texture} size={size} position={[0, 0, 0.002]} />
    </group>
  );
}

function AboutProps() {
  const portrait = useTexture(profile.portrait);
  useEffect(() => { portrait.colorSpace = THREE.SRGBColorSpace; }, [portrait]);
  const drawing = useMemo(() => structureTexture(STRUCTURES[7]), []);
  return (
    <group>
      <WallFrame position={[-3.47, 2.15, 0.9]} texture={portrait} size={[1.1, 1.3]} />
      <WallFrame position={[-3.47, 2.2, -1.2]} texture={drawing} size={[1.3, 0.91]} />
      <Table position={[-1.9, 0, -1.6]} size={[1.6, 0.9, 0.9]} />
      <Block position={[-1.9, 1.02, -1.6]} size={[1.4, 0.02, 0.75]} mat="white" rotation={[0.25, 0, 0]} />
      <HardHat position={[-1.3, 0.93, -1.9]} rotation={[0, 1.2, 0]} />
      {/* bookshelf with binders */}
      <Block position={[-2.3, 1.1, 3.3]} size={[2.2, 2.2, 0.4]} mat="darkWood" />
      {[0.5, 1.2, 1.9].map(y => [0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <Block key={`${y}${i}`} position={[-3.1 + i * 0.22, y + 0.2, 3.12]} size={[0.07 + (i % 3) * 0.02, 0.36, 0.3]} mat={['blue', 'black', 'safety', 'white'][(i + y * 10) % 4 | 0]} edges={false} />
      )))}
    </group>
  );
}

function ProjectsProps() {
  const textures = useMemo(() => STRUCTURES.slice(0, 6).map(structureTexture), []);
  return (
    <group>
      {textures.map((t, i) => (
        <WallFrame key={i} texture={t} size={[1.05, 0.74]} position={[-3.47, i < 3 ? 2.75 : 1.75, -1.4 + (i % 3) * 1.4]} />
      ))}
      <Table position={[-0.9, 0, 0.2]} size={[1.8, 0.9, 1.1]} />
      {/* scale model: three-storey RC frame */}
      <group position={[-0.9, 0.92, 0.2]}>
        {[0, 1, 2].map(f => (
          <group key={f}>
            {[-0.5, 0, 0.5].flatMap(x => [-0.3, 0.3].map(z => (
              <Block key={`${x}${z}`} position={[x, f * 0.22 + 0.11, z]} size={[0.04, 0.22, 0.04]} mat="wallDark" />
            )))}
            <Block position={[0, f * 0.22 + 0.23, 0]} size={[1.15, 0.025, 0.75]} />
          </group>
        ))}
      </group>
    </group>
  );
}

function ActivitiesProps() {
  const { m } = useContext(SceneCtx);
  return (
    <group>
      {/* trophy shelf */}
      <Block position={[-3.25, 1.4, 0]} size={[0.4, 0.05, 3.2]} mat="darkWood" />
      <Block position={[-3.25, 2.2, 0]} size={[0.4, 0.05, 3.2]} mat="darkWood" />
      {[-1.1, -0.35, 0.4, 1.15].map((z, i) => (
        <group key={z} position={[-3.25, 1.425, z]}>
          <mesh material={m.black} position={[0, 0.05, 0]}><boxGeometry args={[0.16, 0.1, 0.16]} /></mesh>
          <mesh material={m.gold} position={[0, 0.2, 0]}><cylinderGeometry args={[0.02, 0.03, 0.2, 10]} /></mesh>
          <mesh material={m.gold} position={[0, 0.36, 0]}><cylinderGeometry args={[0.11 - i * 0.01, 0.04, 0.16, 16]} /></mesh>
        </group>
      ))}
      {[-0.8, 0.2, 1.0].map((z, i) => (
        <mesh key={z} material={i === 1 ? m.gold : m.steelLight} position={[-3.3, 2.42, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
        </mesh>
      ))}
      <Table position={[-1.4, 0, -1.2]} size={[1.6, 0.85, 0.8]} />
      <group position={[-1.4, 0.87, -1.2]} rotation={[0, Math.PI / 2, 0]}><TrussModel /></group>
      {/* cricket kit */}
      <Block position={[-2.9, 0.45, 2.6]} size={[0.11, 0.85, 0.05]} mat="wood" rotation={[0, 0.3, 0.18]} />
      <mesh material={m.red} position={[-2.5, 0.04, 2.3]}><sphereGeometry args={[0.04, 14, 10]} /></mesh>
      <HardHat position={[-2.2, 0.0, 2.6]} mat="blue" rotation={[0, 2, 0]} />
    </group>
  );
}

function ContactProps() {
  const board = useMemo(() => labelTexture(["Let's build", 'send me the brief'], { kind: 'caption', width: 1024, height: 300, bg: '#f4f2eb', fg: '#1c1f1d' }), []);
  const { m } = useContext(SceneCtx);
  return (
    <group>
      <WallFrame position={[-3.47, 2.0, 0]} texture={board} size={[2.6, 0.76]} />
      <Table position={[-1.8, 0, 0.2]} size={[1.8, 0.76, 0.9]} rotation={[0, 0, 0]} mat="darkWood" />
      <Block position={[-2.05, 0.9, 0.2]} size={[0.03, 0.26, 0.42]} mat="black" rotation={[0, 0, -0.2]} />
      <mesh position={[-2.03, 0.9, 0.2]} rotation={[0, Math.PI / 2, -0.2]} material={m.glow}><planeGeometry args={[0.38, 0.22]} /></mesh>
      <Block position={[-1.8, 0.79, 0.2]} size={[0.3, 0.015, 0.42]} mat="steelLight" />
      <Block position={[-1.5, 0.8, -0.3]} size={[0.24, 0.02, 0.32]} mat="white" />
      {/* hard-hat rack */}
      <Block position={[-1.2, 1.7, -3.45]} size={[2.2, 0.06, 0.1]} mat="steel" />
      {['safety', 'white', 'blue', 'orange'].map((c, i) => <HardHat key={c} position={[-2.0 + i * 0.55, 1.73, -3.3]} mat={c} />)}
    </group>
  );
}

const ROOM_PROPS = { about: AboutProps, projects: ProjectsProps, activities: ActivitiesProps, contact: ContactProps };

function Room({ room }) {
  const s = room.side === 'left' ? 1 : -1;
  const Props = ROOM_PROPS[room.id];
  const cx = -s * (HALF_W + WALL_T + ROOM / 2);
  return (
    <group position={[cx, 0, room.z]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
      <RoomShell>
        <Suspense fallback={null}><Props /></Suspense>
      </RoomShell>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Camera                                                             */
/* ------------------------------------------------------------------ */

function roomPoses(room) {
  const s = room.side === 'left' ? 1 : -1;
  return {
    front: { pos: new THREE.Vector3(-s * 0.5, EYE, room.z), yaw: s * Math.PI / 2 },
    inside: { pos: new THREE.Vector3(-s * (HALF_W + WALL_T + 1.6), EYE, room.z + s * 0.4), yaw: s * (Math.PI / 2 + 0.22) },
  };
}

function shortestAngle(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function CameraRig({ zTarget, camZ, activeRoom, onArrive, onExited, setOpenId, reducedMotion, started }) {
  const { camera, size } = useThree();
  const st = useRef({ pos: new THREE.Vector3(0, EYE + 0.4, CORRIDOR.start + 3), yaw: 0, pitch: 0, phase: 'corridor', room: null, wait: 0 });
  const tmp = useRef(new THREE.Vector3());
  const narrow = size.width < 760;

  useEffect(() => {
    const s = st.current;
    if (activeRoom && s.room && s.room.id !== activeRoom && s.phase !== 'corridor') {
      // switching rooms: walk back out first, then on to the next door
      s.next = activeRoom;
      if (s.phase !== 'turn') s.phase = 'leave';
    } else if (activeRoom && s.room?.id !== activeRoom) {
      s.room = rooms.find(r => r.id === activeRoom);
      s.phase = 'travel';
    } else if (!activeRoom && s.room && s.phase !== 'corridor') {
      s.phase = 'leave';
    }
  }, [activeRoom]);

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    if (narrow) camera.clearViewOffset();
    else camera.setViewOffset(size.width, size.height, -size.width * 0.12, 0, size.width, size.height);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, narrow]);

  useFrame(({ pointer }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = st.current;
    const target = tmp.current;
    let yaw = 0, speed = 3, maxV = 11, turnRate = 4.5;
    const poses = s.room ? roomPoses(s.room) : null;

    switch (s.phase) {
      case 'travel':
        target.set(0, EYE, s.room.z);
        if (Math.abs(s.pos.z - s.room.z) < 0.6) s.phase = 'face';
        break;
      case 'face':
        target.copy(poses.front.pos); yaw = poses.front.yaw; speed = 5; turnRate = 6.5;
        if (s.pos.distanceTo(target) < 0.12 && Math.abs(shortestAngle(s.yaw, yaw)) < 0.1) {
          setOpenId(s.room.id); s.phase = 'opening'; s.wait = 0.4;
        }
        break;
      case 'opening':
        target.copy(poses.front.pos); yaw = poses.front.yaw; turnRate = 6.5;
        s.wait -= dt;
        if (s.wait <= 0) s.phase = 'enter';
        break;
      case 'enter':
        target.copy(poses.inside.pos); yaw = poses.inside.yaw; speed = 3.4; maxV = 6;
        if (s.pos.distanceTo(target) < 0.18) { s.phase = 'inside'; onArrive(s.room.id); }
        break;
      case 'inside':
        target.copy(poses.inside.pos); yaw = poses.inside.yaw + (reducedMotion ? 0 : -pointer.x * 0.06);
        break;
      case 'leave':
        target.copy(poses.front.pos); yaw = poses.front.yaw; speed = 4; maxV = 7;
        if (s.pos.distanceTo(target) < 0.18) { s.phase = 'turn'; setOpenId(null); }
        break;
      case 'turn':
        target.set(0, EYE, s.room.z); yaw = 0; speed = 5; turnRate = 7;
        if (Math.abs(shortestAngle(s.yaw, 0)) < 0.12) {
          zTarget.current = s.room.z;
          if (s.next) { s.room = rooms.find(r => r.id === s.next); s.next = null; s.phase = 'travel'; }
          else { s.phase = 'corridor'; s.room = null; onExited(); }
        }
        break;
      default: {
        const z = started ? zTarget.current : CORRIDOR.start + 3;
        target.set(0, started ? EYE : EYE + 0.4, z);
        if (!reducedMotion && !narrow) yaw = -pointer.x * 0.1;
        // phones: turn towards the avatar at the reception counter while in the lobby
        if (narrow) yaw = -0.34 * THREE.MathUtils.clamp((s.pos.z - 4.5) / 3, 0, 1);
      }
    }

    // move: exponential ease capped at a walking/running speed
    const dist = s.pos.distanceTo(target);
    if (dist > 1e-4) {
      let step = reducedMotion ? dist : dist * (1 - Math.exp(-speed * dt));
      step = Math.min(step, maxV * dt * (s.phase === 'corridor' ? 1.6 : 1));
      s.pos.lerp(target, step / dist);
    }
    const dy = shortestAngle(s.yaw, yaw);
    s.yaw += reducedMotion ? dy : dy * (1 - Math.exp(-turnRate * dt));
    const pitchTarget = s.phase !== 'corridor' ? 0
      : narrow ? -0.14 * THREE.MathUtils.clamp((s.pos.z - 4.5) / 3, 0, 1)
      : reducedMotion ? 0 : pointer.y * 0.04;
    s.pitch += (pitchTarget - s.pitch) * (1 - Math.exp(-4 * dt));

    // gentle footstep bob while walking the corridor
    const walking = s.phase === 'corridor' || s.phase === 'travel' ? Math.min(1, Math.abs(target.z - s.pos.z)) : 0;
    const bob = reducedMotion ? 0 : Math.sin(s.pos.z * 2.6) * 0.025 * walking;

    camera.position.set(s.pos.x, s.pos.y + bob, s.pos.z);
    camera.rotation.set(s.pitch, s.yaw, 0);
    camZ.current = s.pos.z;
  });
  return null;
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

function Lights({ lowPower }) {
  const zs = lowPower ? [5, -12, -30, -46] : [6, -3, -12, -21, -30, -39, -48];
  return (
    <group>
      <hemisphereLight args={['#fdfbf5', '#8a857a', 1.1]} />
      <ambientLight intensity={0.35} />
      {zs.map(z => <pointLight key={z} position={[0, HEIGHT - 0.7, z]} intensity={lowPower ? 22 : 16} distance={lowPower ? 22 : 15} decay={1.3} color="#fff3e2" />)}
    </group>
  );
}

function World({ blueprint, lowPower, onReady, ...rig }) {
  const m = useMaterialSet(blueprint);
  const ctx = useMemo(() => ({ m, blueprint }), [m, blueprint]);
  const [openId, setOpenId] = useState(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  const bg = blueprint ? '#0c2a4d' : '#c9c7c0';
  return (
    <SceneCtx.Provider value={ctx}>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, blueprint ? 14 : 20, blueprint ? 55 : 70]} />
      <Lights lowPower={lowPower} />
      <Floor />
      <Ceiling />
      <Wall side="left" />
      <Wall side="right" />
      <EndWall />
      {FRAME_Z.map(z => <PortalFrame key={z} z={z} />)}
      {PICTURES.map(([side, z, i]) => <Picture key={`${side}${z}`} side={side} z={z} index={i} />)}
      <Plinth position={[-2.55, 0, -13.8]} label={['RC column cage', '8T16 + T10 links @ 100']}><RebarCage /></Plinth>
      <Plinth position={[2.55, 0, -24]} label={['Warren truss model', 'steel · 1:50']}><TrussModel /></Plinth>
      <Plinth position={[-2.55, 0, -37]} label={['Moment connection', 'end plate · M20 bolts']}><SteelConnection /></Plinth>
      <Lobby />
      {rooms.map(r => (
        <group key={r.id}>
          <Door room={r} open={openId === r.id} onSelect={rig.onSelectRoom} interactive={!rig.activeRoom} />
          <Room room={r} />
        </group>
      ))}
      <CameraRig {...rig} setOpenId={setOpenId} />
    </SceneCtx.Provider>
  );
}

export default function CorridorScene({ blueprint, lowPower, reducedMotion, onReady, onFailure, ...rig }) {
  return (
    <div className="scene">
      <Canvas
        dpr={lowPower ? [1, 1.25] : [1, 1.75]}
        camera={{ position: [0, EYE + 0.4, CORRIDOR.start + 3], fov: 62, near: 0.05, far: 120 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          gl.domElement.addEventListener('webglcontextlost', onFailure, { once: true });
        }}
      >
        <Suspense fallback={null}>
          <World blueprint={blueprint} lowPower={lowPower} onReady={onReady} reducedMotion={reducedMotion} {...rig} />
        </Suspense>
      </Canvas>
    </div>
  );
}

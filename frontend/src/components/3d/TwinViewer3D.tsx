import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnatomyNode, SimulationFrame } from '../../types';
import { 
  Layers, 
  RefreshCw, 
  Activity, 
  Sparkles, 
  Scissors, 
  Droplet, 
  Wind, 
  Eye, 
  EyeOff, 
  Flame, 
  Check, 
  HeartHandshake,
  Tag
} from 'lucide-react';

interface TwinViewer3DProps {
  nodes: AnatomyNode[];
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode) => void;
  simulationFrame: SimulationFrame;
  isWireframe?: boolean;
  lodLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  onEbusClick?: (station: string) => void;
  isMobile?: boolean;
  // 高级透视与图层控制 (可选外部传入)
  externalShowVessels?: boolean;
  externalShowLesion?: boolean;
  externalPerfusionMode?: boolean;
  isModalOpen?: boolean;
}

// =========================================================================
// 1. 单个支气管管道连接段 (Procedural Cylinder/Tube)
// =========================================================================
function BronchusSegment({
  start,
  end,
  startRadius,
  endRadius,
  color,
  isWireframe,
  isLesion,
  flutter = 0,
  isSelected = false,
  clipPlane,
  onClick
}: {
  start: [number, number, number];
  end: [number, number, number];
  startRadius: number;
  endRadius: number;
  color: string;
  isWireframe?: boolean;
  isLesion?: boolean;
  flutter?: number;
  isSelected?: boolean;
  clipPlane?: THREE.Plane | null;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const { position, rotation, length } = useMemo(() => {
    const p1 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const rot = new THREE.Euler();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
    rot.setFromQuaternion(quat);

    return { position: mid, rotation: rot, length: len };
  }, [start, end]);

  useFrame(({ clock }) => {
    if (meshRef.current && isLesion) {
      if (flutter !== 0) {
        meshRef.current.position.x = position.x + flutter * 0.4;
        meshRef.current.position.z = position.z + flutter * 0.2;
      }
      if (haloRef.current) {
        const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
        haloRef.current.scale.set(pulse, 1, pulse);
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <cylinderGeometry args={[endRadius, startRadius, length, 24, 2]} />
        <meshPhysicalMaterial
          color={isSelected ? '#38bdf8' : isLesion ? '#f43f5e' : color}
          roughness={0.25}
          metalness={0.1}
          clearcoat={0.3}
          clearcoatRoughness={0.15}
          wireframe={isWireframe}
          emissive={isSelected ? '#0284c7' : isLesion ? '#e11d48' : '#000000'}
          emissiveIntensity={isSelected ? 0.8 : isLesion ? 0.6 : 0}
          clippingPlanes={clipPlane ? [clipPlane] : undefined}
          clipShadows
        />
      </mesh>

      {/* RB3 病灶重构狭窄红黄色炎性浸润微发光外环 */}
      {isLesion && (
        <mesh ref={haloRef}>
          <cylinderGeometry args={[endRadius * 1.6, startRadius * 1.5, length * 0.8, 16, 1]} />
          <meshBasicMaterial
            color="#fb923c"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            clippingPlanes={clipPlane ? [clipPlane] : undefined}
          />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 2. 肺主要动静脉血管系统 (Pulmonary Major Vessels: 肺动脉红 + 肺静脉蓝)
// =========================================================================
function PulmonaryVesselSystem({ clipPlane }: { clipPlane?: THREE.Plane | null }) {
  const arteries = useMemo(() => [
    // 肺动脉主干 (Pulmonary Trunk)
    { start: [0.1, 2.2, 0.4] as [number, number, number], end: [0.7, 1.9, 0.3] as [number, number, number], r: 0.22, color: '#f43f5e' },
    { start: [0.7, 1.9, 0.3] as [number, number, number], end: [1.8, 2.2, 0.4] as [number, number, number], r: 0.17, color: '#f43f5e' },
    { start: [1.8, 2.2, 0.4] as [number, number, number], end: [2.5, 2.7, 0.5] as [number, number, number], r: 0.11, color: '#fb7185' },
    { start: [0.7, 1.9, 0.3] as [number, number, number], end: [1.9, 0.4, 0.2] as [number, number, number], r: 0.16, color: '#f43f5e' },
    { start: [1.9, 0.4, 0.2] as [number, number, number], end: [2.6, -1.0, 0.3] as [number, number, number], r: 0.12, color: '#fb7185' },
    // 左肺动脉
    { start: [0.1, 2.2, 0.4] as [number, number, number], end: [-0.9, 1.8, 0.2] as [number, number, number], r: 0.20, color: '#f43f5e' },
    { start: [-0.9, 1.8, 0.2] as [number, number, number], end: [-1.9, 2.1, 0.3] as [number, number, number], r: 0.15, color: '#f43f5e' },
    { start: [-0.9, 1.8, 0.2] as [number, number, number], end: [-1.8, 0.1, 0.1] as [number, number, number], r: 0.14, color: '#fb7185' },
    { start: [-1.8, 0.1, 0.1] as [number, number, number], end: [-2.4, -1.1, 0.1] as [number, number, number], r: 0.11, color: '#fb7185' },
  ], []);

  const veins = useMemo(() => [
    // 右肺静脉 (右上/右下肺静脉汇入左心房)
    { start: [0.4, 1.2, -0.3] as [number, number, number], end: [1.7, 1.4, -0.1] as [number, number, number], r: 0.16, color: '#0284c7' },
    { start: [1.7, 1.4, -0.1] as [number, number, number], end: [2.4, 1.8, -0.1] as [number, number, number], r: 0.11, color: '#38bdf8' },
    { start: [0.4, 0.8, -0.3] as [number, number, number], end: [1.8, -0.4, -0.2] as [number, number, number], r: 0.15, color: '#0284c7' },
    { start: [1.8, -0.4, -0.2] as [number, number, number], end: [2.5, -1.4, -0.3] as [number, number, number], r: 0.10, color: '#38bdf8' },
    // 左肺静脉
    { start: [-0.4, 1.1, -0.3] as [number, number, number], end: [-1.6, 1.3, -0.1] as [number, number, number], r: 0.15, color: '#0284c7' },
    { start: [-1.6, 1.3, -0.1] as [number, number, number], end: [-2.3, 1.6, 0.0] as [number, number, number], r: 0.10, color: '#38bdf8' },
    { start: [-0.4, 0.7, -0.3] as [number, number, number], end: [-1.7, -0.6, -0.2] as [number, number, number], r: 0.14, color: '#0284c7' },
  ], []);

  return (
    <group>
      {/* 肺动脉树 (红色/玫瑰金) */}
      {arteries.map((art, idx) => {
        const p1 = new THREE.Vector3(...art.start);
        const p2 = new THREE.Vector3(...art.end);
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const rot = new THREE.Euler();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
        rot.setFromQuaternion(quat);

        return (
          <group key={`art-${idx}`} position={mid} rotation={rot}>
            <mesh>
              <cylinderGeometry args={[art.r * 0.85, art.r, len, 16]} />
              <meshPhysicalMaterial
                color={art.color}
                emissive="#be123c"
                emissiveIntensity={0.35}
                roughness={0.2}
                metalness={0.25}
                clearcoat={0.6}
                clippingPlanes={clipPlane ? [clipPlane] : undefined}
                transparent
                opacity={0.88}
              />
            </mesh>
          </group>
        );
      })}

      {/* 肺静脉树 (蓝色/青色) */}
      {veins.map((vn, idx) => {
        const p1 = new THREE.Vector3(...vn.start);
        const p2 = new THREE.Vector3(...vn.end);
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const rot = new THREE.Euler();
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
        rot.setFromQuaternion(quat);

        return (
          <group key={`vn-${idx}`} position={mid} rotation={rot}>
            <mesh>
              <cylinderGeometry args={[vn.r * 0.85, vn.r, len, 16]} />
              <meshPhysicalMaterial
                color={vn.color}
                emissive="#0369a1"
                emissiveIntensity={0.35}
                roughness={0.2}
                metalness={0.2}
                clearcoat={0.6}
                clippingPlanes={clipPlane ? [clipPlane] : undefined}
                transparent
                opacity={0.88}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// =========================================================================
// 3. 实时呼吸气流粒子流线 (Airflow Velocity Particles)
// =========================================================================
function AirflowParticles({
  flowRate = 0.45,
  isLesionSelected = false,
  clipPlane
}: {
  flowRate: number;
  isLesionSelected?: boolean;
  clipPlane?: THREE.Plane | null;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 480;

  // 粒子轨迹路线 (主气管 ➔ 隆突 ➔ 左右主支气管 ➔ 叶段)
  const [positions, targets, colors, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const tgt = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);

    const waypoints = [
      { start: [0, 4.3, 0], end: [0, 2.5, 0], side: 'trachea' },
      { start: [0, 2.5, 0], end: [1.2, 1.8, 0.2], side: 'rmb' },
      { start: [0, 2.5, 0], end: [-1.4, 1.6, -0.1], side: 'lmb' },
      { start: [1.2, 1.8, 0.2], end: [2.8, 2.1, 1.1], side: 'rb3_lesion' }, // 狭窄段
      { start: [1.2, 1.8, 0.2], end: [2.3, -0.1, 0.9], side: 'rmlb' },
      { start: [1.2, 1.8, 0.2], end: [2.5, -2.3, 0.8], side: 'rlb' },
      { start: [-1.4, 1.6, -0.1], end: [-2.1, 2.0, 0.3], side: 'lub' },
      { start: [-1.4, 1.6, -0.1], end: [-1.9, 0.3, -0.2], side: 'llb' },
    ];

    for (let i = 0; i < particleCount; i++) {
      const wp = waypoints[i % waypoints.length];
      const alpha = Math.random();
      const pX = wp.start[0] + (wp.end[0] - wp.start[0]) * alpha + (Math.random() - 0.5) * 0.12;
      const pY = wp.start[1] + (wp.end[1] - wp.start[1]) * alpha;
      const pZ = wp.start[2] + (wp.end[2] - wp.start[2]) * alpha + (Math.random() - 0.5) * 0.12;

      pos[i * 3] = pX;
      pos[i * 3 + 1] = pY;
      pos[i * 3 + 2] = pZ;

      tgt[i * 3] = wp.end[0];
      tgt[i * 3 + 1] = wp.end[1];
      tgt[i * 3 + 2] = wp.end[2];

      spd[i] = 0.025 + Math.random() * 0.04;

      // 颜色根据所在分支赋色 (RB3 狭窄区赋高剪切力黄红色)
      if (wp.side === 'rb3_lesion') {
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.3;
        col[i * 3 + 2] = 0.2;
      } else {
        col[i * 3] = 0.2;
        col[i * 3 + 1] = 0.85;
        col[i * 3 + 2] = 1.0;
      }
    }

    return [pos, tgt, col, spd];
  }, [particleCount]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      const posAttr = geo.attributes.position;
      const arr = posAttr.array as Float32Array;

      const rateMul = Math.max(0.6, Math.min(2.5, flowRate * 2.2));

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        // 向目标流动
        const dx = targets[idx] - arr[idx];
        const dy = targets[idx + 1] - arr[idx + 1];
        const dz = targets[idx + 2] - arr[idx + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 0.15 || arr[idx + 1] < -3.0) {
          // 重置回气管顶部
          arr[idx] = (Math.random() - 0.5) * 0.22;
          arr[idx + 1] = 4.3;
          arr[idx + 2] = (Math.random() - 0.5) * 0.22;
        } else {
          const step = speeds[i] * rateMul;
          arr[idx] += (dx / dist) * step;
          arr[idx + 1] += (dy / dist) * step;
          arr[idx + 2] += (dz / dist) * step;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        clippingPlanes={clipPlane ? [clipPlane] : undefined}
      />
    </points>
  );
}

// =========================================================================
// 4. 气管树与精细化左二右三半透明五叶架构 (支持 V/Q 灌注热力与 3D 剖切)
// =========================================================================
function BronchialTree({
  nodes,
  selectedNode,
  onSelectNode,
  simulationFrame,
  isWireframe,
  lodLevel,
  showPleura = true,
  showBronchi = true,
  showLesion = true,
  colorMode = 'TRANSPARENT',
  clipPlane = null
}: {
  nodes: AnatomyNode[];
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode) => void;
  simulationFrame: SimulationFrame;
  isWireframe?: boolean;
  lodLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  showPleura?: boolean;
  showBronchi?: boolean;
  showLesion?: boolean;
  colorMode?: 'TRANSPARENT' | 'PERFUSION_VQ';
  clipPlane?: THREE.Plane | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const expansion = simulationFrame.metrics.expansion_ratio || 1.0;
  const flutter = simulationFrame.metrics.flutter_displacement || 0.0;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(expansion, expansion, expansion);
    }
  });

  // 主气管隆突与分支
  const tracheaTop: [number, number, number] = [0, 4.3, 0];
  const carinaPoint: [number, number, number] = [0, 2.5, 0];
  const rmbEnd: [number, number, number] = [1.2, 1.8, 0.2];
  const lmbEnd: [number, number, number] = [-1.4, 1.6, -0.1];

  // 右肺分支
  const rubEnd: [number, number, number] = [2.0, 2.4, 0.4];
  const biEnd: [number, number, number] = [1.7, 0.7, 0.1];
  const rmlbEnd: [number, number, number] = [2.3, -0.1, 0.9];
  const rlbEnd: [number, number, number] = [1.9, -0.6, -0.2];

  // 左肺分支
  const lubEnd: [number, number, number] = [-2.1, 2.0, 0.3];
  const llbEnd: [number, number, number] = [-1.9, 0.3, -0.2];
  const lingularEnd: [number, number, number] = [-2.7, 1.0, 0.8];

  const segments = useMemo(() => [
    { id: 'TRACHEA', start: tracheaTop, end: carinaPoint, r1: 0.38, r2: 0.34, color: '#67e8f9' },
    { id: 'RMB', start: carinaPoint, end: rmbEnd, r1: 0.30, r2: 0.26, color: '#38bdf8' },
    { id: 'LMB', start: carinaPoint, end: lmbEnd, r1: 0.27, r2: 0.23, color: '#38bdf8' },
    
    // 右侧叶段 (B1-B10)
    { id: 'RUB', start: rmbEnd, end: rubEnd, r1: 0.23, r2: 0.19, color: '#0ea5e9' },
    { id: 'BI', start: rmbEnd, end: biEnd, r1: 0.24, r2: 0.21, color: '#0ea5e9' },
    { id: 'RB1', start: rubEnd, end: [2.5, 3.4, 0.7] as [number, number, number], r1: 0.15, r2: 0.11, color: '#a5f3fc' },
    { id: 'RB2', start: rubEnd, end: [2.9, 2.7, -0.7] as [number, number, number], r1: 0.14, r2: 0.10, color: '#a5f3fc' },
    { id: 'RB3', start: rubEnd, end: [2.8, 2.1, 1.1] as [number, number, number], r1: 0.15, r2: 0.05, color: '#f43f5e', isLesion: true },
    { id: 'RMLB', start: biEnd, end: rmlbEnd, r1: 0.19, r2: 0.15, color: '#38bdf8' },
    { id: 'RB4', start: rmlbEnd, end: [3.3, -0.4, 1.4] as [number, number, number], r1: 0.13, r2: 0.09, color: '#a5f3fc' },
    { id: 'RB5', start: rmlbEnd, end: [2.7, -0.7, 1.7] as [number, number, number], r1: 0.12, r2: 0.09, color: '#a5f3fc' },
    { id: 'RLB', start: biEnd, end: rlbEnd, r1: 0.21, r2: 0.17, color: '#38bdf8' },
    { id: 'RB6', start: rlbEnd, end: [2.5, -0.8, -1.1] as [number, number, number], r1: 0.14, r2: 0.10, color: '#a5f3fc' },
    { id: 'RB7', start: rlbEnd, end: [1.8, -1.9, 0.3] as [number, number, number], r1: 0.12, r2: 0.08, color: '#a5f3fc' },
    { id: 'RB8', start: rlbEnd, end: [2.5, -2.3, 0.8] as [number, number, number], r1: 0.13, r2: 0.09, color: '#a5f3fc' },
    { id: 'RB9', start: rlbEnd, end: [3.3, -2.4, -0.3] as [number, number, number], r1: 0.13, r2: 0.09, color: '#a5f3fc' },
    { id: 'RB10', start: rlbEnd, end: [2.7, -2.7, -1.2] as [number, number, number], r1: 0.13, r2: 0.09, color: '#a5f3fc' },

    // 左侧叶段 (B1-B10)
    { id: 'LUB', start: lmbEnd, end: lubEnd, r1: 0.21, r2: 0.17, color: '#0ea5e9' },
    { id: 'LB1_2', start: lubEnd, end: [-2.6, 3.3, -0.3] as [number, number, number], r1: 0.14, r2: 0.10, color: '#a5f3fc' },
    { id: 'LB3', start: lubEnd, end: [-2.8, 2.2, 1.0] as [number, number, number], r1: 0.14, r2: 0.10, color: '#a5f3fc' },
    { id: 'LINGULAR', start: lubEnd, end: lingularEnd, r1: 0.16, r2: 0.13, color: '#38bdf8' },
    { id: 'LB4', start: lingularEnd, end: [-3.3, 0.5, 1.3] as [number, number, number], r1: 0.12, r2: 0.09, color: '#a5f3fc' },
    { id: 'LB5', start: lingularEnd, end: [-3.1, -0.1, 1.4] as [number, number, number], r1: 0.12, r2: 0.08, color: '#a5f3fc' },
    { id: 'LLB', start: lmbEnd, end: llbEnd, r1: 0.20, r2: 0.16, color: '#0ea5e9' },
    { id: 'LB6', start: llbEnd, end: [-2.5, 0.1, -1.2] as [number, number, number], r1: 0.13, r2: 0.10, color: '#a5f3fc' },
    { id: 'LB7_8', start: llbEnd, end: [-2.4, -1.7, 0.7] as [number, number, number], r1: 0.13, r2: 0.09, color: '#a5f3fc' },
    { id: 'LB9', start: llbEnd, end: [-3.2, -2.1, -0.2] as [number, number, number], r1: 0.12, r2: 0.09, color: '#a5f3fc' },
    { id: 'LB10', start: llbEnd, end: [-2.6, -2.5, -1.1] as [number, number, number], r1: 0.13, r2: 0.09, color: '#a5f3fc' }
  ], []);

  // 肺叶颜色与发光 (依据解剖透光模式 vs V/Q 蓝红灌注映射模式)
  const lobeStyles = useMemo(() => {
    if (colorMode === 'PERFUSION_VQ') {
      return {
        // 右上叶: 严重气肿+低灌注 (缺氧红黄色)
        rul: { color: '#ef4444', emissive: '#991b1b', opacity: 0.48 },
        // 右中叶: 轻度低通气
        rml: { color: '#f59e0b', emissive: '#b45309', opacity: 0.42 },
        // 右下叶: 代偿性良好灌注 (健康富氧蓝)
        rll: { color: '#0284c7', emissive: '#0369a1', opacity: 0.38 },
        // 左上叶: 良好通气灌注
        lul: { color: '#0ea5e9', emissive: '#0284c7', opacity: 0.38 },
        // 左下叶: 良好通气灌注
        lll: { color: '#0284c7', emissive: '#0369a1', opacity: 0.38 }
      };
    }
    // 标准复旦中山/LTTS 级半透明透光材质
    return {
      rul: { color: '#0284c7', emissive: '#0369a1', opacity: 0.36 },
      rml: { color: '#0ea5e9', emissive: '#0284c7', opacity: 0.34 },
      rll: { color: '#0284c7', emissive: '#0369a1', opacity: 0.36 },
      lul: { color: '#0284c7', emissive: '#0369a1', opacity: 0.36 },
      lll: { color: '#0284c7', emissive: '#0369a1', opacity: 0.36 }
    };
  }, [colorMode]);

  return (
    <group ref={groupRef}>
      {/* 主气管C型软骨环 (高精立体凹凸质感) */}
      {lodLevel === 'HIGH' && showBronchi && (
        <group position={[0, 3.4, 0]}>
          {[0.8, 0.6, 0.4, 0.2, 0, -0.2, -0.4, -0.6, -0.8].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.39, 0.035, 12, 32, Math.PI * 1.5]} />
              <meshStandardMaterial
                color="#cbd5e1"
                roughness={0.4}
                metalness={0.2}
                emissive="#94a3b8"
                emissiveIntensity={0.2}
                clippingPlanes={clipPlane ? [clipPlane] : undefined}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 渲染各级支气管管道 */}
      {showBronchi && segments.map((seg) => {
        if (!showLesion && seg.isLesion) return null;
        const nodeInfo = nodes.find(n => n.id === seg.id);
        const isSelected = selectedNode?.id === seg.id;
        return (
          <BronchusSegment
            key={seg.id}
            start={seg.start}
            end={seg.end}
            startRadius={seg.r1}
            endRadius={seg.r2}
            color={seg.color}
            isWireframe={isWireframe}
            isLesion={seg.isLesion}
            flutter={seg.isLesion ? flutter : 0}
            isSelected={isSelected}
            clipPlane={clipPlane}
            onClick={() => {
              if (nodeInfo) onSelectNode(nodeInfo);
            }}
          />
        );
      })}

      {/* 商业顶尖级左二右三五叶半透明透光解剖材质 (MeshPhysicalMaterial SSS次表面散射质感) */}
      {showPleura && lodLevel !== 'LOW' && (
        <group>
          {/* 右肺右上叶 (RUL) */}
          <mesh position={[2.2, 1.8, 0.2]} scale={[1.35, 1.3, 1.25]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color={lobeStyles.rul.color}
              emissive={lobeStyles.rul.emissive}
              emissiveIntensity={colorMode === 'PERFUSION_VQ' ? 0.3 : 0.12}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              clearcoatRoughness={0.2}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={lobeStyles.rul.opacity}
              wireframe={isWireframe}
              clippingPlanes={clipPlane ? [clipPlane] : undefined}
            />
          </mesh>

          {/* 右肺右中叶 (RML) */}
          <mesh position={[2.5, 0.1, 0.7]} scale={[1.2, 0.95, 1.1]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color={lobeStyles.rml.color}
              emissive={lobeStyles.rml.emissive}
              emissiveIntensity={colorMode === 'PERFUSION_VQ' ? 0.25 : 0.1}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={lobeStyles.rml.opacity}
              wireframe={isWireframe}
              clippingPlanes={clipPlane ? [clipPlane] : undefined}
            />
          </mesh>

          {/* 右肺右下叶 (RLL) */}
          <mesh position={[2.3, -1.2, -0.2]} scale={[1.45, 1.7, 1.45]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color={lobeStyles.rll.color}
              emissive={lobeStyles.rll.emissive}
              emissiveIntensity={0.12}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={lobeStyles.rll.opacity}
              wireframe={isWireframe}
              clippingPlanes={clipPlane ? [clipPlane] : undefined}
            />
          </mesh>

          {/* 左肺左上叶 (LUL，含舌叶) */}
          <mesh position={[-2.3, 1.6, 0.1]} scale={[1.35, 1.5, 1.3]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color={lobeStyles.lul.color}
              emissive={lobeStyles.lul.emissive}
              emissiveIntensity={0.12}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={lobeStyles.lul.opacity}
              wireframe={isWireframe}
              clippingPlanes={clipPlane ? [clipPlane] : undefined}
            />
          </mesh>

          {/* 左肺左下叶 (LLL，含心切迹) */}
          <mesh position={[-2.1, -0.9, -0.1]} scale={[1.4, 1.75, 1.4]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color={lobeStyles.lll.color}
              emissive={lobeStyles.lll.emissive}
              emissiveIntensity={0.12}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={lobeStyles.lll.opacity}
              wireframe={isWireframe}
              clippingPlanes={clipPlane ? [clipPlane] : undefined}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// =========================================================================
// 5. 1R-12L 淋巴结分站定位球体 (支持智能精简高亮与防遮挡模式)
// =========================================================================
function LymphNodeMarker({
  node,
  isSelected,
  onSelect,
  onEbusClick,
  clipPlane,
  labelMode = 'SMART',
  isModalOpen = false
}: {
  node: AnatomyNode;
  isSelected: boolean;
  onSelect: () => void;
  onEbusClick?: (station: string) => void;
  clipPlane?: THREE.Plane | null;
  labelMode?: 'SMART' | 'ALL' | 'NONE';
  isModalOpen?: boolean;
}) {
  const isSwollen = node.status === 'SWOLLEN';
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sphereRef.current && (isSwollen || isHovered)) {
      const s = 1.0 + 0.25 * Math.sin(t * 3.5);
      sphereRef.current.scale.set(s, s, s);
    }
    if (ringRef.current) {
      const ringScale = 1.0 + (t * 1.5) % 1.5;
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
    }
  });

  // 智能防遮挡标签展示逻辑:
  // 1. 弹窗打开时，绝对隐藏 3D 浮动标签，绝不遮挡弹窗窗口
  // 2. NONE 模式: 隐藏所有文字标签
  // 3. ALL 模式: 显示所有标签
  // 4. SMART 模式 (默认): 严禁任何常驻死卡片阻挡气道！仅在鼠标悬停 (Hover) 时显示，移开鼠标即隐，保持视野清爽
  const shouldShowLabel = useMemo(() => {
    if (isModalOpen) return false;
    if (labelMode === 'NONE') return false;
    if (labelMode === 'ALL') return true;
    return isHovered;
  }, [isModalOpen, labelMode, isHovered]);

  return (
    <group position={node.coords}>
      {(node.ebus || isSwollen) && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.26, 24]} />
          <meshBasicMaterial
            color={isSwollen ? '#f43f5e' : '#00e5ff'}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            clippingPlanes={clipPlane ? [clipPlane] : undefined}
          />
        </mesh>
      )}

      <mesh
        ref={sphereRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          if (node.station && onEbusClick) onEbusClick(node.station);
        }}
      >
        <sphereGeometry args={[isSwollen ? 0.22 : isSelected || isHovered ? 0.20 : 0.14, 20, 20]} />
        <meshPhysicalMaterial
          color={isSelected ? '#38bdf8' : isSwollen ? '#f43f5e' : isHovered ? '#34d399' : '#10b981'}
          emissive={isSwollen ? '#e11d48' : isSelected ? '#0284c7' : isHovered ? '#059669' : '#047857'}
          emissiveIntensity={isSwollen ? 1.0 : isSelected || isHovered ? 0.8 : 0.4}
          roughness={0.15}
          clearcoat={0.4}
          clippingPlanes={clipPlane ? [clipPlane] : undefined}
        />
      </mesh>

      {/* 淋巴结文字浮签 (智能防遮挡，受 zIndexRange 控制，仅在 hover 或全部显示时即时呈现) */}
      {shouldShowLabel && (
        <Html distanceFactor={14} position={[0, 0.35, 0]} center zIndexRange={[5, 0]}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
              if (node.station && onEbusClick) onEbusClick(node.station);
            }}
            className={`cursor-pointer px-2.5 py-1 rounded-xl text-[10px] whitespace-nowrap border transition-all shadow-xl select-none ${
              isSwollen
                ? 'bg-rose-950/95 text-rose-200 border-rose-500/80 font-bold scale-105 shadow-rose-950/60'
                : isSelected
                ? 'bg-cyan-500 text-slate-950 border-white font-extrabold scale-110 shadow-cyan-500/50'
                : 'bg-emerald-950/95 text-emerald-200 border-emerald-400 font-bold scale-105 shadow-emerald-950/60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{node.station ? `${node.station}站 (EBUS)` : node.name_cn}</span>
              {isSwollen && (
                <span className="px-1 py-0.2 rounded bg-rose-500 text-white text-[9px] font-black">
                  水肿
                </span>
              )}
            </div>
            <div className="text-[9px] text-slate-300/80 font-normal mt-0.5">
              点击展开 EBUS 探查指引
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// =========================================================================
// 6. 主渲染入口 (TwinViewer3D)
// =========================================================================
export function TwinViewer3D({
  nodes,
  selectedNode,
  onSelectNode,
  simulationFrame,
  isWireframe = false,
  lodLevel = 'HIGH',
  onEbusClick,
  isMobile = false,
  externalShowVessels = true,
  externalShowLesion = true,
  externalPerfusionMode = false,
  isModalOpen = false
}: TwinViewer3DProps) {
  const controlsRef = useRef<any>(null);

  // 视口独立图层解剖开关状态
  const [showPleura, setShowPleura] = useState(true);
  const [showBronchi, setShowBronchi] = useState(true);
  const [showVessels, setShowVessels] = useState(externalShowVessels);
  const [showLesion, setShowLesion] = useState(externalShowLesion);
  const [showLymphNodes, setShowLymphNodes] = useState(true);
  const [showAirflowParticles, setShowAirflowParticles] = useState(true);
  const [colorMode, setColorMode] = useState<'TRANSPARENT' | 'PERFUSION_VQ'>(
    externalPerfusionMode ? 'PERFUSION_VQ' : 'TRANSPARENT'
  );

  // 淋巴结标签模式: 'SMART' (智能高亮，默认) | 'ALL' (全部显示) | 'NONE' (仅图标)
  const [labelMode, setLabelMode] = useState<'SMART' | 'ALL' | 'NONE'>('SMART');

  // 3D 剖切功能状态
  const [enableClipping, setEnableClipping] = useState(false);
  const [clipDepth, setClipDepth] = useState(0.5); // 沿 Z 轴切面 -2.0 ~ 2.0
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  // 同步外部属性
  useEffect(() => {
    if (externalPerfusionMode !== undefined) {
      setColorMode(externalPerfusionMode ? 'PERFUSION_VQ' : 'TRANSPARENT');
    }
  }, [externalPerfusionMode]);

  const clipPlane = useMemo(() => {
    if (!enableClipping) return null;
    return new THREE.Plane(new THREE.Vector3(0, 0, 1), clipDepth);
  }, [enableClipping, clipDepth]);

  const lymphNodes = useMemo(() => {
    return nodes.filter(n => n.label === 'LymphNode');
  }, [nodes]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#050814] overflow-hidden select-none isolate z-0">
      {/* 3D 视口悬浮工具栏 (包含解剖图层、3D剖切、血流灌注映射、视角复位) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* 解剖图层下拉切换 */}
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 shadow-lg backdrop-blur-md transition active:scale-95"
            title="解剖图层开关 (胸膜、支气管、主要血管、病灶区、淋巴结)"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>解剖图层</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono">
              {(showPleura ? 1 : 0) + (showBronchi ? 1 : 0) + (showVessels ? 1 : 0) + (showLesion ? 1 : 0) + (showLymphNodes ? 1 : 0)}/5
            </span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 p-2 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl z-20 space-y-1 text-xs">
              <div className="text-[10px] text-slate-400 font-semibold px-2 py-1">解剖结构可见性</div>
              <button
                onClick={() => setShowPleura(!showPleura)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <span className="text-cyan-400">🫁</span> 肺叶与胸膜
                </span>
                {showPleura ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              <button
                onClick={() => setShowBronchi(!showBronchi)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sky-400">🌿</span> 支气管树 (B1-B10)
                </span>
                {showBronchi ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              <button
                onClick={() => setShowVessels(!showVessels)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <span className="text-rose-400">🫀</span> 肺动静脉主要血管
                </span>
                {showVessels ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              <button
                onClick={() => setShowLesion(!showLesion)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">⚠️</span> RB3 病灶重构狭窄区
                </span>
                {showLesion ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              <button
                onClick={() => setShowLymphNodes(!showLymphNodes)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <span className="text-emerald-400">🟣</span> 1R-12L 淋巴结分站
                </span>
                {showLymphNodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            </div>
          )}
        </div>

        {/* 蓝-红动态血流灌注映射 V/Q 切换 */}
        <button
          onClick={() => setColorMode(colorMode === 'TRANSPARENT' ? 'PERFUSION_VQ' : 'TRANSPARENT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            colorMode === 'PERFUSION_VQ'
              ? 'bg-gradient-to-r from-blue-600/90 to-rose-600/90 border-rose-400/80 text-white shadow-lg shadow-rose-950/50'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white'
          }`}
          title="切换蓝-红动态血流灌注 (V/Q Perfusion) 映射"
        >
          <Droplet className={`w-3.5 h-3.5 ${colorMode === 'PERFUSION_VQ' ? 'text-rose-300 animate-pulse' : 'text-blue-400'}`} />
          <span>{colorMode === 'PERFUSION_VQ' ? 'V/Q血流灌注态' : '解剖半透明透光'}</span>
        </button>

        {/* 气流流线粒子流 */}
        <button
          onClick={() => setShowAirflowParticles(!showAirflowParticles)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showAirflowParticles
              ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-400'
          }`}
          title="开/关实时呼吸气流粒子流线"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>气流粒子流线</span>
        </button>

        {/* 淋巴结站位标签显示模式切换 (智能精简 / 全部显示 / 仅图标) */}
        {showLymphNodes && (
          <button
            onClick={() => {
              setLabelMode((prev) => (prev === 'SMART' ? 'ALL' : prev === 'ALL' ? 'NONE' : 'SMART'));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              labelMode === 'SMART'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : labelMode === 'ALL'
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-400'
            }`}
            title="切换 3D 淋巴结站位标签模式 (智能精简 / 全部显示 / 仅图标)"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>
              {labelMode === 'SMART' ? '标签: 智能精简' : labelMode === 'ALL' ? '标签: 全部显示' : '标签: 仅图标'}
            </span>
          </button>
        )}

        {/* 3D 剖切功能开关 */}
        <button
          onClick={() => setEnableClipping(!enableClipping)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            enableClipping
              ? 'bg-purple-950/90 border-purple-500/80 text-purple-300 shadow-md shadow-purple-950/40'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white'
          }`}
          title="开启 3D 冠状面剖切观察腔内深部气道"
        >
          <Scissors className="w-3.5 h-3.5 text-purple-400" />
          <span>3D剖切</span>
        </button>

        {/* 视角复位 */}
        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white transition-all shadow-md"
          title="复位临床观察视角"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>复位</span>
        </button>
      </div>

      {/* 3D 剖切深度滑块控制器 (当剖切开启时展示在顶部右侧) */}
      {enableClipping && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-purple-600/70 text-xs backdrop-blur-md shadow-xl pointer-events-auto animate-in fade-in duration-200">
          <Scissors className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-300 font-medium">剖切深度:</span>
          <input
            type="range"
            min="-1.5"
            max="1.5"
            step="0.05"
            value={clipDepth}
            onChange={(e) => setClipDepth(parseFloat(e.target.value))}
            className="w-28 accent-purple-400 cursor-pointer"
          />
          <span className="font-mono text-purple-300 font-bold w-12 text-right">
            {(clipDepth * 10).toFixed(1)} cm
          </span>
        </div>
      )}

      {/* 呼吸状态与力学仿真实时浮动 HUD 指示 */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs backdrop-blur-md shadow-xl pointer-events-auto">
        <Activity className={`w-4 h-4 ${simulationFrame.phase === 'INSPIRATION' ? 'text-cyan-400 animate-pulse' : 'text-amber-400'}`} />
        <span className="text-slate-400">生理阶段:</span>
        <span className={`font-bold ${simulationFrame.phase === 'INSPIRATION' ? 'text-cyan-300' : 'text-amber-300'}`}>
          {simulationFrame.phase === 'INSPIRATION' ? '吸气相 (Inspiration)' : '呼气相 (Expiration - 颤振)'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">气道压 Paw:</span>
        <span className="font-mono text-cyan-300 font-bold">{simulationFrame.metrics.airway_pressure_cmh2o} cmH₂O</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">通气流速:</span>
        <span className="font-mono text-emerald-300 font-bold">{simulationFrame.metrics.flow_rate_lps} L/s</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">顺应性 Crs:</span>
        <span className="font-mono text-amber-300 font-bold">42.5 mL/cmH₂O</span>
      </div>

      {/* Three.js R3F Canvas 渲染管线 (启用 localClippingEnabled) */}
      <Canvas
        camera={{ position: [0, 1.2, 9.2], fov: isMobile ? 48 : 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        gl={{ localClippingEnabled: true }}
        onPointerMissed={() => {
          // 点击空白处，自动将焦点恢复为主病灶段 RB3
          if (selectedNode?.label === 'LymphNode') {
            const rb3 = nodes.find((n) => n.id === 'RB3');
            if (rb3) onSelectNode(rb3);
          }
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 16, 10]} intensity={1.3} />
        <directionalLight position={[-10, 6, -5]} intensity={0.6} />
        <pointLight position={[0, 2, 4]} intensity={1.0} color="#38bdf8" />
        <pointLight position={[2.8, 2.1, 1.1]} intensity={1.2} color="#f43f5e" distance={3} />

        {/* 气管树与精细化五肺叶网格 (含血流灌注与剖切) */}
        <BronchialTree
          nodes={nodes}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          simulationFrame={simulationFrame}
          isWireframe={isWireframe}
          lodLevel={lodLevel}
          showPleura={showPleura}
          showBronchi={showBronchi}
          showLesion={showLesion}
          colorMode={colorMode}
          clipPlane={clipPlane}
        />

        {/* 主要动静脉血管系统 (红蓝主血管) */}
        {showVessels && <PulmonaryVesselSystem clipPlane={clipPlane} />}

        {/* 呼吸气流流线粒子 */}
        {showAirflowParticles && (
          <AirflowParticles
            flowRate={simulationFrame.metrics.flow_rate_lps}
            isLesionSelected={selectedNode?.id === 'RB3'}
            clipPlane={clipPlane}
          />
        )}

        {/* 1R-12L 淋巴结定位球体 */}
        {showLymphNodes && lymphNodes.map((ln) => (
          <LymphNodeMarker
            key={ln.id}
            node={ln}
            isSelected={selectedNode?.id === ln.id}
            onSelect={() => onSelectNode(ln)}
            onEbusClick={onEbusClick}
            clipPlane={clipPlane}
            labelMode={labelMode}
            isModalOpen={isModalOpen}
          />
        ))}

        {/* 触控与鼠标视角控制器 */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={3.5}
          maxDistance={18}
          maxPolarAngle={Math.PI - 0.1}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          }}
        />
      </Canvas>
    </div>
  );
}

export default TwinViewer3D;

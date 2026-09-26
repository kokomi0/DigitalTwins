import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnatomyNode, SimulationFrame } from '../../types';
import { Layers, RefreshCw, Activity, Sparkles, Stethoscope, Eye } from 'lucide-react';

interface TwinViewer3DProps {
  nodes: AnatomyNode[];
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode) => void;
  simulationFrame: SimulationFrame;
  isWireframe?: boolean;
  lodLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  onEbusClick?: (station: string) => void;
  isMobile?: boolean;
}

// 单个支气管管道连接段 (Procedural Cylinder/Tube)
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
      // 狭窄处高频流体颤振与发光微脉冲动画
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
          />
        </mesh>
      )}
    </group>
  );
}

// 气管树与精细化左二右三半透明肺叶架构
function BronchialTree({
  nodes,
  selectedNode,
  onSelectNode,
  simulationFrame,
  isWireframe,
  lodLevel
}: {
  nodes: AnatomyNode[];
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode) => void;
  simulationFrame: SimulationFrame;
  isWireframe?: boolean;
  lodLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}) {
  const groupRef = useRef<THREE.Group>(null);
  const expansion = simulationFrame.metrics.expansion_ratio || 1.0;
  const flutter = simulationFrame.metrics.flutter_displacement || 0.0;

  useFrame(() => {
    if (groupRef.current) {
      // 潮气呼吸主群组周期微缩放
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
    // 主支气管
    { id: 'TRACHEA', start: tracheaTop, end: carinaPoint, r1: 0.38, r2: 0.34, color: '#67e8f9' },
    { id: 'RMB', start: carinaPoint, end: rmbEnd, r1: 0.30, r2: 0.26, color: '#38bdf8' },
    { id: 'LMB', start: carinaPoint, end: lmbEnd, r1: 0.27, r2: 0.23, color: '#38bdf8' },
    
    // 右侧叶段 (B1-B10)
    { id: 'RUB', start: rmbEnd, end: rubEnd, r1: 0.23, r2: 0.19, color: '#0ea5e9' },
    { id: 'BI', start: rmbEnd, end: biEnd, r1: 0.24, r2: 0.21, color: '#0ea5e9' },
    { id: 'RB1', start: rubEnd, end: [2.5, 3.4, 0.7] as [number, number, number], r1: 0.15, r2: 0.11, color: '#a5f3fc' },
    { id: 'RB2', start: rubEnd, end: [2.9, 2.7, -0.7] as [number, number, number], r1: 0.14, r2: 0.10, color: '#a5f3fc' },
    { id: 'RB3', start: rubEnd, end: [2.8, 2.1, 1.1] as [number, number, number], r1: 0.15, r2: 0.05, color: '#f43f5e', isLesion: true }, // RB3 严重狭窄重构
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

  return (
    <group ref={groupRef}>
      {/* 主气管C型软骨环 (高精立体凹凸质感) */}
      {lodLevel === 'HIGH' && (
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
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 渲染各级支气管管道 */}
      {segments.map((seg) => {
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
            onClick={() => {
              if (nodeInfo) onSelectNode(nodeInfo);
            }}
          />
        );
      })}

      {/* 商业顶尖级左二右三五叶半透明透光解剖材质 (MeshPhysicalMaterial SSS次表面散射质感) */}
      {lodLevel !== 'LOW' && (
        <group>
          {/* 右肺右上叶 (RUL) */}
          <mesh position={[2.2, 1.8, 0.2]} scale={[1.35, 1.3, 1.25]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={0.12}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              clearcoatRoughness={0.2}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={0.36}
              wireframe={isWireframe}
            />
          </mesh>

          {/* 右肺右中叶 (RML) */}
          <mesh position={[2.5, 0.1, 0.7]} scale={[1.2, 0.95, 1.1]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color="#0ea5e9"
              emissive="#0284c7"
              emissiveIntensity={0.1}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={0.34}
              wireframe={isWireframe}
            />
          </mesh>

          {/* 右肺右下叶 (RLL) */}
          <mesh position={[2.3, -1.2, -0.2]} scale={[1.45, 1.7, 1.45]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={0.12}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={0.36}
              wireframe={isWireframe}
            />
          </mesh>

          {/* 左肺左上叶 (LUL，含舌叶) */}
          <mesh position={[-2.3, 1.6, 0.1]} scale={[1.35, 1.5, 1.3]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={0.12}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={0.36}
              wireframe={isWireframe}
            />
          </mesh>

          {/* 左肺左下叶 (LLL，含心切迹) */}
          <mesh position={[-2.1, -0.9, -0.1]} scale={[1.4, 1.75, 1.4]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshPhysicalMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={0.12}
              roughness={0.25}
              metalness={0.05}
              clearcoat={0.3}
              transmission={0.65}
              thickness={1.1}
              transparent
              opacity={0.36}
              wireframe={isWireframe}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 1R-12L 淋巴结分站定位球体 (含脉冲光晕与 EBUS 超声声像指示)
function LymphNodeMarker({
  node,
  isSelected,
  onSelect,
  onEbusClick
}: {
  node: AnatomyNode;
  isSelected: boolean;
  onSelect: () => void;
  onEbusClick?: (station: string) => void;
}) {
  const isSwollen = node.status === 'SWOLLEN';
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sphereRef.current && isSwollen) {
      // 肿大淋巴结7站脉动呼吸警示
      const s = 1.0 + 0.25 * Math.sin(t * 3.5);
      sphereRef.current.scale.set(s, s, s);
    }
    if (ringRef.current) {
      const ringScale = 1.0 + (t * 1.5) % 1.5;
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
    }
  });

  return (
    <group position={node.coords}>
      {/* 脉冲声像光波圈 */}
      {(node.ebus || isSwollen) && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.26, 24]} />
          <meshBasicMaterial
            color={isSwollen ? '#f43f5e' : '#00e5ff'}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      <mesh
        ref={sphereRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          if (node.station && onEbusClick) onEbusClick(node.station);
        }}
      >
        <sphereGeometry args={[isSwollen ? 0.24 : 0.16, 20, 20]} />
        <meshPhysicalMaterial
          color={isSelected ? '#38bdf8' : isSwollen ? '#f43f5e' : '#10b981'}
          emissive={isSwollen ? '#e11d48' : isSelected ? '#0284c7' : '#059669'}
          emissiveIntensity={isSwollen ? 1.0 : 0.7}
          roughness={0.15}
          clearcoat={0.4}
        />
      </mesh>

      {/* 淋巴结文字浮签 (Hover/Select可读) */}
      <Html distanceFactor={14} position={[0, 0.35, 0]} center>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            if (node.station && onEbusClick) onEbusClick(node.station);
          }}
          className={`cursor-pointer px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap border transition-all shadow-md ${
            isSelected
              ? 'bg-cyan-500 text-slate-950 border-white font-extrabold scale-110 shadow-cyan-500/50'
              : isSwollen
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/80 font-bold'
              : 'bg-slate-900/90 text-emerald-300 border-emerald-500/50'
          }`}
        >
          {node.station ? `${node.station}站 (EBUS)` : node.name_cn}
          {isSwollen && <span className="ml-1 text-rose-300 font-black animate-ping">!</span>}
        </div>
      </Html>
    </group>
  );
}

export function TwinViewer3D({
  nodes,
  selectedNode,
  onSelectNode,
  simulationFrame,
  isWireframe = false,
  lodLevel = 'HIGH',
  onEbusClick,
  isMobile = false
}: TwinViewer3DProps) {
  const controlsRef = useRef<any>(null);
  const [showLymphNodes, setShowLymphNodes] = useState(true);

  const lymphNodes = useMemo(() => {
    return nodes.filter(n => n.label === 'LymphNode');
  }, [nodes]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#070c18] overflow-hidden select-none">
      {/* 3D 视口悬浮工具栏 */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 pointer-events-auto">
        <button
          onClick={() => setShowLymphNodes(!showLymphNodes)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showLymphNodes
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
          }`}
          title="切换 1R-12L 淋巴结分站荧光与 EBUS 声像定位"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1R-12L 淋巴结</span>
        </button>

        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all shadow-md"
          title="复位临床观察视角"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>视角复位</span>
        </button>
      </div>

      {/* 呼吸状态与力学仿真实时浮动 HUD 指示 */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs backdrop-blur-md shadow-xl pointer-events-auto">
        <Activity className={`w-4 h-4 ${simulationFrame.phase === 'INSPIRATION' ? 'text-cyan-400 animate-pulse' : 'text-amber-400'}`} />
        <span className="text-slate-400">生理阶段:</span>
        <span className={`font-bold ${simulationFrame.phase === 'INSPIRATION' ? 'text-cyan-300' : 'text-amber-300'}`}>
          {simulationFrame.phase === 'INSPIRATION' ? '吸气相 (Inspiration)' : '呼气相 (Expiration - 颤振)'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">气道压:</span>
        <span className="font-mono text-cyan-300 font-bold">{simulationFrame.metrics.airway_pressure_cmh2o} cmH₂O</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">通气流量:</span>
        <span className="font-mono text-emerald-300 font-bold">{simulationFrame.metrics.flow_rate_lps} L/s</span>
      </div>

      {/* Three.js R3F Canvas 渲染管线 */}
      <Canvas
        camera={{ position: [0, 1.2, 9.2], fov: isMobile ? 48 : 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 16, 10]} intensity={1.3} />
        <directionalLight position={[-10, 6, -5]} intensity={0.6} />
        <pointLight position={[0, 2, 4]} intensity={1.0} color="#38bdf8" />
        <pointLight position={[2.8, 2.1, 1.1]} intensity={1.2} color="#f43f5e" distance={3} />

        {/* 气管树与精细化五肺叶网格 */}
        <BronchialTree
          nodes={nodes}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          simulationFrame={simulationFrame}
          isWireframe={isWireframe}
          lodLevel={lodLevel}
        />

        {/* 1R-12L 淋巴结定位球体 */}
        {showLymphNodes && lymphNodes.map((ln) => (
          <LymphNodeMarker
            key={ln.id}
            node={ln}
            isSelected={selectedNode?.id === ln.id}
            onSelect={() => onSelectNode(ln)}
            onEbusClick={onEbusClick}
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

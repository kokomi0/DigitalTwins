import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { 
  RotateCw, 
  RotateCcw, 
  Eye, 
  Wind, 
  Activity, 
  ShieldCheck, 
  Play, 
  Pause,
  Compass,
  Maximize2
} from 'lucide-react';

interface Patient3DLungViewerProps {
  score?: number; // 默认84分
  onScoreClick?: () => void;
  className?: string;
}

// =========================================================================
// 1. 单个支气管管道组件 (高精光滑管道)
// =========================================================================
function BronchialBranch({
  start,
  end,
  r1,
  r2,
  color = '#2dd4bf'
}: {
  start: [number, number, number];
  end: [number, number, number];
  r1: number;
  r2: number;
  color?: string;
}) {
  const { position, rotation, length } = useMemo(() => {
    const p1 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
    const rot = new THREE.Euler().setFromQuaternion(quat);

    return { position: mid, rotation: rot, length: len };
  }, [start, end]);

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[r2, r1, length, 18, 1, true]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        roughness={0.25}
        metalness={0.15}
        transparent
        opacity={0.88}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// =========================================================================
// 2. 清透气流呼吸粒子系统 (Airflow Breathing Particles)
// =========================================================================
function AirflowBreathingParticles({ count = 220, isBreathing = true }: { count?: number; isBreathing?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  // 预生成粒子初始路径参数
  const particleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      // 分配左右支气管或气管
      const isRight = Math.random() > 0.48;
      const progress = Math.random(); // 0~1 沿路径
      const speed = 0.25 + Math.random() * 0.4;
      const spreadX = (Math.random() - 0.5) * 0.6;
      const spreadZ = (Math.random() - 0.5) * 0.6;
      data.push({ isRight, progress, speed, spreadX, spreadZ });
    }
    return data;
  }, [count]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c1 = new THREE.Color('#34d399'); // 薄荷绿
    const c2 = new THREE.Color('#38bdf8'); // 晴空蓝
    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      const mixC = Math.random() > 0.5 ? c1 : c2;
      col[i * 3] = mixC.r;
      col[i * 3 + 1] = mixC.g;
      col[i * 3 + 2] = mixC.b;
    }
    return { positions: pos, colors: col };
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !isBreathing) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const p = particleData[i];
      p.progress += delta * p.speed * 0.7;
      if (p.progress > 1) {
        p.progress = 0;
      }

      // 计算位置轨迹 (气管入口 (0, 3.6, 0) -> 隆突 (0, 2.3, 0) -> 左右肺门 -> 肺叶深处)
      const t = p.progress;
      let x = 0;
      let y = 3.6;
      let z = 0;

      if (t < 0.35) {
        // 主气管向下
        const step = t / 0.35;
        x = (Math.random() - 0.5) * 0.12;
        y = THREE.MathUtils.lerp(3.6, 2.3, step);
        z = (Math.random() - 0.5) * 0.12;
      } else {
        // 分流入左右肺
        const step = (t - 0.35) / 0.65;
        const targetX = p.isRight ? 1.8 + p.spreadX : -1.8 + p.spreadX;
        const targetY = THREE.MathUtils.lerp(2.3, -0.6 + p.spreadZ * 0.8, step);
        const targetZ = p.spreadZ;

        x = THREE.MathUtils.lerp(0, targetX, step);
        y = targetY;
        z = targetZ;
      }

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// =========================================================================
// 3. 3D 数字肺主体 (左二右三五叶物理次表面散射模型 + 呼吸舒张驱动)
// =========================================================================
function LungModelScene({
  score = 84,
  isBreathing = true
}: {
  score?: number;
  isBreathing?: boolean;
}) {
  const lungGroupRef = useRef<THREE.Group>(null);
  const breathTimeRef = useRef<number>(0);

  // 呼吸运动驱动 (健康呼吸约 18 次/分，周期 ~3.33s，舒张幅度平缓健康)
  useFrame((_, delta) => {
    if (!lungGroupRef.current) return;
    if (isBreathing) {
      breathTimeRef.current += delta;
      // 呼吸节律正弦波
      const cycle = breathTimeRef.current * (Math.PI * 2 / 3.33);
      // 根据健康得分调整呼吸充盈感 (84分良好 -> 平缓饱满)
      const expansion = 1.0 + Math.sin(cycle) * 0.045;
      const yOffset = Math.sin(cycle) * 0.04;
      lungGroupRef.current.scale.set(expansion, expansion * 1.02, expansion);
      lungGroupRef.current.position.y = yOffset;
    }
  });

  // 支气管拓扑解剖路径
  const airwaySegments = useMemo(() => [
    // 主气管
    { start: [0, 3.8, 0] as [number, number, number], end: [0, 2.3, 0] as [number, number, number], r1: 0.28, r2: 0.25, color: '#34d399' },
    // 隆突分叉至左右主支气管
    { start: [0, 2.3, 0] as [number, number, number], end: [1.1, 1.6, 0.15] as [number, number, number], r1: 0.23, r2: 0.18, color: '#2dd4bf' },
    { start: [0, 2.3, 0] as [number, number, number], end: [-1.2, 1.5, -0.08] as [number, number, number], r1: 0.21, r2: 0.17, color: '#2dd4bf' },
    // 右肺叶分支 (上、中、下叶支气管)
    { start: [1.1, 1.6, 0.15] as [number, number, number], end: [1.8, 2.2, 0.35] as [number, number, number], r1: 0.17, r2: 0.13, color: '#38bdf8' },
    { start: [1.1, 1.6, 0.15] as [number, number, number], end: [1.6, 0.6, 0.1] as [number, number, number], r1: 0.18, r2: 0.14, color: '#38bdf8' },
    { start: [1.6, 0.6, 0.1] as [number, number, number], end: [2.0, -0.1, 0.7] as [number, number, number], r1: 0.14, r2: 0.10, color: '#38bdf8' },
    { start: [1.6, 0.6, 0.1] as [number, number, number], end: [1.7, -0.7, -0.15] as [number, number, number], r1: 0.15, r2: 0.11, color: '#38bdf8' },
    // 右上叶分支细支气管
    { start: [1.8, 2.2, 0.35] as [number, number, number], end: [2.3, 3.0, 0.6] as [number, number, number], r1: 0.11, r2: 0.07, color: '#6ee7b7' },
    { start: [1.8, 2.2, 0.35] as [number, number, number], end: [2.6, 2.3, -0.5] as [number, number, number], r1: 0.10, r2: 0.06, color: '#6ee7b7' },
    { start: [1.8, 2.2, 0.35] as [number, number, number], end: [2.4, 1.7, 0.9] as [number, number, number], r1: 0.10, r2: 0.05, color: '#34d399' },
    // 右下叶细支气管群
    { start: [1.7, -0.7, -0.15] as [number, number, number], end: [2.3, -1.5, 0.6] as [number, number, number], r1: 0.11, r2: 0.06, color: '#6ee7b7' },
    { start: [1.7, -0.7, -0.15] as [number, number, number], end: [2.8, -1.6, -0.3] as [number, number, number], r1: 0.10, r2: 0.06, color: '#6ee7b7' },
    { start: [1.7, -0.7, -0.15] as [number, number, number], end: [2.2, -1.9, -0.8] as [number, number, number], r1: 0.09, r2: 0.05, color: '#6ee7b7' },

    // 左肺叶分支 (上叶、下叶、舌段)
    { start: [-1.2, 1.5, -0.08] as [number, number, number], end: [-1.9, 1.9, 0.25] as [number, number, number], r1: 0.16, r2: 0.12, color: '#38bdf8' },
    { start: [-1.2, 1.5, -0.08] as [number, number, number], end: [-1.7, 0.3, -0.18] as [number, number, number], r1: 0.16, r2: 0.12, color: '#38bdf8' },
    { start: [-1.9, 1.9, 0.25] as [number, number, number], end: [-2.4, 2.8, -0.2] as [number, number, number], r1: 0.10, r2: 0.06, color: '#6ee7b7' },
    { start: [-1.9, 1.9, 0.25] as [number, number, number], end: [-2.5, 1.8, 0.8] as [number, number, number], r1: 0.10, r2: 0.06, color: '#6ee7b7' },
    // 左舌段与下叶细分支
    { start: [-1.9, 1.9, 0.25] as [number, number, number], end: [-2.4, 0.8, 0.7] as [number, number, number], r1: 0.12, r2: 0.08, color: '#38bdf8' },
    { start: [-1.7, 0.3, -0.18] as [number, number, number], end: [-2.2, -0.9, 0.5] as [number, number, number], r1: 0.10, r2: 0.06, color: '#6ee7b7' },
    { start: [-1.7, 0.3, -0.18] as [number, number, number], end: [-2.6, -1.3, -0.2] as [number, number, number], r1: 0.10, r2: 0.06, color: '#6ee7b7' },
    { start: [-1.7, 0.3, -0.18] as [number, number, number], end: [-2.0, -1.7, -0.7] as [number, number, number], r1: 0.09, r2: 0.05, color: '#6ee7b7' }
  ], []);

  // 翡翠健康透光肺叶半透明材质规范 (84分良好健康微光)
  const lobeMaterialProps = useMemo(() => ({
    color: '#10b981', // 健康翡翠绿
    emissive: '#047857', // 柔和微光
    emissiveIntensity: 0.26,
    roughness: 0.22,
    metalness: 0.08,
    transmission: 0.72, // 晶莹剔透感
    thickness: 1.15,
    transparent: true,
    opacity: 0.46,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15
  }), []);

  return (
    <group ref={lungGroupRef} position={[0, -0.2, 0]}>
      {/* 气道树支架 */}
      <group>
        {airwaySegments.map((seg, idx) => (
          <BronchialBranch
            key={idx}
            start={seg.start}
            end={seg.end}
            r1={seg.r1}
            r2={seg.r2}
            color={seg.color}
          />
        ))}

        {/* 主气管软骨环立体感装饰 */}
        {[0.6, 0.4, 0.2, 0, -0.2, -0.4, -0.6].map((yOffset, i) => (
          <mesh key={i} position={[0, 3.1 + yOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.29, 0.025, 12, 28, Math.PI * 1.5]} />
            <meshStandardMaterial
              color="#a7f3d0"
              emissive="#10b981"
              emissiveIntensity={0.2}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* 清透气流呼吸粒子流 */}
      <AirflowBreathingParticles count={240} isBreathing={isBreathing} />

      {/* ================= 右肺 (左三叶解剖解剖透光曲面) ================= */}
      <group position={[0.2, 0, 0]}>
        {/* 1. 右上叶 (Right Upper Lobe - RUL) */}
        <mesh position={[1.8, 1.7, 0.15]} scale={[1.25, 1.25, 1.18]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>

        {/* 2. 右中叶 (Right Middle Lobe - RML) */}
        <mesh position={[2.0, 0.1, 0.6]} scale={[1.1, 0.9, 1.0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            {...lobeMaterialProps}
            color="#14b8a6"
            emissive="#0f766e"
            opacity={0.44}
          />
        </mesh>

        {/* 3. 右下叶 (Right Lower Lobe - RLL) */}
        <mesh position={[1.9, -1.0, -0.1]} scale={[1.35, 1.35, 1.25]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>
      </group>

      {/* ================= 左肺 (二叶解剖解剖透光曲面，带心切迹) ================= */}
      <group position={[-0.2, 0, 0]}>
        {/* 4. 左上叶 (Left Upper Lobe - LUL) */}
        <mesh position={[-1.8, 1.6, 0.1]} scale={[1.22, 1.28, 1.15]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>

        {/* 5. 左下叶 (Left Lower Lobe - LLL) */}
        <mesh position={[-1.8, -0.9, -0.1]} scale={[1.3, 1.35, 1.2]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial {...lobeMaterialProps} />
        </mesh>
      </group>

      {/* 背景深邃空间呼吸绿色柔光晕 */}
      <mesh position={[0, 0.2, -2.5]}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial
          color="#064e3b"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// =========================================================================
// 4. 主导出大尺寸 3D 肺视界组件 (Patient3DLungViewer)
// =========================================================================
export const Patient3DLungViewer: React.FC<Patient3DLungViewerProps> = ({
  score = 84,
  onScoreClick,
  className = ''
}) => {
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isBreathing, setIsBreathing] = useState<boolean>(true);
  const controlsRef = useRef<any>(null);

  // 视角重置 / 切换
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleSetView = (angle: 'FRONT' | 'LEFT' | 'RIGHT') => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    if (angle === 'FRONT') {
      camera.position.set(0, 0.5, 8.5);
    } else if (angle === 'LEFT') {
      camera.position.set(-8.5, 0.5, 2);
    } else if (angle === 'RIGHT') {
      camera.position.set(8.5, 0.5, 2);
    }
    controlsRef.current.target.set(0, 0.3, 0);
    controlsRef.current.update();
  };

  return (
    <div className={`relative w-full h-full min-h-[460px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 shadow-2xl flex flex-col ${className}`}>
      {/* 顶部悬浮状态条 */}
      <div className="absolute top-4 left-5 right-5 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>3D 数字肺健康孪生视界</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                实时拟真
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              双肺通气良好 · 气流粒子速率 18 次/分
            </div>
          </div>
        </div>

        {/* 今日健康评分徽章 */}
        <button
          type="button"
          onClick={onScoreClick}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/50 hover:border-emerald-400 px-3.5 py-1.5 rounded-2xl shadow-lg backdrop-blur-md transition-all active:scale-95 pointer-events-auto group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="text-[10px] text-emerald-300 font-medium">健康评估评分</div>
            <div className="text-sm font-black text-white font-mono leading-none">
              {score} <span className="text-[10px] font-normal text-emerald-300">/ 100</span>
            </div>
          </div>
        </button>
      </div>

      {/* 3D WebGL Canvas 渲染视口 */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 0.4, 8.5], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full"
        >
          {/* 柔和健康医学级照明系统 */}
          <ambientLight intensity={1.1} />
          <directionalLight position={[6, 8, 6]} intensity={1.6} color="#ecfdf5" />
          <directionalLight position={[-6, -4, -6]} intensity={0.9} color="#06b6d4" />
          <pointLight position={[0, 4, 3]} intensity={1.2} color="#34d399" distance={14} />

          {/* 数字肺主体模型与气流粒子 */}
          <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.18}>
            <LungModelScene score={score} isBreathing={isBreathing} />
          </Float>

          {/* 360° 交互轨道控制器 */}
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={4.5}
            maxDistance={14.0}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
            dampingFactor={0.06}
            target={[0, 0.2, 0]}
          />
        </Canvas>

        {/* 鼠标拖拽引导微提示 */}
        <div className="absolute bottom-16 left-5 z-10 pointer-events-none flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/60 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-slate-800/80">
          <Compass className="w-3.5 h-3.5 text-teal-400 animate-spin" />
          <span>支持鼠标按住 360° 旋转 · 滚轮缩放查看肺叶细节</span>
        </div>
      </div>

      {/* 底部悬浮快捷控制与视角切换栏 */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 z-20">
        {/* 快捷视角切换组 */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => handleSetView('FRONT')}
            className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
            title="正面视角"
          >
            正位全景
          </button>
          <button
            type="button"
            onClick={() => handleSetView('RIGHT')}
            className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
            title="查看右肺三叶"
          >
            右侧肺叶
          </button>
          <button
            type="button"
            onClick={() => handleSetView('LEFT')}
            className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
            title="查看左肺两叶"
          >
            左侧肺叶
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
            title="复位视角"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 播放控制与自动巡航开关 */}
        <div className="flex items-center gap-2 text-xs">
          {/* 呼吸舒张动效开关 */}
          <button
            type="button"
            onClick={() => setIsBreathing(!isBreathing)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition ${
              isBreathing
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="开启/暂停呼吸律动"
          >
            {isBreathing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isBreathing ? '呼吸动效中' : '呼吸已定格'}</span>
          </button>

          {/* 自动巡航旋转开关 */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition ${
              autoRotate
                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="开启/暂停自动平缓旋转"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? '自动巡航' : '定点观察'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Patient3DLungViewer;

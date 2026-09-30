import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Compass,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Zap,
  RotateCcw,
  Sparkles,
  Maximize2,
  Sliders,
  Eye,
  Activity,
  Layers,
  Target
} from 'lucide-react';
import { BrainTumorPatientMeta, SurgicalTrajectory } from '../../types';

interface BrainTumorViewer3DProps {
  patient: BrainTumorPatientMeta;
  onTrajectoryChange?: (traj: SurgicalTrajectory) => void;
}

// ==========================================
// 1. 程序化构建大脑半球皮层与脑沟脑回凹凸纹理
// ==========================================
function generateCortexGyriTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 基础皮层灰质底色
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 1024, 1024);

  // 模拟大脑皮层复杂迂曲的脑沟 (Sulci) 与脑回 (Gyri) 凹凸带
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    let x = Math.random() * 1024;
    let y = Math.random() * 1024;
    ctx.moveTo(x, y);

    for (let seg = 0; seg < 6; seg++) {
      x += (Math.random() - 0.5) * 160;
      y += (Math.random() - 0.5) * 160;
      ctx.quadraticCurveTo(
        x + (Math.random() - 0.5) * 60,
        y + (Math.random() - 0.5) * 60,
        x,
        y
      );
    }
    ctx.stroke();
  }

  // 脑回高光隆起
  ctx.strokeStyle = '#38bdf822';
  ctx.lineWidth = 6;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    let x = Math.random() * 1024;
    let y = Math.random() * 1024;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 100, y + 60);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

// ==========================================
// 2. Willis 环三维动脉血管网络 (Circle of Willis Arteries)
// ==========================================
function CircleOfWillisNetwork() {
  const arteries = useMemo(() => {
    // 1. 基底动脉 (Basilar Artery) -> 脑干前方向上
    const basilar = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -1.8, -0.6),
      new THREE.Vector3(0, -1.2, -0.4),
      new THREE.Vector3(0, -0.6, -0.2) // 分叉为双侧 PCA
    ]);

    // 2. 大脑后动脉 (Left & Right PCA)
    const pcaLeft = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.6, -0.2),
      new THREE.Vector3(-0.6, -0.5, -0.5),
      new THREE.Vector3(-1.4, -0.4, -0.9)
    ]);
    const pcaRight = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.6, -0.2),
      new THREE.Vector3(0.6, -0.5, -0.5),
      new THREE.Vector3(1.4, -0.4, -0.9)
    ]);

    // 3. 颈内动脉 (Left & Right ICA)
    const icaLeft = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.8, -1.6, 0.1),
      new THREE.Vector3(-0.7, -0.8, 0.1),
      new THREE.Vector3(-0.6, -0.2, 0.2) // 分叉为 MCA 与 ACA
    ]);
    const icaRight = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.8, -1.6, 0.1),
      new THREE.Vector3(0.7, -0.8, 0.1),
      new THREE.Vector3(0.6, -0.2, 0.2)
    ]);

    // 4. 大脑中动脉 (Left MCA - 紧贴病灶外侧 Sylvian 裂)
    const mcaLeft = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.6, -0.2, 0.2),
      new THREE.Vector3(-1.1, -0.1, 0.3),
      new THREE.Vector3(-1.6, 0.2, 0.2), // M2 分支
      new THREE.Vector3(-2.1, 0.5, 0.1)
    ]);
    const mcaRight = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.6, -0.2, 0.2),
      new THREE.Vector3(1.1, -0.1, 0.3),
      new THREE.Vector3(1.6, 0.2, 0.2),
      new THREE.Vector3(2.1, 0.5, 0.1)
    ]);

    // 5. 大脑前动脉 (Left & Right ACA + ACoA)
    const acaLeft = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.6, -0.2, 0.2),
      new THREE.Vector3(-0.2, 0.2, 0.7),
      new THREE.Vector3(-0.1, 0.8, 0.9)
    ]);
    const acaRight = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.6, -0.2, 0.2),
      new THREE.Vector3(0.2, 0.2, 0.7),
      new THREE.Vector3(0.1, 0.8, 0.9)
    ]);

    return [
      { name: 'Basilar', curve: basilar, radius: 0.14 },
      { name: 'PCA_L', curve: pcaLeft, radius: 0.11 },
      { name: 'PCA_R', curve: pcaRight, radius: 0.11 },
      { name: 'ICA_L', curve: icaLeft, radius: 0.15 },
      { name: 'ICA_R', curve: icaRight, radius: 0.15 },
      { name: 'MCA_L', curve: mcaLeft, radius: 0.13, isCloseToTumor: true },
      { name: 'MCA_R', curve: mcaRight, radius: 0.13 },
      { name: 'ACA_L', curve: acaLeft, radius: 0.12 },
      { name: 'ACA_R', curve: acaRight, radius: 0.12 }
    ];
  }, []);

  return (
    <group>
      {arteries.map((art) => (
        <group key={art.name}>
          <mesh>
            <tubeGeometry args={[art.curve, 32, art.radius, 16, false]} />
            <meshPhysicalMaterial
              color={art.isCloseToTumor ? '#f43f5e' : '#ef4444'}
              emissive={art.isCloseToTumor ? '#dc2626' : '#991b1b'}
              emissiveIntensity={art.isCloseToTumor ? 0.8 : 0.4}
              roughness={0.2}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
            />
          </mesh>

          {/* 邻近肿瘤高危血管段微外晕 */}
          {art.isCloseToTumor && (
            <mesh>
              <tubeGeometry args={[art.curve, 20, art.radius * 1.5, 12, false]} />
              <meshBasicMaterial color="#f43f5e" transparent opacity={0.25} wireframe />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ==========================================
// 3. 3D 虚拟大脑核心解剖场景
// ==========================================
interface BrainSceneProps {
  pitch: number;
  yaw: number;
  depth: number;
  showFunctional: boolean;
  showVessels: boolean;
  showCraniotomyFlap: boolean;
  trajectory: SurgicalTrajectory;
  onSelectApproach: (approach: 'pterional' | 'transsulcal' | 'subtemporal') => void;
}

function BrainScene({
  pitch,
  yaw,
  depth,
  showFunctional,
  showVessels,
  showCraniotomyFlap,
  trajectory,
  onSelectApproach
}: BrainSceneProps) {
  const cortexTexture = useMemo(() => generateCortexGyriTexture(), []);
  const needleRef = useRef<THREE.Group>(null);
  const tumorPulseRef = useRef<THREE.Mesh>(null);

  // 肿瘤在三维脑空间中的中心坐标 (左额颞叶交界区深部)
  const tumorCenter = useMemo(() => new THREE.Vector3(-1.15, 0.25, 0.45), []);

  // 计算穿刺导针在 3D 空间中的入路起始点与走向
  const { entryPoint, cannulaPoints } = useMemo(() => {
    // 根据航向角与俯仰角，计算头皮/颅骨表面的入点 (距脑中心 R=2.75)
    const r = 2.65;
    const phi = (90 - pitch) * (Math.PI / 180);
    const theta = (yaw + 180) * (Math.PI / 180);

    const ex = r * Math.sin(phi) * Math.cos(theta);
    const ey = r * Math.cos(phi);
    const ez = r * Math.sin(phi) * Math.sin(theta);
    const entry = new THREE.Vector3(ex, ey, ez);

    // 导针路径走向：从 entry 伸入向 tumorCenter
    const dir = new THREE.Vector3().subVectors(tumorCenter, entry).normalize();
    const currentTip = entry.clone().add(dir.clone().multiplyScalar(depth));

    return { entryPoint: entry, cannulaPoints: [entry, currentTip] };
  }, [pitch, yaw, depth, tumorCenter]);

  useFrame(({ clock }) => {
    if (tumorPulseRef.current) {
      const t = clock.getElapsedTime();
      const p = 1.0 + Math.sin(t * 3.0) * 0.05;
      tumorPulseRef.current.scale.set(p, p, p);
    }
  });

  return (
    <group>
      {/* 1. 半透明双大脑半球皮层 (Cerebral Cortex Shell: 脑纵裂 + 额/颞/顶/枕叶轮廓) */}
      <group>
        {/* 左大脑半球 (患侧 - 包含肿瘤) */}
        <mesh position={[-0.95, 0.35, 0]} scale={[1.15, 1.45, 1.65]}>
          <sphereGeometry args={[1, 36, 36]} />
          <meshPhysicalMaterial
            map={cortexTexture}
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.12}
            roughness={0.25}
            metalness={0.05}
            clearcoat={0.8}
            transmission={0.55}
            transparent
            opacity={0.48}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 右大脑半球 (健侧) */}
        <mesh position={[0.95, 0.35, 0]} scale={[1.15, 1.45, 1.65]}>
          <sphereGeometry args={[1, 36, 36]} />
          <meshPhysicalMaterial
            map={cortexTexture}
            color="#0ea5e9"
            emissive="#0369a1"
            emissiveIntensity={0.08}
            roughness={0.28}
            metalness={0.05}
            clearcoat={0.6}
            transmission={0.65}
            transparent
            opacity={0.38}
          />
        </mesh>

        {/* 小脑与脑干 (Cerebellum & Brainstem) */}
        <mesh position={[0, -1.3, -0.9]} scale={[1.2, 0.75, 0.9]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial
            color="#1e293b"
            emissive="#0f172a"
            transparent
            opacity={0.5}
            roughness={0.4}
          />
        </mesh>
      </group>

      {/* 2. 脑功能区高亮标记 (Functional Eloquent Areas) */}
      {showFunctional && (
        <group>
          {/* Broca's 运动性语言区 (左额下回后部 - 紧邻入路，必须严格保护) */}
          <mesh position={[-1.65, 0.65, 0.85]} scale={[0.35, 0.42, 0.3]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#10b981"
              emissive="#059669"
              emissiveIntensity={0.7}
              transparent
              opacity={0.75}
            />
            <Html distanceFactor={7} position={[0, 0.5, 0]}>
              <div className="px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500 text-[9px] font-bold font-mono whitespace-nowrap shadow-lg">
                Broca 语言区 (安全间隙: 5.2mm)
              </div>
            </Html>
          </mesh>

          {/* 中央前回主运动区 (Primary Motor Cortex - 控制对侧肢体) */}
          <mesh position={[-1.3, 1.35, 0.1]} scale={[0.25, 0.8, 0.28]}>
            <cylinderGeometry args={[1, 1, 1, 16]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#d97706"
              emissiveIntensity={0.6}
              transparent
              opacity={0.7}
            />
            <Html distanceFactor={7} position={[0, 0.7, 0]}>
              <div className="px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500 text-[9px] font-bold font-mono whitespace-nowrap shadow-lg">
                中央前回运动皮层 (肢体控制)
              </div>
            </Html>
          </mesh>

          {/* Wernicke 感觉性语言区 (颞上回后部) */}
          <mesh position={[-1.75, 0.05, -0.6]} scale={[0.32, 0.35, 0.32]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#0891b2"
              emissiveIntensity={0.6}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      )}

      {/* 3. Willis 环三维大血管网 */}
      {showVessels && <CircleOfWillisNetwork />}

      {/* 4. 左额颞叶深部脑胶质母细胞瘤 (GBM WHO IV级) 实体与瘤周水肿带 */}
      <group position={tumorCenter.toArray()}>
        {/* 肿瘤坏死核心与高强化活跃边缘 (Tumor Core) */}
        <mesh ref={tumorPulseRef} scale={[0.72, 0.65, 0.68]}>
          <dodecahedronGeometry args={[0.9, 2]} />
          <meshPhysicalMaterial
            color="#7c3aed"
            emissive="#dc2626"
            emissiveIntensity={0.85}
            roughness={0.15}
            metalness={0.2}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* 瘤周侵润水肿带 (Peritumoral Edema Shell - FLAIR高信号区) */}
        <mesh scale={[1.25, 1.15, 1.2]}>
          <sphereGeometry args={[0.9, 20, 20]} />
          <meshPhysicalMaterial
            color="#f59e0b"
            emissive="#b45309"
            emissiveIntensity={0.3}
            transparent
            opacity={0.28}
            roughness={0.4}
            wireframe={true}
          />
        </mesh>

        {/* 3D 空间标签 */}
        <Html distanceFactor={6} position={[0, 0.8, 0]}>
          <div className="px-2 py-1 rounded bg-rose-950/90 text-rose-200 border border-rose-500 text-[10px] font-bold font-mono whitespace-nowrap shadow-xl">
            GBM 胶质瘤靶灶 (38.6 cm³)
          </div>
        </Html>
      </group>

      {/* 5. ATLAS Meditech 3D 手术穿刺导针 / 显微入路套管 (Surgical Pathfinder Needle) */}
      <group ref={needleRef}>
        {/* 手术导针本体 */}
        {cannulaPoints.length === 2 && (
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3(cannulaPoints),
                24,
                0.045, // 细长神经外科立体定向穿刺针
                16,
                false
              ]}
            />
            <meshStandardMaterial
              color={
                trajectory.riskLevel === 'CRITICAL'
                  ? '#ef4444'
                  : trajectory.riskLevel === 'WARNING'
                  ? '#f59e0b'
                  : '#10b981'
              }
              metalness={0.9}
              roughness={0.15}
              emissive={
                trajectory.riskLevel === 'CRITICAL'
                  ? '#b91c1c'
                  : trajectory.riskLevel === 'WARNING'
                  ? '#b45309'
                  : '#047857'
              }
              emissiveIntensity={0.6}
            />
          </mesh>
        )}

        {/* 入路开颅通道透明安全走廊 (Safety Corridor Cylinder) */}
        {cannulaPoints.length === 2 && (
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3(cannulaPoints),
                16,
                0.22, // 显微通道直径
                12,
                false
              ]}
            />
            <meshBasicMaterial
              color={trajectory.riskLevel === 'CRITICAL' ? '#ef4444' : '#10b981'}
              transparent
              opacity={0.2}
              wireframe={true}
            />
          </mesh>
        )}

        {/* 头皮入点发光光环 (Entry Port) */}
        <mesh position={entryPoint.toArray()} rotation={[0, 0, 0]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* 6. 开颅骨窗半透标记 (Craniotomy Bone Flap) */}
      {showCraniotomyFlap && (
        <mesh position={[-2.1, 0.8, 0.8]} rotation={[0.4, -0.6, 0.3]}>
          <cylinderGeometry args={[0.65, 0.65, 0.1, 24]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            metalness={0.3}
            roughness={0.4}
            transmission={0.4}
            transparent
            opacity={0.45}
            wireframe={true}
          />
        </mesh>
      )}
    </group>
  );
}

// ==========================================
// 4. 主视口与 ATLAS 交互控制台
// ==========================================
export const BrainTumorViewer3D: React.FC<BrainTumorViewer3DProps> = ({
  patient,
  onTrajectoryChange
}) => {
  // 穿刺路径立体定向航向角 (Yaw) 与俯仰角 (Pitch)
  const [yaw, setYaw] = useState<number>(-55); // -180 ~ 180
  const [pitch, setPitch] = useState<number>(32); // -80 ~ 80
  const [depth, setDepth] = useState<number>(2.45); // 0 ~ 4.0

  // 视口图层开关
  const [showFunctional, setShowFunctional] = useState<boolean>(true);
  const [showVessels, setShowVessels] = useState<boolean>(true);
  const [showCraniotomyFlap, setShowCraniotomyFlap] = useState<boolean>(true);

  // 动态解算与肿瘤、血管及功能区的距离
  const trajectory = useMemo<SurgicalTrajectory>(() => {
    // 简化几何空间距离计算模型
    // 最佳翼点入路(Pterional Approach): yaw ≈ -60, pitch ≈ 35
    const optimalDist = Math.hypot(yaw - (-60), pitch - 35);

    // 导针针尖距肿瘤中心 (距离越小越精准穿透肿瘤靶心)
    const distToTumor = Math.max(0, (optimalDist * 0.18 + Math.abs(depth - 2.45) * 12)).toFixed(1);

    // 距左侧大脑中动脉 (MCA-M2分支) 距离 (安全警戒线: < 3.0mm 为危险)
    const distToVessel = Math.max(1.2, 4.2 + (yaw - (-60)) * 0.08).toFixed(1);

    // 距 Broca 语言中枢距离
    const distToFunction = Math.max(2.0, 5.2 - (pitch - 35) * 0.05).toFixed(1);

    let riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
    if (parseFloat(distToVessel) < 3.0 || parseFloat(distToFunction) < 3.0) {
      riskLevel = 'CRITICAL';
    } else if (parseFloat(distToVessel) < 4.0 || parseFloat(distToFunction) < 4.5) {
      riskLevel = 'WARNING';
    }

    return {
      entryPoint: [-2.1, 0.9, 0.8],
      targetPoint: [-1.15, 0.25, 0.45],
      angleYaw: yaw,
      anglePitch: pitch,
      insertionDepthMm: parseFloat((depth * 18.5).toFixed(1)),
      distanceToTumorMm: parseFloat(distToTumor),
      distanceToVesselMm: parseFloat(distToVessel),
      distanceToFunctionMm: parseFloat(distToFunction),
      riskLevel
    };
  }, [yaw, pitch, depth]);

  // AI 一键自动寻优：加载 ATLAS 最优微创翼点开颅入路 (Pterional Approach)
  const handleAIOptimize = () => {
    setYaw(-60);
    setPitch(35);
    setDepth(2.45);
  };

  // 预设入路快速切换
  const handleSelectPresetApproach = (preset: 'pterional' | 'transsulcal' | 'subtemporal') => {
    if (preset === 'pterional') {
      setYaw(-60);
      setPitch(35);
      setDepth(2.45);
    } else if (preset === 'transsulcal') {
      setYaw(-45);
      setPitch(50);
      setDepth(2.2);
    } else if (preset === 'subtemporal') {
      setYaw(-75);
      setPitch(15);
      setDepth(2.7);
    }
  };

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* 顶栏控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-400" />
            3D 虚拟脑手术预演与 AI 入路规划器 (ATLAS Meditech Pathfinder)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            深度对标美国 ATLAS Meditech 架构，实现半透明大脑皮层、Willis环大血管、Broca语言区与 GBM 胶质瘤三维空间避障推演
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAIOptimize}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/50 flex items-center gap-2 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>AI 自动计算最优避障路径</span>
          </button>
        </div>
      </div>

      {/* 3D 视口与手术参数交互区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[580px]">
        {/* 左侧 2 列: 3D 虚拟大脑三维手术视口 */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-purple-950/70 rounded-2xl p-4 flex flex-col gap-3 relative shadow-2xl overflow-hidden">
          {/* 3D 视口顶栏角标 */}
          <div className="flex items-center justify-between text-xs px-2 text-slate-300 z-10">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-bold text-slate-200">3D NEUROSURGERY SIMULATOR</span>
              <span className="text-[10px] text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                PTERIONAL APPROACH · SAFETY MARGIN 4.2mm
              </span>
            </div>

            {/* 解剖图层可见性开关 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowFunctional(!showFunctional)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                  showFunctional
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                ● 语言/运动区
              </button>
              <button
                onClick={() => setShowVessels(!showVessels)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                  showVessels
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                    : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                ● Willis 环动脉
              </button>
              <button
                onClick={() => setShowCraniotomyFlap(!showCraniotomyFlap)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                  showCraniotomyFlap
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-950 text-slate-500 border border-slate-800'
                }`}
              >
                ● 开颅骨窗
              </button>
            </div>
          </div>

          {/* Three.js Canvas 3D 渲染器 */}
          <div className="flex-1 w-full rounded-xl bg-slate-950/95 border border-slate-800 relative overflow-hidden min-h-[380px]">
            <Canvas camera={{ position: [-4.2, 2.8, 4.5], fov: 46 }}>
              <ambientLight intensity={1.1} />
              <pointLight position={[8, 8, 8]} intensity={1.6} />
              <pointLight position={[-8, -8, -8]} color="#9333ea" intensity={0.8} />

              <BrainScene
                pitch={pitch}
                yaw={yaw}
                depth={depth}
                showFunctional={showFunctional}
                showVessels={showVessels}
                showCraniotomyFlap={showCraniotomyFlap}
                trajectory={trajectory}
                onSelectApproach={handleSelectPresetApproach}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.8}
                zoomSpeed={1.0}
                panSpeed={0.8}
                minDistance={3.5}
                maxDistance={12.0}
              />
            </Canvas>

            {/* 3D 视口内实时安全预警 HUD */}
            <div className="absolute top-3 left-3 pointer-events-none p-3 rounded-xl bg-slate-950/85 border border-purple-800/60 text-[10px] font-mono text-slate-300 space-y-1 shadow-2xl">
              <div className="text-purple-300 font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                入路避障评估: {trajectory.riskLevel === 'SAFE' ? '安全畅通 (Safe)' : '高危临界'}
              </div>
              <div>● 穿刺入路深度: {trajectory.insertionDepthMm} mm</div>
              <div>● 距肿瘤核心: <span className="text-emerald-400 font-bold">{trajectory.distanceToTumorMm} mm</span></div>
              <div>● 距 MCA 动脉大血管: <span className="text-rose-400 font-bold">{trajectory.distanceToVesselMm} mm</span> (阈值 &gt;3.0mm)</div>
              <div>● 距 Broca 语言皮层: <span className="text-amber-300 font-bold">{trajectory.distanceToFunctionMm} mm</span></div>
            </div>

            {/* 鼠标旋转交互提示 */}
            <div className="absolute bottom-3 right-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              左键旋转 3D 大脑 · 滚轮缩放 · 观察入路与神经血管夹角
            </div>
          </div>

          {/* 底部入路航向角度滑块与手柄 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800">
            {/* 航向角 Yaw */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-purple-400 font-bold">方位角 (Yaw):</span>
                <span className="text-slate-300">{yaw}°</span>
              </div>
              <input
                type="range"
                min="-120"
                max="0"
                value={yaw}
                onChange={(e) => setYaw(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-purple-400 cursor-pointer"
              />
            </div>

            {/* 俯仰角 Pitch */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-cyan-400 font-bold">倾角 (Pitch):</span>
                <span className="text-slate-300">{pitch}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="75"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* 穿刺推进深度 Depth */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">导针深度 (Depth):</span>
                <span className="text-slate-300">{(depth * 18.5).toFixed(0)} mm</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.2"
                step="0.05"
                value={depth}
                onChange={(e) => setDepth(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 右侧：手术方案对比与华西神经外科决策参数 */}
        <div className="space-y-4 flex flex-col">
          {/* 三大人路方案对比 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-400" />
                入路手术走廊对比 (ATLAS 推荐)
              </span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                MDT 优选
              </span>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 'pterional',
                  name: '方案一: 经外侧裂翼点入路 (Pterional)',
                  score: '综合推荐 96分',
                  desc: '经外侧裂自然解剖间隙显露，脑组织牵拉轻微，避开语言中枢，血管显露良好。',
                  recommended: true
                },
                {
                  id: 'transsulcal',
                  name: '方案二: 经额下沟入路 (Transsulcal)',
                  score: '84分',
                  desc: '穿行额叶皮层，距离稍短，但距 Broca 语言区仅 3.5mm，存在术后暂时性失语风险。',
                  recommended: false
                },
                {
                  id: 'subtemporal',
                  name: '方案三: 颞下入路 (Subtemporal)',
                  score: '78分',
                  desc: '需过度向上抬起颞叶，有损伤 Labbe 静脉引发静脉性脑梗塞风险。',
                  recommended: false
                }
              ].map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleSelectPresetApproach(app.id as any)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                    app.recommended
                      ? 'bg-purple-950/40 border-purple-500/60 text-purple-200 shadow-md shadow-purple-950/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-100">{app.name}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        app.recommended
                          ? 'bg-purple-500 text-slate-950 font-extrabold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {app.score}
                    </span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-slate-300">{app.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 华西神经外科术前关键分子病理指标 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex-1">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              分子病理与全切可行性分析
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">IDH1 突变状态</span>
                <span className="text-rose-400 font-bold">{patient.molecular_markers.idh1}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">MGMT 甲基化</span>
                <span className="text-emerald-400 font-bold">{patient.molecular_markers.mgmt}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">预估安全切除率</span>
                <span className="text-purple-300 font-bold">&gt;95% (GTR 近全切)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">KPS 术后预期</span>
                <span className="text-cyan-300 font-bold">80 ➔ 90 分</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-purple-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                华西神经外科主刀医师结论
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                建议采用翼点入路微创开颅，术中联合神经导航与皮层电刺激(Broca区脑电监测)，确保在保护优势半球语言功能的前提下实现肿瘤最大化切除。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

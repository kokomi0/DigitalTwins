import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Crosshair,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Zap,
  Activity,
  FileText,
  AlertTriangle,
  Eye,
  Sliders,
  Sparkles,
  Camera
} from 'lucide-react';
import { PatientMeta } from '../../types';

interface EndoscopyViewProps {
  patient: PatientMeta;
  initialSegment?: string;
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
}

// ==========================================
// 1. 程序化生成气管支气管内壁黏膜与微血管纹理
// ==========================================
function generateMucosaTexture(isNBI: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 基础底色: 白光下为粉红色湿润黏膜，NBI窄带模式下为淡青绿色
  if (isNBI) {
    ctx.fillStyle = '#0f2922'; // NBI 基底青绿
  } else {
    ctx.fillStyle = '#831843'; // 湿润粉红肉感底色
  }
  ctx.fillRect(0, 0, 1024, 1024);

  // 支气管横向 C 型软骨环凹凸纹理 (纵向周期性明暗环带)
  const ringCount = 18;
  for (let r = 0; r < ringCount; r++) {
    const y = (r / ringCount) * 1024;
    const grad = ctx.createLinearGradient(0, y, 0, y + 1024 / ringCount);
    if (isNBI) {
      grad.addColorStop(0, 'rgba(6, 78, 59, 0.4)');
      grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)');
      grad.addColorStop(1, 'rgba(6, 78, 59, 0.4)');
    } else {
      grad.addColorStop(0, 'rgba(159, 18, 57, 0.4)');
      grad.addColorStop(0.5, 'rgba(244, 114, 182, 0.15)');
      grad.addColorStop(1, 'rgba(159, 18, 57, 0.4)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 1024, 1024 / ringCount);
  }

  // 黏膜下微血管分枝 (Capillary Networks)
  ctx.lineWidth = 1.5;
  const vesselCount = 60;
  for (let v = 0; v < vesselCount; v++) {
    ctx.beginPath();
    let vx = (v / vesselCount) * 1024 + (Math.random() - 0.5) * 80;
    let vy = Math.random() * 1024;
    ctx.moveTo(vx, vy);

    for (let seg = 0; seg < 6; seg++) {
      vx += (Math.random() - 0.5) * 60;
      vy += (Math.random() - 0.5) * 80;
      ctx.lineTo(vx, vy);
    }

    if (isNBI) {
      // NBI 下微血管呈现棕褐色/深紫黑色 (415nm 血红蛋白高吸收峰)
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(67, 20, 7, 0.7)' : 'rgba(5, 150, 105, 0.6)';
    } else {
      ctx.strokeStyle = Math.random() > 0.3 ? 'rgba(225, 29, 72, 0.65)' : 'rgba(254, 205, 211, 0.4)';
    }
    ctx.stroke();
  }

  // 高光黏液微反光颗粒 (Mucus sheen)
  for (let s = 0; s < 120; s++) {
    const sx = Math.random() * 1024;
    const sy = Math.random() * 1024;
    const sr = 1 + Math.random() * 3.5;
    ctx.fillStyle = isNBI ? 'rgba(209, 250, 229, 0.3)' : 'rgba(255, 241, 242, 0.4)';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 6);
  texture.needsUpdate = true;
  return texture;
}

// ==========================================
// 2. 真实 3D 气管管道与 RB3 狭窄肉芽病变
// ==========================================
interface BronchialLumenSceneProps {
  pathProgress: number; // 0.0 ~ 1.0 (探头深入进度)
  yaw: number;
  pitch: number;
  isNBI: boolean;
  onPathUpdate: (p: number) => void;
}

function BronchialLumenScene({
  pathProgress,
  yaw,
  pitch,
  isNBI
}: BronchialLumenSceneProps) {
  const { camera } = useThree();
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  // 真实的支气管解剖中心曲线 (气管 -> 隆突 -> 右主 RMB -> 右上叶 RUB -> RB3 段)
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 6.0, 0),       // 1. 高位气管入口
      new THREE.Vector3(0, 3.8, 0.1),     // 2. 中段气管
      new THREE.Vector3(0, 2.0, 0),       // 3. 隆突分叉前上方
      new THREE.Vector3(0.5, 1.2, 0.3),   // 4. 右主支气管 (RMB) 入口
      new THREE.Vector3(1.1, 0.4, 0.6),   // 5. 右上叶支气管 (RUB) 开口
      new THREE.Vector3(1.8, -0.3, 0.9),  // 6. 前进至 B1-B3 分叉部
      new THREE.Vector3(2.5, -0.9, 1.3),  // 7. RB3 狭窄重构段前方
      new THREE.Vector3(3.2, -1.5, 1.7)   // 8. RB3 狭窄深部
    ];
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }, []);

  // 管道网格
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 180, 0.95, 32, false);
  }, [curve]);

  const mucosaTexture = useMemo(() => generateMucosaTexture(isNBI), [isNBI]);

  // RB3 病灶肉芽网格位置 (位于曲线 progress ≈ 0.82 处)
  const lesionPos = useMemo(() => {
    return curve.getPointAt(0.82);
  }, [curve]);

  // 动画帧驱动：将相机置于管腔内并跟随探头前进
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. 取出当前探针所在曲线点与前进切线方向
    const p = Math.max(0.01, Math.min(0.99, pathProgress));
    const camPos = curve.getPointAt(p);
    const tangent = curve.getTangentAt(p).normalize();

    // 2. 叠加呼吸微颤 (探头微弱抖动)
    const breathTremorX = Math.sin(t * 4.5) * 0.012;
    const breathTremorY = Math.cos(t * 3.8) * 0.012;

    camera.position.set(
      camPos.x + breathTremorX,
      camPos.y + breathTremorY,
      camPos.z
    );

    // 3. 计算前方注视点 (结合用户鼠标 yaw & pitch)
    const lookAheadDist = 1.4;
    const baseTarget = camPos.clone().add(tangent.clone().multiplyScalar(lookAheadDist));

    // 计算局部的 Up / Right 正交基
    const upVector = new THREE.Vector3(0, 1, 0);
    const rightVector = new THREE.Vector3().crossVectors(tangent, upVector).normalize();
    const orthoUp = new THREE.Vector3().crossVectors(rightVector, tangent).normalize();

    // 叠加航向与俯仰偏移
    const lookTarget = baseTarget
      .clone()
      .add(rightVector.clone().multiplyScalar(yaw * 0.9))
      .add(orthoUp.clone().multiplyScalar(pitch * 0.9));

    camera.lookAt(lookTarget);

    // 探照灯聚光跟随
    if (spotLightRef.current && targetRef.current) {
      spotLightRef.current.position.copy(camera.position);
      targetRef.current.position.copy(lookTarget);
      spotLightRef.current.target = targetRef.current;
    }
  });

  return (
    <>
      {/* 内窥镜前端冷光源探照灯 (SpotLight) */}
      <spotLight
        ref={spotLightRef}
        color={isNBI ? '#5eead4' : '#fff7ed'}
        intensity={isNBI ? 3.5 : 4.0}
        angle={Math.PI / 3}
        penumbra={0.6}
        distance={6.5}
        decay={1.2}
      />
      <primitive object={targetRef.current} />

      {/* 环境漫反射弱光 */}
      <ambientLight intensity={isNBI ? 0.35 : 0.45} color={isNBI ? '#042f2e' : '#4a044e'} />

      {/* 气管支气管三维内表面 (BackSide 渲染，相机置于内部) */}
      <mesh geometry={tubeGeometry}>
        <meshPhysicalMaterial
          map={mucosaTexture}
          side={THREE.BackSide}
          roughness={0.22}
          metalness={0.06}
          clearcoat={1.0}
          clearcoatRoughness={0.12}
          reflectivity={0.7}
          emissive={isNBI ? '#042f2e' : '#2a0815'}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* RB3 局灶性向内突出充血增生狭窄肉芽病变 (凸入管腔 65%) */}
      <group position={[lesionPos.x + 0.15, lesionPos.y - 0.08, lesionPos.z - 0.1]}>
        {/* 主狭窄肉芽团块 (不规则向管心凹凸隆起) */}
        <mesh scale={[0.55, 0.48, 0.52]}>
          <dodecahedronGeometry args={[0.7, 2]} />
          <meshPhysicalMaterial
            color={isNBI ? '#451a03' : '#b91c1c'}
            roughness={0.18}
            metalness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
            emissive={isNBI ? '#78350f' : '#dc2626'}
            emissiveIntensity={0.65}
          />
        </mesh>

        {/* 炎性微小附壁水肿结节 */}
        <mesh position={[0.2, 0.22, 0.15]} scale={[0.25, 0.22, 0.28]}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshPhysicalMaterial
            color={isNBI ? '#292524' : '#ef4444'}
            roughness={0.25}
            clearcoat={0.9}
            emissive="#991b1b"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* 支气管隆突 (Carina) 马鞍形分界突起 */}
      <mesh position={[0.1, 1.25, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.22, 0.65, 16]} />
        <meshPhysicalMaterial
          color={isNBI ? '#065f46' : '#9d174d'}
          roughness={0.3}
          clearcoat={0.8}
        />
      </mesh>
    </>
  );
}

// ==========================================
// 3. 主虚拟支气管镜交互工作台
// ==========================================
export const EndoscopyView: React.FC<EndoscopyViewProps> = ({
  patient,
  initialSegment = 'RB3',
  onOpenKnowledgeGraph
}) => {
  // 探头曲线推进进度: 0.0 (气管口) ~ 0.85 (RB3 狭窄病变深处)
  const [pathProgress, setPathProgress] = useState<number>(0.8);
  const [currentSegment, setCurrentSegment] = useState<string>('RB3');

  // 相机环视偏角 (Yaw / Pitch)
  const [yaw, setYaw] = useState<number>(0.12);
  const [pitch, setPitch] = useState<number>(-0.08);

  // 鼠标拖拽环视状态
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 模式切换: 白光模式 (WLI) vs 窄带成像 (NBI)
  const [isNBI, setIsNBI] = useState<boolean>(false);

  // 解剖快捷跳转锚点表
  const SEGMENT_PRESETS: Record<string, { p: number; label: string; name: string }> = {
    TRACHEA: { p: 0.05, label: '气管主干', name: '气管中上段 (Trachea)' },
    CARINA: { p: 0.32, label: '隆突分叉', name: '气管隆突 (Carina)' },
    RMB: { p: 0.45, label: '右主支气管', name: '右主支气管 (RMB)' },
    RUB: { p: 0.62, label: '右上叶支气管', name: '右上叶支气管 (RUB)' },
    RB3: { p: 0.82, label: 'RB3狭窄区', name: '右上叶前段 (RB3 病灶)' },
    LMB: { p: 0.40, label: '左主支气管', name: '左主支气管 (LMB)' }
  };

  const handleSelectSegment = (key: string) => {
    setCurrentSegment(key);
    if (SEGMENT_PRESETS[key]) {
      setPathProgress(SEGMENT_PRESETS[key].p);
      setYaw(0);
      setPitch(0);
    }
  };

  // 鼠标在 3D 视口内拖拽 360° 环视
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    setYaw((prev) => Math.max(-1.2, Math.min(1.2, prev + deltaX * 0.005)));
    setPitch((prev) => Math.max(-1.0, Math.min(1.0, prev - deltaY * 0.005)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // 推进控制手柄
  const stepForward = () => setPathProgress((p) => Math.min(0.96, p + 0.04));
  const stepBackward = () => setPathProgress((p) => Math.max(0.04, p - 0.04));
  const stepLeft = () => setYaw((y) => Math.max(-1.2, y - 0.15));
  const stepRight = () => setYaw((y) => Math.min(1.2, y + 0.15));
  const resetOrientation = () => {
    setYaw(0);
    setPitch(0);
  };

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'ArrowUp') stepForward();
      if (e.key === 's' || e.key === 'ArrowDown') stepBackward();
      if (e.key === 'a' || e.key === 'ArrowLeft') stepLeft();
      if (e.key === 'd' || e.key === 'ArrowRight') stepRight();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* 顶栏控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            3D 电子支气管镜 B1-B10 腔内第一人称漫游探查系统 (Virtual Bronchoscopy)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            采用真实解剖曲率管腔内表面渲染，直视软骨环起伏轮廓、黏膜下微血管分布与 RB3 肉芽肿充血狭窄
          </p>
        </div>

        {/* 光源与 NBI 成像切换 */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNBI(!isNBI)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs border flex items-center gap-1.5 transition shadow-lg ${
              isNBI
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-emerald-950/50'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isNBI ? 'NBI 窄带微血管高敏模式 (415nm)' : '标准高清白光模式 (WLI)'}</span>
          </button>

          <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-800">
            镜头位置: {SEGMENT_PRESETS[currentSegment]?.name || currentSegment}
          </span>
        </div>
      </div>

      {/* 3D 腔内视口与控制面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[580px]">
        {/* 左侧 2 列: 3D 第一人称内窥镜视口 */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-300 z-10">
            <span className="font-semibold flex items-center gap-1.5 text-cyan-300 font-mono">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              ENDOSCOPE 4K UHD CAVITY FEED · {isNBI ? 'NBI SPECTRAL' : 'RGB WHITE LIGHT'}
            </span>
            <span className="text-emerald-400 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              DEPTH: {(pathProgress * 42.5).toFixed(1)} cm · 60 FPS
            </span>
          </div>

          {/* Three.js Canvas 渲染第一人称视角 */}
          <div
            className="flex-1 w-full rounded-2xl bg-black border border-slate-800 relative overflow-hidden cursor-grab active:cursor-grabbing min-h-[380px]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Canvas
              camera={{ fov: 75, near: 0.05, far: 20 }}
              gl={{ antialias: true, alpha: false }}
            >
              <BronchialLumenScene
                pathProgress={pathProgress}
                yaw={yaw}
                pitch={pitch}
                isNBI={isNBI}
                onPathUpdate={setPathProgress}
              />
            </Canvas>

            {/* 拟真内窥镜圆形黑色光学遮罩 (Circular Bezel Mask) */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl border-[16px] border-black/80 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]" />

            {/* 中心准星与刻度十字线 */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-20 h-20 border border-cyan-400/30 rounded-full" />
              <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
              <div className="absolute w-28 h-px bg-cyan-400/20" />
              <div className="absolute h-28 w-px bg-cyan-400/20" />
            </div>

            {/* RB3 局灶狭窄高危警告 HUD 标识 */}
            {pathProgress > 0.72 && pathProgress < 0.92 && (
              <div className="absolute top-6 right-6 pointer-events-none p-3 rounded-xl bg-rose-950/85 border border-rose-500 text-rose-200 text-xs font-semibold shadow-2xl animate-pulse space-y-1">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  RB3 狭窄病变已进入视野
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  ● 截面积缩减: 65% (肉芽充血重构)
                </div>
                <div className="text-[10px] text-rose-400">
                  ● 建议：防污染毛刷取样 + 局部冷冻灌洗
                </div>
              </div>
            )}

            {/* 屏幕左下角光学参数 */}
            <div className="absolute bottom-4 left-6 pointer-events-none text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 space-y-0.5">
              <div>COLD LIGHT: XENON 300W · 5500K</div>
              <div>TIP DEFLECTION: UP 180° / DOWN 130°</div>
              <div>AIRWAY PRESSURE: 18.4 cmH₂O</div>
            </div>

            {/* 视口右下角拖拽提示 */}
            <div className="absolute bottom-4 right-6 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              鼠标拖拽 360° 环顾 · W/S 键前进后退
            </div>
          </div>

          {/* 底部内镜推进手柄与解剖快速跳转 */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800">
            {/* 解剖段落快速切换 */}
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(SEGMENT_PRESETS).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSelectSegment(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                    currentSegment === key
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* 推进控制手柄按键 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={stepBackward}
                title="后退 (S / Down)"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
              >
                <ArrowDown className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                onClick={stepLeft}
                title="向左偏转 (A / Left)"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                onClick={stepForward}
                title="推进前进 (W / Up)"
                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/40 transition"
              >
                <ArrowUp className="w-4 h-4" />
                <span>推进深入</span>
              </button>
              <button
                onClick={stepRight}
                title="向右偏转 (D / Right)"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
              >
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                onClick={resetOrientation}
                title="复位视线方向"
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：镜下病理记录与 CFD 力学联动 */}
        <div className="space-y-4 flex flex-col">
          {/* 实时镜下病理记录 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                支气管镜镜下实时病理研判
              </span>
              <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                {currentSegment}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">当前探查分支</span>
                <span className="text-slate-100 font-bold text-sm">
                  {SEGMENT_PRESETS[currentSegment]?.name || currentSegment}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 text-[10px] block">镜下形态学描述</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {currentSegment === 'RB3' || pathProgress > 0.75
                    ? '管壁明显环周向内狭窄隆起，黏膜高度充血发红，鹅卵石样肉芽样组织增生，毛细血管扩张迂曲，触之极易渗血，管腔有效截面积减少约 65%。'
                    : '软骨环排列规则，黏膜色泽淡红湿润，微血管分支网状清晰，无活动性出血或息肉样新生物。'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">管腔截面狭窄率</span>
                  <span className="text-rose-400 font-bold text-sm">
                    {currentSegment === 'RB3' || pathProgress > 0.75 ? '65.2%' : '0.0%'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">黏膜水肿分级</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {currentSegment === 'RB3' || pathProgress > 0.75 ? 'Grade III (重度)' : 'Grade 0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 活检与 CFD 流体力学联动 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex-1">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              主治医师穿刺活检行动指征
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-1">
                <div className="font-semibold text-rose-300">防污染毛刷 (PSB) + 灌洗 (BAL)</div>
                <p className="text-[11px] text-slate-300">
                  针对 RB3 局灶性脓性分泌物积聚，建议行深部防污染毛刷细胞学检查，排查铜绿假单胞菌耐药定植。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-1">
                <div className="font-semibold text-cyan-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  CFD 流体计算联动
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  当前 65% 狭窄导致局部雷诺数由 850 激增至 3200，诱发强烈紊流，呼气末阻抗剧增，与患者主诉剧烈喘鸣完全吻合。
                </p>
              </div>
            </div>

            {onOpenKnowledgeGraph && (
              <button
                onClick={() => onOpenKnowledgeGraph('anat_rb3')}
                className="w-full py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>查询 RB3 狭窄病理知识图谱关联</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

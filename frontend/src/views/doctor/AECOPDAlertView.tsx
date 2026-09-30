import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  AlertTriangle,
  Activity,
  Zap,
  Wind,
  Droplet,
  Heart,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { PatientMeta } from '../../types';

interface AECOPDAlertViewProps {
  patient: PatientMeta;
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
}

// ==========================================
// 1. 3D 气流湍流危象与肺泡炎症浸润热力图场景
// ==========================================
interface CrisisSceneProps {
  alertIntensity: number; // 0.0 ~ 1.0 (危象严重程度)
  isFluttering: boolean;
}

function CrisisScene({ alertIntensity, isFluttering }: CrisisSceneProps) {
  const airwayRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const heatMeshRef = useRef<THREE.Group>(null);

  // 1. 肺实质表面炎症热力着色材质 (Heatmap Shader / Vertex Color simulation)
  // 右上叶 (病变严重区) 呈现炽热深红/亮黄火焰色，其余叶呈过渡绿青
  const heatTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 基础绿色 (正常低炎区)
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 512);

    // 右上叶重点区域径向炽热渐变 (黄 -> 橙 -> 鲜红 -> 紫红)
    const grad = ctx.createRadialGradient(380, 160, 20, 380, 160, 220);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)'); // 核心亮黄
    grad.addColorStop(0.3, 'rgba(249, 115, 22, 0.85)'); // 橙红
    grad.addColorStop(0.65, 'rgba(225, 29, 72, 0.7)');   // 鲜红
    grad.addColorStop(1, 'rgba(6, 78, 59, 0)');          // 渐入绿色底

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(380, 160, 220, 0, Math.PI * 2);
    ctx.fill();

    // 左肺散在炎性小热点
    const grad2 = ctx.createRadialGradient(160, 200, 10, 160, 200, 110);
    grad2.addColorStop(0, 'rgba(251, 146, 60, 0.8)');
    grad2.addColorStop(0.5, 'rgba(239, 68, 68, 0.5)');
    grad2.addColorStop(1, 'rgba(6, 78, 59, 0)');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(160, 200, 110, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // 2. 气流湍流粒子系统 (正常段平稳向下，狭窄处突然加速飞溅喷涌)
  const particleCount = 800;
  const [particleData, particleColors] = useMemo(() => {
    const data = [];
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // 初始分散在主气管上方
      const x = (Math.random() - 0.5) * 0.35;
      const y = 3.2 - Math.random() * 4.5;
      const z = (Math.random() - 0.5) * 0.35;

      data.push({
        x,
        y,
        z,
        vx: 0,
        vy: -0.04 - Math.random() * 0.03,
        vz: 0,
        isTurbulent: false
      });

      // 默认流体青白色
      colors[i * 3] = 0.4;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 1.0;
    }
    return [data, colors];
  }, [particleCount]);

  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 气道壁高频颤振 (模拟呼吸窘迫喘鸣 Wheezing Flutter: 12Hz ~ 20Hz 机械颤振)
    if (airwayRef.current && isFluttering) {
      const flutter = Math.sin(t * 28.0) * 0.025 * alertIntensity;
      airwayRef.current.position.x = flutter;
      airwayRef.current.position.z = Math.cos(t * 32.0) * 0.015 * alertIntensity;
    }

    // 炎症热力图表面脉动
    if (heatMeshRef.current) {
      const pulse = 1.0 + Math.sin(t * 3.5) * 0.03;
      heatMeshRef.current.scale.set(pulse, pulse, pulse);
    }

    // 粒子动画解算
    if (particlesRef.current) {
      const geo = particlesRef.current.geometry;
      const posAttr = geo.attributes.position;
      const colAttr = geo.attributes.color;
      const colArr = colAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const p = particleData[i];

        // 运动更新
        p.y += p.vy;

        // 如果流经 RB3 狭窄区 (Y: 0.2 ~ -0.8 且偏右侧 X > 0.4)
        if (p.y < 0.3 && p.y > -0.9 && p.x > 0.2) {
          // 产生剧烈紊乱旋涡湍流！速度剧增 4 倍并剧烈侧向飞溅
          p.isTurbulent = true;
          p.vy = -0.12 - Math.random() * 0.08; // 速度骤增
          p.x += (Math.random() - 0.4) * 0.06; // 湍流涡旋偏移
          p.z += (Math.random() - 0.5) * 0.06;

          // 粒子变成火焰警戒红黄色
          colArr[i * 3] = 1.0;     // R
          colArr[i * 3 + 1] = 0.25; // G
          colArr[i * 3 + 2] = 0.1;  // B
        } else {
          // 正常平稳向下
          p.isTurbulent = false;
          colArr[i * 3] = 0.4;
          colArr[i * 3 + 1] = 0.85;
          colArr[i * 3 + 2] = 1.0;
        }

        // 循环重置
        if (p.y < -1.8) {
          p.y = 3.0;
          p.x = (Math.random() - 0.5) * 0.32;
          p.z = (Math.random() - 0.5) * 0.32;
          p.vy = -0.04 - Math.random() * 0.03;
        }

        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
      }

      (posAttr as THREE.BufferAttribute).copyArray(positions);
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. 肺实质表面 3D 炎症浸润热力图 (Heatmap Shell) */}
      <group ref={heatMeshRef}>
        {/* 右肺 (右上叶重度炎症浸润红黄区) */}
        <mesh position={[1.2, 0.4, 0]} scale={[1.1, 1.45, 1.0]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial
            map={heatTexture}
            emissive="#ef4444"
            emissiveIntensity={0.45 * alertIntensity}
            roughness={0.25}
            clearcoat={0.6}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* 左肺 */}
        <mesh position={[-1.2, 0.3, 0]} scale={[1.0, 1.35, 0.95]}>
          <sphereGeometry args={[1, 28, 28]} />
          <meshPhysicalMaterial
            color="#064e3b"
            emissive="#047857"
            emissiveIntensity={0.2}
            roughness={0.3}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>

      {/* 2. 气道壁高频颤振管道结构 */}
      <group ref={airwayRef}>
        {/* 主气管 */}
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[0.26, 0.24, 1.8, 20]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            roughness={0.2}
            metalness={0.1}
            clearcoat={0.8}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* 右支气管与 RB3 狭窄病变区 (红黄充血水肿隆起) */}
        <mesh position={[0.7, 0.6, 0.1]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.22, 0.12, 1.2, 20]} />
          <meshPhysicalMaterial
            color="#ef4444"
            emissive="#b91c1c"
            emissiveIntensity={0.6}
            roughness={0.15}
            clearcoat={1.0}
          />
        </mesh>

        {/* 局灶剧烈狭窄肉芽团 */}
        <mesh position={[1.1, 0.15, 0.2]} scale={[0.3, 0.25, 0.28]}>
          <dodecahedronGeometry args={[0.6, 1]} />
          <meshPhysicalMaterial
            color="#f59e0b"
            emissive="#dc2626"
            emissiveIntensity={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* 左支气管 */}
        <mesh position={[-0.7, 0.6, -0.05]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.2, 0.18, 1.2, 16]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.75} />
        </mesh>
      </group>

      {/* 3. 气流粒子系统 (高速紊流湍流飞溅) */}
      <points ref={particlesRef}>
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
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.075}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ==========================================
// 2. 主 AECOPD 早期预警工作台
// ==========================================
export const AECOPDAlertView: React.FC<AECOPDAlertViewProps> = ({
  patient,
  onOpenKnowledgeGraph
}) => {
  const [isFluttering, setIsFluttering] = useState<boolean>(true);
  const [alertIntensity, setAlertIntensity] = useState<number>(0.85);

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* 顶栏控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            AECOPD 急性加重 72 小时动态早期预警雷达 (3D 气流湍流危象与炎症浸润)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            融合 SpO2 走低、气道壁高频颤振 (Wheezing) 与 RB3 局灶气流紊乱激增，提前 72 小时干预阻断呼吸衰竭
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFluttering(!isFluttering)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs border flex items-center gap-1.5 transition ${
              isFluttering
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-rose-400" />
            <span>{isFluttering ? '气道高频颤振模拟: 开' : '气道高频颤振模拟: 关'}</span>
          </button>

          <span className="px-3.5 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-300 font-bold text-xs flex items-center gap-1.5 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>红色高危告警响应中</span>
          </span>
        </div>
      </div>

      {/* 3D 动力学危象视口与生理体征监控 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[580px]">
        {/* 左侧 2 列: 3D 气流湍流与炎症热力图视口 */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-rose-900/50 rounded-2xl p-4 flex flex-col gap-3 relative shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between text-xs px-2 text-slate-300 z-10">
            <span className="font-bold text-rose-300 font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-400" />
              3D INFLAMMATION HEATMAP & TURBULENT CRISIS VIEW
            </span>
            <span className="text-[11px] font-mono text-amber-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
              REYNOLDS: 3200 (TURBULENT) · FLUTTER: 18Hz
            </span>
          </div>

          <div className="flex-1 w-full rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden min-h-[380px]">
            <Canvas camera={{ position: [0, 0.8, 5.2], fov: 46 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[6, 6, 6]} intensity={1.5} />
              <pointLight position={[-6, -6, -6]} color="#f43f5e" intensity={1.0} />

              <CrisisScene
                alertIntensity={alertIntensity}
                isFluttering={isFluttering}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.8}
                minDistance={3.5}
                maxDistance={11.0}
              />
            </Canvas>

            {/* 视口悬浮危象 HUD */}
            <div className="absolute top-4 left-4 pointer-events-none p-3 rounded-xl bg-slate-950/85 border border-rose-800/60 text-[11px] font-mono text-slate-300 space-y-1 shadow-xl">
              <div className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                右上叶前段 (RB3) 发生严重湍流飞溅
              </div>
              <div className="text-slate-400 text-[10px]">● 黏膜炎症浸润面积扩展 +38%</div>
              <div className="text-amber-300 text-[10px]">● 气道呼气末塌陷阻抗 Raw: 0.485 kPa·s/L</div>
            </div>

            {/* 3D 旋转提示 */}
            <div className="absolute bottom-3 right-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              左键旋转 3D 视口 · 观察炎性浸润范围
            </div>
          </div>

          {/* 底部危象级别调节滑块 */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/90 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
              <Zap className="w-4 h-4 text-amber-400" />
              危象模拟强度: {(alertIntensity * 100).toFixed(0)}%
            </span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={alertIntensity}
              onChange={(e) => setAlertIntensity(parseFloat(e.target.value))}
              className="flex-1 accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* 右侧：72 小时综合概率、生理指标与 Anthonisen 三联征 */}
        <div className="space-y-4 flex flex-col">
          {/* 72 小时概率表盘 */}
          <div className="p-5 bg-gradient-to-b from-rose-950/60 to-slate-900/90 border border-rose-800/60 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 shadow-xl">
            <div className="text-xs text-rose-300 font-bold tracking-wide uppercase">
              72小时急性加重发生概率
            </div>
            <div className="text-5xl font-black text-rose-400 font-mono tracking-tight drop-shadow-md">
              {(83.5 * alertIntensity / 0.85).toFixed(1)}%
            </div>
            <div className="text-xs text-rose-200 bg-rose-900/60 px-3 py-1 rounded-full border border-rose-600 font-semibold">
              极高危：需主治医师立即干预
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs pt-1">
              患者近 48 小时静息 SpO2 持续降至 91%，气道内压振幅增大，提示小气道严重痉挛与黏液栓塞。
            </p>
          </div>

          {/* 连续生理指标卡 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              加重相关连续生理体征监控
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">静息指脉氧 SpO2</span>
                <span className="text-rose-400 font-bold text-base">91 %</span>
                <span className="text-[9px] text-rose-500 block">低于安全线 (94%)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">呼吸频率 RR</span>
                <span className="text-amber-300 font-bold text-base">24 次/分</span>
                <span className="text-[9px] text-amber-500 block">轻度气促急促</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">气道阻力 Raw</span>
                <span className="text-amber-300 font-bold text-base">0.485 kPa·s/L</span>
                <span className="text-[9px] text-amber-500 block">高负荷阻抗</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">气象温湿度突变</span>
                <span className="text-cyan-300 font-bold text-base">-4.2 ℃</span>
                <span className="text-[9px] text-cyan-400 block">冷空气刺激诱因</span>
              </div>
            </div>
          </div>

          {/* Anthonisen 临床诊断三联指征 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex-1">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              Anthonisen 临床诊断三联指征排查
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-900/50 flex justify-between items-center">
                <span>1. 气促加重明显</span>
                <span className="text-rose-400 font-bold">✓ 阳性 (mMRC 3级)</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-900/50 flex justify-between items-center">
                <span>2. 痰量较平时增多</span>
                <span className="text-rose-400 font-bold">✓ 阳性 (&gt;50ml/日)</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-900/50 flex justify-between items-center">
                <span>3. 痰呈脓性变黄</span>
                <span className="text-rose-400 font-bold">✓ 阳性 (黄色脓痰)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[11px] text-amber-300 font-semibold">【主治医师紧急处置指引】:</div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                <li>启动日间留观/住院床位快速绿色通道</li>
                <li>吸入布地奈德福莫特罗加大剂量抗炎</li>
                <li>指导家庭持续低流量氧疗 (1.5 ~ 2.0 L/min)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

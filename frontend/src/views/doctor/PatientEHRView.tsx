import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  User,
  Clock,
  Pill,
  Activity,
  Droplet,
  ScanLine,
  FileText,
  Sparkles,
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Zap
} from 'lucide-react';
import { PatientMeta } from '../../types';

interface PatientEHRViewProps {
  patient: PatientMeta;
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
}

// ==========================================
// 1. 3D 全息数字人站立投影场景 (Holographic Human Avatar)
// ==========================================
interface HolographicAvatarSceneProps {
  selectedPin: string | null;
  onSelectPin: (pinId: string) => void;
}

function HolographicAvatarScene({ selectedPin, onSelectPin }: HolographicAvatarSceneProps) {
  const avatarGroup = useRef<THREE.Group>(null);
  const scanPlaneRef = useRef<THREE.Mesh>(null);
  const baseRingRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. 全息投影自下而上往复激光扫描线 (Vertical Scan Beam)
    if (scanPlaneRef.current) {
      scanPlaneRef.current.position.y = -2.2 + ((t * 1.5) % 4.6);
    }

    // 2. 底座全息罗盘圆环自转
    if (baseRingRef.current) {
      baseRingRef.current.rotation.y = t * 0.4;
    }

    // 3. 人体潮气呼吸微动
    if (avatarGroup.current) {
      const breath = 1.0 + Math.sin(t * 1.8) * 0.015;
      avatarGroup.current.scale.set(breath, 1.0, breath);
    }
  });

  return (
    <group>
      {/* 1. 全息发光底座平台 (Holographic Pedestal) */}
      <group position={[0, -2.3, 0]}>
        {/* 外圈光盘 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.65, 64]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
        {/* 旋转刻度环 */}
        <group ref={baseRingRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.2, 1.3, 32]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} wireframe />
          </mesh>
        </group>
        {/* 中心微发光圆形地面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.1, 32]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 2. 纵向全息扫描光片 (Scanning Plane) */}
      <mesh ref={scanPlaneRef} position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 2.8]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. 三维人体全息解剖轮廓 (Holographic Avatar Geometry) */}
      <group ref={avatarGroup} position={[0, 0, 0]}>
        {/* 头部 (Head) */}
        <mesh position={[0, 1.7, 0]} scale={[0.32, 0.42, 0.36]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.25}
            roughness={0.2}
            transmission={0.7}
            transparent
            opacity={0.3}
            wireframe={false}
          />
        </mesh>

        {/* 颈部 (Neck) */}
        <mesh position={[0, 1.25, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.28, 16]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            roughness={0.2}
          />
        </mesh>

        {/* 躯干外层全息皮肤透视轮廓 (Torso Shell - 半透明以展现胸腔内肺部) */}
        <mesh position={[0, 0.45, 0]} scale={[0.85, 1.25, 0.55]}>
          <cylinderGeometry args={[0.9, 0.75, 1.0, 24]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            emissive="#0369a1"
            emissiveIntensity={0.15}
            roughness={0.15}
            transmission={0.8}
            transparent
            opacity={0.18}
            wireframe={true}
          />
        </mesh>

        {/* 骨盆与下腹 (Pelvis) */}
        <mesh position={[0, -0.35, 0]} scale={[0.78, 0.5, 0.5]}>
          <cylinderGeometry args={[0.8, 0.65, 0.7, 20]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.22}
            wireframe={true}
          />
        </mesh>

        {/* 上肢 (Arms) */}
        <mesh position={[-0.9, 0.4, 0]} rotation={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.12, 0.09, 1.3, 16]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.2} wireframe />
        </mesh>
        <mesh position={[0.9, 0.4, 0]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.12, 0.09, 1.3, 16]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.2} wireframe />
        </mesh>

        {/* 下肢 (Legs) */}
        <mesh position={[-0.38, -1.3, 0]}>
          <cylinderGeometry args={[0.16, 0.11, 1.6, 16]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.2} wireframe />
        </mesh>
        <mesh position={[0.38, -1.3, 0]}>
          <cylinderGeometry args={[0.16, 0.11, 1.6, 16]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.2} wireframe />
        </mesh>

        {/* 4. 胸腔内部重点透视实体: 患者病变的肺部与支气管树 */}
        <group position={[0, 0.55, 0]}>
          {/* 右肺 (右上叶伴有 RB3 狭窄与肺气肿) */}
          <mesh position={[0.42, 0.1, 0]} scale={[0.38, 0.55, 0.36]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshPhysicalMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={0.4}
              transparent
              opacity={0.65}
              roughness={0.2}
            />
          </mesh>

          {/* 右上叶 RB3 局灶重构狭窄红光微脉冲 */}
          <mesh position={[0.48, 0.42, 0.12]} scale={[0.12, 0.12, 0.12]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>

          {/* 左肺 */}
          <mesh position={[-0.42, 0.05, 0]} scale={[0.35, 0.52, 0.34]}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshPhysicalMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={0.3}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* 气管支气管倒Y形中心线 */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
          <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.04, 0.03, 0.4, 12]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
          <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.04, 0.03, 0.4, 12]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>

          {/* 心脏轮廓 (纵隔左偏) */}
          <mesh position={[-0.12, -0.08, 0.12]} scale={[0.22, 0.25, 0.22]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshPhysicalMaterial
              color="#e11d48"
              emissive="#be123c"
              emissiveIntensity={0.35}
              transparent
              opacity={0.55}
            />
          </mesh>
        </group>
      </group>

      {/* 5. 空间 3D 光标引导引出到病历指标 (3D Pinpoints & Leader Lines) */}
      {/* 标引 1: 右上叶病灶 (RB3 狭窄与 LAA-950) */}
      <group position={[0.48, 0.95, 0.15]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelectPin('lesion');
          }}
        >
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
        <Html distanceFactor={7} position={[0.25, 0.1, 0]}>
          <div
            onClick={() => onSelectPin('lesion')}
            className={`p-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap cursor-pointer transition shadow-xl border ${
              selectedPin === 'lesion'
                ? 'bg-rose-950 text-rose-200 border-rose-500 scale-105'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-cyan-400'
            }`}
          >
            ● RB3 狭窄 (65%) · LAA 32.4%
          </div>
        </Html>
      </group>

      {/* 标引 2: 肺功能损害 (FEV1 46.2%pred) */}
      <group position={[-0.45, 0.6, 0.1]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelectPin('pft');
          }}
        >
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <Html distanceFactor={7} position={[-0.3, 0.1, 0]}>
          <div
            onClick={() => onSelectPin('pft')}
            className={`p-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap cursor-pointer transition shadow-xl border ${
              selectedPin === 'pft'
                ? 'bg-amber-950 text-amber-200 border-amber-500 scale-105'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-cyan-400'
            }`}
          >
            ● FEV1 46.2% (GOLD 3级)
          </div>
        </Html>
      </group>

      {/* 标引 3: 血气低氧血症 (PaO2 62mmHg) */}
      <group position={[-0.12, 0.45, 0.25]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelectPin('abg');
          }}
        >
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Html distanceFactor={7} position={[0.2, -0.15, 0]}>
          <div
            onClick={() => onSelectPin('abg')}
            className={`p-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap cursor-pointer transition shadow-xl border ${
              selectedPin === 'abg'
                ? 'bg-cyan-950 text-cyan-200 border-cyan-500 scale-105'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-cyan-400'
            }`}
          >
            ● PaO₂ 62mmHg (I型呼衰)
          </div>
        </Html>
      </group>
    </group>
  );
}

// ==========================================
// 2. 主患者全景 EHR 视图
// ==========================================
export const PatientEHRView: React.FC<PatientEHRViewProps> = ({
  patient,
  onOpenKnowledgeGraph
}) => {
  const [selectedPin, setSelectedPin] = useState<string | null>('lesion');

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* 顶栏控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            患者全景脱敏电子健康档案 (3D 全息数字人站立投影)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            采用人体数字孪生全景全息台，透视胸腔病变肺实质，空间光标引出关联吸烟史、血气与肺功能
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-800">
            匿名编码: {patient?.anon_code || 'SYU-COPD-2026-088'}
          </span>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            责任医师: 王建平 主任医师 · 呼吸科 08床
          </div>
        </div>
      </div>

      {/* 3D 全息台与右侧 EHR 医疗档案列 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[580px]">
        {/* 左侧 2 列: 3D 全息数字人站立视口 */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between text-xs px-2 text-slate-300 z-10">
            <span className="font-bold text-cyan-300 font-mono flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              HOLOGRAPHIC HUMAN DIGITAL TWIN AVATAR
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
              HIPAA DE-IDENTIFIED · 3D SCAN ACTIVE
            </span>
          </div>

          <div className="flex-1 w-full rounded-xl bg-slate-950/95 border border-slate-800 relative overflow-hidden min-h-[380px]">
            <Canvas camera={{ position: [0, 0.4, 4.8], fov: 46 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[5, 8, 5]} intensity={1.5} />
              <pointLight position={[-5, -4, -5]} color="#0284c7" intensity={0.8} />

              <HolographicAvatarScene
                selectedPin={selectedPin}
                onSelectPin={setSelectedPin}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.8}
                minDistance={3.0}
                maxDistance={9.5}
              />
            </Canvas>

            {/* 3D 旋转提示 */}
            <div className="absolute bottom-3 right-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              点击数字人 3D 光标引线查看病案模块 · 鼠标左键旋转
            </div>
          </div>

          {/* 快捷标引切换标签 */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
            {[
              { id: 'lesion', label: '① 靶区病灶 (RB3狭窄与气肿)' },
              { id: 'pft', label: '② 肺功能检验 (PFT 46.2%)' },
              { id: 'abg', label: '③ 动脉血气 (PaO2 62mmHg)' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPin(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedPin === p.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：电子健康档案全景指标 (人口学 + 肺功能 + 血气 + 用药) */}
        <div className="space-y-4 flex flex-col">
          {/* 基础人口学与危险暴露 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                人口学特征与吸烟暴露史
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {patient?.age ?? 68} 岁 / {patient?.gender || '男'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">吸烟指数 (包·年)</span>
                <span className="text-rose-400 font-bold">
                  {patient?.smoking_pack_years ?? 40} 包·年 (重度暴露)
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">主要合并症</span>
                <span className="text-slate-200">高血压2级 · 肺心病代偿期</span>
              </div>
            </div>
          </div>

          {/* 肺功能检验报告单 (Spirometry PFT) */}
          <div className={`p-4 rounded-2xl border transition space-y-2.5 ${
            selectedPin === 'pft'
              ? 'bg-amber-950/20 border-amber-500/70 shadow-lg shadow-amber-950/30'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                肺功能报告单 (PFT Baseline)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                {patient?.gold_stage || 'GOLD 3级 C组 (重度)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">FEV1 % pred</span>
                <span className="text-cyan-300 font-bold">{patient?.fev1_pred || 46.2}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">FEV1 / FVC</span>
                <span className="text-rose-400 font-bold">{patient?.fev1_fvc_ratio || 46.2}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">FVC 实测值</span>
                <span className="text-slate-200 font-bold">{patient?.fvc_liters || 2.65} L</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">气道阻力 Raw</span>
                <span className="text-amber-300 font-bold">{patient?.airway_resistance || 0.485} kPa·s/L</span>
              </div>
            </div>
          </div>

          {/* 动脉血气分析 (ABG) */}
          <div className={`p-4 rounded-2xl border transition space-y-2.5 ${
            selectedPin === 'abg'
              ? 'bg-cyan-950/20 border-cyan-500/70 shadow-lg shadow-cyan-950/30'
              : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-cyan-400" />
                动脉血气分析 (ABG)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                I型低氧血症
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">动脉氧分压 PaO₂</span>
                <span className="text-rose-400 font-bold text-sm">62 mmHg</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">二氧化碳 PaCO₂</span>
                <span className="text-amber-300 font-bold text-sm">48 mmHg</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">静息指脉氧 SpO₂</span>
                <span className="text-rose-400 font-bold text-sm">{patient?.spo2_resting || 91}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">酸碱度 pH</span>
                <span className="text-slate-200 font-bold text-sm">7.38</span>
              </div>
            </div>
          </div>

          {/* 现病史在服药物 */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2 flex-1">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-emerald-400" />
              现用维持治疗处方清单
            </span>
            <div className="space-y-1.5 text-xs">
              {(patient?.current_meds || [
                '布地奈德福莫特罗粉吸入剂 (ICS/LABA 160/4.5μg bid)',
                '噻托溴铵粉吸入剂 (LAMA 18μg qd)',
                '乙酰半胱氨酸泡腾片 (0.6g bid)'
              ]).map((m, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

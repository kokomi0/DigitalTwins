import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Download,
  Zap,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { BrainTumorPatientMeta, NeosomaFollowupPoint } from '../../types';
import { MOCK_NEOSOMA_FOLLOWUP } from '../../services/mockData';

interface NeosomaVolumetricPanelProps {
  patient: BrainTumorPatientMeta;
  onExportReport?: () => void;
}

// 3D 体素级靶区多层外壳球体演示
function TargetVolumeShells({ data }: { data: NeosomaFollowupPoint }) {
  const gtvRadius = Math.cbrt(data.gtv_cm3 / 4.18) * 0.45;
  const ctvRadius = Math.cbrt(data.ctv_cm3 / 4.18) * 0.45;
  const ptvRadius = Math.cbrt(data.ptv_cm3 / 4.18) * 0.45;

  return (
    <group>
      {/* PTV (计划靶区 - 外部最广放疗保护壳) */}
      <mesh>
        <sphereGeometry args={[ptvRadius, 24, 24]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.6}
          transparent
          opacity={0.25}
          roughness={0.3}
          wireframe={true}
        />
      </mesh>

      {/* CTV (临床靶区 - 显微镜下侵润边界) */}
      <mesh>
        <sphereGeometry args={[ctvRadius, 24, 24]} />
        <meshPhysicalMaterial
          color="#f59e0b"
          transmission={0.5}
          transparent
          opacity={0.38}
          roughness={0.2}
          wireframe={false}
        />
      </mesh>

      {/* GTV (肿瘤肉眼体积 - 强化实体坏死核心) */}
      <mesh>
        <sphereGeometry args={[gtvRadius, 28, 28]} />
        <meshPhysicalMaterial
          color="#ef4444"
          emissive="#dc2626"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

export const NeosomaVolumetricPanel: React.FC<NeosomaVolumetricPanelProps> = ({
  patient,
  onExportReport
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(2); // 默认选中 Post-op M3 (随访关键期)
  const currentData = MOCK_NEOSOMA_FOLLOWUP[selectedPointIndex];
  const [isExported, setIsExported] = useState<boolean>(false);

  const handleExport = () => {
    setIsExported(true);
    setTimeout(() => setIsExported(false), 3000);
    onExportReport?.();
  };

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* 顶栏控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Neosoma 体素级肿瘤放疗靶区纵向随访与真假进展智能辨别系统 (FDA 510(k) 对标)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            采用多模态 MRI 灌注 (PWI rCBV) 与波谱 (MRS Cho/NAA)，精准鉴别放化疗后【假性进展】与真实肿瘤复发，规避盲目二次开颅
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExported ? '已生成 Neosoma 评估报告' : '导出 FDA-510(k) 纵向随访报告'}</span>
          </button>
        </div>
      </div>

      {/* 纵向随访 3 大时间节点切换横条 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MOCK_NEOSOMA_FOLLOWUP.map((point, idx) => (
          <div
            key={point.timepoint}
            onClick={() => setSelectedPointIndex(idx)}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
              selectedPointIndex === idx
                ? 'bg-indigo-950/60 border-indigo-400 shadow-xl shadow-indigo-950/50'
                : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100">{point.label}</span>
              <span className="text-[10px] font-mono text-slate-400">{point.date}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <div className="p-1.5 rounded-lg bg-slate-950">
                <span className="text-[9px] text-slate-500 block">GTV 实体</span>
                <span className="text-rose-400 font-bold">{point.gtv_cm3} cm³</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950">
                <span className="text-[9px] text-slate-500 block">CTV 侵润</span>
                <span className="text-amber-400 font-bold">{point.ctv_cm3} cm³</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950">
                <span className="text-[9px] text-slate-500 block">PTV 靶区</span>
                <span className="text-cyan-300 font-bold">{point.ptv_cm3} cm³</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 中心分析区：左侧 3D 靶区体素视口 + 右侧真假进展多模态辨别看板 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[500px]">
        {/* 左侧 3D 体素靶区视口 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between text-xs px-1 text-slate-300 z-10">
            <span className="font-bold text-indigo-300 font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              3D VOXEL TARGET VOLUME (GTV/CTV/PTV)
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {currentData.timepoint} 空间靶区投影
            </span>
          </div>

          <div className="flex-1 w-full rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden min-h-[300px]">
            <Canvas camera={{ position: [0, 0, 4.0], fov: 45 }}>
              <ambientLight intensity={1.2} />
              <pointLight position={[6, 6, 6]} intensity={1.5} />
              <pointLight position={[-6, -6, -6]} color="#818cf8" intensity={0.8} />

              <TargetVolumeShells data={currentData} />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.8}
                minDistance={2.5}
                maxDistance={8.0}
              />
            </Canvas>

            {/* 3D 图例悬浮 */}
            <div className="absolute bottom-3 left-3 pointer-events-none p-2 rounded-lg bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> GTV (肿瘤肉眼核心)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> CTV (临床侵润扩散区)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> PTV (计划放疗照射壳)
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：Neosoma 核心多模态 MRI 鉴别与真假进展概率分析 */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl">
          {/* 核心结论大卡片：假性进展判定 */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-950 to-indigo-950/40 border border-emerald-500/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Neosoma 临床鉴别结论: 假性进展 (Pseudoprogression)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-600 font-mono text-[10px]">
                  概率 78.4%
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px] pt-1">
                术后 3 个月强化病灶虽有扩大（GTV 从 6.2 升至 9.8 cm³），但灌注加权成像 (PWI) 呈明显<b>低脑血容量 (rCBV=1.15)</b>，波谱分析未见恶性增殖高 Cho 峰，高度符合放化疗引起的<b>暂时性无菌性血管通透性增高与脱髓鞘坏死</b>，建议维持观察，<b>坚决避免盲目二次手术创伤！</b>
              </p>
            </div>

            <div className="flex flex-col items-center shrink-0 p-3 rounded-xl bg-slate-900 border border-slate-800 min-w-[140px]">
              <span className="text-[10px] text-slate-400">假性进展置信度</span>
              <span className="text-3xl font-black text-emerald-400 font-mono my-0.5">78.4%</span>
              <span className="text-[9px] text-slate-500">真实复发概率: 21.6%</span>
            </div>
          </div>

          {/* 4 大多模态物理指标对比矩阵 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">PWI 相对脑血容量</span>
              <span className="text-emerald-400 font-bold text-base">{currentData.rcbv_ratio}</span>
              <span className="text-[9px] text-slate-400 block">&lt;1.75 提示非肿瘤增生</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">MRS 波谱比值 (Cho/NAA)</span>
              <span className="text-emerald-400 font-bold text-base">{currentData.cho_naa_ratio}</span>
              <span className="text-[9px] text-slate-400 block">&lt;1.8 未见恶性代谢峰</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">RANO 疗效分级</span>
              <span className="text-amber-400 font-bold text-base">SD (疾病稳定)</span>
              <span className="text-[9px] text-slate-400 block">放化疗反应期</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">建议下次复查间期</span>
              <span className="text-cyan-300 font-bold text-base">6 ~ 8 周</span>
              <span className="text-[9px] text-slate-400 block">加做 PET-CT 随访</span>
            </div>
          </div>

          {/* 华西医院放疗科与神经外科联合诊疗指引 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <FileText className="w-4 h-4 text-cyan-400" />
                华西医院神经外科 ✕ 肿瘤放疗科 MDT 随访行动指南
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                指南依据: 2026 NCCN CNS Cancers Guidelines
              </span>
            </div>
            <ul className="text-slate-300 text-[11px] space-y-1 list-disc list-inside leading-relaxed">
              <li>维持当前替莫唑胺 (TMZ) 辅助化疗周期，暂不调整二线靶向贝伐珠单抗；</li>
              <li>口服地塞米松 2mg bid 减轻瘤周无菌性水肿，密切监测患者肌力与语言清晰度；</li>
              <li>预定于 2026-11-15 进行第 4 次薄层灌注磁共振扫描，重新计算靶区体积漂移率。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

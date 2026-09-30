import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Layers,
  Sparkles,
  Activity,
  FileText,
  ShieldCheck,
  Zap,
  Target,
  Share2,
  Calendar,
  AlertTriangle,
  User,
  CheckCircle2,
  Award,
  Download
} from 'lucide-react';
import { BrainTumorPatientMeta, SurgicalTrajectory } from '../../types';
import { MOCK_BRAIN_PATIENT } from '../../services/mockData';
import { BrainTumorViewer3D } from './BrainTumorViewer3D';
import { NeosomaVolumetricPanel } from './NeosomaVolumetricPanel';

interface WestChinaBrainStudioProps {
  onOpenBenchmarkModal?: () => void;
  activeMenuId?: string;
  onSelectMenu?: (menuId: string) => void;
}

export const WestChinaBrainStudio: React.FC<WestChinaBrainStudioProps> = ({
  onOpenBenchmarkModal,
  activeMenuId,
  onSelectMenu
}) => {
  const [patient, setPatient] = useState<BrainTumorPatientMeta>(MOCK_BRAIN_PATIENT);
  const [activeSubTab, setActiveSubTab] = useState<'3d_pathfinder' | 'neosoma_volumetrics' | 'dti_tracts' | 'mdt_decision'>('3d_pathfinder');
  const [currentTrajectory, setCurrentTrajectory] = useState<SurgicalTrajectory | null>(null);

  useEffect(() => {
    if (activeMenuId === 'brain_neosoma_volumetric') {
      setActiveSubTab('neosoma_volumetrics');
    } else if (activeMenuId === 'brain_dti_tracts') {
      setActiveSubTab('dti_tracts');
    } else if (activeMenuId === 'brain_mdt_decision') {
      setActiveSubTab('mdt_decision');
    } else if (activeMenuId === 'brain_3d_pathfinder') {
      setActiveSubTab('3d_pathfinder');
    }
  }, [activeMenuId]);

  const handleTabChange = (tabId: '3d_pathfinder' | 'neosoma_volumetrics' | 'dti_tracts' | 'mdt_decision') => {
    setActiveSubTab(tabId);
    if (onSelectMenu) {
      if (tabId === '3d_pathfinder') onSelectMenu('brain_3d_pathfinder');
      else if (tabId === 'neosoma_volumetrics') onSelectMenu('brain_neosoma_volumetric');
      else if (tabId === 'dti_tracts') onSelectMenu('brain_dti_tracts');
      else if (tabId === 'mdt_decision') onSelectMenu('brain_mdt_decision');
    }
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* 华西医院专属医疗标头与患者全景看板 */}
      <div className="p-3 md:px-5 border-b border-purple-900/40 bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-purple-400/40">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  <span>四川大学华西医院 · 神经外科脑肿瘤数字孪生协同平台</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    West China Brain Tumor Studio
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-purple-300/80">
                深度对标美国 ATLAS Meditech 虚拟脑手术预演 ✕ Neosoma FDA 510(k) 肿瘤放疗多模态评估
              </p>
            </div>
          </div>

          {/* 华西患者摘要卡片 */}
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <div className="p-1.5 px-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-100 font-bold">{patient.patient_name}</span>
              <span className="text-slate-400">({patient.gender} · {patient.age}岁)</span>
              <span className="text-purple-300 px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-[10px]">
                {patient.inpatient_no}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 p-1.5 px-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400">病理分型:</span>
              <span className="text-rose-400 font-bold">GBM WHO IV级</span>
              <span className="text-slate-400">| MGMT:</span>
              <span className="text-emerald-400 font-bold">阳性 (68%)</span>
            </div>

            {onOpenBenchmarkModal && (
              <button
                onClick={onOpenBenchmarkModal}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-purple-950/50 flex items-center gap-1.5 hover:from-purple-500 hover:to-indigo-500 transition active:scale-95"
              >
                <Award className="w-3.5 h-3.5 text-yellow-300" />
                <span>中美前沿工具对比看板</span>
              </button>
            )}
          </div>
        </div>

        {/* 四大临床子模块胶囊切换栏 */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
          {[
            { id: '3d_pathfinder', name: '3D 虚拟脑手术预演 (ATLAS Pathfinder)', icon: Compass },
            { id: 'neosoma_volumetrics', name: 'Neosoma 靶区纵向对比 (真假进展鉴别)', icon: Layers },
            { id: 'dti_tracts', name: 'DTI 白质纤维束示踪与语言区保护', icon: Zap },
            { id: 'mdt_decision', name: '华西神经外科 MDT 术前方案决议', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 核心内容区 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {/* 1. ATLAS Meditech 3D 虚拟脑手术预演 */}
          {activeSubTab === '3d_pathfinder' && (
            <motion.div
              key="3d_pathfinder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 h-full overflow-hidden"
            >
              <BrainTumorViewer3D
                patient={patient}
                onTrajectoryChange={setCurrentTrajectory}
              />
            </motion.div>
          )}

          {/* 2. Neosoma 体素级靶区与真假进展纵向随访 */}
          {activeSubTab === 'neosoma_volumetrics' && (
            <motion.div
              key="neosoma_volumetrics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 h-full overflow-hidden"
            >
              <NeosomaVolumetricPanel patient={patient} />
            </motion.div>
          )}

          {/* 3. DTI 白质纤维束示踪与语言功能区保护 */}
          {activeSubTab === 'dti_tracts' && (
            <motion.div
              key="dti_tracts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 h-full p-4 overflow-y-auto space-y-4"
            >
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    高分辨率 DTI 弥散张量成像神经纤维束示踪与优势半球语言保护
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    基于华西医院 3.0T MRI 64方向 DTI 序列，追踪左侧弓状束 (Arcuate Fasciculus) 与皮质脊髓束 (CST) 空间走形
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-xl bg-emerald-950 border border-emerald-800">
                  纤维束浸润位移: 3.2mm (未见完全离断)
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-slate-200">
                    DTI 白质传导束三维空间保护走廊评估
                  </div>
                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="text-purple-300 font-bold block">1. 左侧弓状束 (Arcuate Fasciculus)</span>
                        <span className="text-slate-400 text-[11px]">连接 Broca 区与 Wernicke 区核心语言通路</span>
                      </div>
                      <span className="text-emerald-400 font-bold">间距 5.2 mm (安全保护)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="text-amber-300 font-bold block">2. 皮质脊髓束 (Corticospinal Tract, CST)</span>
                        <span className="text-slate-400 text-[11px]">对侧肢体主运动神经下行传导束</span>
                      </div>
                      <span className="text-emerald-400 font-bold">间距 6.8 mm (无损伤风险)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="text-rose-400 font-bold block">3. 额枕下束 (Inferior Fronto-Occipital, IFOF)</span>
                        <span className="text-slate-400 text-[11px]">深部语义阅读传导通路</span>
                      </div>
                      <span className="text-amber-400 font-bold">间距 3.4 mm (需术中皮层下电刺激监控)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-slate-200">术中神经电生理监测指引</div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                    <li>术中采用 Ojemann 双极电刺激器 (2~4 mA, 60Hz)；</li>
                    <li>在患者唤醒状态下进行计数与物体命名测试，确认 Broca 语言皮层功能边界；</li>
                    <li>若刺激时出现言语停顿或命名不能，立即标定为功能边界，预留 5mm 安全边缘。</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. 华西神经外科 MDT 术前讨论决议 */}
          {activeSubTab === 'mdt_decision' && (
            <motion.div
              key="mdt_decision"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 h-full p-4 overflow-y-auto space-y-4"
            >
              <div className="p-5 bg-slate-900/80 border border-purple-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    华西医院神经外科 ✕ 肿瘤放疗科 ✕ 神经病理科 MDT 专家会诊决议书
                  </h3>
                  <span className="text-xs font-mono text-slate-400">会诊日期: 2026-09-26 14:30</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs leading-relaxed">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">【术前综合诊断】:</span>
                    <p className="text-slate-200">
                      左侧额颞叶交界区占位性病变，影像学及分子生物学特征高度符合<b>胶质母细胞瘤 (Glioblastoma, GBM WHO IV级, IDH1野生型, MGMT甲基化阳性)</b>。
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block mb-1">【手术方案策略 (ATLAS Meditech 仿真指导)】:</span>
                    <p className="text-slate-200">
                      一致同意采用<b>经外侧裂翼点入路 (Pterional Approach)</b>。入路走廊避开 MCA-M2 主干大血管（安全距离 3.8mm）及 Broca 语言中枢（安全距离 5.2mm）。目标实现 <b>GTR (近全切除 &gt;95%)</b>，最大程度保留言语与运动功能。
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold block mb-1">【术后放化疗与随访策略 (Neosoma 指导)】:</span>
                    <p className="text-slate-200">
                      术后 4 周启动 Stupp 方案（同步放化疗 60Gy/30f + 替莫唑胺 TMZ 75mg/m²）。术后第 3 个月强化病灶若出现扩大，强制调用 <b>Neosoma PWI/MRS 真假进展鉴别系统</b>，严防将放射性假性进展误判为复发。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

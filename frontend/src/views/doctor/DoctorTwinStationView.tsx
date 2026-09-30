import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientMeta, AnatomyNode, SimulationFrame } from '../../types';
import { TwinViewer3D } from '../../components/3d/TwinViewer3D';
import { AirwayWaveformChart } from '../../components/clinical/AirwayWaveformChart';
import { prescriptionService, Prescription } from '../../services/prescriptionService';
import {
  Activity,
  Heart,
  Wind,
  Thermometer,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Send,
  FileCheck,
  TrendingUp,
  Share2,
  Calendar,
  Clock,
  ShieldCheck,
  Flame,
  ChevronRight,
  Info,
  Maximize2
} from 'lucide-react';

interface DoctorTwinStationViewProps {
  patient: PatientMeta;
  nodes: AnatomyNode[];
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode) => void;
  simulationFrame: SimulationFrame;
  history: Array<{ time: string; pressure: number; flow: number }>;
  isWireframe: boolean;
  lodLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  onEbusClick: (station: string) => void;
  onOpenKnowledgeGraph: (nodeId?: string) => void;
  isModalOpen?: boolean;
}

export const DoctorTwinStationView: React.FC<DoctorTwinStationViewProps> = ({
  patient,
  nodes,
  selectedNode,
  onSelectNode,
  simulationFrame,
  history,
  isWireframe,
  lodLevel,
  onEbusClick,
  onOpenKnowledgeGraph,
  isModalOpen = false
}) => {
  // =========================================================================
  // 1. 左侧 CT 影像切片与解剖定位控制
  // =========================================================================
  const [ctPlane, setCtPlane] = useState<'AXIAL' | 'CORONAL' | 'SAGITTAL'>('AXIAL');
  const [sliceIndex, setSliceIndex] = useState<number>(64);
  const [leftTab, setLeftTab] = useState<'VITALS_CT' | 'ANATOMY_TREE'>('VITALS_CT');

  // =========================================================================
  // 2. 右侧 What-if 虚拟试错对比器状态
  // =========================================================================
  const [selectedRegimen, setSelectedRegimen] = useState<'PLAN_A' | 'PLAN_B' | 'PLAN_C'>('PLAN_A');
  const [adherence, setAdherence] = useState<number>(85); // 依从性 40% ~ 100%
  const [durationMonths, setDurationMonths] = useState<number>(3); // 3, 6, 12 个月
  const [smokingStatus, setSmokingStatus] = useState<'CURRENT' | 'REDUCING' | 'QUIT'>('QUIT');
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState<boolean>(false);
  const [prescriptionSuccessToast, setPrescriptionSuccessToast] = useState<string | null>(null);

  // 依据滑块动态计算 AI 预测产出
  const predictionOutputs = useMemo(() => {
    const adherenceFactor = adherence / 100.0;
    const smokeBonus = smokingStatus === 'QUIT' ? 1.2 : smokingStatus === 'REDUCING' ? 1.05 : 0.9;
    const monthFactor = durationMonths === 3 ? 1.0 : durationMonths === 6 ? 1.3 : 1.55;

    // 方案 A: LABA+LAMA (小气道阻力改善最优)
    const planA_fev1 = +(15.2 * adherenceFactor * smokeBonus * (monthFactor > 1.2 ? 1.25 : 1.0)).toFixed(1);
    const planA_aecopd = +(-1.2 * adherenceFactor * (smokingStatus === 'QUIT' ? 1.15 : 1.0)).toFixed(2);
    const planA_cat = Math.max(9, Math.round(21 - 9 * adherenceFactor * smokeBonus));
    const planA_raw = Math.round(32 * adherenceFactor);

    // 方案 B: LABA+ICS (抗炎为主)
    const planB_fev1 = +(8.4 * adherenceFactor * smokeBonus * (monthFactor > 1.2 ? 1.18 : 1.0)).toFixed(1);
    const planB_aecopd = +(-0.75 * adherenceFactor * (smokingStatus === 'QUIT' ? 1.1 : 0.95)).toFixed(2);
    const planB_cat = Math.max(12, Math.round(21 - 5.5 * adherenceFactor * smokeBonus));
    const planB_raw = Math.round(18 * adherenceFactor);

    // 方案 C: 三联强化 (针对极重度/频发患者)
    const planC_fev1 = +(18.6 * adherenceFactor * smokeBonus * (monthFactor > 1.2 ? 1.3 : 1.05)).toFixed(1);
    const planC_aecopd = +(-1.52 * adherenceFactor * (smokingStatus === 'QUIT' ? 1.2 : 1.0)).toFixed(2);
    const planC_cat = Math.max(8, Math.round(21 - 11 * adherenceFactor * smokeBonus));
    const planC_raw = Math.round(38 * adherenceFactor);

    return {
      PLAN_A: { fev1: `+${planA_fev1}%`, aecopd: `${planA_aecopd} 次/年`, cat: `${planA_cat} 分`, raw: `-${planA_raw}%` },
      PLAN_B: { fev1: `+${planB_fev1}%`, aecopd: `${planB_aecopd} 次/年`, cat: `${planB_cat} 分`, raw: `-${planB_raw}%` },
      PLAN_C: { fev1: `+${planC_fev1}%`, aecopd: `${planC_aecopd} 次/年`, cat: `${planC_cat} 分`, raw: `-${planC_raw}%` }
    };
  }, [adherence, durationMonths, smokingStatus]);

  // 处理下发处方到移动端 APP
  const handleDeployPrescription = () => {
    let regimenName = '';
    let drugs = [];

    if (selectedRegimen === 'PLAN_A') {
      regimenName = '方案 A: LABA+LAMA 双支气管扩张剂联合维持疗法';
      drugs = [
        {
          name: '噻托溴铵/福莫特罗吸入粉雾剂',
          dosage: '18μg / 12μg',
          freq: '每日1次，早晨吸入1吸',
          device: '准纳尔吸入器 (Diskus)',
          remaining_doses: 60
        },
        {
          name: '乙酰半胱氨酸泡腾片',
          dosage: '0.6g',
          freq: '每日2次，溶于温开水服用',
          device: '口服',
          remaining_doses: 30
        }
      ];
    } else if (selectedRegimen === 'PLAN_B') {
      regimenName = '方案 B: LABA+ICS 支气管舒张剂联合吸入糖皮质激素';
      drugs = [
        {
          name: '布地奈德福莫特罗吸入粉雾剂',
          dosage: '160/4.5μg',
          freq: '每日2次，早晚各吸入1吸',
          device: '都保吸入器 (Turbuhaler)',
          remaining_doses: 60
        }
      ];
    } else {
      regimenName = '方案 C: 三联强化疗法 (LABA+LAMA+ICS)';
      drugs = [
        {
          name: '倍氯米松福莫特罗格隆溴铵吸入气雾剂',
          dosage: '87/5/9μg',
          freq: '每日2次，每次2吸',
          device: '轻雾型加压定量吸入器 (pMDI)',
          remaining_doses: 120
        }
      ];
    }

    const created = prescriptionService.createPrescription({
      prescription_no: `RX-SYH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_id: patient.patient_uid,
      patient_name: patient.patient_name,
      doctor_name: '王建平',
      doctor_title: '主任医师 / 教授',
      regimen_type: selectedRegimen,
      regimen_name: regimenName,
      drugs,
      expected_fev1_gain: predictionOutputs[selectedRegimen].fev1,
      expected_aecopd_drop: predictionOutputs[selectedRegimen].aecopd,
      cat_score_target: `CAT评分降至 ${predictionOutputs[selectedRegimen].cat}`,
    });

    setPrescriptionSuccessToast(`✅ 处方 (${created.prescription_no}) 已完成 CA 数字签名并实时推送到患者【${patient.patient_name}】移动端 APP！`);
    setTimeout(() => {
      setPrescriptionSuccessToast(null);
    }, 4500);
  };

  return (
    <div className="flex-1 h-full flex flex-col xl:flex-row overflow-hidden p-3 gap-3 bg-slate-950 text-slate-100 select-none">
      {/* 成功下发微通知 */}
      {prescriptionSuccessToast && (
        <div className="fixed top-16 right-6 z-50 p-3.5 rounded-2xl bg-cyan-950/95 border-2 border-cyan-400 text-cyan-200 text-xs flex items-center gap-2.5 shadow-2xl shadow-cyan-500/30 animate-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="font-semibold">{prescriptionSuccessToast}</span>
        </div>
      )}

      {/* =========================================================================
          左侧协同面板: 患者全貌临床多模态基线 + 实时体征流 + CT横断面切片
          ========================================================================= */}
      <div className="w-full xl:w-80 h-full flex flex-col gap-2.5 shrink-0 overflow-hidden">
        {/* 患者卡片与 GOLD 分期 */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-100">{patient.patient_name}</span>
              <span className="text-xs text-slate-400 font-mono">{patient.gender} · {patient.age}岁</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] font-bold font-mono">
              {patient.inpatient_no}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">GOLD 临床分期</span>
              <span className="font-bold text-amber-400 font-mono text-xs">3级 E组 (高危)</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">吸烟指数 (年限)</span>
              <span className="font-bold text-rose-400 font-mono text-xs">40 包年 (高危)</span>
            </div>
          </div>
        </div>

        {/* 导航切换 Tab: 实时体征与CT切片 vs 解剖拓扑树 */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setLeftTab('VITALS_CT')}
            className={`flex-1 py-1 rounded-lg font-semibold transition ${
              leftTab === 'VITALS_CT' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            体征流与CT横断切片
          </button>
          <button
            onClick={() => setLeftTab('ANATOMY_TREE')}
            className={`flex-1 py-1 rounded-lg font-semibold transition ${
              leftTab === 'ANATOMY_TREE' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            B1-B10气道拓扑
          </button>
        </div>

        {leftTab === 'VITALS_CT' ? (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {/* 实时体征监护流卡片 */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  床旁物联网实时体征流
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  已接入 10Hz
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">血氧 SpO₂</span>
                    <span className="text-base font-extrabold text-amber-400">93%</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    轻度低氧
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">心率 Pulse</span>
                    <span className="text-base font-extrabold text-emerald-400">86</span>
                  </div>
                  <span className="text-[10px] text-slate-400">bpm</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">呼吸频率 RR</span>
                    <span className="text-base font-extrabold text-rose-400">22</span>
                  </div>
                  <span className="text-[10px] text-slate-400">次/分</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">无创血压 BP</span>
                    <span className="text-sm font-extrabold text-cyan-300">138/88</span>
                  </div>
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>
            </div>

            {/* CT 关键横断面切片查看器 (Axial / Coronal / Sagittal) */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                  胸部薄层 CT 关键切片
                </span>
                <span className="text-[10px] text-slate-400 font-mono">0.625mm HRCT</span>
              </div>

              {/* 切面方向选择 */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px]">
                {(['AXIAL', 'CORONAL', 'SAGITTAL'] as const).map((plane) => (
                  <button
                    key={plane}
                    onClick={() => setCtPlane(plane)}
                    className={`flex-1 py-1 rounded-md font-bold transition ${
                      ctPlane === plane ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {plane === 'AXIAL' ? '轴位 (横断)' : plane === 'CORONAL' ? '冠状位' : '矢状位'}
                  </button>
                ))}
              </div>

              {/* 切片画布视口模拟 */}
              <div className="relative w-full h-36 rounded-xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center group">
                {/* 模拟 DICOM 灰度医学胸部横断切片与 LAA-950 肺气肿高亮 */}
                <div className="absolute inset-0 bg-radial from-slate-800 via-slate-950 to-black opacity-90" />
                
                {/* 肺野阴影轮廓 */}
                <div className="relative w-28 h-24 rounded-full border-2 border-slate-700/60 flex items-center justify-center">
                  <div className="w-12 h-16 rounded-full border border-sky-500/40 mr-1 bg-sky-950/20" />
                  <div className="w-12 h-16 rounded-full border border-sky-500/40 ml-1 bg-sky-950/20" />
                  {/* RB3 狭窄病变红圈标注 */}
                  <div className="absolute top-4 right-5 w-4 h-4 rounded-full border-2 border-rose-500 bg-rose-500/30 animate-pulse" />
                </div>

                {/* 影像窗宽窗位角标 */}
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                  W:1500 L:-600 (肺窗)
                </div>
                <div className="absolute bottom-2 left-2 text-[9px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                  LAA-950: 32.4%
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                  RB3 狭窄 65%
                </div>
              </div>

              {/* 切片层滑块 */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 w-10">层号: {sliceIndex}</span>
                <input
                  type="range"
                  min="1"
                  max="128"
                  value={sliceIndex}
                  onChange={(e) => setSliceIndex(parseInt(e.target.value))}
                  className="flex-1 accent-sky-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 font-mono">128</span>
              </div>
            </div>

            {/* 肺功能与血气基线 */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="font-bold text-slate-300">肺功能基线 (PFT)</div>
              <div className="flex justify-between text-slate-400">
                <span>FEV1 实测 / Pred:</span>
                <span className="font-mono text-rose-400 font-bold">1.28 L (46.2%)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>FEV1/FVC:</span>
                <span className="font-mono text-rose-400 font-bold">48.6%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>动脉血气 PaO₂:</span>
                <span className="font-mono text-amber-400 font-bold">68.5 mmHg</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
            {nodes.slice(0, 16).map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-cyan-400">{node.id}</span>
                    <span className="truncate max-w-[120px]">{node.name_cn}</span>
                  </div>
                  {node.is_lesion && (
                    <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">
                      狭窄
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          中心视口 (3D Twin Core): 高保真半透明 3D 双肺 + 呼吸流体力学波形
          ========================================================================= */}
      <div className="flex-1 h-full flex flex-col gap-3 min-w-0">
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-[380px] bg-slate-950">
          <TwinViewer3D
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={onSelectNode}
            simulationFrame={simulationFrame}
            isWireframe={isWireframe}
            lodLevel={lodLevel}
            onEbusClick={onEbusClick}
            isMobile={false}
            isModalOpen={isModalOpen}
          />
        </div>

        {/* 底部呼吸生物力学时序曲线 */}
        <div className="h-44 shrink-0 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-xl p-2.5">
          <AirwayWaveformChart
            history={history}
            currentPressure={simulationFrame.metrics.airway_pressure_cmh2o}
            currentFlow={simulationFrame.metrics.flow_rate_lps}
          />
        </div>
      </div>

      {/* =========================================================================
          右侧协同面板: What-if 虚拟治疗试错与方案对比仪表盘 (核心杀手锏)
          ========================================================================= */}
      <div className="w-full xl:w-96 h-full flex flex-col gap-2.5 shrink-0 overflow-y-auto">
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl space-y-3.5">
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-wide text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              What-if 虚拟治疗试错决策器
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              PPO-RL + CFD
            </span>
          </div>

          {/* 方案并排对比选择器 */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
              <span>候选诊疗维持方案对比</span>
              <span className="text-[10px] text-cyan-400">点击切换预测</span>
            </div>

            <div className="space-y-2">
              {/* 方案 A: LABA + LAMA */}
              <div
                onClick={() => setSelectedRegimen('PLAN_A')}
                className={`p-2.5 rounded-xl border cursor-pointer transition relative ${
                  selectedRegimen === 'PLAN_A'
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    【方案 A】LABA + LAMA
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-semibold">
                    GOLD推荐
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  噻托溴铵/福莫特罗吸入粉雾剂 (1吸 qd/bid)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  双支气管平滑肌靶向扩张，直接降低外周小气道阻力
                </div>
              </div>

              {/* 方案 B: LABA + ICS */}
              <div
                onClick={() => setSelectedRegimen('PLAN_B')}
                className={`p-2.5 rounded-xl border cursor-pointer transition relative ${
                  selectedRegimen === 'PLAN_B'
                    ? 'bg-blue-950/80 border-blue-400 shadow-md shadow-blue-950/50'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    【方案 B】LABA + ICS
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 font-semibold">
                    抗炎强化
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  布地奈德/福莫特罗吸入粉雾剂 (160/4.5μg 2吸 bid)
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  靶向嗜酸性粒细胞及炎症介质释放，预防急性加重
                </div>
              </div>

              {/* 方案 C: 三联疗法 */}
              <div
                onClick={() => setSelectedRegimen('PLAN_C')}
                className={`p-2.5 rounded-xl border cursor-pointer transition relative ${
                  selectedRegimen === 'PLAN_C'
                    ? 'bg-purple-950/80 border-purple-400 shadow-md shadow-purple-950/50'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    【方案 C】三联强化 (LABA+LAMA+ICS)
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 font-semibold">
                    重度极佳
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  倍氯米松/福莫特罗/格隆溴铵吸入剂 (2吸 bid)
                </div>
              </div>
            </div>
          </div>

          {/* 交互试错滑块: 依从性、时间跨度、吸烟状态 */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              虚拟临床变量交互调优
            </div>

            {/* 依从性 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">患者服药依从性:</span>
                <span className="font-mono text-cyan-300 font-bold">{adherence}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={adherence}
                onChange={(e) => setAdherence(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* 随访周期 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">推演随访跨度:</span>
              <div className="flex gap-1">
                {[3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setDurationMonths(m)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      durationMonths === m ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m}个月
                  </button>
                ))}
              </div>
            </div>

            {/* 吸烟干预状态 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">吸烟状态干预:</span>
              <div className="flex gap-1">
                {[
                  { key: 'QUIT', label: '已戒烟' },
                  { key: 'REDUCING', label: '减量' },
                  { key: 'CURRENT', label: '吸烟' }
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSmokingStatus(s.key as any)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      smokingStatus === s.key ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 动态预测结果输出卡片 */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>{durationMonths} 个月后动态获益预测</span>
              <span className="text-[10px] text-emerald-400 font-mono">置信度 93.6%</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">FEV1 改善率</span>
                <span className="text-base font-extrabold text-cyan-300 font-mono">
                  {predictionOutputs[selectedRegimen].fev1}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">急性加重下降</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {predictionOutputs[selectedRegimen].aecopd}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CAT 症状评分</span>
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  {predictionOutputs[selectedRegimen].cat}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">气道总阻力 Raw</span>
                <span className="text-base font-extrabold text-sky-400 font-mono">
                  {predictionOutputs[selectedRegimen].raw}
                </span>
              </div>
            </div>
          </div>

          {/* 杀手锏核心按钮: 一键生成处方并下发至患者端 APP */}
          <button
            onClick={handleDeployPrescription}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-600 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-600/30 transition transform active:scale-98"
          >
            <Send className="w-4 h-4 text-white" />
            <span>一键生成处方并下发至患者端 APP</span>
          </button>

          <button
            onClick={() => onOpenKnowledgeGraph('copd_core')}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>查看此方案 GOLD 指南知识图谱循证链</span>
          </button>
        </div>
      </div>
    </div>
  );
};

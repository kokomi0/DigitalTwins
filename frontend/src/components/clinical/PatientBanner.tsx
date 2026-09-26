import React from 'react';
import { PatientMeta } from '../../types';
import { 
  User, 
  AlertTriangle, 
  Activity, 
  Wind, 
  Heart, 
  FileText, 
  Cigarette, 
  UploadCloud, 
  Network,
  Stethoscope,
  TrendingDown,
  Layers
} from 'lucide-react';

interface PatientBannerProps {
  patient: PatientMeta;
  onOpenCTModal?: () => void;
  onOpenKnowledgeGraph?: () => void;
  onLocateLesion?: () => void;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({
  patient,
  onOpenCTModal,
  onOpenKnowledgeGraph,
  onLocateLesion
}) => {
  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-cyan-800/40 rounded-2xl p-3 md:p-4 shadow-xl shadow-cyan-950/30 text-slate-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 shrink-0">
      
      {/* 左侧：患者身份档案与基础信息 */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* 头像徽章 */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            <User className="w-6 h-6 text-white" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-950">
            ✓
          </span>
        </div>

        {/* 档案核心文本 */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-extrabold text-white tracking-wide flex items-center gap-1.5">
              <span>{patient.patient_name || '张*民'}</span>
              <span className="text-xs font-normal text-slate-400">
                ({patient.gender} · {patient.age}岁)
              </span>
            </h2>

            {/* 住院号 & 床位 */}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-300 border border-slate-700">
              {patient.inpatient_no || '#HN-2026-0928'}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700">
              {patient.bed_no || '呼吸科 08床'}
            </span>

            {/* 吸烟史 */}
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-950/50 text-amber-300 border border-amber-800/50 flex items-center gap-1">
              <Cigarette className="w-3 h-3 text-amber-400" />
              <span>吸烟史 {patient.smoking_pack_years}年·包</span>
            </span>
          </div>

          <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
            <span>
              合并症: <span className="text-slate-300">{patient.comorbidities?.join('、') || '高血压2级、肺心病'}</span>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="font-mono text-[11px] text-cyan-400/90">
              CT序列: {patient.ct_series_id || 'CT-THORAX-HRCT-0082'} ({patient.ct_scan_date?.split(' ')[0]})
            </span>
          </div>
        </div>
      </div>

      {/* 中部：结构化临床基线指标栅格 */}
      <div className="w-full xl:w-auto flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap py-1 xl:py-0 border-y xl:border-y-0 border-slate-800/80 xl:px-4 xl:border-x xl:border-slate-800/60">
        
        {/* GOLD 评级 */}
        <div className="bg-slate-950/70 border border-amber-600/30 rounded-xl px-3 py-1.5 flex flex-col justify-center min-w-[110px]">
          <span className="text-[10px] text-amber-400 font-medium">临床严重度分级</span>
          <span className="text-xs sm:text-sm font-bold text-amber-200 truncate">
            {patient.gold_stage}
          </span>
        </div>

        {/* FEV1/FVC 预计值 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 flex flex-col justify-center min-w-[95px]">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Wind className="w-3 h-3 text-cyan-400" />
            <span>FEV1/FVC</span>
          </span>
          <div className="text-xs sm:text-sm font-black font-mono text-cyan-300">
            {patient.fev1_fvc_ratio}% <span className="text-[9px] text-rose-400 font-sans">重度受限</span>
          </div>
        </div>

        {/* 静息血氧 SpO2 */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 flex flex-col justify-center min-w-[90px]">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-400" />
            <span>静息 SpO₂</span>
          </span>
          <div className="text-xs sm:text-sm font-black font-mono text-rose-300">
            {patient.spo2_resting || 91}% <span className="text-[9px] text-amber-400 font-sans">低氧</span>
          </div>
        </div>

        {/* 气道阻力 Raw */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 flex flex-col justify-center min-w-[95px]">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>气道阻力 Raw</span>
          </span>
          <div className="text-xs sm:text-sm font-black font-mono text-emerald-300">
            {patient.airway_resistance} <span className="text-[9px] text-slate-400 font-sans">kPa·s/L</span>
          </div>
        </div>

        {/* AECOPD 智能预警徽章 (标红高亮) */}
        <div className="bg-gradient-to-r from-rose-950/80 to-red-950/60 border border-rose-500/60 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg shadow-rose-950/40 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="text-left">
            <div className="text-[10px] font-bold text-rose-300 tracking-wider">
              AECOPD 急性加重高风险预警
            </div>
            <div className="text-xs font-black font-mono text-rose-100 flex items-center gap-1">
              <span>72小时发生概率:</span>
              <span className="text-rose-400 text-sm">{patient.aecopd_risk_prob || 83.5}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：核心商业级交互按钮组 */}
      <div className="w-full xl:w-auto flex items-center justify-end gap-2.5 shrink-0">
        {/* 导入患者 CT 按钮 */}
        {onOpenCTModal && (
          <button
            onClick={onOpenCTModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition active:scale-95 group"
            title="导入胸部薄层CT并一键启动AI多尺度气道与肺气肿孪生体重建"
          >
            <UploadCloud className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
            <span>导入患者胸部 CT (DICOM)</span>
          </button>
        )}

        {/* 慢病知识图谱按钮 */}
        {onOpenKnowledgeGraph && (
          <button
            onClick={onOpenKnowledgeGraph}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 font-bold text-xs shadow-md border border-cyan-500/40 hover:border-cyan-400 transition active:scale-95"
            title="查看《COPD慢病知识图谱系统》多维语义决策网络"
          >
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">COPD 智慧知识图谱</span>
            <span className="sm:hidden">知识图谱</span>
          </button>
        )}
      </div>

    </div>
  );
};

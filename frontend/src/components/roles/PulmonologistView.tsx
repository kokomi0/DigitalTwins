import React, { useState, useEffect } from 'react';
import { PatientMeta } from '../../types';
import { api } from '../../services/api';
import { Stethoscope, Sparkles, Activity, PlusCircle, CheckCircle, ArrowUpRight, Zap } from 'lucide-react';

interface PulmonologistViewProps {
  patient: PatientMeta;
  onAnnotateSuccess?: () => void;
  onOpenCTModal?: () => void;
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
}

export function PulmonologistView({ 
  patient, 
  onAnnotateSuccess,
  onOpenCTModal,
  onOpenKnowledgeGraph
}: PulmonologistViewProps) {
  const [aiReport, setAiReport] = useState<any>(null);
  const [rehabResult, setRehabResult] = useState<any>(null);
  const [isSimulatingRehab, setIsSimulatingRehab] = useState(false);
  const [showAnnotateModal, setShowAnnotateModal] = useState(false);

  // 标注表单
  const [selectedSegment, setSelectedSegment] = useState('RB3');
  const [stenosisInput, setStenosisInput] = useState(0.65);
  const [notesInput, setNotesInput] = useState('右肺上叶前段黏膜高度充血水肿伴狭窄');
  const [isAnnotating, setIsAnnotating] = useState(false);

  useEffect(() => {
    const fetchAi = async () => {
      const data = await api.getAiEvaluation(patient.anon_code);
      if (data) setAiReport(data);
    };
    fetchAi();
  }, [patient.anon_code]);

  const handleSimulateRehab = async () => {
    setIsSimulatingRehab(true);
    try {
      const res = await api.simulateRehab("BiPAP_VENTILATION");
      if (res && res.data) {
        setRehabResult(res.data);
      }
    } finally {
      setIsSimulatingRehab(false);
    }
  };

  const handleSaveAnnotation = async () => {
    setIsAnnotating(true);
    try {
      await api.annotateLesion(selectedSegment, stenosisInput, notesInput);
      setShowAnnotateModal(false);
      onAnnotateSuccess?.();
    } finally {
      setIsAnnotating(false);
    }
  };

  return (
    <div className="space-y-3 text-xs">
      {/* 临床核心肺功能与COPD关键指标卡片 */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-slate-200 font-semibold">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            患者肺功能生理指标 (Pulmonary Baseline)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">
            {patient.gold_stage}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">FEV1% pred</div>
            <div className="text-cyan-300 font-bold text-sm">{patient.fev1_pred}%</div>
            <div className="text-[9px] text-rose-400">重度通气功能受限</div>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">FEV1 / FVC</div>
            <div className="text-cyan-300 font-bold text-sm">{patient.fev1_fvc_ratio}%</div>
            <div className="text-[9px] text-amber-400">呼气流速不可逆受阻</div>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">气道阻力 Raw</div>
            <div className="text-amber-300 font-bold text-sm">{patient.airway_resistance} kPa·s/L</div>
            <div className="text-[9px] text-slate-400">高于基线2.8倍</div>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">肺气肿指数 (LAA-950)</div>
            <div className="text-purple-300 font-bold text-sm">23.4%</div>
            <div className="text-[9px] text-purple-400">小叶中央型肺气肿</div>
          </div>
        </div>

        {/* 临床操作快捷工具 */}
        <div className="flex gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={() => setShowAnnotateModal(true)}
            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>解剖段狭窄标注</span>
          </button>

          <button
            onClick={handleSimulateRehab}
            disabled={isSimulatingRehab}
            className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSimulatingRehab ? '超算解算中...' : '启动康复推演'}</span>
          </button>
        </div>
      </div>

      {/* 康复推演对比结果弹层 */}
      {rehabResult && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/50 rounded-xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-emerald-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              数字孪生康复推演评估结论
            </span>
            <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-300 font-mono">BiPAP通气</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-1.5 rounded bg-slate-900/80 border border-emerald-900/40">
              <span className="text-slate-400 text-[10px]">气道阻力下降:</span>
              <div className="text-emerald-300 font-bold">{rehabResult.airway_resistance_reduction}</div>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80 border border-emerald-900/40">
              <span className="text-slate-400 text-[10px]">预计FEV1改善:</span>
              <div className="text-emerald-300 font-bold">+{rehabResult.fev1_projected_increase_ml} ml</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-300">
            ● 呼气塌陷风险从【极高】降至【轻度】，RB3颤振振幅显著受到抑制。
          </p>
        </div>
      )}

      {/* 三亚学院超算 BioMedLM 大模型临床评估报告 */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-slate-200 font-semibold">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            超算大模型辅助诊疗报告 (BioMedLM)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">V3.8</span>
        </div>

        {aiReport ? (
          <div className="space-y-2 text-slate-300">
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
              <div className="font-semibold text-cyan-300 mb-1">【CFD流体狭窄分析】</div>
              <p className="leading-relaxed text-slate-300">
                {aiReport.cfd_airway_analysis?.pathological_mechanism || 'RB3管壁增厚，伴局部压降剧烈与呼气相陷闭动态塌陷。'}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
              <div className="font-semibold text-emerald-300 mb-1">【淋巴结EBUS镜下研判】</div>
              <p className="leading-relaxed text-slate-300">
                {aiReport.lymph_station_interpretation?.station_7 || '7站隆突下淋巴结短径14.8mm反应性增大，建议择期穿刺复核。'}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
              <div className="font-semibold text-amber-300 mb-1">【诊疗与康复建议】</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>予以布地奈德福莫特罗联合噻托溴铵吸入三联方案；</li>
                <li>采用个体化缩唇腹式呼吸控制吸呼比至 1:2.5；</li>
                <li>夜间间歇性低流量吸氧伴无创BiPAP支持。</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-center py-4">正在从三亚学院超算知识库拉取诊疗建议...</div>
        )}
      </div>

      {/* 解剖段病变标注弹窗 */}
      {showAnnotateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl space-y-3">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              气道病变解剖段标注 (3D同步)
            </h4>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">选择气管段</label>
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100"
                >
                  <option value="RB3">右上叶前段 (RB3 - 当前重点病变)</option>
                  <option value="RB1">右上叶尖段 (RB1)</option>
                  <option value="RB2">右上叶后段 (RB2)</option>
                  <option value="RB6">右下叶背段 (RB6)</option>
                  <option value="LB3">左上叶前段 (LB3)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>管腔狭窄缩减率</span>
                  <span className="font-mono text-cyan-300">{Math.round(stenosisInput * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={stenosisInput}
                  onChange={(e) => setStenosisInput(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">临床病理备注</label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAnnotateModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleSaveAnnotation}
                disabled={isAnnotating}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
              >
                {isAnnotating ? '保存中...' : '确认标注并解算'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

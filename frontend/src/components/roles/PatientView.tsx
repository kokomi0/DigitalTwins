import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Heart, 
  ShieldCheck, 
  Smile, 
  Activity, 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  Network,
  Clock,
  Sparkles
} from 'lucide-react';

interface PatientViewProps {
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
}

export const PatientView: React.FC<PatientViewProps> = ({ onOpenKnowledgeGraph }) => {
  const [checkedMeds, setCheckedMeds] = useState<Record<string, boolean>>({
    med1: true,
    med2: false,
    rehab1: true
  });

  const toggleCheck = (key: string) => {
    setCheckedMeds(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3.5 shadow-xl">
        
        {/* 顶部标头与7x24h守护状态 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
              <HeartHandshake className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-slate-100 text-sm">慢病关爱与居家康复</div>
              <div className="text-[10px] text-slate-400">7×24h 智能动态监护已开启</div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>生理连接正常</span>
          </span>
        </div>

        {/* 7×24h 智能预警红黄卡片 */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/50 to-orange-950/40 border border-amber-600/40 space-y-1.5">
          <div className="flex items-center justify-between text-amber-300 font-bold">
            <span className="flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>智能健康预警提示</span>
            </span>
            <span className="text-[10px] font-mono bg-amber-950 px-1.5 py-0.2 rounded border border-amber-700">
              今日风险: 中高
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            系统结合您近 3 日咳嗽频次及气道阻力模型，预测未来 72 小时有 <b>83.5%</b> 概率出现喘憋加重，请务必按时完成今日<b>布地奈德吸入</b>与<b>缩唇呼吸</b>。
          </p>
        </div>

        {/* 通俗大白话：3D 肺部病变解读 */}
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-1.5">
          <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-cyan-400" />
            <span>三维气道通俗解读：</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            左侧三维模型中标红的细枝（右叶前段），就像被捏扁的软吸管。吸气能进，呼气容易贴拢闭气，造成废气积存。通过规范呼吸训练可有效把废气排净！
          </p>
          {onOpenKnowledgeGraph && (
            <button
              onClick={() => onOpenKnowledgeGraph('anat_rb3')}
              className="mt-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
            >
              <Network className="w-3.5 h-3.5" />
              <span>查看该部位对应的用药图谱指南 →</span>
            </button>
          )}
        </div>

        {/* 今日慢病用药打卡 */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Pill className="w-3.5 h-3.5 text-purple-400" />
              <span>今日处方用药指引</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">2/2 剂次</span>
          </div>

          <div className="space-y-1.5">
            <div
              onClick={() => toggleCheck('med1')}
              className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                checkedMeds.med1
                  ? 'bg-purple-950/40 border-purple-600/50 text-purple-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div>
                <div className="font-semibold text-xs">布地奈德福莫特罗吸入粉雾剂</div>
                <div className="text-[10px] text-slate-400">早晚各 1 吸 (160/4.5μg) · 抑制气道炎症</div>
              </div>
              <CheckCircle2 className={`w-4 h-4 ${checkedMeds.med1 ? 'text-purple-400' : 'text-slate-600'}`} />
            </div>

            <div
              onClick={() => toggleCheck('med2')}
              className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                checkedMeds.med2
                  ? 'bg-purple-950/40 border-purple-600/50 text-purple-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div>
                <div className="font-semibold text-xs">噻托溴铵粉雾剂 (LAMA)</div>
                <div className="text-[10px] text-slate-400">晨起 1 吸 (18μg) · 舒张支气管平滑肌</div>
              </div>
              <CheckCircle2 className={`w-4 h-4 ${checkedMeds.med2 ? 'text-purple-400' : 'text-slate-600'}`} />
            </div>
          </div>
        </div>

        {/* 今日慢病康复打卡 */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>今日家庭肺康复打卡</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">已完成 1/2 项</span>
          </div>

          <div
            onClick={() => toggleCheck('rehab1')}
            className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
              checkedMeds.rehab1
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            <div>
              <div className="font-semibold text-xs">缩唇腹式呼吸训练 (15分钟)</div>
              <div className="text-[10px] text-slate-400">吸气数到 2，吹气缩唇数到 4 · 防止小气道陷闭</div>
            </div>
            <CheckCircle2 className={`w-4 h-4 ${checkedMeds.rehab1 ? 'text-emerald-400' : 'text-slate-600'}`} />
          </div>
        </div>

        {/* 底部关爱团队标识 */}
        <div className="text-[10px] text-slate-500 text-center pt-1 font-sans">
          三亚市人民医院呼吸慢病管理中心 ✕ 三亚学院超算中心 全程守护
        </div>

      </div>
    </div>
  );
};

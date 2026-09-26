import React from 'react';
import { AnatomyNode } from '../../types';
import { X, Activity, ShieldAlert, Compass, Eye } from 'lucide-react';

interface EBUSModalProps {
  station: string | null;
  node: AnatomyNode | null;
  onClose: () => void;
}

export function EBUSModal({ station, node, onClose }: EBUSModalProps) {
  if (!station || !node) return null;

  const isSwollen = node.status === 'SWOLLEN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono text-sm border border-emerald-500/40">
              {node.station || station}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {node.name_cn}
                {isSwollen && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    高危炎性肿大
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">超声支气管镜 (EBUS-TBNA) 淋巴结分站定位指引</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* 邻近大血管解剖解构 */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>解剖空间与邻近大血管关系</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              <span className="text-cyan-300 font-medium">毗邻大血管：</span>
              {node.vessel || '肺动静脉主要叶段分支'}
            </p>
            <p className="text-slate-400 leading-relaxed">
              <span className="text-cyan-300 font-medium">气道相对方位：</span>
              {node.station === '7' ? '位于隆突顶点分叉正下方马鞍窝内，紧贴右肺动脉后壁与食管前壁' :
               node.station === '4R' ? '奇静脉弓 (Azygos Arch) 深面，穿刺路径需在多普勒血流指引下避开上腔静脉' :
               node.station === '4L' ? '主动脉弓下缘与左主肺动脉之间，AP窗下缘' :
               '支气管外侧壁邻近走形血管'}
            </p>
          </div>

          {/* 超声支气管镜下特征 */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>EBUS 镜下声像学特征</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {node.ebus_desc || '呈圆形或椭圆形均匀低回声结节，周边伴随环形血流回声信号，门部结构可见。'}
            </p>
            {isSwollen && (
              <div className="mt-2 p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-rose-300">
                  <b className="font-semibold">临床警示：</b>
                  该站短径测得 14.8mm，伴均匀低回声与周边血流灌注旺盛。COPD慢性气管支气管炎常导致该站反应性滤泡增生，建议择期行 EBUS-TBNA 细针穿刺细胞学活检复核。
                </div>
              </div>
            )}
          </div>

          {/* 穿刺安全裕度与推荐操作 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-slate-300">
            <div>
              <div className="font-semibold text-cyan-300">推荐穿刺针型</div>
              <div className="text-[11px] text-slate-400">22G / 25G 负压内芯针</div>
            </div>
            <div>
              <div className="font-semibold text-cyan-300">彩色多普勒血流</div>
              <div className="text-[11px] text-emerald-400">需全程开启血管规避</div>
            </div>
            <div>
              <div className="font-semibold text-cyan-300">安全进入深度</div>
              <div className="text-[11px] text-slate-300 font-mono">&lt; 18.0 mm</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            关闭指引
          </button>
        </div>
      </div>
    </div>
  );
}
